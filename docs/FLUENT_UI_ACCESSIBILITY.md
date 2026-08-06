# Fluent UI Accessibility

## Component labelling

Source: [Fluent UI — Component labelling](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-component-labelling--docs)

A label should be clear and sufficiently explain the purpose of the component. It should **not** contain component type, role, action, state, position, or repeating text. See the examples below.

### Prefer reusing visible text for labels

- **Bad:** `aria-label="Remove Robert Tolbert"` applied directly on the button.
- **Good:** the visible user name span has `id="userNameId"`, the "Remove" button has `id="removeButtonId"`, and the button carries `aria-labelledby="removeButtonId userNameId"`.
- Both produce the same screen reader narration ("Remove Robert Tolbert Button To activate press spacebar"), but the good version reuses information already visible in the UI instead of duplicating it in a hard-coded string.
- A component may reference itself via `aria-labelledby` — this pattern comes from the [Accessible Name and Description Computation 1.1](https://www.w3.org/TR/accname-1.1/#terminology) spec (§4.3.1 Terminology, example 2B).

### Form fields labelling

- **Bad:** a form field isn't connected to its error message, so a screen reader only announces "Full name, Edit, Required, invalid entry" with no explanation of what's wrong.
- **Good:** the input has `aria-describedby` referencing the error message element, so the screen reader also narrates the full validation message (e.g. "Full name is invalid. It must: contain only lowercase or uppercase letters, spaces or hyphens...").
- Every form field should reference its corresponding error message via `aria-describedby` so the message is narrated whenever the field is focused.

### Avoid action in accessibility name

- **Bad:** `aria-label="Click here to send message"`
- **Good:** `aria-label="Send message"`
- Adding action instructions ("Click here to...") prolongs narration with information the screen reader already conveys based on the component's type/role. Make sure the component uses the correct HTML element or ARIA role so its type is announced automatically.

### Avoid component type in accessibility name

- **Bad:** `aria-label="Mute microphone button"`
- **Good:** `aria-label="Mute microphone"`
- Adding the component type (e.g. "button") duplicates what the screen reader already announces from the element's role. Use the correct HTML element or ARIA role instead of hard-coding the type into the name.

### Avoid state in accessibility name

- **Bad:** `aria-label="Files tab is active"` on the "Files" tab.
- **Good:** no `aria-label` needed — the screen reader announces "Files tab selected 2 of 3" from the element's state.
- Hard-coding state into the accessible name is unnecessary when the correct ARIA state attribute is used (`aria-checked`, `aria-selected`, `aria-pressed`, `aria-current`, etc. — see the [ARIA spec](https://www.w3.org/TR/wai-aria/)).

### Avoid position in accessibility name

- **Bad:** each menu item's `aria-label` manually includes "first item of four", "second item of four", etc.
- **Good:** no manual position text — using `role="menuitem"` on items and `role="menu"` on the parent lets the screen reader announce "1 of 4", "2 of 4", etc. automatically.
- Don't hard-code "X of Y" position text; use the correct ARIA roles and let the screen reader compute it. JAWS currently supports this for `listbox`, `menu`, `tablist`, `tree`, `radiogroup`, `grid`, `treegrid`, and similar roles — see the [ARIA specification](https://www.w3.org/TR/wai-aria/) for the required owned elements (`option`, `menuitem`, `tab`, `treeitem`, etc.).

### Avoid repeating text for component inner items

- **Bad:** `aria-label="Meeting participant [user name]"` applied to every item in a list, so each item's narration repeats "Meeting participant" before the name.
- **Good:** no `aria-label` on each item; instead `aria-label="Meeting participants"` is applied once, on the containing list/menu element.
- Repeating text on every item prolongs narration and forces the user to wait through it before reaching the useful content. Label the container instead. This applies broadly — to `Tree`, `List`, `Listbox`, `Toolbar`, and similar components.

### Avoid making text focusable

- **Bad:** `tabindex="0"` on a plain text element, adding it as its own stop in the tab order.
- **Good:** the text isn't focusable. Either reference it from an actionable element via `aria-describedby` (e.g. a checkbox referencing an explanatory paragraph by id), or wrap the actionable element in a container with `role="group"` and a label/`aria-labelledby` that includes the text.
- Non-actionable elements shouldn't receive focus — it adds an unnecessary tab stop. Use `aria-describedby` so the text is still narrated when the related actionable element is focused, or group with `role="group"` plus a label.

## Components

### Button

Source: [Fluent UI — Button accessibility spec](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-button--docs)

`Button` triggers an action or event when activated. It is the foundational building block for more specialized button variants in this package — `CompoundButton`, `MenuButton`, `SplitButton`, and `ToggleButton` — each of which has its own accessibility considerations beyond what is covered here.

By default, `Button` renders a native HTML `<button>` element and inherits all of its built-in accessibility behavior. When rendered as an anchor (`as="a"`), additional ARIA attributes and keyboard handlers are applied to make it behave like a button.

#### Usage

##### When to choose Button

###### Button vs. anchor / Link

Use `Button` when activation triggers an action on the page, such as submitting a form, opening a dialog, or running a command. Use a link (`<a>` or Fluent's `Link` component) when activation navigates the user to a different page or location.

A good indication that something should be a link is if the URL changes when clicked, even if routing is handled via JavaScript. Using a link allows end users to perform actions like copying the URL, opening in a new window or tab, and accessibility benefits such as appearing in a screen reader's links dialog.

If the visual design calls for a button-styled control that navigates somewhere, render `Button` as an anchor with `as="a"` and an `href`. This preserves link semantics (so screen readers announce it as a link, and users can open it in a new tab) while keeping the visual styling of a button.

###### Button vs. ToggleButton

`ToggleButton` should be used when a control represents a binary on/off state that persists after activation, such as toggling bold formatting in an editor. `Button` should be used for actions that do not have a persistent on/off state.

###### Button vs. MenuButton / SplitButton

Use `MenuButton` when activating the control should open a menu of options. Use `SplitButton` when there is a primary default action plus a related menu of variations on that action. Use `Button` when there is a single action with no associated menu.

##### Implementing Button

###### Label

Authors must provide an accessible label for every `Button`. The label is what assistive technologies announce when the button receives focus.

For buttons with visible text content, the text content automatically serves as the accessible name:

```tsx
<Button>Save</Button>
```

For icon-only buttons (a `Button` with an `icon` slot but no children), an `aria-label` must be provided, since there is no visible text:

```tsx
<Button icon={<EditRegular />} aria-label="Edit" />
```

When pairing a `Button` with separate visible label text (for example, when a tooltip is providing the label), use `aria-labelledby` to point at the id of that text.

When using the Fluent `Tooltip` control with a `Button` where the Tooltip represents the primary labelling text, use the `relationship="label"` attribute to provide the accessible name:

```tsx
<Tooltip content="Edit" relationship="label">
  <Button icon={<EditRegular />} />
</Tooltip>
```

###### Content

Use concise, action-oriented labels. A single verb is usually best, with a noun included if there is any room for interpretation about what the verb acts on (for example, "Delete folder" rather than "Delete"). Use sentence-style capitalization.

###### Content restrictions

The following content types should not be used within children or slots of `Button`:

- Any interactive or focusable content (links, other buttons, inputs).
- Any structured content, such as tables, lists, or headings.

Focusable content nested inside a button is not reliably reachable by assistive technologies when the root renders as `<button>` or `<div role="button">`.

The following content types may be used within children and slot content of `Button`:

- Images and icons (decorative; the button itself provides the accessible name)
- Generic elements like `<span>`, without `tabindex` or `role` properties
- Fluent's `<Text>` component

###### Disabled vs. disabledFocusable

`Button` exposes two ways to indicate that the control cannot be activated:

- `disabled` — the button is not focusable and cannot be activated. This is the default disabled behavior of the underlying `<button>` element.
- `disabledFocusable` — the button is still programmatically focusable, but it is not in the tab order and activation is blocked. The hook applies `aria-disabled="true"` and intercepts click and key activation.

Outside of very specific edge cases, prefer using the `disabled` attribute for buttons. Assistive tech like screen readers can still read disabled controls, the `disabled` attribute should not be avoided for discoverability by screen readers.

`disabledFocusable` should be used in these cases:

1. The Button is inside a control with arrow key navigation. The only such control that a `Button` should appear in is `Toolbar`.
2. The Button can become disabled when activated. In this case, use `disabledFocusable` so that the user does not lose their keyboard focus. This affects screen reader users the most since losing focus causes them to lose their cursor's place on the page.

Both `disabled` and `disabledFocusable` apply the same disabled visual styling.

###### Anchor (`as="a"`)

When `Button` is rendered as an anchor with `as="a"`, the underlying element is `<a>` rather than `<button>`. To preserve button-like semantics and behavior, `useARIAButtonProps` adds:

- `role="button"` when no `href` is present (so the element is exposed as interactive to assistive technology; an `<a>` element with no `href` is semantically equivalent to a `<span>`)
- `tabIndex={0}` so the element is keyboard focusable when no `href` is present
- Synthetic Space activation, since anchors do not natively activate on Space

When `href` is present, the role remains the default link role, and the control is announced as a link. When the anchor is disabled, `href` is removed to prevent navigation, and `role="link"` is set explicitly so the element is still announced as a (disabled) link rather than silently changing role.

###### Color contrast and appearance variants

Each appearance variant has different color contrast considerations:

- `primary` uses brand background colors. The text color is paired with the brand background to meet 4.5:1 contrast in the supported themes.
- `secondary` (default) and `outline` rely on the page background. They must be placed over a background light or dark enough that the button's border meets 3:1 contrast against the page background, and the text meets 4.5:1 contrast.
- `subtle` and `transparent` have no border and no background at rest. They must be placed over a background that provides 4.5:1 contrast against the button's text color.

Authors are responsible for ensuring the button is placed on a background where these contrast requirements are met. The included themes guarantee contrast within the default page surfaces.

###### Target size

[WCAG 2.5.8 Target Size (Minimum)](https://w3c.github.io/wcag/understanding/target-size-minimum.html) requires interactive controls to be at least 24×24 CSS pixels. `Button`'s default styles meet this requirement at all sizes, including the smallest icon-only size (24×24). When overriding layout styles such as `padding`, `min-width`, `min-height`, or `font-size`, authors must verify the rendered button is still at least 24×24.

#### Semantics

| Element | Role mapping | States and properties |
| --- | --- | --- |
| Default (`<button>`) | button | `type="button"`, `disabled` or `aria-disabled="true"` when disabled |
| Anchor with `href` (`as="a"`) | link | `aria-disabled="true"` and `role="link"` when disabled (no `href`) |
| Anchor without `href` (`as="a"`) | button | `role="button"`, `tabIndex="0"`, `aria-disabled="true"` when disabled |

#### Keyboard interaction

##### Navigate to button

`Button` is a single tab stop.

| Key | Result |
| --- | --- |
| Tab | Moves focus to the button |
| Shift + Tab | Moves focus to the button from a later focus target |

When either `disabled` or `disabledFocusable` is set, the button is removed from in the tab order.

##### Activate button

| Key | Result |
| --- | --- |
| Enter | Activates the button (fires `onClick`) |
| Space | Activates the button on key release (fires `onClick`) |

For native `<button>` elements, this behavior comes from the browser. For anchors rendered with `as="a"`, `useARIAButtonProps` from `@fluentui/react-aria` attaches `onKeyDown` and `onKeyUp` handlers to call `click()` on Enter and Space, matching native button behavior. Space activates on key release (matching the platform convention) and the default scroll behavior is suppressed on key down.

When the button is disabled (`disabled`, `disabledFocusable`, or `aria-disabled="true"`), Enter and Space activation is blocked and the click event is not fired.

#### Windows contrast themes (high contrast mode)

`Button` adapts to Windows contrast themes (high contrast mode) using system colors inside `@media (forced-colors: active)`:

- Default appearance uses the default system mappings for colors
- `primary` explicitly maps to `Highlight` (background) and `HighlightText` (text and border) so the visual emphasis of the primary action is preserved in high contrast mode.
- `:hover` and `:hover:active` states swap to the inverse pairing (`HighlightText` background with `Highlight` text and border) so interactive feedback remains visible.
- Disabled states use `GrayText` for text, border, and icon, which allows `disabledFocusable` to match the native platform colors for `disabled`.

##### Potential high contrast mode pitfalls

The Button control uses `forcedColorAdjust: none` in three places:

- `:hover` styles on the default button
- `:hover:active` and `:active:focus-visible` on the default button
- All styles on the `primary` button

This is important because if any custom styles targeting those selectors override `background` or `color` directly instead of updating tokens, it is likely that the correct high contrast color styles will need to be re-declared in the `forced-colors` media query.

#### Motion and animation

`Button` has a short transition (`durationFaster`) on `background`, `border`, and `color` when interaction state changes. This transition is shortened to `0.01ms` when [`prefers-reduced-motion: reduce`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) is set, effectively disabling the animation while preserving the final visual state.

There is no other motion or animation on `Button`.

### Checkbox

Source: [Fluent UI — Checkbox accessibility spec](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-checkbox--docs)

`Checkbox` lets a user toggle an option on, off, or — in some cases — into a mixed state representing partial selection of a group. Internally it renders a real `<input type="checkbox">` element with a custom visual indicator, and uses the native input for all ARIA semantics and keyboard interaction.

Because the underlying control is a native checkbox, `Checkbox` inherits the browser's built-in accessibility behavior: focus, role, checked state, and the platform keyboard contract are all handled by the browser. The visible square (or circle) the user sees is a separate `aria-hidden` element rendered next to the input; it does not contribute to the accessibility tree.

#### Usage

##### When to choose Checkbox

###### Checkbox vs. Switch

This is largely a visual choice -- both Checkbox and Switch are standalone controls that support on/off user input and communicate their state and state changes in almost identical ways. One difference is that Checkbox supports an `indeterminate` or `checked="mixed"` state, and Switch does not. The Switch control uses an `<input type="checkbox">` as the underlying interactive element, so all keyboard behavior is identical. While Switch adds `role="switch"`, the difference to screen reader users is negligible.

###### Checkbox vs. ToggleButton

ToggleButton is another control with an on/off user-selected state. The difference here is also largely visual, though ToggleButton is semantically a button and hints towards users that pressing it will have an immediate effect on the page. Checkbox, in contrast, is traditionally a form control. However, in the modern web, checkbox inputs may be used outside of a form and have immediate effects when toggled. Both choices are ultimately accessible for any standalone on/off user input.

###### Checkbox vs. Radio

Use `Checkbox` when multiple options can be selected independently, or when a single option can be turned on or off. Use a `RadioGroup` when the user must choose exactly one from a set of mutually exclusive options.

###### Multiselect Dropdown vs. Checkboxes

For fewer than ~10 options, a checkbox group is significantly more usable and accessible than a multiselect `Dropdown` or `Combobox`. Prefer checkboxes for small option sets.

###### Tri-state (mixed) checkboxes

Use `checked="mixed"` when the checkbox controls a group of sub-options that are partially selected (for example, a "Select all" master checkbox above a list where some but not all items are selected). The mixed state is announced by screen readers as "mixed" or "partially checked", and is the standard ARIA pattern for this case.

The `circular` shape variant is **only** appropriate for tasks-style UI (a checklist), where it is unambiguously a completion control. Do not use `circular` for general form checkboxes — users will mistake it for a radio button.

##### Checkbox within other controls

There are multiple other types of composite widgets that will sometimes visually display a checked/unchecked icon: multiselect Dropdown and Combobox, Tree, and Menu. However, all of these have their own specific semantic ways of exposing selection (e.g. `role="menuitemcheckbox"` inside a `role="menu"` or `aria-checked` on a `role="treeitem"`). Checkbox should not be directly used in any of these controls. Nested interactives are forbidden, so Checkbox is not a valid child of a menuitem, option, or treeitem.

Instead of using the Checkbox control within these composite widgets, use the styles for the check indicator directly as a visual-only indication of selection combined with the component-specific selection semantics for the control in question.

Checkbox may be used directly within Toolbar, which is the only composite / arrow-navigation control that supports flexible interactive children.

##### Implementing Checkbox

###### Programmatic label

`Checkbox` does not render its own visible label text unless the `label` prop is set. Authors must provide a label one of three ways:

```tsx
<Checkbox label="I agree to the terms" />
```

The `label` prop renders a `<label>` element with `htmlFor` pointing at the internal input id, so clicking the label text toggles the checkbox.

When `Checkbox` is wrapped in `Field`, the field's label is associated with the checkbox automatically via the same `htmlFor` mechanism, and there is no need to set `label` on the checkbox itself:

```tsx
<Field label="I agree to the terms">
  <Checkbox />
</Field>
```

If neither of those layouts fits, use `aria-label` or `aria-labelledby` on the `<Checkbox>` to point at visible label text elsewhere on the page. `aria-label` should be avoided when a visible label is available, since screen reader and voice control users benefit from the labels matching what they see on screen.

###### Visual label

Per [WCAG 3.3.2 — Labels or Instructions](https://w3c.github.io/wcag/understanding/labels-or-instructions.html), every checkbox needs a visible label or visibly associated text. The visible text and the programmatic accessible name should match.

A checkbox with **no** visible label (only an `aria-label`) is acceptable only when the surrounding visual context makes the meaning obvious — for example, checkboxes in the first column of a table, where another column in the row serves as the visible label.

###### Field integration

When `Checkbox` is inside `Field`, `Field` automatically applies:

- `id` — generated and used for the `<label htmlFor>` association.
- `aria-labelledby` — set if the consumer overrides `id` so that the input is still labelled correctly.
- `aria-describedby` — points at the field's validation message and hint, merged with any consumer-provided value.
- `required` — applied as the native attribute on the `<input>` (Checkbox opts in to `supportsRequired`).

`Checkbox` does **not** automatically set `aria-invalid` from `Field`'s `validationState`. There is no error visual styling on the checkbox itself; communicate validation through the field's validation message text.

When `Checkbox` is not inside `Field`, the consumer is responsible for `aria-describedby`, `aria-invalid`, and `required` if those are needed.

###### Tri-state (mixed)

`Checkbox` exposes its tri-state via the `checked` and `defaultChecked` props, which accept `true`, `false`, or the string `"mixed"`. Internally, `"mixed"` maps to the native [`indeterminate`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#indeterminate_state_checkboxes) property on the `<input>`, which is what assistive technologies read to announce "mixed" or "partially checked".

The mixed state can only be set programmatically (it is not a value the user can toggle to). The standard pattern is:

1. The consumer determines that not all sub-items are selected and sets `checked="mixed"` on the master checkbox.
2. The user activates the master checkbox.
3. `onChange` fires with `data.checked = false` (since the native input was indeterminate before activation, the browser treats the activation as a transition away from indeterminate).
4. The consumer updates its model — typically clearing or selecting all sub-items — and the next render passes a non-mixed `checked` value.

Because the mixed → next-state transition is driven by the consumer's `onChange` handler, authors must ensure that handler updates state in a way that does not leave the checkbox stuck in `"mixed"` after a user toggle.

###### Disabled

`Checkbox` supports the native `disabled` attribute, which removes the input from the tab order and prevents toggling. There is no `disabledFocusable` analog — checkboxes that need to remain focusable in a roving-tabindex context should use the native disabled behavior, since a disabled form input is reliably announced by screen readers.

When disabled, the cursor on the root becomes `default`, all colors switch to disabled tokens, and the indicator's color is mapped to `GrayText` in Windows contrast themes.

###### Click target

The hidden `<input>` is sized to cover the visible indicator plus the surrounding padding, so clicking anywhere on the indicator (or the empty space immediately around it) toggles the checkbox. Clicking the `<label>` element also toggles the checkbox via the native `<label htmlFor>` association.

When customizing layout, ensure the combined indicator + click-padding area remains at least 24×24 CSS pixels per [WCAG 2.5.8 Target Size (Minimum)](https://w3c.github.io/wcag/understanding/target-size-minimum.html). The default sizes meet this.

#### Semantics

`Checkbox` is a composition of a native input, a visual indicator, and an optional label:

| Slot | Role | States and properties |
| --- | --- | --- |
| root | none | A plain `<span>` with no role; used for layout, focus-within outline, and click-target sizing. |
| input | checkbox (native) | `type="checkbox"`; `checked` reflects `true`/`false`; `indeterminate` reflects `"mixed"`; `disabled`, `required`, `aria-labelledby`, `aria-describedby` as applied by Field or the consumer. |
| indicator | none | A `<div>` with `aria-hidden="true"`; the visible square or circle. Purely presentational. |
| label | label (native) | A `<label htmlFor={input.id}>` from `@fluentui/react-label`. Clicking it toggles the input. |

Note: never set `aria-checked` on a Checkbox, since it conflicts in unexpected and unsupported ways with the native `checked` property.

Focus lives on the `<input>` element. The visible focus indicator is drawn on the root via `:focus-within` from `createFocusOutlineStyle` in `@fluentui/react-tabster`, because the actual `<input>` is `opacity: 0` and would not show its native focus ring.

The indicator is not part of the accessibility tree. Screen readers announce the checkbox using the native input's role and `checked`/`indeterminate` state, with the label text as its accessible name — the visual checkmark is not announced separately.

#### Keyboard interaction

`Checkbox` is a single tab stop. All keyboard behavior comes from the native `<input type="checkbox">` element.

| Key | Result |
| --- | --- |
| Tab | Moves focus to the checkbox. |
| Shift + Tab | Moves focus to the checkbox from a later target. |
| Space | Toggles the checkbox. Fires `onChange`. |

There is no Enter activation on a checkbox — pressing Enter inside a form submits the form, matching native behavior.

When `disabled` is set, the input is removed from the tab order entirely and is not interactable.

#### Windows contrast themes (high contrast mode)

`Checkbox` relies on native browser behavior to provide forced-colors values for most interaction states. The component itself only adds one explicit forced-colors rule: the disabled state maps the root and indicator colors to `GrayText`, so the disabled affordance matches the platform's disabled-control color. This is because the border is on the indicator slot and not on the native input, so does not automatically set the correct color based on the input element's state.

#### Motion and animation

`Checkbox` has no animation. State changes (checked / unchecked / mixed) are immediate. There is therefore nothing to gate on `prefers-reduced-motion`.

### Dropdown

Source: [Fluent UI — Dropdown accessibility spec](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-dropdown--docs)

`Dropdown` is one of three form selection components that display the current selection, and allow a user to expand a popup to modify the selection. The other two are `Select` and `Combobox`.

The semantics and behavior are roughly similar to a more complex version of the `Select` component (an HTML `<select>` element), but with more functionality and full control over styling. Unlike `Combobox`, `Dropdown` does not allow text input. `Dropdown` supports both single-selection and multi-selection.

#### Usage

##### When to choose Dropdown

###### Dropdown vs. Select

`Dropdown` is a more feature-rich version of `Select`, which comes at the cost a larger code footprint, and less robust support for accessibility compared to the native `<select>` element.

Use `Dropdown` when any of the following are required:

- Control over styling the popup and options
- Multiple selection
- Virtualization

Otherwise, `Select` is recommended for performance, accessibility, and native-feeling mobile support.

###### Dropdown vs. Combobox

`Combobox` allows text input, which enables filtering and freeform values. This is a better fit for use cases with a large number of options, or where the user may want to type a value directly without interacting with the popup.

###### Dropdown vs. Menu

`Select` or `Dropdown` should be used over `Menu` when creating a standalone control for selecting values. `Menu` should be used when the purpose is to allow the user to perform an immediate action on the page, or when the control is embedded within a parent `Menu`.

Examples of appropriate `Menu` usage include:

- Application top menus
- Context menus
- Editing menubars

###### Multiselect Dropdown vs. Checkboxes

Checkboxes are significantly more usable and accessible than multiselect comboboxes for smaller numbers of choices. Consider using a checkbox group over `Dropdown` if there are less than 10 options.

##### Implementing Dropdown

###### Label

Authors must provide label text for `Dropdown`. The recommended pattern for Fluent form controls is to use the `Label` component like this:

```tsx
<Label htmlFor="dropdown-id">Favorite Fruit</Label>
<Dropdown id="dropdown-id">
  <Option>Apple</Option>
  <Option>Banana</Option>
</Dropdown>
```

Other options include:

1. `aria-label="label text string"` on the `<Dropdown>` component
2. `aria-labelledby="label-id"` on the `<Dropdown>` component, pointing to the id of label text

The `placeholder` prop is not a substitute for a label. It is no longer displayed when a value is selected, while labels must be persistently visible and exposed to the user.

###### Content restrictions

The following content types should not be used within children or slots of `Dropdown`:

- Any interactive or focusable content, aside from `<Option>`.
- Any structured content, such as tables, lists, or headings.

The following content types should not be used within children or slots of `Option`:

- Any interactive or focusable content, aside from `<Option>`.
- Any structured content, such as tables, lists, or headings.
- Tooltips

Focusable and interactive content is prohibited based on the semantics of `Dropdown` and `Option`, and will cause issues for screen reader users. Focusable items within the popup will additionally not be keyboard accessible.

The following content types may be used within children and slot content in `Dropdown` and `Option`:

- Images and icons
- Generic elements like `<div>` and `<span>`, without `tabindex` or `role` properties
- Fluent's `<Text>` component

###### inlinePopup

By default, the popup renders in its own layer at the end of the DOM to ensure it appears above all other UI, and is not clipped by containers with `overflow: hidden` or `overflow: scroll`. This causes an issue for people who use iOS VoiceOver (Apple's touch-based screen reader), since it strictly follows DOM order when swiping from one control to the next. This makes it difficult to reach the options popup after opening the `Dropdown`.

If possible, we recommend setting `inlinePopup={true}`, which will render the popup directly after the `Dropdown` button in the DOM for better VoiceOver touch support.

###### Option value

By default, the `<Option>` component calculates its text value from its children. This works if the children are a simple string, like this:

```tsx
<Option>Simple text string</Option>
```

However, if the `<Option>` contains JSX, this will not work correctly. If that is the case, provide a string value with the `value` prop:

```tsx
<Option value="Simple text string">
  <CheckRegular />
  <span>Simple text string</span>
</Option>
```

`Dropdown` uses string values to handle jumping between options based on alphanumeric keyboard input, so `value` must match the visual text displayed within the `Option`.

###### Color contrast and appearance variants

The `filled-lighter`, `filled-darker`, and `underline` all have contrast requirements for their background color:

- `filled-lighter` and `filled-darker` variants must both be placed over background colors dark enough to meet 3:1 contrast against the `Dropdown` button's background color.
- `underline` must be placed over a light enough background for the placeholder and value text to meet 4.5:1 contrast against the page background.

#### Semantics

| Element | Role | States and properties |
| --- | --- | --- |
| Trigger button | combobox | `type="button"`, `aria-haspopup="listbox"`, `aria-activedescendant="active-option-id"`, `aria-expanded="true"/"false"` |
| Popup | listbox | — |
| Option | option | `aria-selected="true"/"false"` |
| Wrapper | (no role) | `aria-owns="listbox-id"` |

Putting `aria-owns` on the wrapping element moves the listbox immediately after the trigger in the accessibility tree, even though it is rendered at the end of the DOM. For all screen readers but VoiceOver, this enables virtual cursor navigation between the trigger and listbox/options. [Safari does not support `aria-owns`](https://bugs.webkit.org/show_bug.cgi?id=241694).

#### Keyboard interaction

##### Navigate to dropdown

The closed dropdown button is a single tab stop.

| Key | Result |
| --- | --- |
| Tab | Moves focus to the dropdown (`aria-expanded="false"`) |
| Shift + Tab | Moves focus to the dropdown from a later focus target |

##### Open or close the listbox popup

###### Open popup with no selected options

| Key | Result |
| --- | --- |
| Enter | Opens popup with first option in focus |
| Space | Opens popup with first option in focus |
| Up or Down arrow | Opens popup with first option in focus |
| Any printable character | Opens popup with focus on first option matching that character |
| Esc or Alt + Up arrow | Closes popup without modifying selection, and keeps dropdown in focus |

###### Open popup with a selected option (or options)

When one or more options are already selected, focus moves to the most recently selected option when the popup is opened (that option carries `aria-selected="true"`).

##### Navigate between options in popup

| Key | Result |
| --- | --- |
| Up arrow | Moves focus to the previous option, if one exists |
| Down arrow | Moves focus to the next option, if one exists |
| Home | Moves focus to the first option |
| End | Moves focus to the last option |
| PageUp | Moves focus up 10 options, or to the first option |
| PageDown | Moves focus down 10 options, or to the last option |
| Any printable character | Moves focus to the next option matching that character |

##### Behavior: Single-selection

###### Select an option

| Key | Result |
| --- | --- |
| Enter or Space | Selects the focused option and closes the popup |
| Tab | Selects the focused option, closes the popup, and moves focus after the dropdown |
| Shift + Tab | Selects the focused option, closes the popup, and moves focus before the dropdown |

###### Popup closes automatically after an option is selected

After selection, the popup collapses and focus returns to the trigger button (`aria-expanded="false"`).

##### Behavior: Multiselection

Unlike single-select behavior, multiselect Dropdowns do not close automatically after a selection is made, unless using Tab or Shift + Tab.

| Key | Result |
| --- | --- |
| Enter or Space | Toggles selection on or off for focused option |
| Tab | Toggles selection on or off for focused option, closes the popup, and moves focus after the dropdown |
| Shift + Tab | Toggles selection on or off for focused option, closes the popup, and moves focus before the dropdown |

#### Windows contrast themes (high contrast mode)

Dropdown fully relies on native browser behavior for Windows contrast themes. All borders, icons, and text adapt to the user-selected theme colors without modifying styles in a media query.

#### Motion and animation

The focus underline's growing animation does not run when [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) is true.

#### Known issues

- [Safari does not support `aria-owns`](https://bugs.webkit.org/show_bug.cgi?id=241694)
- [JAWS does not expose option group labels](https://github.com/FreedomScientific/VFO-standards-support/issues/381)
- [Android Talkback does not expose option group labels](https://issuetracker.google.com/issues/225987035)
- NVDA and JAWS do not explicitly announce "selected" for selected options (this is not a bug per se, but occasionally causes confusion)

### Input

Source: [Fluent UI — Input accessibility spec](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-input--docs)

`Input` is a single-line text entry control. It wraps a native HTML `<input>` element in a styled `<span>` container, with optional `contentBefore` and `contentAfter` slots for in-field decoration (icons, units, prefixes, or action buttons).

Because the rendered control is a real `<input>`, `Input` inherits the browser's built-in accessibility behavior for text fields: caret movement, selection, IME composition, autofill, password masking, spellcheck, and the platform-native keyboard contract are all handled by the browser. This spec covers what Fluent layers on top: labelling, the `Field` integration, the `contentBefore` / `contentAfter` slots, validation, and visual considerations.

#### Usage

##### When to choose Input

`Input` is for free-form single-line text entry. The component supports a constrained set of text-based `type` values: `text` (default), `email`, `password`, `search`, `tel`, `url`, `date`, `datetime-local`, `month`, `number`, `time`, and `week`. For non-text input types like `button`, `checkbox`, or `radio`, use the appropriate Fluent component instead.

###### Input vs. SpinButton

Use `SpinButton` (not `Input` with `type="number"`) when the value is a number within a defined range and the user benefits from incremental adjustment with arrow keys, or from explicit min/max boundaries that are announced to assistive technology. `Input type="number"` does not enforce min/max in a way screen readers reliably announce, and does not support non-numerical characters such as commas, dollar signs, etc.

###### Input vs. Textarea

Use `Textarea` when the user needs to enter multi-line content (comments, descriptions, free-form notes). Use `Input` for single-line entry, even if the value is long — the input will scroll horizontally rather than wrap.

###### Input vs. Combobox / Dropdown

If the user is selecting from a known set of values, prefer `Combobox` (which allows freeform entry alongside selection) or `Dropdown` / `Select`. `Input` should be reserved for cases where the value space is open-ended.

##### Implementing Input

###### Programmatic Label

`Input` does not render its own label. Authors must always associate the input with visible label text. The recommended pattern is to wrap `Input` in a `Field`, which sets `id` and the label association automatically:

```tsx
<Field label="Full name">
  <Input />
</Field>
```

If `Field` is not appropriate for the layout, use `Label` directly with `htmlFor`:

```tsx
<Label htmlFor="full-name">Full name</Label>
<Input id="full-name" />
```

Other options:

1. `aria-labelledby="label-id"` on the `<Input>`, pointing at the id of visible label text elsewhere on the page.
2. `aria-label="label text string"` on the `<Input>`. Use sparingly — some sort of visible or contextual label is required.

###### Visual Label

All form fields including Input require a visible label per [WCAG 3.3.2 — Labels or Instructions](https://w3c.github.io/wcag/understanding/labels-or-instructions.html). That label does not need to be a `<label>` element, but there must be text that is visually associated with the input that functions as its label. The programmatic accessible name of the input should match that text.

There are only two exceptions to this rule:

1. For top-level search inputs that have a search icon — the search icon is considered generally understood and can function as the visible label for one search input in the current context. If there are multiple search inputs with different functions, they will still require a specific text label, however.
2. In chat applications such as Teams or M365 Copilot, where the main content area contains exactly one chat input, usually at the bottom of the pane. In this case, we consider the surrounding context (it being a chat application) plus the visual language of the input staying at the bottom of the pane to be sufficient for a user to understand what the input does.

###### Placeholder

The `placeholder` prop is **not** a substitute for a label. Placeholder text disappears as soon as the user starts typing, while WCAG requires a persistent visual label to be present. Placeholder also fails contrast requirements in some themes by design.

Because the `placeholder` is not persistent, it also should never be used for user instructions such as "Type / for more suggestions", unless those instructions are easily accessible elsewhere.

###### Field integration

When `Input` is rendered inside `Field`, `Field` automatically wires up:

- `id` — generated and applied so the field's `<Label>` `htmlFor` points at the input.
- `aria-labelledby` — set if the consumer's `id` does not match the label's `htmlFor` (so the input is still labelled even when the consumer overrides the id, or if Field is used with an element that does not support native `<label>` + `for` association).
- `aria-describedby` — set to point at the validation message and hint elements, merged with any consumer-provided `aria-describedby`.
- `aria-invalid` — set to `true` when `Field`'s `validationState` is `"error"`.
- `required` — applied as the native attribute when `Field` is marked required (Input opts in to `supportsRequired`, so the attribute used is `required`, not `aria-required`).

When `Input` is **not** inside `Field`, the consumer is responsible for any of these attributes that are needed (`aria-describedby` for hint/error text, `aria-invalid` for validation state, `required`).

###### contentBefore and contentAfter

The `contentBefore` and `contentAfter` slots render inside the visual input border, on either side of the editable text. They are rendered as siblings of the `<input>` element in DOM order: `contentBefore` precedes the input, `contentAfter` follows it.

Three common patterns each have different accessibility implications:

**Decorative icon.** A non-interactive icon describing the field (for example, a magnifying glass on a search field). The icon is purely visual and does not need to be in the accessible name or focusable.

```tsx
<Field label="Search">
  <Input contentBefore={<SearchRegular />} />
</Field>
```

**Action button.** A `Button` that performs an action related to the input (for example, a microphone button to dictate input). The button is a separate focusable control with its own accessible name.

```tsx
<Field label="First name">
  <Input contentAfter={<Button appearance="transparent" icon={<MicRegular />} aria-label="Start dictation" />} />
</Field>
```

The button is reached by Tab after the input (or before it, if placed in `contentBefore`). Authors must ensure the button has its own accessible name — the input's label does not propagate to it.

**Presentational text that completes the field's meaning.** For example, a `$` prefix and `.00` suffix on an amount field. These are visible text that materially affects how the input value should be read, but they are **not** part of the input's value or its accessible name by default. To make the input announce as "Amount to pay, dollars, dot zero zero", the consumer must write concise human-readable alternative text and include it in `aria-labelledby` or an `aria-label` explicitly:

```tsx
<Field label="Amount to pay">
  <Input
    contentBefore={<Text id="prefix">$</Text>}
    contentAfter={<Text id="suffix">.00</Text>}
    aria-labelledby={`${fieldLabelId} prefix suffix`}
  />
</Field>
```

This is the consumer's responsibility — `Input` does not infer the accessible name from `contentBefore` / `contentAfter`.

###### Disabled

`Input` supports the native `disabled` attribute, which removes the input from the tab order and prevents value changes. There is no `disabledFocusable` analog for `Input` — keeping a disabled text field in the tab order is rarely useful, and the native disabled behavior is the standard. The `readonly` attribute is a native alternative state for inputs that is still focusable and allows text to be read and copied but not edited.

When disabled, the focus underline animation and focus outline are suppressed, the cursor becomes `not-allowed`, the border switches to `colorNeutralStrokeDisabled` (or `GrayText` in forced colors), and any `contentBefore` / `contentAfter` content is colored to match.

Focusable content placed in `contentBefore` / `contentAfter` is **not** automatically disabled by the parent `Input`'s `disabled` prop; authors who want the inner button to also be disabled must pass `disabled` on it explicitly.

###### Validation

When `Input` is inside `Field` with `validationState="error"`, `aria-invalid="true"` is applied to the `<input>` and the wrapper switches to the red border style. Outside of `Field`, the consumer can set `aria-invalid` directly — the red border style keys off the rendered `aria-invalid` attribute on the `<input>`, so styling and ARIA stay in sync.

The error **message** itself is not provided by `Input`. Use `Field`'s `validationMessage` (which is automatically wired into `aria-describedby`), or wire your own message element via `aria-describedby`. An `aria-invalid` value with no accompanying description tells the user the field is invalid but does not tell them why.

Both `error` and `warning` validation states give the `validationMessage` a `role=alert` and will be announced to screen reader users as soon as they appear. Other validation states will not cause the message to be announced automatically. If this behavior is desired, use the `useAnnounce` utility to do so.

###### Color contrast and appearance variants

All inputs must have some part of their boundary meet 3:1 contrast against the background behind the input. The placeholder or value text are not sufficient to meet this requirement. Each appearance variant meets this contrast requirement in a different way:

- `outline` (default) — the bottom border specifically uses `colorNeutralStrokeAccessible`, which is darker than the surrounding border tokens to meet the indicator-contrast requirement.
- `underline` — only the bottom border is visible at rest, and meets 3:1 contrast against the background.
- `filled-darker` and `filled-lighter` — these must be placed on a surface that provides at least 3:1 contrast against the input's background color, so the boundary of the input is still discernible.
- `filled-darker-shadow` and `filled-lighter-shadow` — **deprecated**. Do not use in new code; they emit a console error in development.

The bottom focus border (`::after`) uses `colorCompoundBrandStroke`, which is the brand color and is guaranteed to meet 3:1 against all supported page surfaces in the included themes.

##### Placing Input within an arrow-navigation region like Toolbar or Menu

It is not recommended to place an input inside a horizontal arrow-navigable region like a `Toolbar`, since left/right arrow keys are already used within an input to move through characters in its value. If this is done, the consumer must provide a custom way to switch between navigating the input value and navigating the `Toolbar` with arrow keys.

An `input` is not technically a valid child of other arrow-navigable controls like `Menu` — doing so violates the ARIA spec's parent/child requirements for `role=menu`, as well as others like `role=tree` or `role=listbox`. However, the practical consequences of doing so are relatively low in severity **if** the input is the first interactive child of the menu or listbox. Exercise caution when doing so, and document both the ARIA violation and reason for doing so.

If Input is used within a vertical arrow-navigation region like Menu or Listbox, do not put any interactive controls like `button` inside the `contentBefore` and `contentAfter` slots.

#### Semantics

`Input` renders a wrapping `<span>` for styling and the actual `<input>` element for editing:

| Slot | Role | States and properties |
| --- | --- | --- |
| root | none | A plain `<span>` with no role; used only for visual border and focus styling. |
| input | textbox (native) | `type` attribute; `aria-invalid`, `aria-describedby`, `aria-labelledby`, `disabled`, `required` as applied by `Field` or the consumer. |
| contentBefore | none | A `<span>` with no role; contains decorative or interactive content placed before the input. |
| contentAfter | none | A `<span>` with no role; contains decorative or interactive content placed after the input. |

Focus lives on the `<input>` element. The visual focus state (the animated bottom border) is applied to the root via `:focus-within`, but the focused element from a screen reader and keyboard perspective is always the `<input>`.

The wrapping `<span>` is **not** a `<label>`. Clicking on the wrapper padding or on a non-focusable `contentBefore` / `contentAfter` does not move focus to the input. If a label-like click-to-focus surface is needed, wrap the input in a `<Label htmlFor>` or use `Field`, which provides the label semantics.

#### Keyboard interaction

`Input` is a single tab stop. All editing key behavior comes from the browser's native `<input>` implementation and matches platform conventions.

When `disabled` is set, the input is removed from the tab order entirely, and is not interactable.

Focusable content placed in `contentBefore` or `contentAfter` is a separate tab stop. Within the rendered DOM order, the tab sequence is: `contentBefore` (if focusable) → `input` → `contentAfter` (if focusable).

#### Windows contrast themes (high contrast mode)

`Input` relies almost entirely on the browser's native `<input>` behavior in Windows contrast themes. The native input adapts its background, text, caret, and placeholder colors to the user-selected theme without explicit overrides in the component's styles.

The only explicit forced-colors rule on `Input` is for the disabled state: the border switches to `GrayText` so the disabled affordance matches the system disabled-control color. This is because the border style is on the parent root node and not on the `<input>` element itself, so it does not natively pick up the disabled state's color.

Because `contentBefore` and `contentAfter` are arbitrary user-supplied content, their forced-colors behavior is the consumer's responsibility. Decorative icons typically need no special handling; interactive content (like a `Button` inside `contentAfter`) inherits whatever forced-colors handling that component provides.

#### Motion and animation

The bottom focus border has two animations — one for focus in and one for focus out — using `durationNormal` (focus in) and `durationUltraFast` (focus out) respectively. Both animations are shortened to `0.01ms` when [`prefers-reduced-motion: reduce`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) is set, effectively disabling the motion while preserving the final visual state. There is no other motion on `Input`.

### MenuButton

Source: [Fluent UI — MenuButton accessibility spec](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-menubutton--docs)

`MenuButton` is a `Button` that opens a menu when activated. It renders a trailing chevron icon to communicate the presence of an associated menu, and manages `aria-expanded` to reflect whether the menu is currently open.

`MenuButton` extends `Button` and inherits all of its accessibility behavior. This spec only covers what is **specific** to `MenuButton`. For label requirements, the difference between `disabled` and `disabledFocusable`, anchor (`as="a"`) rendering, contrast considerations across appearance variants, target size, motion, and base keyboard activation, see the [Button](#button) section above.

#### Usage

##### When to choose MenuButton

Use `MenuButton` when activation should open a menu of items for the user to choose from. If activation performs a single direct action with no associated menu, use `Button`. If activation performs a primary action and the user needs an alternate way to reach related variations, use `SplitButton`.

Despite its name, it is possible to use `MenuButton` for any Button that opens/closes a non-modal popup, such as a Popover.

`MenuButton` is the typical trigger for the `Menu` component, and is what `MenuTrigger` produces by default when its `disableButtonEnhancement` prop is not set.

##### Implementing MenuButton

###### Use with Menu and MenuTrigger

The recommended pattern is to wrap `MenuButton` in `MenuTrigger` inside a `Menu`. `MenuTrigger` handles the ARIA wiring (`aria-haspopup`, `aria-controls`, and toggling `aria-expanded`) and the keyboard behavior to open and close the menu, including Down arrow to open the menu and place focus on the first item, and Esc to close the menu and return focus to the trigger.

```tsx
<Menu>
  <MenuTrigger disableButtonEnhancement>
    <MenuButton>Open menu</MenuButton>
  </MenuTrigger>
  <MenuPopover>
    <MenuList>
      <MenuItem>Item a</MenuItem>
      <MenuItem>Item b</MenuItem>
    </MenuList>
  </MenuPopover>
</Menu>
```

When used this way, `MenuButton`'s only ARIA responsibility is reflecting the open/closed state via `aria-expanded`, which `MenuTrigger` sets.

###### Standalone use

If `MenuButton` is used outside of `MenuTrigger`, the author is responsible for:

1. Setting `aria-expanded` to reflect whether the menu is currently open. `MenuButton` normalizes the `aria-expanded` prop to a boolean — string values like `"true"` and `"false"` are accepted and converted, but the attribute is always rendered as a boolean.
2. Setting `aria-haspopup="menu"` if the button opens a Fluent Menu, or other popup that has `role="menu"`.
3. Optional: for buttons that open a popup with `role="dialog"`, setting `aria-haspopup="dialog"` is recommended. MenuButton should not be used for any other supported values of `aria-haspopup` aside from `menu` and `dialog`.
4. Moving keyboard focus into the popup when it opens, and returning focus to the `MenuButton` when the popup closes.

Standalone use is uncommon; prefer the `Menu` + `MenuTrigger` pattern unless there is a concrete reason not to.

###### Label

Like `Button`, `MenuButton` requires an accessible label. The label rules from [Button](#button) apply unchanged.

The trailing chevron `menuIcon` is decorative and does not contribute to the accessible name. For an icon-only `MenuButton` (a `MenuButton` with no children), provide an `aria-label` describing what the menu contains, not the chevron itself — for example, `aria-label="More actions"` rather than `aria-label="Expand"`.

When an icon-only `MenuButton` has both an `icon` slot and no children, the `menuIcon` is omitted from the rendered output so the button does not render two icons.

#### Semantics

`MenuButton`'s root element has the same role mapping as `Button`. The only addition is the `aria-expanded` attribute on the root, which is always present (rendered as either `true` or `false`).

| Slot | Role | Notes |
| --- | --- | --- |
| root | button | `aria-expanded` is always set; `aria-haspopup` and `aria-controls` are added by `MenuTrigger`. |
| icon | — | Decorative leading icon, same as `Button`. |
| menuIcon | — | Decorative trailing chevron (`ChevronDownRegular` by default). |

Because the chevron is decorative, screen readers communicate the presence of the associated menu through `aria-haspopup` (announced as "menu") and `aria-expanded`, not through the icon itself.

#### Keyboard interaction

`MenuButton` itself implements only the activation keys inherited from `Button` — Enter and Space. The keys that interact with the menu (Down, Esc, type-ahead, etc.) are handled by `Menu` and `MenuTrigger`, not by `MenuButton`, and are documented in the `Menu` accessibility spec.

#### Windows contrast themes (high contrast mode)

`MenuButton` adds an "expanded" visual state on top of `Button`'s appearance variants. When `aria-expanded="true"`, the button changes to a selected/pressed style. In Windows contrast themes:

- The expanded state uses the same system colors as the equivalent `Button` `:hover` state, so the open state remains visible in forced colors.
- The leading `icon` slot's color is set to `Highlight` on hover when expanded, ensuring the icon stays visible against the hover background.

All other forced-colors behavior is inherited from `Button`.

### RadioGroup

Source: [Fluent UI — Radio and RadioGroup accessibility spec](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-radiogroup--docs)

`RadioGroup` and `Radio` together implement the standard radio-button selection pattern: a group of mutually exclusive options where exactly one can be selected at a time. `RadioGroup` provides the `role="radiogroup"` container that aggregates the individual `Radio` items into a single labelled control, and propagates `name`, `value`, `disabled`, and `required` to its children via context.

Each `Radio` renders a real `<input type="radio">` element with a custom visual indicator. As with `Checkbox`, the native input handles all ARIA semantics, focus, and keyboard interaction; the visible circle is `aria-hidden` and purely presentational.

#### Usage

##### When to choose Radio / RadioGroup

###### Radio vs. Dropdown / Select

Use `RadioGroup` when there are a small number of mutually exclusive options (roughly 2–6) and seeing all options at once helps the user decide. Use `Dropdown` or `Select` when the option list is long, when the options take a lot of vertical space, or when the selected value is more important than the alternatives.

###### Radio vs. Checkbox or Switch

Use `Radio` when exactly one option must be selected and the options are mutually exclusive. Use `Checkbox` or `Switch` for independent on/off toggles, or when multiple selections from a set are allowed.

##### Radio/RadioGroup within other controls

RadioGroup and Radio should not be used within other composite controls like Menu, Tree, or Listbox. All of these have their own specific ways of exposing single-selection, and do not support nesting interactive controls like Radio within them. Instead of using the Radio control within these composite widgets, use the styles for the indicator directly as a visual-only indication of selection combined with the component-specific selection semantics for the control in question.

Radio and RadioGroup also should not be used directly within Toolbar, since Radios change selection as you arrow between them. If used within a Toolbar, this means the user would not be able to arrow past a RadioGroup without altering their selection. Instead of using RadioGroup and Radio, use the `ToolbarRadioGroup` and `ToolbarRadioButton` made for this purpose, which do not alter selection on focus.

#### Implementing Radio and RadioGroup

##### Always use RadioGroup

Individual `Radio` components must always be rendered inside a `RadioGroup`. `RadioGroup` provides:

- `role="radiogroup"` on the wrapper `<div>`, which tells assistive technologies to treat the contained radios as a single composite control.
- A shared `name` attribute on every child `Radio`'s `<input>`, which is what the browser uses to enforce mutual exclusivity and to expose the group via the platform accessibility API. If `name` is not provided, `RadioGroup` generates one.
- Propagation of `value` / `defaultValue` so the selected `Radio` is determined by comparing each `Radio`'s `value` against the group's `value`.
- Propagation of `disabled`, `required`, and `aria-describedby` to all child radios.

A stand-alone `Radio` outside of `RadioGroup` does not have a group container, is not announced as part of a set, and does not share a `name` with sibling radios — which means the browser will not enforce mutual exclusivity. Always wrap radios in `RadioGroup`.

##### RadioGroup label

`RadioGroup` requires a label that names the _group_ as a whole — for example, "Favorite fruit", not the individual options. The recommended pattern is `Field`:

```tsx
<Field label="Favorite fruit">
  <RadioGroup>
    <Radio value="apple" label="Apple" />
    <Radio value="banana" label="Banana" />
  </RadioGroup>
</Field>
```

`Field` sets `aria-labelledby` on the `RadioGroup` to point at the field's label text. Without `Field`, use `aria-labelledby` or `aria-label` directly on the `RadioGroup`:

```tsx
<Label id="fruit-label">Favorite fruit</Label>
<RadioGroup aria-labelledby="fruit-label">
  ...
</RadioGroup>
```

##### Radio labels

Each individual `Radio` also needs its own label, which is what the `Radio`'s `label` prop provides. The `Radio`'s label is rendered as an associated `<label>` element so clicking the label text selects the radio. Avoid using `aria-label` or `aria-labelledby` on `Radio` controls unless it is an edge case such as rendering them in the first column of a Table or DataGrid.

##### Visual labels

Per [WCAG 3.3.2 — Labels or Instructions](https://w3c.github.io/wcag/understanding/labels-or-instructions.html), the group needs a visible label and also each radio needs a visible label.

For radios, the visible label is rendered from the `label` prop. The label slot may contain inline content (text, a `Text` component) or images. It is generally best practice to not include interactive elements in the label — focusable content inside a `<label>` causes the click-to-select behavior to misroute.

For sublabels or extra descriptive text per radio, render the additional text outside the `label` slot and wire it to the radio via `aria-describedby`.

##### Field integration

When `RadioGroup` is rendered inside `Field`, `useFieldControlProps_unstable` automatically applies:

- `aria-labelledby` — points at the field's label.
- `aria-describedby` — points at the field's validation message and hint, merged with any consumer-provided value. This is also propagated through context to each child `Radio`'s `<input>`.
- `required` — propagated to each child `Radio` via context, applied as the native `required` attribute on each `<input>`.

`RadioGroup` does **not** automatically set `aria-invalid` from `Field`'s `validationState`. There is no error visual on the radios themselves; the validation message text is what communicates the error.

##### onChange behavior

The `onChange` callback fires on **selection**, not deselection. When the user picks a new radio in the group, only the newly-selected `Radio`'s `onChange` fires, with the new `value` as data. The previously-selected radio does not fire `onChange` for its deselection.

For most cases, prefer `RadioGroup`'s `onChange`, which fires on any selection change in the group and provides the newly-selected `value` regardless of which radio was selected.

##### Disabled

`disabled` on `RadioGroup` propagates to every child `Radio` via context, applied as the native `disabled` attribute. Setting `disabled` on an individual `Radio` only disables that radio while leaving the others interactive — useful for showing an unavailable option in an otherwise-enabled group.

There is no `disabledFocusable` analog. A disabled `Radio` is removed from the tab order, but the group's overall tab stop remains on the next non-disabled radio.

##### Layout

`RadioGroup`'s `layout` prop controls how radios are arranged visually:

- `vertical` (default) — one radio per line. Best for option lists where each label may be long.
- `horizontal` — radios on a single line with the label after each indicator.
- `horizontal-stacked` — radios on a single line with the label _below_ each indicator. Each `Radio`'s `labelPosition` defaults to `"below"` in this layout.

Layout is purely visual; it does not change the DOM order of radios or the keyboard behavior.

#### Semantics

##### RadioGroup

| Slot | Role | States and properties |
| --- | --- | --- |
| root | radiogroup | `aria-labelledby` or `aria-label` (required); `aria-describedby` (optional); no native `required`. |

`RadioGroup` is a `<div>` with `role="radiogroup"`. The `required` and `disabled` props are not exposed as ARIA properties on the group itself — they are propagated to each child `Radio`'s `<input>` as native attributes.

##### Radio

| Slot | Role | States and properties |
| --- | --- | --- |
| root | none | A plain `<span>` with no role; used for layout and focus-within outline. |
| input | radio (native) | `type="radio"`, shared `name` from group context, `checked` from value comparison, `disabled`, `required`, `aria-describedby` from group context. |
| indicator | none | A `<div>` with `aria-hidden="true"`; the visible circle. Purely presentational. |
| label | label (native) | A `<label htmlFor={input.id}>` from `@fluentui/react-label`. Clicking it selects the radio. |

Focus lives on each radio's `<input>` element. The visible focus indicator is drawn on the radio's root via `:focus-within` from `createFocusOutlineStyle` in `@fluentui/react-tabster`, because the actual `<input>` is `opacity: 0`.

The indicator is `aria-hidden` — screen readers announce the radio using the native input's role and `checked` state, with the label text as its accessible name and the group's label as the surrounding group name.

#### Keyboard interaction

`RadioGroup` participates in the standard radio-button keyboard pattern, which the browser implements natively:

| Key | Result |
| --- | --- |
| Tab | Moves focus into the group. If a radio is selected, focus lands on the selected radio. If none is selected, focus lands on the first radio. |
| Shift + Tab | Reverses the order above. |
| Down arrow / Right arrow | Moves focus to the next radio in the group and selects it. Wraps to the first after the last. |
| Up arrow / Left arrow | Moves focus to the previous radio in the group and selects it. Wraps to the last before the first. |
| Space | Selects the focused radio (no-op if already selected). |

Critically, the entire group is a **single tab stop**, not one tab stop per radio. Tab moves _past_ the group, not between its radios; arrow keys move between radios. This is the standard browser-implemented behavior for `<input type="radio">` elements that share a `name` and are inside a `radiogroup`. All arrow keys move focus between radios, regardless of the visual layout.

Selection follows focus when navigating with arrow keys — moving focus to a radio with arrow keys also selects it. This matches both the native browser behavior and the ARIA radiogroup pattern.

Disabled radios are skipped during arrow-key navigation.

#### Windows contrast themes (high contrast mode)

`Radio` includes explicit forced-colors handling in `useRadioStyles.styles.ts`:

- **Unchecked:** the indicator border uses `ButtonBorder` so the outline of each option is visible against the system background.
- **Checked:** the indicator border, the filled inner circle (`::after`), and the checkmark color all map to `Highlight`, matching the platform's selected-control color.
- **Disabled:** the indicator border, fill, and label text map to `GrayText`, matching the platform's disabled-control color.

`RadioGroup` has no forced-colors handling of its own — it is a layout `<div>` and inherits the page's forced-colors background.

The focus indicator (`createFocusOutlineStyle` on each Radio's root) uses tokens that resolve to the user-selected outline color in forced colors.

#### Motion and animation

Neither `Radio` nor `RadioGroup` has any animation. Selection changes are immediate. There is no `prefers-reduced-motion` handling to apply.

### SpinButton

Source: [Fluent UI — SpinButton accessibility spec](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-spinbutton--docs)

> The upstream spec for `SpinButton` is less complete than the other component specs (it has open TODOs for high-contrast guidance and no published semantics table) — the gaps are called out below rather than papered over.

`SpinButton` lets a user incrementally adjust a numeric value in small steps via a text input paired with increment/decrement buttons.

#### Usage

##### When to choose SpinButton

SpinButtons allow someone to incrementally adjust a value in small steps.

SpinButtons are a better choice than `Input` and `Input` with `type="number"` when clear indication is needed that there are maximum and minimum allowed values.

SpinButtons are a better choice than `Slider` when there are many valid values and `Slider` would not provide enough granularity to choose a precise value.

##### Required props

Authors must provide a label for `SpinButton`. The recommended pattern for Fluent inputs is to use the `Label` component like this:

```tsx
<Label htmlFor="example-spinbutton">A SpinButton</Label>
<SpinButton id="example-spinbutton" defaultValue={10} />
```

How the SpinButton is read depends on the screen reader used but generally it reads:

1. Label
2. "spin button"
3. "value" where "value" is the current displayed value

Prefixes, postfixes and other display formatting (e.g., mapping the numbers 1–12 to January–December) is handled by setting the `displayValue` prop which, internally to `SpinButton`, sets the `aria-valuetext` attribute.

How this is read also depends on the screen reader used but a screen reader should read the displayed text consistently with how it would read it in other contexts (i.e., "$1" should be read as "one dollar").

##### Child content restrictions

The component has the following structure:

- Input field
- Up button
  - Increment icon
- Down button
  - Decrement icon

#### Semantics

No semantics table has been published in the upstream spec for `SpinButton` at the time of writing. Structurally the component is the input field plus up/down buttons listed above; the value field carries the numeric value and `aria-valuetext` (when `displayValue` is set) for formatted values.

#### Keyboard interaction

##### Tab order

1. Value field

The value field is the only tab stop — the up/down buttons are not separately tabbable; their increment/decrement behavior is reached via the edit keys below.

##### States

1. Rest (focused)
2. Editing (focused and editing)

##### Keyboard state diagram

| Starting state | Transition | Resulting state |
| --- | --- | --- |
| Content before spin button | Tab | Rest |
| Rest | Tab | Content after spin button |
| Editing | Tab | Content after spin button (value committed) |
| Editing | Enter | Rest (value committed) |
| Rest | Any edit key (that results in a change) | Editing |
| Editing | Any edit key | Editing |
| Content after spin button (value committed) | Shift + Tab | Rest |

##### Edit keys

| Edit key | Result |
| --- | --- |
| Home | First item in defined range |
| End | Last item in defined range |
| Up arrow | Increments value higher, based on the `step` prop (defaulting to 1) |
| Down arrow | Increments value lower, based on the `step` prop (defaulting to 1) |
| Page up | Increments value higher, based on the `stepPage` prop (defaulting to 1) |
| Page down | Increments value lower, based on the `stepPage` prop (defaulting to 1) |
| Typing a valid value | Sets that value |

#### Windows contrast themes (high contrast mode)

Be careful about visibility of the spin button arrows in high contrast mode. (Flagged as an open TODO in the upstream spec — no concrete guidance on customizing the increment/decrement icon color in forced colors without breaking high-contrast rendering has been published yet.)

#### Motion and animation

There is an animation when this element receives focus. This respects reduced-motion media queries.

When a user holds down an edit key or mouse click, there is an animation of spinning numbers to provide a sense of how fast the value is changing. This animation is an interaction cue and therefore is acceptable even when a user has set a preference for reduced motion.

#### Known issues

- Mouse press quick changes to value are not announced to screen readers.
- [NVDA does not read the value of spinbuttons in Chromium](https://github.com/nvaccess/nvda/issues/13195).
- Narrator defaults to reading min/max as 0 when they're (intentionally) undefined.

##### Narrator + Edge

When no min or max values are set, Narrator announces "minimum 0" and "maximum 0". This is misleading because when these values are not set, `SpinButton` does not enforce a min or max value.

##### NVDA + Edge/Chrome

When focused on the SpinButton input field, pressing up/down arrows announces "blank". NVDA + Firefox announces the correct value.

### SplitButton

Source: [Fluent UI — SplitButton accessibility spec](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-splitbutton--docs)

`SplitButton` is a composite control: it pairs a primary action `Button` with a secondary `MenuButton` that opens a menu of related variations on that action. The two buttons are visually joined but are independently focusable and independently activatable.

`SplitButton` is composed of `Button` and `MenuButton`, and inherits all of their accessibility behavior. This spec only covers what is **specific** to the composite. For label requirements, the difference between `disabled` and `disabledFocusable`, anchor (`as="a"`) rendering, contrast considerations, target size, motion, and base keyboard activation, see the [Button](#button) and [MenuButton](#menubutton) sections above.

#### Usage

##### When to choose SplitButton

Use `SplitButton` when there is a single primary action that the user is most likely to take, **and** a set of related variations on that action that should be available without taking up additional space at rest. The classic example is a "Send" button with a chevron that opens "Send later", "Schedule send", etc.

If there is no clear primary action — only a set of equally-weighted choices — use `MenuButton` instead. If there is a primary action with no associated menu, use `Button`.

##### Implementing SplitButton

###### Use with Menu and MenuTrigger

The recommended pattern is to use `SplitButton` with a `Menu` and `MenuTrigger`, passing the `MenuTrigger` props onto the `menuButton` slot:

```tsx
<Menu positioning="below-end">
  <MenuTrigger disableButtonEnhancement>
    {(triggerProps: MenuButtonProps) => (
      <SplitButton
        menuButton={{ ...triggerProps, 'aria-label': 'More send options' }}
        primaryActionButton={{ onClick: send }}
      >
        Send
      </SplitButton>
    )}
  </MenuTrigger>
  <MenuPopover>
    <MenuList>
      <MenuItem>Send later</MenuItem>
      <MenuItem>Schedule send</MenuItem>
    </MenuList>
  </MenuPopover>
</Menu>
```

This wires the menu half to the popup correctly (`aria-haspopup`, `aria-expanded`, `aria-controls`) and leaves the primary half as a plain action button.

###### Label

The two halves of `SplitButton` need separate accessible names because they are separate focusable controls.

- The **primary action button** is labelled the same way any `Button` is labelled — usually by its visible text content, or by `aria-label` if there is none.
- The **menu button** is labelled by the primary action button by default. `useSplitButton_unstable` assigns `id` to the primary action button and sets `aria-labelledby` on the menu button to point at it, **only** if the consumer has not already provided `aria-label` or `aria-labelledby` on the `menuButton` slot.

This default produces a useful fallback announcement: a screen reader announces the menu half with the primary action's text plus the role ("menu button") and the `aria-expanded` state. For the "Send" example, without an `aria-label` the menu button would be announced as "Send, menu button, collapsed".

It is good practice to provide a more descriptive, localized, custom accessible name to the `menuButton` slot such as "More send options" in the earlier example.

###### Disabled state

Setting `disabled` or `disabledFocusable` on `SplitButton` cascades down to both the primary action button and the menu button via the slot default props. The two halves cannot be independently disabled at the top level — to disable only one, pass `disabled` directly on the `primaryActionButton` or `menuButton` slot.

The visual disabled styling is applied to both halves, plus a disabled border color on the inner seam between them so the visual joinery still reads as disabled.

###### Target size

The menu half of `SplitButton` is narrower than a standalone `MenuButton` because it does not render text. To meet [WCAG 2.5.8 Target Size (Minimum)](https://w3c.github.io/wcag/understanding/target-size-minimum.html), the styles enforce a minimum width of 24px on the menu button via the `MIN_TARGET_SIZE` constant.

When overriding layout styles, authors must verify that **both** halves remain at least 24×24 CSS pixels. This is especially relevant for the menu half at the `small` size, where it is closest to the minimum.

#### Semantics

`SplitButton` renders a non-interactive `<div>` wrapper around two independently-focusable buttons:

| Slot | Role | States and properties |
| --- | --- | --- |
| root | none | A plain `<div>` with no role. |
| primaryActionButton | button | All `Button` semantics. Carries an internal `id` used for menu button labelling. |
| menuButton | button | All `MenuButton` semantics. `aria-expanded` is always set; `aria-labelledby` points at the primary action button by default. |

The wrapper does not have a group role or any composite role. `SplitButton` is two independent buttons that happen to be visually adjacent; assistive tech treats them as two separate tab stops and announces each individually.

When customizing the SplitButton or placing it into arrow-navigation regions like Toolbar, it is important to ensure that the root slot is never focusable and does not get an interactive role.

#### Keyboard interaction

`SplitButton` produces **two tab stops**: the primary action button and the menu button, in that DOM order. When used within arrow-navigation groups like Toolbar, `SplitButton` has two arrow stops. This behavior should not be overridden — for robust cross-platform screen reader accessibility, it is important that each button is independently exposed and focused.

#### Focus indicator

Each half has its own visually distinct focus indicator.

#### Windows contrast themes (high contrast mode)

The inner seam between the primary action button and the menu button has its own forced-colors handling:

- For `primary`, the inner border uses `HighlightText` at rest and `Highlight` on hover and active — opposite of the outer border — so the visual division between the two halves stays visible against the highlighted background.
- For `subtle` and `transparent`, the inner border uses transparent background tokens, matching the rest of the button.
- When disabled, the inner border uses `GrayText` to match the rest of the disabled border.

All other forced-colors behavior is inherited from `Button` and `MenuButton`.

### TextArea

Source: [Fluent UI — Textarea accessibility spec](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-textarea--docs)

`Textarea` is a multi-line text entry control. It wraps a native HTML `<textarea>` element in a styled `<span>` container that provides the focus-indicator border animation. There is no slot for in-field decoration — `Textarea` exposes only the wrapper and the textarea itself.

Because the rendered control is a real `<textarea>`, `Textarea` inherits the browser's built-in accessibility behavior for multi-line text fields: caret movement, line wrapping, selection, IME composition, autofill, spellcheck, scrolling, and the platform-native keyboard contract are all handled by the browser. This spec covers what Fluent layers on top: labelling, the `Field` integration, the `resize` prop, validation, and visual considerations.

#### Usage

##### When to choose Textarea

`Textarea` is for free-form multi-line text entry: comments, descriptions, free-form notes, or any value that may legitimately wrap to multiple lines.

###### Textarea vs. Input

Use `Textarea` when the value may contain newlines or wrap across multiple visual lines. Use `Input` for single-line entry, even if the value is long — an `Input` scrolls horizontally rather than wrapping, which is the correct behavior for fields like name, email, or URL where the value is semantically a single line.

A useful rule of thumb: if pressing Enter should commit the value (submit a form, run a search), use `Input`. If pressing Enter should insert a newline in the value, use `Textarea`.

###### Textarea vs. a rich text editor

Use `Textarea` for plain-text content. Use a rich text editor when the user needs to apply formatting (bold, italic, lists, links). A rich text editor is significantly more complex to make accessible than a `Textarea` — only adopt one when the formatting requirement is real or when nested links and buttons are needed.

##### Implementing Textarea

###### Programmatic Label

`Textarea` does not render its own label. Authors must always associate the textarea with visible label text. The recommended pattern is to wrap `Textarea` in a `Field`, which sets `id` and the label association automatically:

```tsx
<Field label="Description">
  <Textarea />
</Field>
```

If `Field` is not appropriate for the layout, use `Label` directly with `htmlFor`:

```tsx
<Label htmlFor="description">Description</Label>
<Textarea id="description" />
```

Other options:

1. `aria-labelledby="label-id"` on the `<Textarea>`, pointing at the id of visible label text elsewhere on the page.
2. `aria-label="label text string"` on the `<Textarea>`. Use sparingly — some sort of visible or contextual label is required.

###### Visual Label

All form fields including Textarea require a visible label per [WCAG 3.3.2 — Labels or Instructions](https://w3c.github.io/wcag/understanding/labels-or-instructions.html). That label does not need to be a `<label>` element, but there must be text that is visually associated with the textarea that functions as its label. The programmatic accessible name of the textarea should match that text.

There is one exception worth calling out for `Textarea` specifically: in chat applications such as Teams or M365 Copilot, where the main content area contains exactly one chat composer, the surrounding context plus the visual language of the composer staying anchored at the bottom of the pane is generally sufficient for users to understand what the textarea does. Even in this case, an `aria-label` is required so the textarea has a programmatic name.

###### Placeholder

The `placeholder` prop is **not** a substitute for a label. Placeholder text disappears as soon as the user starts typing, while WCAG requires a persistent visual label to be present. Placeholder also fails contrast requirements in some themes by design.

Because the `placeholder` is not persistent, it also should never be used for user instructions such as "Press Enter to add a new line" or "Type @ to mention someone" unless those instructions are easily accessible elsewhere — for example, in a hint slot provided by `Field`.

###### Field integration

When `Textarea` is rendered inside `Field`, `Field` automatically wires up:

- `id` — generated and applied so the field's `<Label>` `htmlFor` points at the textarea.
- `aria-labelledby` — set if the consumer's `id` does not match the label's `htmlFor` (so the textarea is still labelled even when the consumer overrides the id).
- `aria-describedby` — set to point at the validation message and hint elements, merged with any consumer-provided `aria-describedby`.
- `aria-invalid` — set to `true` when `Field`'s `validationState` is `"error"`.
- `required` — applied as the native attribute when `Field` is marked required.
- `size` — propagated from `Field` so the textarea matches the field's size.

When `Textarea` is **not** inside `Field`, the consumer is responsible for any of these attributes that are needed (`aria-describedby` for hint/error text, `aria-invalid` for validation state, `required`).

###### Resize

The `resize` prop maps directly to the CSS `resize` property on the `<textarea>` and controls whether the user can drag a corner handle to resize the field:

- `none` (default) — no resize handle. The textarea expands and scrolls within its size-defined min/max height.
- `vertical` — the user can drag the bottom edge to make the textarea taller or shorter.
- `horizontal` — the user can drag the right edge to make the textarea wider or narrower.
- `both` — the user can drag the bottom-right corner to resize in both axes.

The resize handle is a browser-native control and is only operable by mouse or touch pointer. **There is no keyboard equivalent** for the resize gesture, and assistive technologies do not expose the handle as a separate focusable target. This is a known limitation of the native `<textarea>` element across browsers, not a Fluent-specific issue.

`resize: 'none'` is the default because it avoids exposing an inaccessible handle. When using any other value, ensure the textarea's default size is large enough that resizing is a convenience, not a requirement — a keyboard-only user who cannot operate the handle should never be forced to resize the field to use it.

The size variants set bounded `min-height` and `max-height`: small (40–200px), medium (52–260px), large (64–320px). When the textarea is set to `resize: 'none'` and the content exceeds the max-height, the browser-native vertical scrollbar appears inside the textarea.

###### Disabled

`Textarea` supports the native `disabled` attribute, which removes the textarea from the tab order and prevents value changes. There is no `disabledFocusable` analog for `Textarea` — keeping a disabled text field in the tab order is rarely useful, and the native disabled behavior is the standard. The `readonly` attribute is a native alternative state for textareas that is still focusable and allows text to be read, selected, and copied but not edited.

When disabled, the focus underline animation and focus outline are suppressed, the cursor becomes `not-allowed`, and the border switches to `colorNeutralStrokeDisabled` (or `GrayText` in forced colors). The disabled state also disables the resize handle, regardless of the `resize` prop value.

###### Validation

When `Textarea` is inside `Field` with `validationState="error"`, `aria-invalid="true"` is applied to the `<textarea>` and the wrapper switches to the red border style. Outside of `Field`, the consumer can set `aria-invalid` directly — the red border style keys off the rendered `aria-invalid` attribute on the `<textarea>`, so styling and ARIA state stay in sync.

The error **message** itself is not provided by `Textarea`. Use `Field`'s `validationMessage` (which is automatically wired into `aria-describedby`), or wire your own message element via `aria-describedby`. An `aria-invalid` value with no accompanying description tells the user the field is invalid but does not tell them why.

Both `error` and `warning` validation states give the `validationMessage` a `role=alert` and will be announced to screen reader users as soon as they appear. Other validation states will not cause the message to be announced automatically. If this behavior is desired, use the `useAnnounce` utility to do so.

###### Character limits

When using `maxLength` to cap the value, consider also exposing a visible character counter so users — especially those with cognitive disabilities — can see how much space remains before they hit the limit. Wire the counter to the textarea via `aria-describedby` so screen reader users hear the remaining count when the field is focused.

Do **not** put `aria-live="polite"` (or any other live region) directly on the counter element. Firing a live region while the user is actively typing collides with the screen reader's native keyboard echo — the reader is already announcing each typed character, and a simultaneous live-region update either gets dropped, gets queued behind every keystroke, or talks over the echo. As a rule, **never trigger a live-region announcement at the same time the user is typing.**

Instead, use the [`useTypingAnnounce`](https://storybooks.fluentui.dev/react/?path=/docs/utilities-aria-live-usetypingannounce--docs) utility, which is designed for exactly this case. It debounces announcements so they fire only after the user pauses typing, which lets the screen reader's typing echo finish without interference and avoids flooding the live region with every keystroke. Trigger it when the remaining character count crosses a meaningful threshold (for example, the last 20 characters), not on every input event.

`maxLength` itself is a native attribute on `<textarea>` and is enforced by the browser — additional characters past the limit are silently dropped, which can be confusing without a visible counter.

###### Color contrast and appearance variants

All textareas must have some part of their boundary meet 3:1 contrast against the background behind the textarea. The placeholder or value text are not sufficient to meet this requirement. Each appearance variant meets this contrast requirement in a different way:

- `outline` (default) — the bottom border specifically uses `colorNeutralStrokeAccessible`, which is darker than the surrounding border tokens to meet the indicator-contrast requirement.
- `filled-darker` and `filled-lighter` — these must be placed on a surface that provides at least 3:1 contrast against the textarea's background color, so the boundary of the textarea is still discernible.
- `filled-darker-shadow` and `filled-lighter-shadow` — **deprecated**. Do not use in new code; they emit a console error in development.

`Textarea` does not include an `underline` appearance like `Input` does, because the additional visual weight of an underline-only boundary is less useful at the larger sizes of a multi-line field.

The bottom focus border (`::after`) uses `colorCompoundBrandStroke`, which is the brand color and is guaranteed to meet 3:1 against all supported page surfaces in the included themes.

##### Placing Textarea within an arrow-navigation region like Toolbar or Menu

It is not recommended to place a textarea inside an arrow-navigable region like a `Toolbar`, `Menu`, or `Listbox`. The arrow keys, Home, End, and Enter are all already used within a textarea to move the caret and insert newlines, and these conflict with the keyboard contract of arrow-navigation containers. The conflict is stronger than for `Input`, because the textarea also consumes Up / Down arrows for vertical caret movement.

Additionally, `<textarea>` is not a valid descendant of most arrow-navigation containers (`role=menu`, `role=tree`, `role=listbox`), and doing so violates the ARIA specification's parent/child requirements.

If a multi-line input is genuinely needed inside one of these regions — for example, a chat composer that appears within a menu surface — use a Dialog/`role=dialog` or Popover container instead, and place the menu before or after the textarea in the dialog.

#### Semantics

`Textarea` renders a wrapping `<span>` for styling and the actual `<textarea>` element for editing:

| Slot | Role | States and properties |
| --- | --- | --- |
| root | none | A plain `<span>` with no role; used only for visual border and focus styling. |
| textarea | textbox (native) | `aria-invalid`, `aria-describedby`, `aria-labelledby`, `disabled`, `required`, `readonly`, `maxLength` as applied by `Field` or the consumer. |

Focus lives on the `<textarea>` element. The visual focus state (the animated bottom border) is applied to the root via `:focus-within`, but the focused element from a screen reader and keyboard perspective is always the `<textarea>`.

Native browsers expose `<textarea>` with the `textbox` role and announce it as a multi-line edit field — for example, NVDA announces "edit, multi-line". This is what tells screen reader users that Enter will insert a newline rather than commit the value.

#### Keyboard interaction

`Textarea` is a single tab stop. All editing key behavior comes from the browser's native `<textarea>` implementation and matches platform conventions. Notable behaviors specific to multi-line text fields:

- Enter inserts a newline. It does **not** submit a surrounding form (unlike single-line `<input>`).
- Up and Down arrows move the caret between lines.
- Tab moves focus out of the textarea (it does not insert a tab character). This is the standard HTML behavior and is what allows keyboard users to escape the field.

When `disabled` is set, the textarea is removed from the tab order entirely and is not interactable.

The resize handle (when `resize` is not `'none'`) is not a separate tab stop, is not keyboard-operable, and is not exposed to assistive technologies as a focusable target. See Resize above.

#### Windows contrast themes (high contrast mode)

`Textarea` relies almost entirely on the browser's native `<textarea>` behavior in Windows contrast themes. The native textarea adapts its background, text, caret, placeholder, and scrollbar colors to the user-selected theme without explicit overrides in the component's styles.

The only explicit forced-colors rule on `Textarea` is for the disabled state: the border switches to `GrayText` so the disabled affordance matches the system disabled-control color. This is because the border style is on the parent root node and not on the `<textarea>` element itself, so it does not natively pick up the disabled state's color.

The resize handle's appearance in forced colors is determined by the browser. Authors should not attempt to restyle the resize handle, as doing so can break its forced-colors behavior.

#### Motion and animation

The bottom focus border has two animations — one for focus in and one for focus out — using `durationNormal` (focus in) and `durationUltraFast` (focus out) respectively. Both animations are shortened to `0.01ms` when [`prefers-reduced-motion: reduce`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) is set, effectively disabling the motion while preserving the final visual state. There is no other motion on `Textarea`.

#### Known issues

- The browser-native resize handle is not keyboard-operable and is not exposed to assistive technologies. Authors using any `resize` value other than `'none'` should ensure the default field size is sufficient for users who cannot operate the handle. Consider exposing a separate keyboard-operable size toggle if larger sizes are critical to the user's task.
- `maxLength` silently drops typed characters past the limit. Always pair `maxLength` with a visible character counter wired via `aria-describedby`, and ideally screen reader notifications using `useTypingAnnounce`.

## Components Overview

Source: [Fluent UI — Components Overview](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-overview--docs)

### Components accessibility

Fluent UI components are designed to support various aspects of accessibility by default, so that they can be used with different input methods (mouse, touch, keyboard, screen readers) as well as fulfill different rendering and layout requirements (theming, zoom, contrast).

The [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/TR/WCAG21/) and [WAI-ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices-1.2/) are community-driven standards for accessible web pages and applications. They provide a basic framework allowing consistent usage of web pages and applications with or without assistive technologies.

Fluent UI components aim to fully respect both WCAG and ARIA practices, the Fluent UI team is working with the community to improve them.

Using components themselves does not guarantee that an application or a page will be accessible. See the [Experiences](#experiences) section below for further points on achieving a good level of usability.

### Scope

Fluent UI components fulfill following requirements:

- **DOM structure** that provides **semantic value** either by using correct element types or roles
- **ARIA attributes** that are valid for elements/roles used and provide correct state information about the component or element
- **Keyboard navigation** (navigation by tabbing, arrow keys, pagination or letter keys, click and right click (Enter/Space, Shift+F10), and close (Escape)) applied based on the component
- **Screen reader navigation** (Virtual Cursor/Browse mode/Scan mode/VoiceOver keys)
- **Touch interaction**
- **Focus handling** when the component is able to move the focus in a predictable way — mostly when opening menus, popups or dialogs (autofocus) or dismissing them using Esc. Focus trap for Dialog and popups
- **Sufficient color contrast**
- Light, Dark and High Contrast **themes**
- Displaying a [focus indicator](#focus-indicator) when keyboard is used to interact with them
- **Tested** against visual inconsistencies/bugs on a zoom up to 400%

Fluent UI components use [tabster](https://github.com/microsoft/tabster) for focus handling functionality, so that they can be easily integrated with application-level tabster functionality such as delooser and cross-iframe focusing.

### Out of Scope

- Internationalization, globalization, keyboard shortcuts and language detection are deliberately not part of Fluent UI and should be handled by the hosting application.
- Focus handling (except of the points mentioned in Scope) on an application level needs to be handled by the application, preferably using [tabster](https://github.com/microsoft/tabster).

### Ensuring accessibility

Fluent UI components will be tested to guarantee standard conformance and usability.

- *[axe-core](https://github.com/dequelabs/axe-core)* is used to validate individual components during development and build time.
- *Manual tests* will be executed on small isolated pages which show different accessibility scenarios. For each component, suitable scenarios will be defined and implemented. They will be then tested by experienced trusted accessibility testers and real users. Axe-core tests will also be executed on each of the scenarios.

## Debugging notifications

Source: [Fluent UI — Debugging screen reader notifications and live regions](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-debugging-notifications--docs)

Live region notifications are one of the most temperamental accessibility features, compounded by how difficult they are to debug. A significant part of their functionality is handled within screen reader implementations, and is both undocumented and differs between screen readers. Differences between browsers also tend to be loosely spec'd and undocumented, which means every possible browser + screen reader combination may have unique bugs.

This page outlines a set of steps to determine whether a bug is an authoring issue, a screen reader implementation issue, or not a bug at all.

This doc uses "live region" and "notification" mostly interchangeably; live regions are the DOM-based implementation of screen reader-targeted notifications.

### Step 1: check for conflicting user interactions or focus changes

If a live region change is not getting read by a screen reader, first check if the screen reader is instead reading other information at the same time (concurrent focus changes or typing are common causes of this). If this is happening, there is a good chance that the live region is functioning as expected but the output is being overridden.

For example: VoiceOver on macOS will sometimes re-read information about the currently-focused element immediately after a user interaction, interrupting live region announcements. This can happen fractions of a second after a live region is triggered, making it difficult to debug. If this is happening, look for a flash of live region text output in the visual VoiceOver helper, test with other screen readers, and run through the other debugging steps to ensure there are no other issues present.

> Even if a screen reader is reading something else while failing to read a notification, it's still possible that there is also another issue with the live region implementation. It's worth going through other debugging steps to ensure this is not the case. Alternatively: if you test with multiple screen readers and at least one other screen reader is correctly reading the live region, it is very likely that the problem is caused by speech queue overrides.

If the screen reader is otherwise silent and the notification is still not being read, then move on to Step 2.

#### Why this happens

Screen readers have a speech queue of strings to read, composed of information such as user navigation changes, typing echo, and notifications. New strings can either be added to the end of the speech queue, added to the front of the queue, or clear the existing queue before being appended. The specifics of which approach is used in which situations can vary between screen readers.

For example: if a focus change occurs immediately following a notification, a screen reader could either read the full notification followed by the newly focused control, read the newly focused control followed by the notification, or clear the notification from its queue and read only the newly focused control. None of this is under the control of the page author; the only thing authors can do is try to reduce the instances of having a focus change occur at the same time as a notification.

#### What to do

This one is tricky because there is no simple solution. It can be tempting to try using a timeout to force the live region to fire later, but this is not a good approach since the exact delay needed is impossible to determine — it depends on the screen reader being used, user verbosity settings, and speech speed, and can vary by orders of magnitude from person to person.

If the interaction is designed in such a way that the live region _always_ fires at the same time as a programmatic focus change, then it might be a better approach to ensure the focus change itself communicates all necessary information. Try talking to an accessibility SME for more detailed guidance.

If the interaction is designed to occur while a user is typing, try using the `useTypingAnnounce` hook for the notification (see the note on this in the [TextArea](#textarea) section above).

### Step 2: check edge cases and known issues

This step is relatively quick, so it's better to check before moving on to debugging the live region's DOM directly.

1. **Is a modal open?** If anything with `role="dialog"` or `aria-modal="true"` is currently open on the page, it may block live region updates coming from outside the modal. This is true for VoiceOver but not Windows screen readers, at the time of writing.
2. **Does the same text get announced multiple times? Does it work the first time but not subsequent times?** Some (but not all) screen readers will filter out repeat identical messages. If this is the case, work through Step 3 to verify the text is really getting inserted into the live region; if it is, this is likely the issue.
3. Check the Fluent known-issues wiki for any other browser, screen reader, or platform accessibility bugs affecting live regions.

### Step 3: verify the live region's DOM is updating correctly

> The Fluent v9 `useAnnounce` hook + `AriaLiveAnnouncer` makes use of the new proposed `document.ariaNotify` feature on browsers where it is available. On those browsers, it will not insert a live region in the DOM. Currently that includes Edge Canary and Chrome Canary (not yet in stable). To check whether this is the case, look at whether `document.ariaNotify` is a function in the console of the browser you are testing in. If it is, and you are using the Fluent `AriaLiveAnnouncer`, skip this step.

#### Does the live region exist in the DOM?

The first thing to check is if there is actually a live region node on the page. If using the Fluent `useAnnounce` hook with the `AriaLiveAnnouncer` implementation, the live region will be inserted at the end of `document.body` and will look something like this:

```html
<div aria-live="assertive" data-tabster-never-hide="" style="clip: rect(0px, 0px, 0px, 0px); height: 1px; margin: -1px; width: 1px; position: absolute; overflow: hidden; text-wrap: nowrap;"></div>
```

If there are multiple `AriaLiveAnnouncer` components in the React tree, there will be multiple live region nodes inserted into the DOM. Other non-Fluent code may also insert live region nodes in the DOM. Using Ctrl+F in the Elements panel and searching for `aria-live` is another way to find live regions on the page if they are not immediately apparent.

A quick way to verify whether the live region node or nodes found are being used by the notification you are debugging is to just watch them in the Elements pane to see if they mutate when the notification fires.

#### Is the live region hidden from the accessibility tree?

Even if the live region exists in the DOM, it's possible that it could be hidden from accessibility APIs with ARIA or CSS. Do a quick check of the following on the live region node itself or any of its ancestors:

- Is there an `aria-hidden="true"` attribute present?
- Are there any CSS `display: none` or `visibility: hidden` styles?

If so, this will cause the live region to not fire.

If the text inserted into the live region has either `aria-hidden` or either CSS style, this will also cause it to not fire, though that is best checked in the next step.

#### Does the live region have the correct text inserted at the right time?

Live region behavior is closely tied to the nature and timing of DOM updates to live region nodes. There are slightly different requirements for announcement text timing based on the type of live region:

1. **Alerts** (any live region with `role="alert"` regardless of whether it also has `aria-live`) fire both on insertion and when changed post-insertion. Check that either:
   - The alert is inserted when you want it read, with the text you want read, or
   - The alert already exists in the DOM, and the text you want read is inserted when you want it read.
2. **All other live regions** (anything with `aria-live`, `role="status"`, or both) _must_ already exist in the DOM before the text you want read is inserted. If using Fluent's `AriaLiveAnnouncer` + `useAnnounce`, this is handled for you. If using a custom live region node, check that it is not inserted into the DOM along with the text you want announced.

#### Observing live region changes directly in the browser

Often it's useful to be able to log the DOM mutations happening to a live region node in a live site. Since some screen-reader-only live regions quickly remove text after it's inserted to prevent invisible text from hanging around, this can be difficult to do by just looking at the Elements pane in browser dev tools. This is also true of the Fluent `AriaLiveAnnouncer` implementation.

To debug this, use a `MutationObserver` and log child mutations to the console to check that the expected text is being correctly inserted. This is best done directly on the live site where the bug occurs, since live regions especially can differ between environments. To do so:

1. Save the live region node as a global variable from the Elements pane.
2. Copy the function below to create a `MutationObserver` into the console (or write your own, if desired).
3. Call the function on the saved live region node: `observeElement(temp1)`.
4. Trigger the live region announcement.

This should let you observe console logs of all mutations to the live region node.

```js
function observeElement(element) {
  const config = { attributes: true, childList: true, subtree: true };
  const callback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        const additions = mutation.addedNodes;
        const removals = mutation.removedNodes;
        if (removals.length) {
          console.log('Child nodes were removed:', ...removals);
        }
        if (additions.length) {
          console.log('Child nodes were added:', ...additions);
        }
      } else if (mutation.type === 'attributes') {
        console.log('The ' + mutation.attributeName + ' attribute was modified.');
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(element, config);
}
```

#### Introspecting the AriaLiveAnnouncer implementation

If you are working directly inside the Fluent AI or Fluent UI repos, it may make sense to add breakpoints or console logs directly in the implementation. Navigate to the file where `useAnnounce` is implemented (`useDomAnnounce.ts` in `react-components/react-aria`) and add breakpoints or logs directly in the code. It is also possible to do this directly in the browser by finding `useDomAnnounce.ts` in the Sources tab.

#### What to do

If you are experiencing an issue with either a live region not existing at all or not updating, the cause could be in any number of places. If using the Fluent `AriaLiveAnnouncer` + `useAnnounce`, a few things to check:

- Use React dev tools to check that the `AriaLiveAnnouncer` component exists as an ancestor of the component calling `useAnnounce` (in the React tree, not the DOM tree).
- Check that the `announce` function is not just the default stub function (i.e. it is actually pulling the full implementation from `AriaLiveAnnouncer`; the default is a `() => undefined` stub).
- If `document.ariaNotify` is defined in your browser, try replacing it in the console with a stub function that logs the arguments it was called with, then trigger the expected `announce()`:
  ```js
  document.ariaNotify = (...params) => {
    console.log('ANNOUNCE DEBUG: ariaNotify called with', params);
  };
  ```
- If `document.ariaNotify` is not defined in your browser, look for the expected live region at the end of the DOM. If it is not updating when `announce()` is called, try calling `announce('hardcoded string')` somewhere else in the same file.
- Move on to Step 4.

### Step 4: reach out to the Fluent team or another accessibility SME

If you've made it this far without finding any issues and are stuck, it's probably time to reach out to either the Fluent team (if using their implementation), book a slot in Fluent's accessibility office hours, or contact another accessibility SME (if using a custom live region).

## Experiences

Source: [Fluent UI — Experiences](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-experiences--docs)

### Creating an accessible web application or web page

When designing an application or a web page, keep in mind that the easiest way to make it accessible is to maintain a consistent and compliant document structure. The following steps help to design an accessible user experience:

- Decompose UI to parts and **identify components, variants and behaviors to use**.
- Define the usage of **[headings and landmarks](https://www.w3.org/TR/wai-aria-practices/examples/landmarks/index.html)**.
- Verify the usage of **[color and contrast](https://webaim.org/resources/contrastchecker/)** to convey information.
- Ensure **[tab order](https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-focus-order.html) and [arrow key](https://dequeuniversity.com/tips/aria-keyboard-patterns) navigation** is consistent with DOM structure and ARIA roles.
- Specify **labels**, especially for components without textual information (e.g. icon-only buttons) and for containers (lists, toolbars, and so on).
- Specify text for **[state change announcements](https://www.w3.org/WAI/WCAG21/Understanding/status-messages)** ([error messages](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA19), confirmations, dynamic UI changes, ...).
- Identify UI parts that **[appear on hover or focus](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html)**, then specify keyboard and screen reader interaction with them. Keep in mind that screen readers, and in most cases also touch devices, do not support hover state.
- List cases when **focus** needs to be **moved programmatically** (if parts of the UI are appearing/disappearing or in other cases).
- List cases when **focus** needs to be **trapped** in sections of the UI (for dialogs, popups, or hierarchical navigation).
- When extending existing functionality, think about how it fits into the current experience with regards to **discoverability, interaction, keyboard navigation, and screen reader navigation**.
- In your designs, cover **[High contrast](https://blogs.windows.com/msedgedev/2020/09/17/styling-for-windows-high-contrast-with-new-standards-for-forced-colors/)** and **[Zoom and reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html)** scenarios.

## Focus Indicator

Source: [Fluent UI — Focus indicator](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-focus-indicator--docs)

Fluent UI components use [tabster](https://github.com/microsoft/tabster) for focus handling functionality, so that they can be easily integrated with application-level tabster functionality such as delooser and cross-iframe focusing.

The Fluent UI `@fluentui/react-tabster` package defines `useKeyboardNavAttribute`, `createCustomFocusIndicatorStyle`, and `createFocusOutlineStyle` to integrate the tabster keyboard navigation mechanism seamlessly within Fluent UI.

### useKeyboardNavAttribute

Instantiates [keyborg](https://github.com/microsoft/keyborg) and adds a `data-keyboard-nav` attribute to a referenced element to ensure keyboard navigation awareness stays synced to keyborg's logic without having to cause a re-render on the React tree.

```tsx
function Root() {
  const ref = useKeyboardNavAttribute();
  return <div ref={ref}>{children}</div>;
}
```

```html
<!-- data-keyboard-nav is present when navigating with keyboard -->
<div data-keyboard-nav="">
  <!-- ... -->
</div>
<!-- data-keyboard-nav is not present when navigating with mouse -->
<div>
  <!-- ... -->
</div>
```

### Styling focus indicators

The default focus indicator used in Fluent UI is an outline. However, in some cases more specific focus indicators are necessary depending on the use case and component design. In order to accommodate these requirements, Fluent UI exports two different utilities to style focus indicators:

1. `createFocusOutlineStyle`
2. `createCustomFocusIndicatorStyle`

Both helper functions are powered using the `useKeyboardNavAttribute` mechanism described above.

#### createFocusOutlineStyle

The `AccordionHeader` component uses `createFocusOutlineStyle` to style the default outline style when focus is detected:

```tsx
import { makeStyles } from '@fluentui/react-components';
import { createFocusOutlineStyle } from '@fluentui/react-components';

const useStyles = makeStyles({
  focusIndicator: createFocusOutlineStyle({
    // selector to be used to decide focus presence: 'focus-within' | 'focus'
    selector: 'focus-within',
    // custom style to be applied with the outline style
    style: {
      outlineOffset: { top: '6px', bottom: '6px', left: '4px', right: '4px' },
    },
  }),
});

function Component() {
  const styles = useStyles();
  return <div className={styles.focusIndicator} />;
}
```

#### createCustomFocusIndicatorStyle

> A bad focus indicator can have serious accessibility consequences and can render your experience unusable by certain users. Please ensure before creating a custom focus indicator that you have gotten the necessary feedback from designers and accessibility experts.

The `Link` component uses `createCustomFocusIndicatorStyle` to add a double-underlined focus indication style:

```tsx
import { makeStyles, createCustomFocusIndicatorStyle } from '@fluentui/react-components';

const useStyles = makeStyles({
  focusIndicator: createCustomFocusIndicatorStyle({
    borderBottomColor: 'transparent',
    textDecorationColor: tokens.colorStrokeFocus2,
    textDecorationLine: 'underline',
    textDecorationStyle: 'double',
  }),
});

function Link() {
  const styles = useStyles();
  return <a className={styles.focusIndicator} />;
}
```

## Notification Best Practices

Source: [Fluent UI — Notification Best Practices](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-notification-best-practices--docs)

### Using DOM-based live regions

There are functionally three ways to create a live region in the DOM:

1. **Use `aria-live="assertive"` or `aria-live="polite"`.** Using `aria-live` to designate an element as a live region is the most common way to do so. In theory, the difference between `assertive` and `polite` affects where notification text is inserted in the screen reader's speech queue. However, in practice this is not consistent between operating systems and screen readers. Generally use `aria-live="assertive"` when the notification is likely more important than a user's current interaction, and use `aria-live="polite"` when the notification is less important than what the user is currently doing.
2. **Use `role="alert"`.** The `alert` approach is best used for error messages such as form errors or high-importance toasts. Some screen readers say "alert" or a similar word before the text of the live region element. It is the only live region that consistently gets announced when inserted into the DOM, rather than only on subsequent child mutations.
3. **Use `role="status"`.** This is largely equivalent to using `aria-live="polite"`. It is possible that some screen readers may announce it slightly differently, such as saying "status" before the message. This does not currently happen in any screen reader as of writing, however.

All these attributes will designate an element as a live region, and screen reader notifications will be triggered by any change to its children. For this reason, it is extremely important to never use live region attributes on an element that will have frequent mutations. Generally elements that have a lot of child content also should not be live regions.

In general, live regions should be:

- **short** — in both text content and number & complexity of child nodes.
- **stable** — only mutating infrequently when a user-relevant event occurs.
- **free of conflicts with user events** — live regions should not be designed to fire at the same time as a focus change or user input event, since doing so will conflict with screen reader announcements of those events.

### Using Fluent's `useAnnounce` hook

There are multiple advantages to using the built-in Fluent `AriaLiveAnnouncer` + `useAnnounce` hook to handle live regions instead of building your own in the DOM:

1. It uses the new `document.ariaNotify` API in browsers where it is supported, with a fallback to a DOM-based live region in browsers without support. The `ariaNotify` API has several advantages, including better support for announcements when a modal is open, better performance in apps with a very large & complex DOM, better observability and debugging support, and it is easier to unit test.
2. You can call it once at exactly the time the announcement is desired, instead of trying to manage text (and removing text) in a rendered live region node.
3. You can call `announce()` at any time, even when the component is first mounted. You do not need to manually ensure an empty live region node exists in the DOM first, before inserting the desired announcement text into it.
4. You sidestep the problem of unintentional other updates to children of a rendered live region node causing the live region to announce again.

While it is possible to directly use `ariaNotify` without the Fluent Announce utility, it's recommended to wait until the API is more stable — Fluent has been working with both the spec and browser implementors, which is why it's implemented in its early stages. It would also be necessary to include a polyfill until browser support meets the needs of your site or app.

#### Step 1: ensure an `AriaLiveAnnouncer` or custom implementation exists

The `useAnnounce` hook's `announce()` function looks for the closest `AnnounceContext`, which is where the actual live region implementation exists. Ideally the `AriaLiveAnnouncer` or custom `AnnounceContext` should be added once at the root of the application.

There are a couple of cases where one might add an additional nested `AriaLiveAnnouncer`:

- Your team's UI may be used in any of several places, and you can't guarantee the wrapping app has its own `AriaLiveAnnouncer`.
- You have UI rendered within an iframe.

It would usually look something like this, in the same place other top-level providers are defined:

```tsx
<FluentProvider theme={webLightTheme}>
  <AriaLiveAnnouncer>{...children}</AriaLiveAnnouncer>
</FluentProvider>
```

#### Step 2: import `useAnnounce` and call `announce()` when desired

At the component level, import and call `useAnnounce` to get the `announce` function, and call `announce` where desired.

For example, this is how you would fire an announcement in response to an attachment uploading:

```tsx
import { useAnnounce } from '@fluentui/react-components';
```

```tsx
const { announce } = useAnnounce();

onLoad = attachment => {
  announce(`finished uploading ${attachment.name}`);

  // other onLoad logic
};
```

### Common mistakes

#### 1. Localization

Since the text of screen reader announcements is often either not displayed visually, or slightly different than the text displayed visually, it is easy to forget and not catch when it isn't localized. Ensure any strings used in live region messages are pulled from imported localized strings (whether using Fluent's `useAnnounce` or custom live regions).

#### 2. Wrapping large regions in a live region node

A common example of this is putting `aria-live` on an element that wraps an entire chat message list, or a table whose cells can frequently update.

Never wrap a large amount of content, and especially complex DOM hierarchy, in a live region node.

#### 3. Using `aria-relevant` or `aria-atomic`

These attributes do not have consistent cross-browser, cross-screen-reader, and cross-platform support and should not be used. Instead, ensure the text of any live region message is specifically tailored to the update that needs to be conveyed. Never wrap a large amount of content with multiple possible types of DOM updates in a live region and expect `aria-relevant` or `aria-atomic` to prevent all the problems that come with that approach.

#### 4. Putting an editable form field or contenteditable element in a live region

User-editable fields like inputs, checkboxes, selects, dropdowns, and contenteditable elements should never be live regions, or be inside live regions. When this happens, every user interaction can cause the live region to fire in some browsers and screen readers, causing the form field or editable region to be effectively unusable for screen reader users.

#### 5. Inserting a live region node into the DOM with child content, and expecting that child content to be read

This applies to custom DOM-based live regions, not to the Fluent announce utility.

When making custom live region nodes, any approach other than `role="alert"` _must_ exist in the DOM before text is inserted in order to work as expected. Live region nodes read updates, not text on insertion. In the past, this has worked in Narrator, but not in any other screen reader.

Only `role="alert"` will read its content when it is first inserted into the DOM. However, `role="alert"` should only be used for errors and alerts, since it is sometimes announced differently by screen readers than other live regions (e.g. by playing a sound or saying "alert" before the text of the message).

#### 6. Calling `announce()` or updating a live region inside a `useEffect` that runs more than intended

One common cause of screen reader announcements running repeatedly when not intended is triggering them within a `useEffect` that has dependencies that update outside of the intended announcement trigger.

For example, here is a `useEffect` that both calls `announce` and an optional callback function in response to a loading state change, and accidentally triggers announcements even outside of the loading changes:

```tsx
useEffect(() => {
  if (!loading) {
    announce('loading complete');
    props.onLoad?.();
  }
}, [loading, props.onLoad]);
```

The issue is that if the `props.onLoad` function isn't wrapped in something like `useCallback` or `useMemo` (or is, but one of those dependencies changes), the "loading complete" message will fire again even though the loading state did not change.

#### 7. Calling `announce` or triggering a live region in response to user text input

The issue with this is that the announcement will conflict with the screen reader's default keyboard echo as the user types. In the worst case, this can make the text input unusable, since the user may not be able to hear themselves typing. Alternatively, they may hear themselves type, but entirely miss the announcement. This applies to text inputs, textareas, and contenteditable regions alike.

Instead, use the Fluent `useTypingAnnounce` hook, which will both batch and debounce any `typingAnnounce` calls and fire a single announcement 0.5s after the user ceases typing.

Here is an example of using `useTypingAnnounce` to give the user a warning about approaching or exceeding the character limit on a text field:

```tsx
const announceId = useId('typing-announce');

const onChange = event => {
  const charCount = event.target.value.length;
  const isOverlimit = charCount > 20;
  setExceededLimit(isOverlimit);

  if (charCount > 15 && charCount <= 20) {
    typingAnnounce(`${20 - charCount} characters remaining`, {
      // setting the same batchId allows multiple messages to be batched,
      // so only the last typingAnnounce call's message is actually announced
      batchId: announceId,
    });
  }

  if (isOverlimit) {
    typingAnnounce('You have reached the maximum character limit', {
      batchId: announceId,
    });
  }
};
```

## Scenarios

Source: [Fluent UI — Accessibility Scenarios](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-scenarios--docs)

Accessibility scenarios are used to validate accessibility of components and demonstrate common UI patterns using Fluent UI components. Each scenario is a small isolated page combining one or more components into a realistic pattern, used for manual and automated (axe-core) accessibility testing.

### Component: Accordion

- [Accordion / Personal form](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--personal-form-accordion)
- [Accordion / FAQ](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--faq-accordion)

### Component: Button

- [Button / Messenger](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--messenger-buttons)

### Component: Checkbox

- [Checkbox / Questionnaire about food](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--questionnaire-about-food-checkboxes)

### Component: Input

- [Input / Ticket order form](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--ticket-order-form-inputs)

### Component: Link

- [Link / Site navigation](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--site-navigation-links)

### Component: Menu

- [Menu / Profile menu](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--profile-menu)
- [Menu / Menu with split item](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--menu-with-split-item)

### Component: Popover

- [Popover / Add people](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--add-people-popover)

### Component: RadioGroup

- [RadioGroup / Questionnaire about transportation](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--questionnaire-about-transportation-radios)

### Component: Slider

- [Slider / Sound control](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--sound-control-sliders)

### Component: Spinner

- [Spinner / Posts loading](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--posts-loading-spinner)

### Component: SplitButton

- [SplitButton / Event reminder](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--event-reminder-split-button)

### Component: Switch

- [Switch / Device controls](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--device-controls-switches)

### Component: TabList

- [TabList / Mail settings with horizontal tablist](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--mail-settings-horizontal-tab-list)
- [TabList / Mail settings with vertical tablist](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--mail-settings-vertical-tab-list)
- [TabList / Mail settings with overflow tablist](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--mail-settings-overflow-tab-list)

### Component: Textarea

- [Textarea / Questionnaire about customer experience](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--questionnaire-about-customer-experience-textareas)

### Component: ToggleButton

- [ToggleButton / Device controls](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--device-controls-toggle-buttons)

### Component: Tooltip

- [Tooltip / Buttons with tooltip](https://storybooks.fluentui.dev/react/iframe.html?id=concepts-developer-accessibility-scenarios--buttons-with-tooltip)

## Truncation

Source: [Fluent UI — Truncation](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-truncation--docs)

Fluent has moved away from building in CSS truncation in components in v9 due to the accessibility concerns that accompany it. There are some ways to handle truncation in an accessible way, though it is important to be aware of the potential pitfalls when doing so.

The top recommendation is to use character-count-based JavaScript truncation over CSS truncation, ensuring that strings are never truncated past a reasonable and readable number of characters shown, and also to prefer truncating in the middle of the string instead of at the end. The rest of this section explains why, and covers a few potential alternatives.

### Accessibility traps

Truncating text based on available width primarily causes problems for people using static page zoom, zoom software, smaller-screen devices, and alternative input methods. These can often combine with each other to create increasingly difficult barriers to access. Most of those barriers boil down to two specific problems:

1. Truncation based on width at small screen sizes can quickly render the control useless by showing so few characters that the information cannot be parsed.
2. The full text is often exposed in tooltips which are inaccessible to many users, and often specifically the users who most need it.

The most common scenarios where a user would experience truncation past the point of understandability are:

- Small-screen devices
- Static zoom or text size increases, sometimes paired with a zooming software like ZoomText
- Zoom or text size increases on a small-screen device

All of these cases also increase the likelihood that tooltips will not be accessible. Small-screen devices are usually touchscreens, which do not allow the user to access tooltips on most controls.

Additionally, static zoom is often paired with screen magnification software, which makes tooltip access much more difficult. The WCAG criterion [1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) is intended to help make tooltips and other hover content more accessible to magnification users, but it still falls far short in terms of real-world usability. In user studies on tooltips that meet all WCAG requirements as well as keyboard, screen reader, and touch access, one zoom + macOS magnification user had the following to say about Fluent's tooltips:

> "There's something popping up here, but it's blending in with the background, and I can't tell where it starts or begins. I'm so visually confused by all of this, that I would not interact with any of this body text."

and:

> "I haaaate hover and things I need to hover over"

This is why tooltips should generally be short optional hints that are not necessary to the understanding and operation of the UI. If a UI uses width-based truncation for a set of items in e.g. a list, menu, or table that requires some users to hover over every entry to read it, that would drastically slow down those users in the best case scenario, and fully block them in the worst case scenario.

There are ways to truncate while avoiding these pitfalls, but they must ensure that users do not lose meaningful information when zooming, and that tooltips are not the primary method of making truncated text available.

### Accessible truncation approaches

**1. Truncate the string with JavaScript based on character count, optionally in the middle rather than the end of the string**

This approach makes it possible to prevent truncation below a minimum number of characters, which can be chosen to ensure the string never shortens past the point of understandability. The other benefit is that JavaScript truncation enables truncating in the middle of the string in cases where the end contains relevant information, as in the case of file names or emails.

**2. Set a reasonable `min-width` paired with CSS truncation to prevent truncating past usability**

This approach works best when the truncation is occurring in a table or grid, where the user might expect to need to scroll horizontally to consume all the information.

The potential pitfall of this approach is that in some places, setting a `min-width` may cause [WCAG Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) failures if it causes the page to scroll horizontally when zoomed.

**3. Only truncate text that is not necessary for the understanding or operation of the UI**

This is a rare case, since most of the time content that is irrelevant to users should not be displayed. This would need to be evaluated on a case-by-case basis, but a couple of examples include:

- `id` or hash data that is not really intended to be read as text by humans.
- Supplementary content, such as a post summary following a post title, where reading the title alone is a reasonable user experience.

**4. Only truncate based on user actions or settings**

If truncation occurs as the result of the user resizing UI or choosing a compact view setting (e.g. in an email application), it is fine to truncate purely based on available space.
