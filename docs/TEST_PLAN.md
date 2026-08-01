# a11y-skills — Test Plan & Acceptance Criteria

**Companion to:** [IMPLEMENTATION.md](IMPLEMENTATION.md) — phase/step numbers below match it.
**Status:** Living document — extend it whenever a rule, reporter, or skill is added. A rule without a test case here (and a fixture in `examples/`) is not done.

## Conventions

- **AC-Px-n** = acceptance criterion for phase x. All ACs of a phase must hold before the phase is released.
- **TC-Px.y-nn** = test case for implementation step x.y. Each states *setup*, *steps*, and *expected result*.
- **Test layers:**
  - **Unit** — Vitest, lives next to the package (`packages/*/tests/`, `reporters/*/tests/`). Run: `npm test`.
  - **Fixture** — seeded-violation projects under `examples/`; a test asserts the **exact** findings list (ruleId + file + line), never just "some findings".
  - **Golden** — snapshot files for reporter output; regenerate deliberately with `vitest -u`, never blindly.
  - **Eval** — agent-behavior scenarios (`evals/tests/` for cross-skill routing, `<skill>/evals/` for one skill). Run in CI on a schedule.
  - **Manual** — a human in a live agent session; recorded as a checklist item in the release notes.
- **Assertion snippets** are illustrative Vitest code — adapt names to the real API, keep the assertion semantics.

---

## Phase 0 — Scaffolding

### Acceptance criteria

- **AC-P0-1** `npm install && npm run build && npm test && npm run lint` all exit 0 on a fresh clone.
- **AC-P0-2** `npm run validate:skills` reports 9/9 valid; `npm run validate:manifests` reports all four manifests agree.
- **AC-P0-3** The committed example `.a11yrc.json` validates against the schema; malformed configs are rejected.
- **AC-P0-4** Skill folder layout matches DESIGN §3 exactly (overview = SKILL.md only; audit/init/fix have `scripts/`; topic guides do not).
- **AC-P0-5** CI executes build, test, lint, and both validators on every PR.

### Test cases

| ID | Setup | Steps | Expected result |
| --- | --- | --- | --- |
| TC-P0.1-01 | Fresh clone, Node ≥ 20 | `npm install` | Exit 0, no vulnerabilities blocking install |
| TC-P0.1-02 | After install | `npm run build` | Exit 0; `packages/core/dist/index.js` + `.d.ts` exist |
| TC-P0.1-03 | After install | `npm test` | Exit 0; ≥ 6 tests pass; 0 failures |
| TC-P0.1-04 | After install | `npm run lint` | Exit 0, no errors |
| TC-P0.2-01 | Repo as committed | `npm run validate:skills` | Exit 0, output ends `9/9 skills valid` |
| TC-P0.2-02 | Temporarily rename `a11y-audit/SKILL.md` frontmatter `name:` to `A11Y-Audit` | `npm run validate:skills` | Exit 1; error names the invalid skill and rule ("invalid name", "does not match directory") |
| TC-P0.2-03 | Delete `description:` line from any SKILL.md | `npm run validate:skills` | Exit 1; "missing required field: description" |
| TC-P0.2-04 | Remove frontmatter entirely from one SKILL.md | `npm run validate:skills` | Exit 1; "missing or malformed YAML frontmatter" |
| TC-P0.2-05 | Repo as committed | `npm run validate:manifests` | Exit 0; "All manifests agree (version: …)" |
| TC-P0.2-06 | Change version in one manifest only | `npm run validate:manifests` | Exit 1; "version drift" lists both versions |
| TC-P0.2-07 | Point one manifest's `source` at a wrong path | `npm run validate:manifests` | Exit 1; source mismatch reported for that file only |
| TC-P0.3-01..06 | — | `npm test` (schema suite) | The 6 committed assertions in `packages/core/tests/a11yrc.schema.test.ts` pass: example valid, `{}` valid, unknown profile rejected, unknown wcagVersion rejected, invalid override severity rejected, unknown top-level property rejected |

**Assertion example (already implemented):**

```ts
it('rejects an unknown profile', () => {
  expect(validate({ profile: 'lenient' })).toBe(false);
});
```

