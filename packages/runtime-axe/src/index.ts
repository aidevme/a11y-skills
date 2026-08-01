import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chromium, type Page } from 'playwright';

const require = createRequire(import.meta.url);
const AXE_SOURCE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

/** Structurally identical to core's RawFinding (kept local to avoid a build cycle). */
export interface RuntimeFinding {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  wcagRef: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagVersion: '2.0' | '2.1' | '2.2';
  message: string;
  file: string;
  layer: 2;
  category?: string;
  context?: string;
  page?: string;
  viewports?: string[];
}

export interface RuntimeOptions {
  urls: string[];
  viewports?: string[];
  crawl?: boolean;
  maxPages?: number;
}

const VIEWPORTS: Record<string, { width: number; height: number }> = {
  mobile: { width: 320, height: 800 }, // SC 1.4.10 reflow width
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

const IMPACT_SEVERITY: Record<string, RuntimeFinding['severity']> = {
  critical: 'error',
  serious: 'error',
  moderate: 'warning',
  minor: 'info',
};

interface AxeNode {
  target: string[];
}
interface AxeViolation {
  id: string;
  impact?: string;
  help: string;
  tags: string[];
  nodes: AxeNode[];
}

/** Parses axe tags like ["wcag2a","wcag111"] → WCAG ref/level/version; null for best-practice rules. */
function wcagFromTags(tags: string[]): { ref: string; level: 'A' | 'AA' | 'AAA'; version: '2.0' | '2.1' | '2.2' } | null {
  const refTag = tags.find((t) => /^wcag\d{3,4}$/.test(t));
  if (!refTag) return null;
  const d = refTag.slice(4);
  let ref = `${d[0]}.${d[1]}.${d.slice(2)}`;
  if (ref === '4.1.1') ref = '4.1.2'; // DESIGN §5: 4.1.1 is obsolete, report under 4.1.2
  const levelTag = tags.find((t) => /^wcag2(1|2)?a{1,3}$/.test(t));
  const m = levelTag?.match(/^wcag2(1|2)?(a{1,3})$/);
  const version = m?.[1] === '1' ? '2.1' : m?.[1] === '2' ? '2.2' : '2.0';
  const level = (m?.[2]?.toUpperCase() ?? 'A') as 'A' | 'AA' | 'AAA';
  return { ref, level, version };
}

function keyOf(ruleId: string, page: string, context: string): string {
  return `${ruleId}|${page}|${context}`;
}

function addOrMergeViewport(
  map: Map<string, RuntimeFinding>,
  finding: RuntimeFinding,
  viewport: string,
): void {
  const key = keyOf(finding.ruleId, finding.page ?? '', finding.context ?? '');
  const existing = map.get(key);
  if (existing) {
    if (!existing.viewports?.includes(viewport)) existing.viewports?.push(viewport);
  } else {
    map.set(key, { ...finding, viewports: [viewport] });
  }
}

async function runAxePass(
  page: Page,
  url: string,
  viewport: string,
  out: Map<string, RuntimeFinding>,
): Promise<void> {
  await page.evaluate((src) => {
    const w = window as unknown as { axe?: unknown; eval: (s: string) => void };
    if (!w.axe) w.eval(src);
  }, AXE_SOURCE);
  const violations = (await page.evaluate(async () => {
    const w = window as unknown as {
      axe: { run: (ctx: Document, opts: object) => Promise<{ violations: unknown[] }> };
    };
    const res = await w.axe.run(document, { resultTypes: ['violations'] });
    return res.violations;
  })) as AxeViolation[];

  const pathname = new URL(url).pathname;
  for (const v of violations) {
    const wcag = wcagFromTags(v.tags);
    if (!wcag) continue; // best-practice rules are out of conformance scope
    for (const node of v.nodes) {
      addOrMergeViewport(
        out,
        {
          ruleId: `axe-${v.id}`,
          severity: IMPACT_SEVERITY[v.impact ?? 'moderate'] ?? 'warning',
          wcagRef: wcag.ref,
          wcagLevel: wcag.level,
          wcagVersion: wcag.version,
          message: v.help,
          file: pathname,
          layer: 2,
          context: node.target.join(' '),
          page: url,
        },
        viewport,
      );
    }
  }
}

async function reflowCheck(page: Page, url: string, out: Map<string, RuntimeFinding>): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 1) {
    addOrMergeViewport(
      out,
      {
        ruleId: 'runtime-reflow',
        severity: 'error',
        wcagRef: '1.4.10',
        wcagLevel: 'AA',
        wcagVersion: '2.1',
        message: `Content requires horizontal scrolling at 320 CSS px width (${overflow}px overflow) — SC 1.4.10 Reflow.`,
        file: new URL(url).pathname,
        layer: 2,
        category: 'visual',
        context: 'documentElement',
        page: url,
      },
      'mobile',
    );
  }
}

