/**
 * AC-P2-2 / TC-P2.2-02: the HTML report must itself pass an axe scan —
 * an inaccessible accessibility report is disqualifying (DESIGN §6).
 * Lives here because playwright + axe-core are this package's dependencies.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { renderHtml } from '../../../reporters/html/src/index.js';
import type { Finding } from '../../core/src/finding.js';

const require = createRequire(import.meta.url);

let browserAvailable = true;
try {
  const { chromium } = await import('playwright');
  const b = await chromium.launch();
  await b.close();
} catch {
  browserAvailable = false;
}

function finding(over: Partial<Finding>): Finding {
  return {
    ruleId: 'react-alt-text',
    severity: 'error',
    baseSeverity: 'error',
    wcagRef: '1.1.1',
    wcagLevel: 'A',
    wcagVersion: '2.0',
    message: 'img elements must have an alt prop',
    file: 'src/App.tsx',
    range: { startLine: 4, startCol: 7 },
    layer: 1,
    surface: 'web-app',
    nonInterference: false,
    fingerprint: `fp-${Math.random().toString(36).slice(2)}`,
    ...over,
  } as Finding;
}

describe.skipIf(!browserAvailable)('HTML report accessibility (axe-on-own-output)', () => {
  it('TC-P2.2-02: a populated report has zero axe violations', async () => {
    const html = renderHtml({
      findings: [
        finding({}),
        finding({ severity: 'warning', wcagRef: '2.4.3', ruleId: 'react-tabindex-no-positive' }),
        finding({ baselined: true, ruleId: 'react-aria-props', wcagRef: '4.1.2' }),
        finding({ page: 'http://example.test/page', ruleId: 'axe-image-alt' }),
        finding({ nonInterference: true, wcagRef: '2.2.2', ruleId: 'react-no-distracting-elements' }),
      ],
      meta: {
        profile: 'standard',
        wcagVersion: '2.2',
        failOn: 'error',
        generatedAt: '2026-08-01T00:00:00.000Z',
        processes: { checkout: ['http://example.test/page'] },
        claim: {
          date: '2026-08-01',
          wcagVersion: '2.2',
          level: 'AA',
          pages: ['http://example.test/page'],
          technologies: ['react'],
        },
      },
      previousFindings: [{ fingerprint: 'old-1' }],
    });

    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate(readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
      const violations = (await page.evaluate(async () => {
        const w = window as unknown as {
          axe: { run: (d: Document, o: object) => Promise<{ violations: { id: string; nodes: unknown[] }[] }> };
        };
        return (await w.axe.run(document, { resultTypes: ['violations'] })).violations;
      })) as { id: string }[];
      expect(violations.map((v) => v.id)).toEqual([]);
    } finally {
      await browser.close();
    }
  }, 60000);

  it('an empty report is also axe-clean', async () => {
    const html = renderHtml({
      findings: [],
      meta: { profile: 'standard', wcagVersion: '2.2', failOn: 'error', generatedAt: '2026-08-01T00:00:00.000Z' },
    });
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate(readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
      const violations = (await page.evaluate(async () => {
        const w = window as unknown as {
          axe: { run: (d: Document, o: object) => Promise<{ violations: { id: string }[] }> };
        };
        return (await w.axe.run(document, { resultTypes: ['violations'] })).violations;
      })) as { id: string }[];
      expect(violations.map((v) => v.id)).toEqual([]);
    } finally {
      await browser.close();
    }
  }, 60000);
});