---

## Phase 1 — MVP

### Acceptance criteria

- **AC-P1-1** `npx a11y audit --format json` on a clean React fixture returns `[]`, exit 0; on a seeded fixture returns the exact expected findings, exit 1 with `--fail-on error`.
- **AC-P1-2** Every shipped rule (react + fluent packs) has ≥ 1 violating fixture and appears in a clean fixture without firing (no false positives).
- **AC-P1-3** No emitted finding ever carries `wcagRef: "4.1.1"`.
- **AC-P1-4** Exit codes are exactly: 0 = clean/below threshold, 1 = findings ≥ `--fail-on`, 2 = execution error. Nothing else.
- **AC-P1-5** `a11y init` is idempotent — second run changes zero bytes.
- **AC-P1-6** `docs/rule-reference.md` regeneration is enforced in CI (stale copy fails).
- **AC-P1-7** In a live Claude Code session, `/a11y-audit` on the fixture surfaces findings + ≥ 1 concrete diff; the router sends "check accessibility" to `a11y-audit`.

### Test cases

#### 1.1 Core (schema, aggregator, CLI)

| ID | Setup | Steps | Expected result |
| --- | --- | --- | --- |
| TC-P1.1-01 | Two findings differing only in line number | compute `fingerprint` for both | Fingerprints are **equal** (drift-resilient) |
| TC-P1.1-02 | Two findings differing in ruleId or file | compute fingerprints | Fingerprints **differ** |
| TC-P1.1-03 | Finding with `wcagRef: "2.1.2"` | construct Finding | `nonInterference === true` |
| TC-P1.1-04 | Findings for 1.4.2, 2.1.2, 2.2.2, 2.3.1 and one for 1.1.1 | construct all | First four `nonInterference: true`; 1.1.1 `false` |
| TC-P1.1-05 | Duplicate findings (same fingerprint) from two layers | aggregate | One survives; `layer` of the first is kept |
| TC-P1.1-06 | Mixed severities/wcagRefs/files | aggregate | Sorted error → warning → info, then wcagRef asc, then file asc |
| TC-P1.1-07 | Empty project dir | `a11y audit --format json` | stdout `[]`, exit 0 |
| TC-P1.1-08 | Fixture with 1 error-severity finding | `a11y audit --fail-on error` | Exit 1 |
| TC-P1.1-09 | Same fixture | `--fail-on never` | Exit 0, findings still printed |
| TC-P1.1-10 | Fixture with warnings only | `--fail-on error` | Exit 0 |
| TC-P1.1-11 | Nonexistent path argument | `a11y audit /does/not/exist` | Exit 2, error message on stderr, no stack trace dump |
| TC-P1.1-12 | Malformed `.a11yrc.json` (bad JSON) | `a11y audit` | Exit 2; message names the config file and parse position |
| TC-P1.1-13 | `.a11yrc.json` with unknown key | `a11y audit` | Exit 2; schema violation message names the key |
| TC-P1.1-14 | Valid config omitting profile/wcagVersion | load config | Defaults applied: `standard`, `2.2` |
| TC-P1.1-15 | `--output out.json` | run audit | File written; stdout stays clean for piping |

```ts
it('fingerprint ignores line drift', () => {
  const a = fingerprint({ ruleId: 'react-img-alt', file: 'src/App.tsx', context: '<img src="x.png"/>' });
  const b = fingerprint({ ruleId: 'react-img-alt', file: 'src/App.tsx', context: '<img src="x.png"/>' });
  expect(a).toBe(b);
});

it('exit code contract', async () => {
  expect((await runCli(['audit', cleanFixture, '--fail-on', 'error'])).code).toBe(0);
  expect((await runCli(['audit', seededFixture, '--fail-on', 'error'])).code).toBe(1);
  expect((await runCli(['audit', '/nope'])).code).toBe(2);
});
```

#### 1.2 Framework detector

