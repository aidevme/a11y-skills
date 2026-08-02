import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { runStaticHtmlChecks } from '../src/checks.js';

function check(html: string) {
  const { document } = parseHTML(html);
  return runStaticHtmlChecks(document as unknown as Document, html);
}

const PAGE = (body: string, htmlAttrs = 'lang="en"') =>
  `<!DOCTYPE html>\n<html ${htmlAttrs}>\n<head><meta charset="utf-8"></head>\n<body>\n${body}\n</body>\n</html>`;

describe('rules-static-html checks (granular, TC-P3.1)', () => {
  it('TC-P3.1-01: <html> without lang → html-lang-missing', () => {
    const findings = check(PAGE('<main><h1>x</h1></main>', ''));
    expect(findings.some((f) => f.ruleKey === 'lang-missing')).toBe(true);
  });

  it('TC-P3.1-02: <html lang="zz-invalid"> → lang-invalid', () => {
    const findings = check(PAGE('<main><h1>x</h1></main>', 'lang="zz-invalid"'));
    expect(findings.some((f) => f.ruleKey === 'lang-invalid')).toBe(true);
  });

  it('valid lang with region subtag (en-US) does not fire', () => {
    const findings = check(PAGE('<main><h1>x</h1></main>', 'lang="en-US"'));
    expect(findings.some((f) => f.ruleKey === 'lang-invalid' || f.ruleKey === 'lang-missing')).toBe(
      false,
    );
  });

  it('TC-P3.1-03: h1 → h3 skip → heading-order', () => {
    const findings = check(PAGE('<main><h1>A</h1><h3>B</h3></main>'));
    expect(findings.some((f) => f.ruleKey === 'heading-order')).toBe(true);
  });

  it('h1 → h2 → h3 (no skip) does not fire heading-order', () => {
    const findings = check(PAGE('<main><h1>A</h1><h2>B</h2><h3>C</h3></main>'));
    expect(findings.some((f) => f.ruleKey === 'heading-order')).toBe(false);
  });

  it('TC-P3.1-04: <label> without for, input without id → label-pairing', () => {
    const findings = check(PAGE('<main><label>Name</label><input type="text"></main>'));
    expect(findings.some((f) => f.ruleKey === 'label-pairing')).toBe(true);
  });

  it('label/for pairing by id satisfies the check', () => {
    const findings = check(
      PAGE('<main><label for="n">Name</label><input id="n" type="text"></main>'),
    );
    expect(findings.some((f) => f.ruleKey === 'label-pairing')).toBe(false);
  });

  it('nested label satisfies the check', () => {
    const findings = check(PAGE('<main><label>Name <input type="text"></label></main>'));
    expect(findings.some((f) => f.ruleKey === 'label-pairing')).toBe(false);
  });

  it('aria-label on the control satisfies the check', () => {
    const findings = check(PAGE('<main><input type="text" aria-label="Name"></main>'));
    expect(findings.some((f) => f.ruleKey === 'label-pairing')).toBe(false);
  });

  it('TC-P3.1-05: no <main>/landmarks → landmark-main', () => {
    const findings = check(PAGE('<h1>x</h1>'));
    expect(findings.some((f) => f.ruleKey === 'landmark-main')).toBe(true);
  });

  it('role="main" satisfies the landmark check without a <main> element', () => {
    const findings = check(PAGE('<div role="main"><h1>x</h1></div>'));
    expect(findings.some((f) => f.ruleKey === 'landmark-main')).toBe(false);
  });

  it('TC-P3.1-06: <nav> present, no skip link as first body child → skip-link', () => {
    const findings = check(PAGE('<nav><a href="/">Home</a></nav><main><h1>x</h1></main>'));
    expect(findings.some((f) => f.ruleKey === 'skip-link')).toBe(true);
  });

  it('skip link as the first body child satisfies the check', () => {
    const findings = check(
      PAGE('<a href="#main">Skip</a><nav><a href="/">Home</a></nav><main id="main"><h1>x</h1></main>'),
    );
    expect(findings.some((f) => f.ruleKey === 'skip-link')).toBe(false);
  });

  it('no <nav> at all never triggers skip-link', () => {
    const findings = check(PAGE('<main><h1>x</h1></main>'));
    expect(findings.some((f) => f.ruleKey === 'skip-link')).toBe(false);
  });

  it('TC-P3.1-07: <img> without alt in plain HTML → img-alt', () => {
    const findings = check(PAGE('<main><img src="x.png"></main>'));
    expect(findings.some((f) => f.ruleKey === 'img-alt')).toBe(true);
  });

  it('alt="" (decorative) satisfies the check', () => {
    const findings = check(PAGE('<main><img src="x.png" alt=""></main>'));
    expect(findings.some((f) => f.ruleKey === 'img-alt')).toBe(false);
  });

  it('TC-P3.1-08: a fully clean page yields zero findings', () => {
    const findings = check(
      PAGE(
        '<a href="#main">Skip</a><nav><a href="/">Home</a></nav><main id="main"><h1>A</h1><h2>B</h2><img src="x.png" alt="d"><label for="n">Name</label><input id="n" type="text"></main>',
      ),
    );
    expect(findings).toEqual([]);
  });
});
