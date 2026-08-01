---
name: a11y-dialogs
description: Reference guide for accessible dialogs and modals — focus trapping and restoration, aria-modal semantics, escape handling, and labeling, including Fluent UI v9 Dialog behavior. Use when building or reviewing dialogs, modals, drawers, popovers, or overlay UI.
---

# a11y-dialogs

Pattern reference: WAI-ARIA APG "Dialog (Modal)".

## Structure and naming (SC 4.1.2, 1.3.1)

- The dialog container: `role="dialog"` (or `role="alertdialog"` for interruptions) + `aria-modal="true"` + an accessible name via `aria-labelledby` pointing at the visible title (fallback: `aria-label`).
- Longer description: `aria-describedby` on the container.
- Fluent v9 `<Dialog>` renders all of this itself — **never override `aria-modal`** (rule `fluent-dialog-aria-modal`); use `<DialogTitle>` so the name is wired automatically.

## Focus behavior (SC 2.4.3, 2.1.2)

- On open: move focus into the dialog — the first focusable element, or the least-destructive action for confirmations.
- While open: focus stays inside (trap). Tab from the last element wraps to the first. The page behind must be inert (`inert` attribute or `aria-hidden` on siblings).
- **The trap must be escapable** — Esc closes the dialog. An inescapable overlay is a keyboard trap: SC 2.1.2, a non-interference criterion, never acceptable at any profile.
- On close: return focus to the element that opened the dialog. Losing focus to `<body>` strands screen reader users.

## Dismissal (SC 2.1.1)

- Esc always closes. Backdrop click may close, but never as the only method — provide a visible, focusable Close button (with `aria-label` if icon-only; rule `fluent-button-accessible-name`).

## Non-modal variants

- Drawers/popovers that don't block the page: no `aria-modal`, no trap; focus still moves in on open and restores on close. Popovers additionally need `aria-expanded` on their trigger.

## Checklist

- [ ] `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- [ ] Focus in on open, trapped while open, restored on close
- [ ] Esc closes; visible Close button with accessible name
- [ ] Background inert
- [ ] No `aria-modal` overrides on Fluent `<Dialog>`
