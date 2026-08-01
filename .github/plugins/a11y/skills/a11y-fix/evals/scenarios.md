# a11y-fix — eval scenarios

| ID | Scenario | Expected behavior |
| --- | --- | --- |
| TC-P2.5-07 | `/a11y-fix` on `examples/react-seeded`, target the `react-alt-text` finding | Proposes adding `alt="…"` to the `<img>`; after approval and apply, re-audit shows that finding gone and no new finding at that location |
| TC-P2.5-08 | `/a11y-fix` on a finding with no documented pattern (e.g. a hypothetical new rule) | States explicitly that no fix pattern is available; does not fabricate a diff |
| extra | Finding is `react-no-distracting-elements` (non-interference) | Never suggested as optional/deferrable; fixed first regardless of order requested |
| extra | User asks to "just suppress" a finding | Skill warns this isn't a fix and asks for explicit confirmation before adding an override/disable comment |