| ID | Setup | Steps | Expected result |
| --- | --- | --- | --- |
| TC-P1.2-01 | Fixture with `react` in deps + `.tsx` files | `detect()` | `react` detected, `fluent: false` |
| TC-P1.2-02 | + `@fluentui/react-components` in deps | `detect()` | `react` detected, `fluent: true` |
| TC-P1.2-03 | Plain Node project, no UI deps | `detect()` | No framework match |
| TC-P1.2-04 | `.jsx` files present but no `react` dep (vendored) | `detect()` | `react` detected (file marker suffices) |
| TC-P1.2-05 | `react` only in devDependencies | `detect()` | `react` detected |

#### 1.3 rules-react (one fixture per rule — the pattern below repeats for every mapped rule)

| ID | Fixture seed | Expected finding |
| --- | --- | --- |
| TC-P1.3-01 | `<img src="x.png" />` (no alt) | `react-img-alt`, error, wcagRef 1.1.1, exact file+line |
| TC-P1.3-02 | `<input type="text" />` with no label association | `react-label-required`, error, 3.3.2 |
| TC-P1.3-03 | `<div onClick={…}>` without keyboard handler | `react-click-events-have-key-events`, warning, 2.1.1 |
| TC-P1.3-04 | `tabIndex={5}` | `react-no-positive-tabindex`, warning, 2.4.3 |
| TC-P1.3-05 | `<a>` with no href/content | `react-anchor-is-valid`, error, 4.1.2 |
| TC-P1.3-06 | `<div role="banana">` | `react-aria-role`, error, 4.1.2 |
| TC-P1.3-07 | `aria-labeledby` (typo) | `react-aria-props`, error, 4.1.2 |
| TC-P1.3-08 | `<marquee>`/`autoFocus` misuse | matching rule, per mapping table |
| TC-P1.3-09 | Clean component using all patterns correctly | **Zero findings** (false-positive gate) |
| TC-P1.3-10 | File that upstream maps to SC 4.1.1 (e.g. duplicate id lint) | Finding emitted with wcagRef **4.1.2** or dropped — never 4.1.1 |
| TC-P1.3-11 | Same fixture audited twice | Byte-identical JSON output (determinism) |

```ts
it('never emits SC 4.1.1', async () => {
  const findings = await lintFixture('examples/react-seeded');
  expect(findings.every((f) => f.wcagRef !== '4.1.1')).toBe(true);
});

it('seeded fixture yields exactly the expected findings', async () => {
  const findings = await lintFixture('examples/react-seeded');
  expect(findings.map(({ ruleId, file, range }) => ({ ruleId, file, line: range?.startLine })))
    .toEqual(expectedFindings); // committed alongside the fixture as expected-findings.json
});
```

#### 1.4 rules-fluent-ui

| ID | Fixture seed | Expected result |
| --- | --- | --- |
| TC-P1.4-01 | Fluent `<Dialog aria-modal="false">` (clobbered) | `fluent-dialog-aria-modal`, error, 4.1.2 |
| TC-P1.4-02 | Icon-only `<Button icon={<X/>} />` without `aria-label` | `fluent-button-accessible-name`, error, 4.1.2 |
| TC-P1.4-03 | `<Field>` input without `<Label>`/label prop | `fluent-field-label`, error, 3.3.2 |
| TC-P1.4-04 | `<Image>` without alt | `fluent-image-alt`, error, 1.1.1 |
| TC-P1.4-05 | `<Spinner>` without label | `fluent-spinner-label`, warning, 4.1.2 |
| TC-P1.4-06 | **Local component named `Button`** (not imported from Fluent) missing aria-label | **Zero fluent findings** — import resolution must prevent the false positive |
| TC-P1.4-07 | Fluent import aliased (`import { Button as Btn }`) misused | Finding still fires (alias tracked) |
| TC-P1.4-08 | Non-Fluent React project | Pack does not run at all (detector gate) |
| TC-P1.4-09 | Correct Fluent usage across all covered components | Zero findings |

#### 1.5 Markdown reporter

