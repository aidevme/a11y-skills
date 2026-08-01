# Rule Reference

> **Generated file — do not edit by hand.** Regenerate with `npm run docs:rules`.
> Source of truth: each pack's `rules-map.json`.

## rules-react (`@aidevme/a11y-rules-react`)

Wraps eslint-plugin-jsx-a11y; only mapped rules are enabled.

| Rule | Severity | WCAG SC | Level | Since | Category | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| `react-alt-text` | error | 1.1.1 | A | 2.0 | semantic | Images and media elements require alternative text. |
| `react-anchor-has-content` | error | 2.4.4 | A | 2.0 | semantic | Anchors must have discernible content. |
| `react-anchor-is-valid` | error | 4.1.2 | A | 2.0 | semantic | Anchors must be valid, navigable links; use a button for actions. |
| `react-aria-props` | error | 4.1.2 | A | 2.0 | semantic | aria-* attributes must be valid ARIA properties. |
| `react-aria-role` | error | 4.1.2 | A | 2.0 | semantic | role values must be valid ARIA roles. |
| `react-aria-unsupported-elements` | error | 4.1.2 | A | 2.0 | semantic | Elements that cannot carry ARIA (meta, script, style) must not have ARIA attributes. |
| `react-click-events-have-key-events` | warning | 2.1.1 | A | 2.0 | interaction | Clickable non-interactive elements need a keyboard handler. |
| `react-heading-has-content` | error | 1.3.1 | A | 2.0 | semantic | Headings must have discernible content. |
| `react-img-redundant-alt` | warning | 1.1.1 | A | 2.0 | semantic | alt text must not contain redundant words like "image" or "picture". |
| `react-label-has-associated-control` | error | 3.3.2 | A | 2.0 | semantic | Labels must be associated with a form control (htmlFor or nesting). |
| `react-media-has-caption` | warning | 1.2.2 | A | 2.0 | semantic | audio/video elements need captions. |
| `react-mouse-events-have-key-events` | warning | 2.1.1 | A | 2.0 | interaction | onMouseOver/onMouseOut require onFocus/onBlur for keyboard users. |
| `react-no-access-key` | warning | 2.1.1 | A | 2.0 | interaction | accessKey conflicts with screen reader and keyboard shortcuts. |
| `react-no-autofocus` | warning | 2.4.3 | A | 2.0 | interaction | autoFocus disorients screen reader and keyboard users. |
| `react-no-distracting-elements` | error | 2.2.2 ⚠NI | A | 2.0 | semantic | marquee/blink are distracting and cannot be paused (non-interference criterion). |
| `react-no-noninteractive-tabindex` | warning | 2.4.3 | A | 2.0 | interaction | Non-interactive elements should not be in the tab order. |
| `react-no-redundant-roles` | warning | 4.1.2 | A | 2.0 | semantic | Redundant explicit roles (e.g. role="button" on button) add noise. |
| `react-role-has-required-aria-props` | error | 4.1.2 | A | 2.0 | semantic | Elements with an ARIA role must carry that role's required properties. |
| `react-role-supports-aria-props` | error | 4.1.2 | A | 2.0 | semantic | aria-* attributes must be supported by the element's role. |
| `react-scope` | error | 1.3.1 | A | 2.0 | semantic | scope attribute is only valid on table header cells. |
| `react-tabindex-no-positive` | warning | 2.4.3 | A | 2.0 | interaction | Positive tabIndex breaks the natural focus order. |

## rules-fluent-ui (`@aidevme/a11y-rules-fluent-ui`)

Custom rules for Fluent UI v9 component semantics; runs only when Fluent is detected.

| Rule | Severity | WCAG SC | Level | Since | Category | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| `fluent-button-accessible-name` | error | 4.1.2 | A | 2.0 | semantic | Icon-only Fluent <Button> requires aria-label or aria-labelledby. |
| `fluent-dialog-aria-modal` | error | 4.1.2 | A | 2.0 | semantic | Fluent <Dialog> manages aria-modal itself; overriding it to false breaks modal semantics. |
| `fluent-field-label` | error | 3.3.2 | A | 2.0 | semantic | Fluent <Field> requires a label prop to label its wrapped control. |
| `fluent-image-alt` | error | 1.1.1 | A | 2.0 | semantic | Fluent <Image> requires an alt prop (or explicit presentation role). |
| `fluent-link-accessible-name` | error | 2.4.4 | A | 2.0 | semantic | Fluent <Link> requires content or aria-label. |
| `fluent-spinner-label` | warning | 4.1.2 | A | 2.0 | semantic | Fluent <Spinner> needs a label or aria-label so its purpose is announced. |

_27 rules total. ⚠NI marks WCAG non-interference criteria (never profile-relaxed, never baseline-eligible)._
