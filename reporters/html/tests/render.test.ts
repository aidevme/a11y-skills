import { describe, expect, it } from 'vitest';
import type { Finding } from '@aidevme/a11y';
import { renderHtml, type HtmlMeta } from '../src/index.js';

const meta: HtmlMeta = {
  profile: 'standard',
  wcagVersion: '2.2',
  failOn: 'error',
  generatedAt: '2026-08-01T00:00:00.000Z',
};

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
    fingerprint: 'fp-1',
    ...over,
  } as Finding;
}

describe('HTML reporter (TC-P2.2)', () => {
  it('TC-P2.2-01: self-contained — no external scripts, stylesheets, or images', () => {
    const html = renderHtml({ findings: [finding({})], meta });
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/<link[^>]+href=/);
    expect(html).not.toMatch(/<img/);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>Accessibility Audit Report</title>');
  });

  it('TC-P2.2-08: hostile message content is escaped, never executable', () => {
    const html = renderHtml({
      findings: [finding({ message: '<script>alert(1)</script> & "quotes"' })],
      meta,
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;');
  });

  it('embedded a11y-data block round-trips and contains no raw "<"', () => {
    const html = renderHtml({ findings: [finding({ message: 'has <tag> inside' })], meta });
    const m = html.match(/<script type="application\/json" id="a11y-data">([\s\S]*?)<\/script>/);
    expect(m).not.toBeNull();
    expect(m?.[1].includes('<')).toBe(false);
    const parsed = JSON.parse(m?.[1] ?? '') as { fingerprint: string; message: string }[];
    expect(parsed[0].fingerprint).toBe('fp-1');
    expect(parsed[0].message).toBe('has <tag> inside');
  });

  it('TC-P2.2-04: compare mode renders new/fixed/persistent counts', () => {
    const current = [finding({}), finding({ fingerprint: 'fp-2', ruleId: 'x2' })];
    const previous = [{ fingerprint: 'fp-1' }, { fingerprint: 'fp-old' }];
    const html = renderHtml({ findings: current, meta, previousFindings: previous });
    expect(html).toContain('New findings: <strong>1</strong>');
    expect(html).toContain('Fixed since last report: <strong>1</strong>');
    expect(html).toContain('Persistent: <strong>1</strong>');
  });

  it('TC-P2.2-05: baselined findings are marked and split in counts; verdict ignores them', () => {
    const html = renderHtml({
      findings: [finding({ baselined: true })],
      meta,
    });
    expect(html).toContain('baselined-row');
    expect(html).toContain('1 baselined finding(s) reported non-failing');
    expect(html).toContain('verdict-pass');
  });

  it('TC-P2.2-06: a failing page fails its whole process (WCAG 5.2.3)', () => {
    const html = renderHtml({
      findings: [finding({ page: 'http://x/checkout/step1' })],
      meta: { ...meta, processes: { checkout: ['http://x/checkout/step1', 'http://x/checkout/step2'] } },
    });
    expect(html).toMatch(/checkout[\s\S]*?verdict-fail/);
    expect(html).toContain('whole process fails');
  });

  it('TC-P2.2-07: claim block renders WCAG 5.3.2 fields', () => {
    const html = renderHtml({
      findings: [],
      meta: {
        ...meta,
        claim: {
          date: '2026-08-01',
          wcagVersion: '2.1',
          level: 'AA',
          pages: ['http://x/'],
          technologies: ['react'],
        },
      },
    });
    expect(html).toContain('Conformance claim');
    expect(html).toContain('WCAG 2.1 Level AA');
  });

  it('runtime findings group per page; static findings keep their own table', () => {
    const html = renderHtml({
      findings: [finding({ page: 'http://x/a', fingerprint: 'p1' }), finding({ fingerprint: 's1' })],
      meta,
    });
    expect(html).toContain('Page: http://x/a');
    expect(html).toContain('Static analysis (source files)');
  });

  it('deterministic for identical input; golden snapshot', () => {
    const input = { findings: [finding({})], meta };
    expect(renderHtml(input)).toBe(renderHtml(input));
    expect(renderHtml(input)).toMatchSnapshot();
  });
});