| ID | Input | Expected result |
| --- | --- | --- |
| TC-P1.5-01 | 5 findings, mixed severities | Golden snapshot: grouped severity → WCAG SC → file; totals header correct |
| TC-P1.5-02 | 0 findings | Golden: explicit "no findings" + pass verdict, not an empty string |
| TC-P1.5-03 | Finding with markdown-hostile message (`\|`, `<`, backtick) | Characters escaped; table not broken |
| TC-P1.5-04 | Same input twice | Byte-identical output (pure transform) |
| TC-P1.5-05 | Any finding | WCAG link points to the correct w3.org Understanding URL for its SC |

#### 1.6 Rule-reference generator

| ID | Steps | Expected result |
| --- | --- | --- |
| TC-P1.6-01 | Run generator on current packs | `docs/rule-reference.md` lists every rule with ruleId, wcagRef, wcagLevel, wcagVersion, severity |
| TC-P1.6-02 | Hand-edit rule-reference.md, run CI check | CI fails with a "stale generated file" diff |
| TC-P1.6-03 | Add a rule to a mapping table, regenerate | New row appears; nothing else changes |

#### 1.7 Skills (evals)

| ID | Scenario | Expected result |
| --- | --- | --- |
| TC-P1.7-01 | Prompt "check accessibility of this component" | Router selects `a11y-audit` |
| TC-P1.7-02 | Prompt "set up accessibility for this repo" | Router selects `a11y-init` |
| TC-P1.7-03 | Prompt "how do I make this modal accessible?" | Router selects `a11y-dialogs` |
| TC-P1.7-04 | Prompt "make this Power Pages form accessible" | Router selects `a11y-pages` (which states its current limits) |
| TC-P1.7-05 | `/a11y-audit` on seeded fixture | Skill runs CLI with `--format json`, reports top findings by severity, proposes ≥ 1 diff |
| TC-P1.7-06 | `/a11y-audit` on clean fixture | Skill reports clean result; does not invent findings |
| TC-P1.7-07 | Any audit response | Every mentioned finding cites its WCAG SC |

#### 1.8 a11y-init / Layer 0

| ID | Setup | Steps | Expected result |
| --- | --- | --- | --- |
| TC-P1.8-01 | Fixture with `.cursorrules` + `CLAUDE.md` | `a11y init` | `A11Y.md` + `.a11yrc.json` created; pointer snippet appended to both host files |
| TC-P1.8-02 | Same, run `a11y init` again | rerun | **Zero byte changes** (idempotency) — `git status` clean |
| TC-P1.8-03 | Fixture with no host files | `a11y init` | `A11Y.md` + `.a11yrc.json` created; no host file invented |
| TC-P1.8-04 | Fixture with `AGENTS.md` + `copilot-instructions.md` | `a11y init` | Both get the pointer; snippet identical in each |
| TC-P1.8-05 | Existing `.a11yrc.json` present | `a11y init` | Config **not** overwritten |
| TC-P1.8-06 | Host file already contains the pointer mid-file | `a11y init` | Not duplicated |
| TC-P1.8-07 | React+Fluent fixture | `a11y init` | Generated `A11Y.md` contains the React/Fluent section, no PCF/Pages content |

```ts
it('init is idempotent', async () => {
  await runCli(['init'], { cwd: fixture });
  const before = snapshotDir(fixture);
  await runCli(['init'], { cwd: fixture });
  expect(snapshotDir(fixture)).toEqual(before);
});
```

#### 1.9 Wrap-up

| ID | Steps | Expected result |
| --- | --- | --- |
| TC-P1.9-01 | CI dogfood job | `a11y audit` runs on this repo, exit 0 (or documented baseline) |
| TC-P1.9-02 | Manual: clean machine, install plugin, run `/a11y-audit` on a real React app | Findings + diffs, no repo-local setup needed |

---

## Phase 2 — v1

### Acceptance criteria

- **AC-P2-1** SARIF output passes GitHub code-scanning ingestion and produces PR annotations on seeded violations.
- **AC-P2-2** The HTML report **passes its own axe scan** (WCAG AA) — this test failing fails the build.
- **AC-P2-3** Runtime layer reproduces seeded axe violations across all three viewports; 320 px reflow, text-spacing, and orientation checks each fire on their dedicated fixture pages and stay silent on clean pages.
- **AC-P2-4** The 3 profiles × 3 wcagVersions matrix produces exactly the documented severity/inclusion differences; non-interference rules are errors under **every** combination.
- **AC-P2-5** Baseline: pre-existing findings never fail the gate; any new finding does; non-interference findings fail even when baselined; `--prune` only ever shrinks the file.
- **AC-P2-6** GitHub Action and AzDO template run green in a consumer repo with documented inputs.

