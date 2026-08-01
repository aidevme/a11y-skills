# a11y-skills GitHub Action

Composite action wrapping `@aidevme/a11y audit`. Ships from this repo (`aidevme/a11y-skills`) — DESIGN.md's `aidevme/a11y-action` naming refers to the eventual dedicated marketplace listing; until that's published, reference this path directly. Pinned to `dev` below since that's where the action currently lives — switch to `@main` once `dev` merges.

## Usage

```yaml
- uses: aidevme/a11y-skills/action@dev
  with:
    path: .
    fail-on: error
    report-format: sarif
```

Static analysis (Layer 1) always runs. The runtime layer (Layer 2, axe-core) is opt-in since it needs a running preview:

```yaml
- uses: aidevme/a11y-skills/action@dev
  with:
    runtime: true
    url: http://localhost:4173
    fail-on: error
```

See `action.yml` for the full input/output list. `.a11y-baseline.json`, if committed in the audited path, is honored automatically by the CLI — no separate input needed.
