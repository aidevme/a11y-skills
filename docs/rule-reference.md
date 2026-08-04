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

## rules-angular (`@aidevme/a11y-rules-angular`)

Wraps @angular-eslint/eslint-plugin-template; scoped to *.component.html only.

| Rule | Severity | WCAG SC | Level | Since | Category | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| `angular-alt-text` | error | 1.1.1 | A | 2.0 | semantic | Images and media elements require alternative text. |
| `angular-click-events-have-key-events` | warning | 2.1.1 | A | 2.0 | interaction | Clickable non-interactive elements need a keyboard handler. |
| `angular-elements-content` | error | 2.4.4 | A | 2.0 | semantic | Elements such as headings, anchors, and buttons must have discernible textual content. |
| `angular-interactive-supports-focus` | warning | 2.1.1 | A | 2.0 | interaction | Elements with an interactive role must be focusable. |
| `angular-label-has-associated-control` | error | 3.3.2 | A | 2.0 | semantic | Labels must be associated with a form control (for/id or nesting). |
| `angular-mouse-events-have-key-events` | warning | 2.1.1 | A | 2.0 | interaction | (mouseover)/(mouseout) require (focus)/(blur) for keyboard users. |
| `angular-no-autofocus` | warning | 2.4.3 | A | 2.0 | interaction | autofocus disorients screen reader and keyboard users. |
| `angular-no-distracting-elements` | error | 2.2.2 ⚠NI | A | 2.0 | semantic | marquee/blink are distracting and cannot be paused (non-interference criterion). |
| `angular-no-positive-tabindex` | warning | 2.4.3 | A | 2.0 | interaction | Positive tabindex breaks the natural focus order. |
| `angular-role-has-required-aria` | error | 4.1.2 | A | 2.0 | semantic | Elements with an ARIA role must carry that role's required properties. |
| `angular-table-scope` | error | 1.3.1 | A | 2.0 | semantic | scope attribute is only valid on table header cells. |
| `angular-valid-aria` | error | 4.1.2 | A | 2.0 | semantic | aria-* attributes must be valid ARIA properties. |

## rules-svelte (`@aidevme/a11y-rules-svelte`)

Captures the Svelte compiler's own a11y_* warnings directly, plus eslint-plugin-svelte for checks the compiler does not cover (e.g. no-target-blank).