### Test cases

#### 2.1 SARIF reporter

| ID | Input | Expected result |
| --- | --- | --- |
| TC-P2.1-01 | Seeded findings | Golden SARIF 2.1.0; `runs[0].tool.driver.rules[*].helpUri` = WCAG links; each result carries our fingerprint |
| TC-P2.1-02 | Upload to a test repo | Code-scanning alerts appear at correct file/line |
| TC-P2.1-03 | Fix one finding, re-upload | That alert auto-closes (fingerprint tracking works) |
| TC-P2.1-04 | 0 findings | Valid SARIF with empty `results`, not an invalid stub |
| TC-P2.1-05 | Finding without range | `region` omitted, file-level result still valid |

#### 2.2 HTML reporter

| ID | Input / action | Expected result |
| --- | --- | --- |
| TC-P2.2-01 | Any report | Single file, zero external network requests (assert no `http(s)://` in `src`/`href` except WCAG doc links) |
| TC-P2.2-02 | Serve report, run axe | **0 violations** — the dogfood gate |
| TC-P2.2-03 | 200 findings | Table filterable by severity/SC/surface; sort by each column works (Playwright assertions) |
| TC-P2.2-04 | Report + `--compare previous.html` | Trend block shows new/fixed/persistent counts matching the synthetic delta |
| TC-P2.2-05 | Baselined + new findings mixed | Visually distinct classes; counts split in summary |
| TC-P2.2-06 | `processes` configured, one page in flow fails | Whole flow marked failed (WCAG 5.2.3) |
| TC-P2.2-07 | `--claim` | Conformance-claim block present with date, version+level, page list |
| TC-P2.2-08 | Finding message containing `<script>alert(1)</script>` | Rendered escaped — **no XSS** (assert no script execution in Playwright) |

#### 2.3 runtime-axe

| ID | Fixture page | Expected result |
| --- | --- | --- |
| TC-P2.3-01 | Page with 3 seeded axe violations | Exactly those 3 findings, mapped ruleIds + WCAG refs, `layer: 2`, `page` set |
| TC-P2.3-02 | Same page, all viewports | Identical findings deduped to one each with `viewports: [mobile, tablet, desktop]` |
| TC-P2.3-03 | Element hidden on desktop, broken on mobile only | Finding present, `viewports: [mobile]` only |
| TC-P2.3-04 | Page with fixed-width 800 px element | Reflow check fires at 320 px (horizontal scroll detected); silent at desktop |
| TC-P2.3-05 | Clean responsive page | Reflow check silent at all widths |
| TC-P2.3-06 | Page clipping text at increased spacing | Text-spacing (1.4.12) finding with element reference |
| TC-P2.3-07 | Page locking to landscape via CSS | Orientation (1.3.4) finding |
| TC-P2.3-08 | Crawl mode, depth 1, 3-page site | Exactly 3 pages scanned; findings carry correct `page` |
| TC-P2.3-09 | URL returns 404 | Exit 2 with clear message, not an empty "clean" result |
| TC-P2.3-10 | axe finding tagged wcag2a 4.1.1 | Remapped/dropped per §5 policy |

#### 2.4 Compliance profiles

| ID | Config | Input rule | Expected effective severity |
| --- | --- | --- | --- |
| TC-P2.4-01 | `strict` | AAA-level rule | error |
| TC-P2.4-02 | `standard` | AAA-level rule | warning |
| TC-P2.4-03 | `standard` | AA-level rule | error |
| TC-P2.4-04 | `mvp` | visual/contrast rule (AA) | warning |
| TC-P2.4-05 | `mvp` | semantic rule (A) | error — **never relaxed** |
| TC-P2.4-06 | any profile | rule on SC 2.1.2 | error — non-interference floor |
| TC-P2.4-07 | any profile + override `"…2.1.2-rule": "off"` | same | **Still error** — override ignored with a warning |
| TC-P2.4-08 | `wcagVersion: "2.1"` | rule with wcagVersion 2.2 | Excluded from run |
| TC-P2.4-09 | `wcagVersion: "2.0"` | rule with wcagVersion 2.0 | Included |
| TC-P2.4-10 | Full matrix run (3 profiles × 3 versions) on one fixture | Snapshot per combination; committed as goldens |

