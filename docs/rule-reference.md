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

## rules-vue (`@aidevme/a11y-rules-vue`)

Wraps eslint-plugin-vuejs-accessibility via vue-eslint-parser.

| Rule | Severity | WCAG SC | Level | Since | Category | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| `vue-alt-text` | error | 1.1.1 | A | 2.0 | semantic | Images and media elements require alternative text. |
| `vue-anchor-has-content` | error | 2.4.4 | A | 2.0 | semantic | Anchors must have discernible content. |
| `vue-aria-props` | error | 4.1.2 | A | 2.0 | semantic | aria-* attributes must be valid ARIA properties. |
| `vue-aria-role` | error | 4.1.2 | A | 2.0 | semantic | role values must be valid ARIA roles. |
| `vue-aria-unsupported-elements` | error | 4.1.2 | A | 2.0 | semantic | Elements that cannot carry ARIA (meta, script, style) must not have ARIA attributes. |
| `vue-click-events-have-key-events` | warning | 2.1.1 | A | 2.0 | interaction | Clickable non-interactive elements need a keyboard handler. |
| `vue-form-control-has-label` | error | 3.3.2 | A | 2.0 | semantic | Form controls must have a programmatically associated label. |
| `vue-heading-has-content` | error | 1.3.1 | A | 2.0 | semantic | Headings must have discernible content. |
| `vue-iframe-has-title` | error | 4.1.2 | A | 2.0 | semantic | iframe elements require a title describing their content. |
| `vue-interactive-supports-focus` | warning | 2.1.1 | A | 2.0 | interaction | Elements with an interactive role must be focusable. |
| `vue-label-has-for` | error | 3.3.2 | A | 2.0 | semantic | Labels must be associated with a form control via for/id or nesting. |
| `vue-media-has-caption` | warning | 1.2.2 | A | 2.0 | semantic | audio/video elements need captions. |
| `vue-mouse-events-have-key-events` | warning | 2.1.1 | A | 2.0 | interaction | @mouseover/@mouseout require @focus/@blur for keyboard users. |
| `vue-no-access-key` | warning | 2.1.1 | A | 2.0 | interaction | accessKey conflicts with screen reader and keyboard shortcuts. |
| `vue-no-aria-hidden-on-focusable` | error | 4.1.2 | A | 2.0 | semantic | aria-hidden must not be set on a focusable element — it becomes an invisible, unlabeled stop in the tab order. |
| `vue-no-autofocus` | warning | 2.4.3 | A | 2.0 | interaction | autofocus disorients screen reader and keyboard users. |
| `vue-no-distracting-elements` | error | 2.2.2 ⚠NI | A | 2.0 | semantic | marquee/blink are distracting and cannot be paused (non-interference criterion). |
| `vue-no-onchange` | warning | 3.2.2 | A | 2.0 | interaction | @change should not trigger unexpected context changes without warning the user. |
| `vue-no-redundant-roles` | warning | 4.1.2 | A | 2.0 | semantic | Redundant explicit roles (e.g. role="button" on button) add noise. |
| `vue-no-role-presentation-on-focusable` | error | 4.1.2 | A | 2.0 | semantic | role="presentation" must not be set on a focusable element — it strips the semantics assistive tech needs. |
| `vue-no-static-element-interactions` | warning | 2.1.1 | A | 2.0 | interaction | Static elements with event handlers need an interactive role and keyboard support. |
| `vue-role-has-required-aria-props` | error | 4.1.2 | A | 2.0 | semantic | Elements with an ARIA role must carry that role's required properties. |
| `vue-tabindex-no-positive` | warning | 2.4.3 | A | 2.0 | interaction | Positive tabindex breaks the natural focus order. |

## rules-static-html (`@aidevme/a11y-rules-static-html`)

Custom DOM-tree walker (no build step) checking landmarks, alt text, label pairing, heading order, lang, and skip links.

| Rule | Severity | WCAG SC | Level | Since | Category | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| `html-heading-order` | error | 1.3.1 | A | 2.0 | semantic | Heading levels must not skip — they convey document structure to screen reader users. |
| `html-img-alt` | error | 1.1.1 | A | 2.0 | semantic | Images require alternative text (alt="" for decorative images). |
| `html-label-pairing` | error | 3.3.2 | A | 2.0 | semantic | Form controls must have a programmatically associated label (for/id, nesting, or aria-label/aria-labelledby). |
| `html-landmark-main` | error | 1.3.1 | A | 2.0 | semantic | The page must expose a main landmark (<main> or role="main") so assistive tech users can jump to content. |
| `html-lang-invalid` | error | 3.1.1 | A | 2.0 | semantic | The html lang attribute must be a valid, assigned language tag. |
| `html-lang-missing` | error | 3.1.1 | A | 2.0 | semantic | The html element must declare a lang attribute so assistive tech uses the right pronunciation/voice. |
| `html-skip-link` | error | 2.4.1 | A | 2.0 | semantic | Pages with repeated navigation need a mechanism (e.g. a skip link) to bypass it. |

_57 rules total. ⚠NI marks WCAG non-interference criteria (never profile-relaxed, never baseline-eligible)._