| Rule | Severity | WCAG SC | Level | Since | Category | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| `svelte-a11y-accesskey` | warning | 2.1.1 | A | 2.0 | interaction | accesskey conflicts with screen reader and keyboard shortcuts. |
| `svelte-a11y-aria-activedescendant-has-tabindex` | error | 4.1.2 | A | 2.0 | semantic | An element with aria-activedescendant must be focusable (have a tabindex). |
| `svelte-a11y-aria-attributes` | error | 4.1.2 | A | 2.0 | semantic | Elements that cannot carry ARIA must not have aria-* attributes. |
| `svelte-a11y-autocomplete-valid` | warning | 1.3.5 | AA | 2.1 | semantic | autocomplete value must be a valid token. |
| `svelte-a11y-autofocus` | warning | 2.4.3 | A | 2.0 | interaction | autofocus disorients screen reader and keyboard users. |
| `svelte-a11y-click-events-have-key-events` | warning | 2.1.1 | A | 2.0 | interaction | Clickable non-interactive elements need a keyboard handler. |
| `svelte-a11y-consider-explicit-label` | warning | 3.3.2 | A | 2.0 | semantic | Prefer an explicit label association over an implicit one. |
| `svelte-a11y-distracting-elements` | error | 2.2.2 ⚠NI | A | 2.0 | semantic | marquee/blink are distracting and cannot be paused (non-interference criterion). |
| `svelte-a11y-figcaption-index` | warning | 1.3.1 | A | 2.0 | semantic | figcaption must be the first or last child of figure. |
| `svelte-a11y-figcaption-parent` | warning | 1.3.1 | A | 2.0 | semantic | figcaption must be a direct child of figure. |
| `svelte-a11y-hidden` | warning | 4.1.2 | A | 2.0 | semantic | This element should not be hidden from assistive technology. |
| `svelte-a11y-img-redundant-alt` | warning | 1.1.1 | A | 2.0 | semantic | alt text must not contain redundant words like "image" or "picture". |
| `svelte-a11y-incorrect-aria-attribute-type` | error | 4.1.2 | A | 2.0 | semantic | aria-* attribute value does not match the expected type. |
| `svelte-a11y-incorrect-aria-attribute-type-boolean` | error | 4.1.2 | A | 2.0 | semantic | aria-* attribute must be a boolean value (true/false). |
| `svelte-a11y-incorrect-aria-attribute-type-id` | error | 4.1.2 | A | 2.0 | semantic | aria-* attribute must reference a single element id. |
| `svelte-a11y-incorrect-aria-attribute-type-idlist` | error | 4.1.2 | A | 2.0 | semantic | aria-* attribute must reference a space-separated list of element ids. |
| `svelte-a11y-incorrect-aria-attribute-type-integer` | error | 4.1.2 | A | 2.0 | semantic | aria-* attribute must be an integer value. |
| `svelte-a11y-incorrect-aria-attribute-type-token` | error | 4.1.2 | A | 2.0 | semantic | aria-* attribute must be one of a fixed set of token values. |
| `svelte-a11y-incorrect-aria-attribute-type-tokenlist` | error | 4.1.2 | A | 2.0 | semantic | aria-* attribute must be a space-separated list of token values. |
| `svelte-a11y-incorrect-aria-attribute-type-tristate` | error | 4.1.2 | A | 2.0 | semantic | aria-* attribute must be true, false, or mixed. |
| `svelte-a11y-interactive-supports-focus` | warning | 2.1.1 | A | 2.0 | interaction | Elements with an interactive role must be focusable. |
| `svelte-a11y-invalid-attribute` | error | 4.1.2 | A | 2.0 | semantic | Attribute value is invalid (e.g. an href of just "#"). |
| `svelte-a11y-label-has-associated-control` | error | 3.3.2 | A | 2.0 | semantic | Labels must be associated with a form control (for/id or nesting). |
| `svelte-a11y-media-has-caption` | warning | 1.2.2 | A | 2.0 | semantic | audio/video elements need captions. |
| `svelte-a11y-misplaced-role` | error | 4.1.2 | A | 2.0 | semantic | This element cannot carry an ARIA role. |
| `svelte-a11y-misplaced-scope` | error | 1.3.1 | A | 2.0 | semantic | scope attribute is only valid on table header cells. |
| `svelte-a11y-missing-attribute` | error | 1.1.1 | A | 2.0 | semantic | This element is missing a required attribute (most commonly alt on img). |
| `svelte-a11y-missing-content` | error | 2.4.4 | A | 2.0 | semantic | Heading/anchor elements must have discernible text content. |
| `svelte-a11y-mouse-events-have-key-events` | warning | 2.1.1 | A | 2.0 | interaction | onmouseover/onmouseout require onfocus/onblur for keyboard users. |
| `svelte-a11y-no-abstract-role` | error | 4.1.2 | A | 2.0 | semantic | Abstract ARIA roles cannot be used directly. |
| `svelte-a11y-no-interactive-element-to-noninteractive-role` | error | 4.1.2 | A | 2.0 | semantic | Do not assign a non-interactive role to a naturally interactive element. |
| `svelte-a11y-no-noninteractive-element-interactions` | warning | 2.1.1 | A | 2.0 | interaction | Non-interactive elements should not have interactive event handlers without a supporting role. |
| `svelte-a11y-no-noninteractive-element-to-interactive-role` | error | 4.1.2 | A | 2.0 | semantic | Do not assign an interactive role to a naturally non-interactive, static element. |
| `svelte-a11y-no-noninteractive-tabindex` | warning | 2.4.3 | A | 2.0 | interaction | Non-interactive elements should not be in the tab order. |
| `svelte-a11y-no-redundant-roles` | warning | 4.1.2 | A | 2.0 | semantic | Redundant explicit roles (e.g. role="button" on button) add noise. |
| `svelte-a11y-no-static-element-interactions` | warning | 2.1.1 | A | 2.0 | interaction | Static elements with event handlers need an interactive role and keyboard support. |
| `svelte-a11y-positive-tabindex` | warning | 2.4.3 | A | 2.0 | interaction | Positive tabindex breaks the natural focus order. |
| `svelte-a11y-role-has-required-aria-props` | error | 4.1.2 | A | 2.0 | semantic | Elements with an ARIA role must carry that role's required properties. |
| `svelte-a11y-role-supports-aria-props` | error | 4.1.2 | A | 2.0 | semantic | aria-* attributes must be supported by the element's role. |
| `svelte-a11y-role-supports-aria-props-implicit` | error | 4.1.2 | A | 2.0 | semantic | aria-* attributes must be supported by the element's implicit role. |
| `svelte-a11y-unknown-aria-attribute` | error | 4.1.2 | A | 2.0 | semantic | aria-* attribute is not a recognized ARIA property. |
| `svelte-a11y-unknown-role` | error | 4.1.2 | A | 2.0 | semantic | role value is not a valid ARIA role. |
| `svelte-no-target-blank` | warning | 3.2.5 | AAA | 2.0 | interaction | target="_blank" opens a new window without warning the user; pair with rel="noopener noreferrer" and consider avoiding it. |

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