```ts
it.each([
  ['strict', 'AAA', 'error'],
  ['standard', 'AAA', 'warning'],
  ['standard', 'AA', 'error'],
  ['mvp', 'AA-visual', 'warning'],
  ['mvp', 'A-semantic', 'error'],
])('profile %s maps %s to %s', (profile, ruleKind, expected) => {
  expect(effectiveSeverity(ruleFor(ruleKind), { profile })).toBe(expected);
});
```

#### 2.5 Baseline + a11y-fix

| ID | Steps | Expected result |
| --- | --- | --- |
| TC-P2.5-01 | Fixture with 20 findings → `a11y baseline` | `.a11y-baseline.json` has 20 fingerprints |
| TC-P2.5-02 | Audit after baselining | Exit 0 with `--fail-on error`; findings still reported, marked baselined |
| TC-P2.5-03 | Introduce 1 new violation | Exit 1; only the new finding marked failing |
| TC-P2.5-04 | Fix 5 findings, `a11y baseline --prune` | Baseline shrinks to 15; never grows on prune |
| TC-P2.5-05 | Seed a keyboard-trap (2.1.2) violation, then baseline | Baseline write **refuses** the 2.1.2 entry; audit still fails |
| TC-P2.5-06 | Rename a file containing baselined findings | Findings still matched (fingerprint is content-based) — or documented known-limit if path is part of the hash |
| TC-P2.5-07 | `/a11y-fix` on missing-label finding | Proposed diff applies cleanly; re-audit shows that finding gone, no new findings introduced |
| TC-P2.5-08 | `/a11y-fix` on a finding with no known pattern | Skill says so explicitly; does not hallucinate a fix |

#### 2.6 CI/CD

| ID | Steps | Expected result |
| --- | --- | --- |
| TC-P2.6-01 | Consumer repo, action with `fail-on: error`, seeded violation | PR check fails; SARIF annotations visible |
| TC-P2.6-02 | Same with `fail-on: never` | Check passes; annotations still uploaded |
| TC-P2.6-03 | `runtime: true` without preview step | Action fails with actionable message (not a hang) |
| TC-P2.6-04 | AzDO template run | HTML report published as artifact; stage fails on error findings |

---

## Phase 3 — v1.5

### Acceptance criteria

- **AC-P3-1** `rules-static-html` detects all six check families (landmarks, alt, label/for, heading order, lang, skip links) on seeded pages, zero findings on the clean page.
- **AC-P3-2** Vue fixtures behave like React ones (exact findings, no false positives, no 4.1.1).
- **AC-P3-3** Regenerated `A11Y.md` differs **only** when rule metadata/profile/detection changed; user content outside markers is never touched.
- **AC-P3-4** Pre-commit hook blocks staged seeded violations, ignores unstaged and pre-existing ones, and completes in < 5 s on the fixture.

### Test cases

