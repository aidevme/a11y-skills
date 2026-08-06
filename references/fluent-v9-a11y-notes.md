# Fluent UI v9 — accessibility behavior notes

Shared research source for the `rules-fluent-ui` pack and the topic-guide skills. Each entry states what Fluent v9 handles itself and what the consumer must still provide — the gap is what our rules check.

| Component | Fluent handles | Consumer must provide | Rule |
| --- | --- | --- | --- |
| `Dialog` | `role="dialog"`, `aria-modal`, focus trap, Esc handling, focus restore | A title via `DialogTitle` (wires `aria-labelledby`); **no `aria-modal` overrides** | `fluent-dialog-aria-modal`, `fluent-dialog-title` |
| `Button` | Correct role, keyboard activation | An accessible name when icon-only: `aria-label`/`aria-labelledby`/`title` or visible content | `fluent-button-accessible-name` |
| `MenuButton` | Everything `Button` handles, plus `aria-expanded`/`aria-haspopup` wiring via `MenuTrigger` | Same accessible-name rule as `Button` — the chevron is decorative | `fluent-menubutton-accessible-name` |
| `Image` | — | `alt` text (or `alt=""` for decorative) | `fluent-image-alt` |
| `Field` | Wires label, hint, and validation message to the wrapped control (`aria-describedby`, `aria-invalid`) | The `label` prop itself | `fluent-field-label` |
| `Spinner` | `role="progressbar"` | `label` (or `aria-label`) so the loading state is announced | `fluent-spinner-label` |
| `Link` | Correct role/keyboard semantics for anchor or button rendering | Discernible content or `aria-label` | `fluent-link-accessible-name` |
| `Checkbox` | Native `<input type="checkbox">` semantics, focus, keyboard | `label` prop, `Field` wrapper, or `aria-label`/`aria-labelledby` | `fluent-checkbox-label` |
| `Dropdown` | Listbox semantics, `aria-expanded` | A label via `Label htmlFor` + matching `id`, `Field` wrapper, or `aria-label`/`aria-labelledby` (`placeholder` is not sufficient) | `fluent-dropdown-label` |
| `Input` | Native `<input>` semantics | Same labelling pattern as `Dropdown` | `fluent-input-label` |
| `RadioGroup` | `role="radiogroup"`, shared `name`, arrow-key navigation between `Radio` items | A *group* label via `aria-label`/`aria-labelledby` or `Field` wrapper (each `Radio` needs its own `label` prop separately, not rule-checked yet) | `fluent-radiogroup-label` |
| `SpinButton` | `role="spinbutton"`, increment/decrement keyboard handling | Same labelling pattern as `Dropdown` | `fluent-spinbutton-label` |
| `Textarea` | Native `<textarea>` semantics | Same labelling pattern as `Dropdown`/`Input` | `fluent-textarea-label` |
| `Menu` / `TabList` / `DataGrid` | Roving tabindex, arrow-key navigation, roles | Don't override `tabIndex` on items; provide item labels | (candidate rules, later) |
| `Combobox` | Listbox semantics, `aria-expanded`, freeform text input | A label (via `Field`, `Label htmlFor`, or `aria-label`) | (candidate rule, later — `Dropdown`'s sibling, not yet covered) |
| `Tooltip` | `aria-describedby` wiring when `relationship="description"` | Set `relationship` correctly; tooltip must not be the only label | (candidate rule, later) |

Implementation notes for rule authors:

- Rules only fire on components **imported from `@fluentui/react-components`** (alias-aware import resolution) — a local component named `Button` must never trigger (TEST_PLAN TC-P1.4-06/07).
- Fluent renders portal content (Dialog, Menu) outside the app root — Layer 2 runtime scans must run against the whole document, not a container query.
- v9's `Field` replaced v8's per-control `label` props; code migrated from v8 often loses labels — the `fluent-field-label` rule is the migration safety net.
- The six `fluent-*-label` rules (Checkbox/Dropdown/Input/RadioGroup/SpinButton/Textarea) share one factory (`makeLabelRequirementRule` in `rules.ts`) that accepts `aria-label`/`aria-labelledby`, an ancestor `<Field>`, or a sibling `<Label htmlFor>` matching the control's `id` — collected file-wide so ordering in the JSX doesn't matter. `Field`/`Label` matching is by literal JSX tag name, not import-resolved, mirroring the existing `hasMeaningfulChildren` simplification; this can only suppress a finding, never cause a false positive.
- `fluent-dialog-title` walks the `Dialog`'s JSX subtree (through fragments and `{cond && <X/>}`/`{cond ? <A/> : <B/>}`) looking for a `DialogTitle` descendant — it won't see a title that only exists behind an untraceable expression (e.g. rendered by a separate component), a known limitation of static analysis.