## rules-pcf (`@aidevme/a11y-rules-pcf`)

Layer 3 domain rules (surface: pcf) via the JSON DSL engine (`@aidevme/a11y-rules-engine`): PCF manifest (ControlManifest.Input.xml) accessible-name and control-type checks, plus Dataverse form XML (*.form.xml) label checks.

| Rule | Severity | WCAG SC | Level | Since | Category | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| `dataverse-cell-label-empty` | error | 3.3.2 | A | 2.0 | semantic | Dataverse form fields need a non-empty label. |
| `dataverse-cell-label-hidden` | error | 3.3.2 | A | 2.0 | semantic | A field cell with showlabel="false" hides its label from every user, not only visually. |
| `dataverse-section-label-empty` | warning | 1.3.1 | A | 2.0 | semantic | Dataverse form sections need a non-empty label. |
| `dataverse-section-label-hidden` | warning | 1.3.1 | A | 2.0 | semantic | A section with showlabel="false" hides its grouping label from every user, not only visually. |
| `dataverse-tab-label-empty` | error | 2.4.6 | AA | 2.0 | semantic | Dataverse form tabs need a non-empty label. |
| `pcf-control-missing-description` | warning | 4.1.2 | A | 2.0 | semantic | PCF control manifests need a description-key documenting the control's purpose. |
| `pcf-control-missing-display-name` | error | 4.1.2 | A | 2.0 | semantic | PCF control manifests need a display-name-key so the control has an accessible name. |
| `pcf-property-missing-description` | warning | 4.1.2 | A | 2.0 | semantic | Properties need a description-key documenting their purpose. |
| `pcf-property-missing-display-name` | error | 4.1.2 | A | 2.0 | semantic | Bound/input/output properties need a display-name-key so they have an accessible name. |
| `pcf-standard-control-manual-keyboard-review` | warning | 2.1.1 | A | 2.0 | interaction | Standard (non-virtual) controls own their own DOM/canvas rendering and need manual keyboard-operability review. |

## rules-code-apps (`@aidevme/a11y-rules-code-apps`)

Layer 3 domain rules (surface: code-apps) via the JSON DSL engine, checking TSX AST patterns for Power Apps Code Apps generated CRUD/grid screens: sortable column headers, pagination button labels, data-bound live regions. Runs alongside rules-react/rules-fluent-ui, not instead of them.

| Rule | Severity | WCAG SC | Level | Since | Category | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| `code-apps-datagrid-missing-live-region` | warning | 4.1.3 | AA | 2.1 | semantic | A data-bound screen needs an aria-live/status/alert region to announce loading and empty states. |
| `code-apps-grid-header-missing-sort-state` | warning | 4.1.2 | A | 2.0 | semantic | A clickable/sortable column header needs aria-sort so its sort state is programmatically determinable. |
| `code-apps-pagination-button-missing-label` | error | 4.1.2 | A | 2.0 | semantic | A numeric-only page button needs an aria-label describing which page it navigates to. |

_125 rules total. ⚠NI marks WCAG non-interference criteria (never profile-relaxed, never baseline-eligible)._
