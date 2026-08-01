# Rule packs and typical fixes

Full generated reference: `docs/rule-reference.md` in the repo. Fix patterns by rule family:

## react-* (jsx-a11y based)

- `react-alt-text` — add `alt="…"`; decorative images get `alt=""`.
- `react-anchor-is-valid` — action, not navigation? Replace `<a onClick>` with `<button type="button">`.
- `react-click-events-have-key-events` — add `onKeyDown` handling Enter/Space + `role="button"` + `tabIndex={0}`, or use a real `<button>`.
- `react-tabindex-no-positive` — remove the positive `tabIndex`; fix DOM order instead.
- `react-aria-props` — usually a typo: `aria-labeledby` → `aria-labelledby`.
- `react-aria-role` — use a valid ARIA role or drop the attribute.
- `react-label-has-associated-control` — pair `<label htmlFor>` with the input `id`, or nest the input.
- `react-no-distracting-elements` — remove `<marquee>`/`<blink>` entirely (non-interference SC 2.2.2).

## fluent-* (Fluent UI v9)

- `fluent-button-accessible-name` — icon-only `<Button>` needs `aria-label`.
- `fluent-dialog-aria-modal` — delete the `aria-modal` override; Fluent manages it.
- `fluent-field-label` — add `label="…"` to `<Field>`.
- `fluent-image-alt` — add `alt` to `<Image>`.
- `fluent-spinner-label` — add `label="…"` so loading is announced.
- `fluent-link-accessible-name` — give `<Link>` text content or `aria-label`.
