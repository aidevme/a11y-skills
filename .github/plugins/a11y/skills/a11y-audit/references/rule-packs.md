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
- `fluent-menubutton-accessible-name` — icon-only `<MenuButton>` needs `aria-label` describing the menu.
- `fluent-dialog-title` — add a `<DialogTitle>` inside the dialog, or `aria-label` on `<Dialog>`.
- `fluent-checkbox-label` — add `label="…"` to `<Checkbox>`, wrap it in `Field`, or set `aria-label`.
- `fluent-dropdown-label` — pair a `<Label htmlFor>` with a matching `id`, wrap in `Field`, or set `aria-label`.
- `fluent-input-label` — same as `fluent-dropdown-label`, for `<Input>`.
- `fluent-radiogroup-label` — set `aria-label`/`aria-labelledby` on `<RadioGroup>`, or wrap in `Field`.
- `fluent-spinbutton-label` — same as `fluent-dropdown-label`, for `<SpinButton>`.
- `fluent-textarea-label` — same as `fluent-dropdown-label`, for `<Textarea>`.

## code-apps-* (Power Apps Code Apps generated CRUD/grid patterns, Layer 3)

Runs *alongside* `react-*`/`fluent-*` on the same `.tsx` files (Code Apps is React underneath) — checks patterns those packs don't cover, not a replacement for them.

- `code-apps-grid-header-missing-sort-state` — a `<th>`/`role="columnheader"` with an `onClick`/`onSort` handler needs `aria-sort` (`"ascending"`/`"descending"`/`"none"`) reflecting the actual sort state, not a hardcoded value.
- `code-apps-pagination-button-missing-label` — a page-number button whose only content is a bare number (e.g. `<button>3</button>`) needs `aria-label="Go to page 3"` (or similar) — the number alone doesn't convey "this navigates to page 3" to assistive tech.
- `code-apps-datagrid-missing-live-region` — add a `role="status"`/`role="alert"` element with `aria-live` somewhere on the screen that announces loading and empty-state transitions for the data being rendered (SC 4.1.3 Status Messages) — a spinner or empty-state message that's only conveyed visually isn't announced.

**Layer 2 for Code Apps:** no Code-Apps-specific runtime mode — reuse the generic URL-based `--runtime` flag against the app's local dev server:

```bash
pac code run          # starts the Code Apps local dev server
npx @aidevme/a11y audit . --runtime --url <the URL pac code run prints>
```
