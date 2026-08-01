---
name: a11y-keyboard
description: Reference guide for keyboard accessibility — tab order, focus visibility, roving tabindex, skip links, and keyboard operability of custom widgets. Use when building or reviewing interactive components, or when asked about keyboard navigation, focus management, or tabindex.
---

# a11y-keyboard

## Operability (SC 2.1.1)

- Everything a mouse can do, the keyboard must do. `onClick` on a `<div>`/`<span>` needs `role`, `tabIndex={0}`, **and** an `onKeyDown` for Enter/Space (audit rule `react-click-events-have-key-events`) — or, almost always better, use a real `<button>`.
- Hover-revealed content must also appear on focus (`react-mouse-events-have-key-events`).

## Focus order (SC 2.4.3)

- Never use a positive `tabIndex` (`react-tabindex-no-positive`) — fix the DOM order instead.
- `tabIndex={0}` puts an element in the natural order; `tabIndex={-1}` makes it programmatically focusable only (for headings/regions you move focus to).
- Don't add non-interactive elements to the tab order (`react-no-noninteractive-tabindex`) — screen reader users browse content without tabbing.

## Focus visibility (SC 2.4.7, 2.4.11)

- Never `outline: none` without an equally visible replacement (`:focus-visible` styling).
- WCAG 2.2 adds Focus Not Obscured: sticky headers/footers must not cover the focused element — account for them in scroll behavior.

## Composite widgets: roving tabindex

- Toolbars, menus, grids, tab lists: **one** tab stop for the whole widget; arrow keys move within. The active item has `tabIndex={0}`, the rest `-1`; update on arrow-key movement. (Alternative: `aria-activedescendant` on a stationary container.)
- Fluent v9 composites (`Menu`, `TabList`, `DataGrid`) implement this — don't fight their focus management with manual `tabIndex`.

## Skip links (SC 2.4.1)

- First focusable element on the page: "Skip to main content", targeting `<main id="main" tabIndex={-1}>`. Visually hidden until focused is fine — `display: none` is not.

## Keyboard traps (SC 2.1.2 — non-interference)

- Focus must always be able to leave any component using Tab/Shift+Tab or a documented, announced mechanism. This is never relaxable at any profile.

## Checklist

- [ ] All actions reachable and operable by keyboard alone
- [ ] No positive `tabIndex`; DOM order = visual order
- [ ] Visible focus indicator everywhere; not obscured by sticky UI
- [ ] Composite widgets use roving tabindex / activedescendant
- [ ] Skip link present; no keyboard traps
