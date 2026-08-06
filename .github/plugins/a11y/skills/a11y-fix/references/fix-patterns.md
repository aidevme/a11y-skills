# Fix patterns by rule

Each entry: what's wrong, the minimal fix, and a worked example. See also `a11y-audit/references/rule-packs.md` for the one-line summaries.

## react-alt-text

**Wrong:** `<img>` with no `alt`.
**Fix:** decorative → `alt=""`; meaningful → describe the image's purpose, not its appearance ("Company logo", not "blue rectangle with text").

```diff
- <img src="logo.png" />
+ <img src="logo.png" alt="Company logo" />
```

## react-anchor-is-valid

**Wrong:** `<a onClick={...}>` used for an action instead of navigation.
**Fix:** if it navigates, give it a real `href`; if it performs an action, use `<button type="button">`.

```diff
- <a onClick={() => setOpen(true)}>Open dialog</a>
+ <button type="button" onClick={() => setOpen(true)}>Open dialog</button>
```

## react-click-events-have-key-events

**Wrong:** `onClick` on a non-interactive element with no keyboard equivalent.
**Fix:** prefer replacing the element with a real `<button>`/`<a>`. Only add manual `role`/`tabIndex`/`onKeyDown` if a real interactive element truly cannot be used.

```diff
- <div onClick={openDialog}>Open dialog</div>
+ <button type="button" onClick={openDialog}>Open dialog</button>
```

## react-tabindex-no-positive / react-no-noninteractive-tabindex

**Wrong:** `tabIndex` with a positive value, or on a non-interactive element.
**Fix:** remove `tabIndex` (or set to `0`/`-1` only if the element is genuinely interactive/programmatically focusable); fix visual/DOM order instead of forcing tab order.

```diff
- <span tabIndex={3}>Focusable</span>
+ <span>Focusable</span>
```

## react-aria-role / react-aria-props

**Wrong:** invalid ARIA role or misspelled `aria-*` attribute.
**Fix:** use a valid role from the ARIA spec, or remove the role if a native element already conveys the right semantics. Fix attribute typos (`aria-labeledby` → `aria-labelledby`).

```diff
- <div role="banana">Fruit</div>
+ <div>Fruit</div>
```

## react-no-distracting-elements (non-interference — SC 2.2.2)

**Wrong:** `<marquee>` or `<blink>`.
**Fix:** remove entirely; if motion is wanted, use CSS animation with a user-controllable pause (respect `prefers-reduced-motion`).

```diff
- <marquee>Breaking news</marquee>
+ <p>Breaking news</p>
```

## react-label-has-associated-control

**Wrong:** `<label>` not associated with any control.
**Fix:** pair `htmlFor`/`id`, or nest the control inside the label.

```diff
- <label>Name</label>
- <input type="text" />
+ <label htmlFor="name">Name</label>
+ <input id="name" type="text" />
```

## fluent-button-accessible-name

**Wrong:** icon-only Fluent `<Button>` with no accessible name.
**Fix:** add `aria-label`.

```diff
- <Button icon={<AddIcon />} />
+ <Button icon={<AddIcon />} aria-label="Add item" />
```

## fluent-dialog-aria-modal

**Wrong:** `aria-modal="false"` (or `{false}`) on Fluent `<Dialog>`.
**Fix:** delete the override — Fluent manages `aria-modal` itself.

```diff
- <Dialog aria-modal="false">
+ <Dialog>
```

## fluent-field-label / fluent-spinner-label / fluent-image-alt / fluent-link-accessible-name

**Wrong:** missing `label`/`alt`/content on the respective Fluent component.
**Fix:** add the missing prop with real, specific text — never a placeholder like "TODO" or "label".

```diff
- <Field><Input /></Field>
+ <Field label="Email"><Input /></Field>
```

## fluent-menubutton-accessible-name

**Wrong:** icon-only Fluent `<MenuButton>` with no accessible name.
**Fix:** add `aria-label` describing what the menu contains — not "expand" or the chevron.

```diff
- <MenuButton icon={<MoreIcon />} />
+ <MenuButton icon={<MoreIcon />} aria-label="More actions" />
```

## fluent-dialog-title

**Wrong:** Fluent `<Dialog>` with no `<DialogTitle>` descendant and no `aria-label`/`aria-labelledby`.
**Fix:** add a `<DialogTitle>` inside `DialogSurface`/`DialogBody` (wires `aria-labelledby` automatically), or set `aria-label` directly on `<Dialog>` if a visible title isn't part of the design.

```diff
- <Dialog>
-   <DialogSurface><DialogBody>Are you sure?</DialogBody></DialogSurface>
- </Dialog>
+ <Dialog>
+   <DialogSurface><DialogBody>
+     <DialogTitle>Confirm deletion</DialogTitle>
+     Are you sure?
+   </DialogBody></DialogSurface>
+ </Dialog>
```

## fluent-checkbox-label / fluent-dropdown-label / fluent-input-label / fluent-radiogroup-label / fluent-spinbutton-label / fluent-textarea-label

**Wrong:** the component has no `aria-label`/`aria-labelledby`, isn't wrapped in a `<Field label="...">`, and (for Checkbox) has no `label` prop.
**Fix:** wrap in `Field` (simplest, works for Checkbox/Input/RadioGroup/Textarea), or pair a `<Label htmlFor>` with a matching `id` (the common pattern for Dropdown/SpinButton), or set `aria-label`/`aria-labelledby` directly. Never use `placeholder` as a substitute for a label.

```diff
- <Dropdown>
+ <Label htmlFor="favorite-fruit">Favorite fruit</Label>
+ <Dropdown id="favorite-fruit">
    <Option>Apple</Option>
  </Dropdown>
```

```diff
- <RadioGroup>
+ <RadioGroup aria-label="Favorite fruit">
    <Radio value="apple" label="Apple" />
  </RadioGroup>
```

## runtime-reflow / runtime-text-spacing / runtime-orientation (Layer 2)

These have no single-line fix — they're layout issues. Point the user at the offending selector (in `context`) and the CSS rule causing it (fixed widths, `overflow: hidden` with fixed heights, or orientation-based `display: none`); propose a responsive alternative (max-width instead of width, min-height instead of fixed height, remove orientation media-query hiding).
