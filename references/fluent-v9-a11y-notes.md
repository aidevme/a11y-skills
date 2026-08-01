# Fluent UI v9 — accessibility behavior notes

Shared research source for the `rules-fluent-ui` pack and the topic-guide skills. Each entry states what Fluent v9 handles itself and what the consumer must still provide — the gap is what our rules check.

| Component | Fluent handles | Consumer must provide | Rule |
| --- | --- | --- | --- |
| `Dialog` | `role="dialog"`, `aria-modal`, focus trap, Esc handling, focus restore | A title via `DialogTitle` (wires `aria-labelledby`); **no `aria-modal` overrides** | `fluent-dialog-aria-modal` |
| `Button` | Correct role, keyboard activation | An accessible name when icon-only: `aria-label`/`aria-labelledby`/`title` or visible content | `fluent-button-accessible-name` |
| `Image` | — | `alt` text (or `alt=""` for decorative) | `fluent-image-alt` |
| `Field` | Wires label, hint, and validation message to the wrapped control (`aria-describedby`, `aria-invalid`) | The `label` prop itself | `fluent-field-label` |
| `Spinner` | `role="progressbar"` | `label` (or `aria-label`) so the loading state is announced | `fluent-spinner-label` |
| `Link` | Correct role/keyboard semantics for anchor or button rendering | Discernible content or `aria-label` | `fluent-link-accessible-name` |
| `Menu` / `TabList` / `DataGrid` | Roving tabindex, arrow-key navigation, roles | Don't override `tabIndex` on items; provide item labels | (candidate rules, later) |
| `Combobox` / `Dropdown` | Listbox semantics, `aria-expanded` | A label (via `Field` or `aria-label`) | (covered via `fluent-field-label` when wrapped) |
| `Tooltip` | `aria-describedby` wiring when `relationship="description"` | Set `relationship` correctly; tooltip must not be the only label | (candidate rule, later) |

Implementation notes for rule authors:

- Rules only fire on components **imported from `@fluentui/react-components`** (alias-aware import resolution) — a local component named `Button` must never trigger (TEST_PLAN TC-P1.4-06/07).
- Fluent renders portal content (Dialog, Menu) outside the app root — Layer 2 runtime scans must run against the whole document, not a container query.
- v9's `Field` replaced v8's per-control `label` props; code migrated from v8 often loses labels — the `fluent-field-label` rule is the migration safety net.