| ID | Setup / input | Expected result |
| --- | --- | --- |
| TC-P3.1-01 | `<html>` without `lang` | `html-lang-missing`, error, 3.1.1 |
| TC-P3.1-02 | `<html lang="zz-invalid">` | invalid-lang finding |
| TC-P3.1-03 | h1 → h3 skip | heading-order finding, 1.3.1 |
| TC-P3.1-04 | `<label>` without `for`, input without id | label-pairing finding, 3.3.2 |
| TC-P3.1-05 | No `<main>`/landmarks | landmark finding, 1.3.1 |
| TC-P3.1-06 | No skip link before nav | skip-link finding, 2.4.1 |
| TC-P3.1-07 | `<img>` without alt in plain HTML | alt finding, 1.1.1 |
| TC-P3.1-08 | Clean page using all patterns | Zero findings |
| TC-P3.1-09 | Walker API consumed by a dummy extension pack | Extension receives every node; proves the P7 reuse contract |
| TC-P3.2-01..n | Vue SFC fixtures mirroring TC-P1.3 patterns (missing alt in template, `v-html` semantics loss, unlabeled input) | Exact findings per fixture; clean SFC yields zero |
| TC-P3.3-01 | Regenerate A11Y.md with unchanged metadata | Byte-identical file |
| TC-P3.3-02 | Add one rule to a pack, regenerate | Only the generated block changes; diff shows the one rule |
| TC-P3.3-03 | User adds custom text outside markers, regenerate | Custom text preserved verbatim |
| TC-P3.3-04 | Switch profile standard → mvp, regenerate | Guidance block reflects mvp severities |
| TC-P3.4-01 | Stage a file with a violation, commit | Commit blocked; violation listed |
| TC-P3.4-02 | Violation exists unstaged only | Commit succeeds |
| TC-P3.4-03 | Pre-existing baselined violation in staged file, no new ones | Commit succeeds (change-scoped) |
| TC-P3.4-04 | Time the hook on fixture repo | < 5 s |

---

## Phase 4 — v1.6

### Acceptance criteria

- **AC-P4-1** Angular and Svelte packs meet the same fixture standard (exact findings, clean-fixture zero, no 4.1.1).
- **AC-P4-2** Svelte compiler `a11y-*` warnings are captured and translated — not re-implemented (assert a warning-only case yields a finding without a matching custom rule existing).
- **AC-P4-3** Hooks are absent unless installed with `--with-hooks`; PreToolUse denies violating writes with the violations as reason, allows corrected writes, never fires on non-UI files, and answers within the performance budget.

### Test cases

| ID | Setup / input | Expected result |
| --- | --- | --- |
| TC-P4.1-01..n | Angular template fixtures (missing alt, unlabeled control, click-no-key) | Exact findings; clean component zero |
| TC-P4.1-10 | Svelte fixture triggering compiler `a11y-missing-attribute` | Finding emitted, sourced from compiler warning, WCAG-mapped |
| TC-P4.1-11 | Svelte fixture with eslint-plugin-svelte-only rule | Finding emitted via plugin path |
| TC-P4.2-01 | Plugin installed **without** `--with-hooks` | No hook entries in settings; writes never gated |
| TC-P4.2-02 | Hooks installed; agent writes `.tsx` with missing alt | Write denied; denial reason lists rule + line |
| TC-P4.2-03 | Agent corrects and rewrites | Write allowed |
| TC-P4.2-04 | Agent writes `README.md` | Hook does not fire |
| TC-P4.2-05 | Write to `ControlManifest.Input.xml` with violation | Denied (UI file-type list includes it) |
| TC-P4.2-06 | Time the gate on a 500-line file | Low single-digit seconds |
| TC-P4.2-07 | UserPromptSubmit with "add a dialog component" | Dialog guidance injected; prompt not blocked |
| TC-P4.2-08 | UserPromptSubmit with "update the README" | No injection |

---

## Phase 5 — v2

### Acceptance criteria

- **AC-P5-1** Surface detection matrix: PCF, Code Apps markers, Power Pages markers, and web-app fallback each detected correctly; multi-surface monorepo returns one result per subtree.
- **AC-P5-2** DSL engine: every condition type unit-tested; `{{placeholder}}` substitution safe; rules from two surfaces load simultaneously without cross-firing.
- **AC-P5-3** PCF/Dataverse rules meet the fixture standard; a real PCF project audits L1–L3 with one command.

### Test cases

