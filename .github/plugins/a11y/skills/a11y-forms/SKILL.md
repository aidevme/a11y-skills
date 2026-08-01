---
name: a11y-forms
description: Reference guide for accessible forms — labels, descriptions, error identification and validation messaging, required-field semantics, autocomplete, and grouping, including Fluent UI v9 Field and Label patterns. Use when building or reviewing form UI, or when asked how to make inputs, selects, or validation accessible.
---

# a11y-forms

## Labels (SC 3.3.2, 1.3.1)

- Every control gets a programmatically associated label: `<label htmlFor="id">` + `id`, nesting, or `aria-labelledby`. Placeholder text is **not** a label — it disappears on input and fails contrast.
- Fluent v9: wrap controls in `<Field label="…">` — it wires the label, validation message, and hint to the control. Never render an `<Input>` outside a labeled `Field` (rule `fluent-field-label`).
- Group related controls (radio sets, address blocks) with `<fieldset>`/`<legend>` or `role="group"` + `aria-labelledby`.

## Errors and validation (SC 3.3.1, 3.3.3, 4.1.3)

- Identify errors in text — never color alone. Associate the message via `aria-describedby` and set `aria-invalid="true"` on the control.
- On submit failure, move focus to the first invalid control or to an error summary that links to each field.
- Announce async validation results with a live region (`role="alert"` for blocking errors, `role="status"` for confirmations).
- Fluent v9: `<Field validationState="error" validationMessage="…">` handles the association — use it instead of hand-rolled ARIA.

## Required fields and instructions (SC 3.3.2)

- Mark required fields with `required` (or `aria-required="true"`), plus a visible convention explained before the form.
- Put format instructions ("DD/MM/YYYY") in the label or an `aria-describedby` hint, not the placeholder.

## Autocomplete (SC 1.3.5)

- Add `autoComplete` tokens (`name`, `email`, `tel`, `street-address`…) on fields collecting user data — assistive tech uses them to identify purpose.

## Checklist

- [ ] Every control labeled (audit rule `react-label-has-associated-control` / `fluent-field-label`)
- [ ] Errors in text + `aria-invalid` + `aria-describedby`
- [ ] Focus moves to the error on failed submit
- [ ] Required and format hints programmatically associated
- [ ] `autoComplete` on personal-data fields
