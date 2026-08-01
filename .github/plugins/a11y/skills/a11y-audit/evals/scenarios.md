# a11y-audit — eval scenarios

| ID | Scenario | Expected behavior |
| --- | --- | --- |
| TC-P1.7-05 | `/a11y-audit` on `examples/react-seeded` | Runs the CLI with `--format json`; reports 9 findings grouped by severity; proposes at least one concrete diff (e.g. adding `alt`) |
| TC-P1.7-06 | `/a11y-audit` on `examples/react-clean` | Reports a clean pass; invents no findings |
| TC-P1.7-07 | Any audit response | Every finding mentioned cites its WCAG SC (e.g. "SC 1.1.1") |
| extra | CLI exits 2 (bad config) | Skill reports the config error verbatim; does not claim the project is clean |
| extra | Findings include `react-no-distracting-elements` | Skill flags it as a non-interference violation and prioritizes it |