async function textSpacingCheck(page: Page, url: string, out: Map<string, RuntimeFinding>): Promise<void> {
  await page.addStyleTag({
    content:
      '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }',
  });
  const clipped = (await page.evaluate(() => {
    const results: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const style = getComputedStyle(el);
      const hidesOverflow = style.overflow === 'hidden' || style.overflowY === 'hidden' || style.overflowX === 'hidden';
      if (!hidesOverflow) continue;
      const h = el as HTMLElement;
      if (!h.innerText || !h.innerText.trim()) continue;
      if (h.scrollHeight > h.clientHeight + 4 || h.scrollWidth > h.clientWidth + 4) {
        const id = h.id ? `#${h.id}` : '';
        results.push(`${h.tagName.toLowerCase()}${id}`);
        if (results.length >= 5) break;
      }
    }
    return results;
  })) as string[];
  for (const selector of clipped) {
    addOrMergeViewport(
      out,
      {
        ruleId: 'runtime-text-spacing',
        severity: 'error',
        wcagRef: '1.4.12',
        wcagLevel: 'AA',
        wcagVersion: '2.1',
        message: `Content is clipped when WCAG text-spacing overrides are applied (${selector}) — SC 1.4.12 Text Spacing.`,
        file: new URL(url).pathname,
        layer: 2,
        category: 'visual',
        context: selector,
        page: url,
      },
      'desktop',
    );
  }
}

async function orientationCheck(page: Page, url: string, out: Map<string, RuntimeFinding>): Promise<void> {
  await page.setViewportSize({ width: 800, height: 1280 }); // portrait
  const portraitLen = await page.evaluate(() => document.body.innerText.trim().length);
  await page.setViewportSize({ width: 1280, height: 800 }); // landscape
  const landscapeLen = await page.evaluate(() => document.body.innerText.trim().length);
  const max = Math.max(portraitLen, landscapeLen);
  const min = Math.min(portraitLen, landscapeLen);
  if (max > 0 && min < max * 0.5) {
    addOrMergeViewport(
      out,
      {
        ruleId: 'runtime-orientation',
        severity: 'error',
        wcagRef: '1.3.4',
        wcagLevel: 'AA',
        wcagVersion: '2.1',
        message: `Content is restricted to a single display orientation (portrait: ${portraitLen} chars, landscape: ${landscapeLen}) — SC 1.3.4 Orientation.`,
        file: new URL(url).pathname,
        layer: 2,
        context: 'body',
        page: url,
      },
      portraitLen < landscapeLen ? 'portrait' : 'landscape',
    );
  }
}

/**
 * Layer 2 runtime scan (DESIGN §2 Layer 2): axe-core per viewport
 * (320px/tablet/desktop — WCAG conformance covers every responsive variant),
 * plus reflow (SC 1.4.10), text-spacing (SC 1.4.12), and orientation
 * (SC 1.3.4) checks. Optional same-origin crawl one level deep.
 */
export async function runRuntime(options: RuntimeOptions): Promise<RuntimeFinding[]> {
  const viewports =
    options.viewports && options.viewports.length > 0
      ? options.viewports.filter((v) => v in VIEWPORTS)
      : ['mobile', 'tablet', 'desktop'];
  const maxPages = options.maxPages ?? 20;
  const browser = await chromium.launch();
  try {
    const queue = [...options.urls];
    const seen = new Set(queue);
    const findings = new Map<string, RuntimeFinding>();
    while (queue.length > 0) {
      const url = queue.shift() as string;
      const page = await browser.newPage();
      try {
        const response = await page.goto(url, { waitUntil: 'load' });
        if (!response || !response.ok()) {
          throw new Error(`runtime target returned HTTP ${response?.status() ?? 'no response'}: ${url}`);
        }
        if (options.crawl) {
          const links = (await page.evaluate(() =>
            Array.from(document.querySelectorAll('a[href]')).map((a) => (a as HTMLAnchorElement).href),
          )) as string[];
          const origin = new URL(url).origin;
          for (const link of links) {
            try {
              const u = new URL(link);
              if (u.origin === origin && !seen.has(u.href) && seen.size < maxPages) {
                seen.add(u.href);
                queue.push(u.href);
              }
            } catch {
              /* ignore unparsable hrefs */
            }
          }
        }
        for (const vp of viewports) {
          await page.setViewportSize(VIEWPORTS[vp]);
          await runAxePass(page, url, vp, findings);
          if (vp === 'mobile') await reflowCheck(page, url, findings);
        }
        await orientationCheck(page, url, findings);
        await textSpacingCheck(page, url, findings); // mutates page styles — always last
      } finally {
        await page.close();
      }
    }
    return [...findings.values()];
  } finally {
    await browser.close();
  }
}
