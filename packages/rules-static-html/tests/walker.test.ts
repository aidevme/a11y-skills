import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { walkElements } from '../src/index.js';

/**
 * TC-P3.1-09: proves the Phase 7 reuse contract — a "dummy extension pack"
 * (rules-power-pages, later) can consume the exported walker directly and
 * receive every element node, without re-implementing traversal.
 */
describe('walkElements (P7 reuse contract)', () => {
  it('a dummy extension visitor receives every element in document order, matching querySelectorAll', () => {
    const html =
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head><body><main><h1>A</h1><p>B <a href="/">C</a></p></main></body></html>';
    const { document } = parseHTML(html);
    const root = document.documentElement as unknown as Element;

    const visitedByExtension: string[] = [];
    const dummyExtensionVisitor = (el: Element): void => {
      // A "dummy extension" doing its own thing (e.g. a Liquid-tag check in
      // rules-power-pages) — it only needs the shared traversal primitive.
      visitedByExtension.push((el as unknown as { tagName: string }).tagName);
    };

    walkElements(root, dummyExtensionVisitor);

    // querySelectorAll('*') already includes the root <html> element itself.
    const expectedTags = Array.from(
      (document as unknown as { querySelectorAll: (s: string) => ArrayLike<Element> }).querySelectorAll(
        '*',
      ),
    ).map((el) => (el as unknown as { tagName: string }).tagName);
    expect(visitedByExtension).toEqual(expectedTags);
    expect(visitedByExtension.length).toBeGreaterThan(5);
  });

  it('an empty element (no children) still gets visited exactly once', () => {
    const html = '<!DOCTYPE html><html><head></head><body><br></body></html>';
    const { document } = parseHTML(html);
    const root = document.documentElement as unknown as Element;
    let count = 0;
    walkElements(root, () => {
      count++;
    });
    expect(count).toBe(4); // html, head, body, br
  });
});
