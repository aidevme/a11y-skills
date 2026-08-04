---
name: a11y-pcf
description: Reference guide and automated audit support for accessible PCF (Power Apps Component Framework) controls and Dataverse model-driven forms — accessible names on bound properties, keyboard operability for standard (non-virtual) controls, and Dataverse form XML labeling. Use when building or reviewing PCF controls, ControlManifest.Input.xml, or Dataverse form customizations. Automated auditing runs via the a11y-audit skill (`packages/rules-pcf`, Layer 3 domain rules).
---

# a11y-pcf

Covers two closely related Power Platform low-code surfaces: PCF control manifests and Dataverse model-driven form XML customizations. Automated checks for both ship in `@aidevme/a11y-rules-pcf` (Layer 3 — see `docs/rule-reference.md` for the full, generated rule list); this skill supplies the guidance the automated rules can't fully cover, plus how to interpret their findings.

## Automated audit support

`npx @aidevme/a11y audit <path>` already covers PCF: `packages/surface-detector` recognizes a directory tree as the `pcf` surface whenever it contains a `ControlManifest.Input.xml`, and `packages/rules-pcf` then runs its Layer 3 rules against that manifest and any `*.form.xml` Dataverse form files alongside it. No separate command or flag is needed — just run `a11y-audit` as usual; findings from this pack carry `"surface": "pcf"` in JSON output. Layer 1 (React/Fluent a11y linting) also runs automatically on a control's own `.tsx`/`.jsx` source when it's React-based (a "virtual" control).

**Known limitation:** the Layer 3 PCF/Dataverse checks require a real `ControlManifest.Input.xml` (or `*.form.xml`) to already exist on disk to be detected — they won't catch violations in a control's manifest on the very first `Write` that creates it from nothing (surface detection can't see pending, not-yet-written content). Once the manifest exists, every subsequent edit is checked normally. Say so if asked why a freshly-scaffolded control wasn't flagged.

**Layer 2 (runtime, axe-core) for PCF:** there's no PCF-specific runtime mode — reuse the generic URL-based `--runtime` flag against the control's own local test harness:

```bash
npm start          # pcf-scripts' local harness, defaults to http://localhost:8181
npx @aidevme/a11y audit . --runtime --url http://localhost:8181
```

This runs real axe-core checks against the control as actually rendered — the most reliable signal for anything the manifest can't express (computed contrast, actual focus order, live ARIA state). If the harness uses a different port, pass that URL instead; `--crawl` isn't useful here since the harness is a single page.

## PCF manifest (`ControlManifest.Input.xml`)

- **Accessible names for makers, not just end users** (SC 4.1.2): every `<control>` needs a non-empty `display-name-key` and `description-key`; every `<property>` (bound, input, or output) needs its own `display-name-key`/`description-key`. These drive the accessible name/description shown in Power Apps Studio's property panel — a maker relying on a screen reader to configure your control depends on them exactly the way an end user depends on `aria-label`. Audit rules: `pcf-control-missing-display-name`, `pcf-control-missing-description`, `pcf-property-missing-display-name`, `pcf-property-missing-description`.
- **Keyboard operability** (SC 2.1.1): a control's `control-type` is either `"virtual"` (React-based; the platform manages its DOM, and the same `jsx-a11y`/Fluent rules that cover any React app apply) or `"standard"`/omitted (the control fully owns its own rendering — including any `<canvas>`-drawn UI). Standard controls can't have their keyboard handling verified from the manifest alone; audit rule `pcf-standard-control-manual-keyboard-review` flags every standard control as a manual-review reminder, not a hard failure. When reviewing one by hand: every interactive element the control draws must be reachable via Tab, operable via Enter/Space (or arrow keys for composite widgets, per the WAI-ARIA Authoring Practices pattern that matches your widget), and must move a visible, programmatically-determinable focus indicator.
- **Values exposed to assistive tech**: if your control renders custom interactive elements (not native `<button>`/`<input>`), give them the correct ARIA role and keep `aria-valuenow`/`aria-checked`/etc. in sync with the control's actual state — this is the SC 4.1.2 "Value" half, and it's on you for a standard control since there's no framework doing it for you.

## Dataverse model-driven forms (`*.form.xml`)

The audit pack recognizes exported/authored Dataverse form customization XML by the `*.form.xml` filename convention (a11y-skills' own scanning convention — Dataverse doesn't have one universal standalone filename, so name the file you hand to the auditor accordingly; see `references/dataverse-forms.md`).

- **Never hide a label, only its visual box** (SC 1.3.1, 3.3.2): `showlabel="false"` on a `<cell>` or `<section>` removes the label from *everyone*, including assistive tech — it is not the accessible equivalent of `aria-label`-only styling. If a label must be visually hidden, that has to happen in a custom form script/ribbon customization that keeps it in the accessibility tree, not via `showlabel`. Audit rules: `dataverse-cell-label-hidden`, `dataverse-section-label-hidden`.
- **Every label needs real text** (SC 3.3.2, 1.3.1, 2.4.6): an empty `<label description="">` is worse than no automated tooling can always catch by itself — check every tab, section, and field label has a real, specific description. Audit rules: `dataverse-tab-label-empty`, `dataverse-section-label-empty`, `dataverse-cell-label-empty`.
- **Tab order and grouping**: form XML's `<tabs>`/`<sections>`/`<rows>`/`<cells>` nesting is also the reading and tab order assistive tech gets — reordering columns visually without reordering the XML creates a mismatch between visual and programmatic order (SC 1.3.2).

## Checklist

- [ ] Every manifest `<control>` and `<property>` has `display-name-key` + `description-key` (`pcf-*-missing-*`)
- [ ] Standard (non-virtual) controls manually reviewed for keyboard operability and ARIA state sync (`pcf-standard-control-manual-keyboard-review`)
- [ ] No `showlabel="false"` on a cell/section that would hide a label from assistive tech (`dataverse-*-label-hidden`)
- [ ] Every tab/section/field label has real, non-empty text (`dataverse-*-label-empty`)
- [ ] Visual column order matches the form XML's structural order
