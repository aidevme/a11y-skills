import { isValidLangTag } from './lang-codes.js';
import { walkElements } from './walker.js';

export interface RawCheckFinding {
  ruleKey: string;
  message: string;
  line: number;
  context: string;
}

const CONTROL_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA']);
const HEADING_RE = /^H([1-6])$/;

/**
 * Best-effort line lookup: linkedom does not track source positions, so we
 * locate the element's opening tag text in the raw source. Searches the
 * whole document each time rather than keeping a cursor, since fixtures
 * (and typical hand-authored pages) rarely have two identical opening tags
 * — a known, documented limitation rather than exact source mapping.
 */
function findLine(sourceLines: string[], needle: string): { line: number; context: string } {
  for (let i = 0; i < sourceLines.length; i++) {
    if (sourceLines[i].includes(needle)) {
      return { line: i + 1, context: sourceLines[i].trim() };
    }
  }
  return { line: 1, context: needle };
}

function openingTag(el: Element): string {
  const html = (el as unknown as { outerHTML: string }).outerHTML;
  const close = html.indexOf('>');
  return close === -1 ? html : html.slice(0, close + 1);
}

/**
 * Runs the static-HTML check families over a parsed document (DESIGN §2.2):
 * landmarks, alt text, label/for pairing, heading order, lang, skip links.
 * Built on the shared `walkElements` primitive so a consumer (e.g.
 * rules-power-pages in Phase 7) can add checks the same way.
 */
export function runStaticHtmlChecks(document: Document, source: string): RawCheckFinding[] {
  const sourceLines = source.split(/\r?\n/);
  const findings: RawCheckFinding[] = [];
  const root = (document as unknown as { documentElement: Element }).documentElement;

  let lastHeadingLevel = 0;
  let hasMain = false;
  let hasNav = false;
  const labelFors = new Set<string>();
  const controls: Element[] = [];

  walkElements(root, (el) => {
    const tag = (el as unknown as { tagName?: string }).tagName?.toUpperCase();
    if (!tag) return;
    const getAttr = (name: string): string | null =>
      typeof (el as unknown as { getAttribute?: (n: string) => string | null }).getAttribute ===
      'function'
        ? (el as unknown as { getAttribute: (n: string) => string | null }).getAttribute(name)
        : null;

    if (tag === 'IMG' && getAttr('alt') === null) {
      const loc = findLine(sourceLines, openingTag(el));
      findings.push({ ruleKey: 'img-alt', message: 'img element has no alt attribute.', ...loc });
    }

    const headingMatch = HEADING_RE.exec(tag);
    if (headingMatch) {
      const level = Number(headingMatch[1]);
      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        const loc = findLine(sourceLines, openingTag(el));
        findings.push({
          ruleKey: 'heading-order',
          message: `Heading level jumps from h${lastHeadingLevel} to h${level} — do not skip levels.`,
          ...loc,
        });
      }
      lastHeadingLevel = level;
    }

    if (tag === 'MAIN' || getAttr('role') === 'main') hasMain = true;
    if (tag === 'NAV') hasNav = true;

    if (tag === 'LABEL') {
      const forAttr = getAttr('for');
      if (forAttr) labelFors.add(forAttr);
    }

    if (CONTROL_TAGS.has(tag)) controls.push(el);
  });

  for (const control of controls) {
    const getAttr = (name: string): string | null =>
      (control as unknown as { getAttribute: (n: string) => string | null }).getAttribute(name);
    const id = getAttr('id');
    const hasAriaLabel = getAttr('aria-label') !== null || getAttr('aria-labelledby') !== null;
    const closest = (control as unknown as { closest?: (sel: string) => Element | null }).closest;
    const nestedInLabel = typeof closest === 'function' && !!closest.call(control, 'label');
    const pairedById = !!id && labelFors.has(id);
    if (!hasAriaLabel && !nestedInLabel && !pairedById) {
      const loc = findLine(sourceLines, openingTag(control));
      findings.push({
        ruleKey: 'label-pairing',
        message: 'Form control has no associated label (via for/id, nesting, or aria-label).',
        ...loc,
      });
    }
  }

  const htmlLang = (root as unknown as { getAttribute: (n: string) => string | null }).getAttribute(
    'lang',
  );
  if (!htmlLang) {
    findings.push({ ruleKey: 'lang-missing', message: 'html element has no lang attribute.', line: 1, context: '<html>' });
  } else if (!isValidLangTag(htmlLang)) {
    findings.push({
      ruleKey: 'lang-invalid',
      message: `lang="${htmlLang}" is not a valid, assigned language tag.`,
      line: 1,
      context: '<html>',
    });
  }

  if (!hasMain) {
    findings.push({
      ruleKey: 'landmark-main',
      message: 'Page has no <main> landmark (or role="main").',
      line: 1,
      context: '<body>',
    });
  }

  const bodyEl = (document as unknown as { body?: Element }).body;
  const firstBodyChild = (bodyEl as unknown as { children?: ArrayLike<Element> })?.children?.[0];
  const firstChildHref =
    firstBodyChild &&
    (firstBodyChild as unknown as { tagName?: string }).tagName?.toUpperCase() === 'A'
      ? (firstBodyChild as unknown as { getAttribute: (n: string) => string | null }).getAttribute(
          'href',
        )
      : null;
  const hasSkipLinkFirst = !!firstChildHref && firstChildHref.startsWith('#');
  if (hasNav && !hasSkipLinkFirst) {
    findings.push({
      ruleKey: 'skip-link',
      message: 'Page contains a <nav> but the first element in <body> is not a skip link (an <a href="#...">).',
      line: 1,
      context: '<body>',
    });
  }

  return findings;
}