| ID | Setup / input | Expected result |
| --- | --- | --- |
| TC-P5.1-01 | Dir with `ControlManifest.Input.xml` | Surface = pcf |
| TC-P5.1-02 | Dir with `power.config.json` | Surface = code-apps |
| TC-P5.1-03 | Dir with Liquid templates | Surface = power-pages |
| TC-P5.1-04 | None of the markers | Surface = web-app fallback |
| TC-P5.1-05 | Monorepo: `apps/web` + `controls/my-pcf` | Two results, each with own surface; findings tagged accordingly |
| TC-P5.2-01 | `control-property` condition on manifest missing display-name | Condition true → finding with substituted `{{name}}` |
| TC-P5.2-02 | Placeholder value containing `{{` or markdown | Rendered literally, no re-interpolation |
| TC-P5.2-03 | Rule with `surface: "power-pages"` loaded during PCF audit | Does **not** fire |
| TC-P5.2-04 | Malformed rule JSON | Engine exit 2 with rule file + validation error, not a silent skip |
| TC-P5.2-05 | Unknown condition `type` | Load-time error naming the rule |
| TC-P5.3-01 | Manifest with bound property lacking accessible name | `pcf-missing-aria-label`, error, 4.1.2 |
| TC-P5.3-02 | Canvas-drawn control, no keyboard handler declared | keyboard rule fires, 2.1.1 |
| TC-P5.3-03 | Dataverse form XML with unlabeled field | form-label rule, 3.3.2 |
| TC-P5.3-04 | Compliant manifest + form XML | Zero findings |
| TC-P5.3-05 | Real PCF sample project, `a11y audit` | L1 (if React) + L3 findings in one run, correctly surfaced |

---

## Phase 6 — v3

### Acceptance criteria

- **AC-P6-1** Code Apps detection + CRUD/grid domain rules meet the fixture standard.
- **AC-P6-2** A Code Apps sample audits end-to-end (L1 react/fluent + L3 CRUD rules; L2 against dev server when available).

### Test cases

| ID | Setup / input | Expected result |
| --- | --- | --- |
| TC-P6.1-01 | Generated grid without sortable-header semantics | grid-header rule fires |
| TC-P6.1-02 | Pagination controls unlabeled | pagination rule fires, 4.1.2 |
| TC-P6.1-03 | Data screen without loading/empty-state announcement | live-region rule fires, 4.1.3 |
| TC-P6.1-04 | Compliant generated screen | Zero L3 findings |
| TC-P6.1-05 | Code Apps project also matching react | Both react pack **and** code-apps rules run; no duplicate findings for the same defect |

---

## Phase 7 — v4

### Acceptance criteria

- **AC-P7-1** Liquid templates parse without choking on `{% %}` / `{{ }}`; all inherited static-html checks fire through Liquid files.
- **AC-P7-2** Entity list/form metadata rules meet the fixture standard.
- **AC-P7-3** Source scan works with no deployed site; live crawl works against a URL; both label findings with the Power Pages severity floor.

### Test cases

| ID | Setup / input | Expected result |
| --- | --- | --- |
| TC-P7.1-01 | Liquid file with `{% if %}` around valid HTML | Parses; zero false findings from template tags |
| TC-P7.1-02 | Liquid file missing `lang` on html | Inherited static-html rule fires |
| TC-P7.1-03 | Heading skip inside a Liquid include chain | Heading-order rule fires with correct file attribution |
| TC-P7.2-01 | Entity list metadata, column without accessible name | metadata rule fires |
| TC-P7.2-02 | Portal template without skip nav | skip-nav rule fires, 2.4.1 |
| TC-P7.3-01 | Same defect on web-app vs power-pages surface | Power Pages finding has ≥ severity of the web-app one (severity floor visible in report) |
| TC-P7.3-02 | Live crawl of staging portal (manual/CI-gated) | Findings per page; report groups by page; exit codes honored |
| TC-P7.3-03 | Source scan on repo with no deployed site | Completes without network access |

---

## Traceability

CI gates by phase (cumulative): P0 → build/test/lint/validators · P1 → fixture suites + golden MD + rule-reference freshness + dogfood audit · P2 → SARIF/HTML goldens + **axe-on-own-report** + profile matrix + baseline suite · P3+ → each new pack's fixture suite joins the same gate.

Rule-of-thumb when extending: every new rule adds (a) a violating fixture with an `expected-findings.json`, (b) presence in the clean fixture, (c) a row in this file, (d) regenerated `docs/rule-reference.md`.
