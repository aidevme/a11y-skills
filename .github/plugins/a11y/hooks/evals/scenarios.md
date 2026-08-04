# Claude Code hooks — eval scenarios

Scenario tests for the opt-in `UserPromptSubmit`/`PreToolUse` hooks (TEST_PLAN TC-P4.2-01..08). Preconditions for every row below except TC-P4.2-01: the plugin is installed **and** `.a11yrc.json` has `hooksEnabled: true` (set via `a11y init --with-hooks`).

| ID | Scenario | Expected behavior |
| --- | --- | --- |
| TC-P4.2-01 | Plugin installed, `hooksEnabled` absent/`false` (i.e. `--with-hooks` never run) | Both hook scripts still execute (Claude Code registers plugin hooks unconditionally — there is no per-project settings toggle) but self-check the config flag first and exit as a silent no-op; writes are never gated. *Design deviation from the literal "no hook entries in settings" phrasing — see IMPLEMENTATION.md §4.2.* |
| TC-P4.2-02 | Hooks enabled; agent writes a `.tsx` with a missing `alt` | `PreToolUse` denies the write; reason lists the rule id, line, and WCAG SC |
| TC-P4.2-03 | Agent corrects the alt text and rewrites | `PreToolUse` allows the write |
| TC-P4.2-04 | Agent writes `README.md` | `PreToolUse` does not fire the audit path (extension not in the lintable list); no-op allow |
| TC-P4.2-05 | Edit to an *existing* `ControlManifest.Input.xml` that removes/empties `display-name-key` (or any other rules-pcf-covered attribute) | **Closed in Phase 5.** `PreToolUse` denies the edit — verified end-to-end against a real fixture project, not just a unit test. `.form.xml` Dataverse form edits are covered the same way. |
| extra | A brand-new `ControlManifest.Input.xml` created via a single `Write` to a location with no PCF control on disk yet | **Known, documented gap:** surface detection requires an on-disk marker file to recognize the `pcf` surface, and the pending content only ever exists in a temp file at check time — so a control's very first manifest, created from nothing in one `Write` call, isn't PCF-surface-detected on that first write and the check silently allows it. Editing an *existing* manifest (the TC-P4.2-05 case, and the realistic scenario — real PCF scaffolds come from `pac pcf init`, not a raw agent `Write`) works correctly. |
| TC-P4.2-06 | Time the gate on a ~500-line file | Low single-digit seconds once `npx`'s local package cache is warm; the hook's own timeout is set to 15s specifically to tolerate a cold first run without a false hard-failure — see docs/safety-and-guardrails.md for the honest perf note |
| TC-P4.2-07 | `UserPromptSubmit` with "add a dialog component" | Dialog guidance (`a11y-dialogs`) injected as additional context; prompt is never blocked |
| TC-P4.2-08 | `UserPromptSubmit` with "update the README" | No context injected (no UI/dialog/form/keyboard signal in the prompt) |
| extra | Any hook input that fails to parse as JSON, or `.a11yrc.json` is malformed | Both hooks fail open (allow / no context) rather than throwing or blocking |
| extra | `Edit` whose `old_string` is not found in the current file content | `PreToolUse` cannot safely reconstruct pending content; allows rather than guessing |
