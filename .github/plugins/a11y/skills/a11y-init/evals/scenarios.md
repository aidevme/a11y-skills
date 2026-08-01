# a11y-init — eval scenarios

| ID | Scenario | Expected behavior |
| --- | --- | --- |
| TC-P1.8-01 | Project with `.cursorrules` + `CLAUDE.md` | Both files gain the A11Y.md pointer; A11Y.md + .a11yrc.json created |
| TC-P1.8-02 | Run init twice | Second run reports everything unchanged; zero byte changes |
| TC-P1.8-03 | Project with no host files | Only A11Y.md + .a11yrc.json created; no host file invented |
| TC-P1.8-05 | Existing `.a11yrc.json` | Left untouched; reported unchanged |
| TC-P1.8-07 | React+Fluent project | A11Y.md contains React and Fluent sections; no PCF/Power Pages content |
| extra | User asks for `--with-hooks` | Skill says hooks ship in a later version (v1.6); does not fake them |
