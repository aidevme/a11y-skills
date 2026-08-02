/**
 * Generic depth-first DOM element walker — the shared traversal primitive
 * for static-HTML analysis (DESIGN §2.2: "same walker, two consumers").
 * `rules-power-pages` (Phase 7) imports this directly to add Liquid-aware
 * checks on top without re-implementing traversal.
 */
export function walkElements(root: Element, visit: (el: Element) => void): void {
  visit(root);
  const children = root.children ? Array.from(root.children as unknown as ArrayLike<Element>) : [];
  for (const child of children) {
    walkElements(child, visit);
  }
}
