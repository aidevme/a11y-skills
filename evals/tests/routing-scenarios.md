# Router evals — a11y-overview

Scenario tests for skill routing (TEST_PLAN TC-P1.7-01..04). Each prompt should activate the expected skill.

| ID | Prompt | Expected skill |
| --- | --- | --- |
| TC-P1.7-01 | "check accessibility of this component" | a11y-audit |
| TC-P1.7-01b | "run a WCAG compliance scan" | a11y-audit |
| TC-P1.7-01c | "audit the ARIA in src/components" | a11y-audit |
| TC-P1.7-02 | "set up accessibility for this repo" | a11y-init |
| TC-P1.7-02b | "add accessibility guidelines the AI should follow" | a11y-init |
| TC-P1.7-03 | "how do I make this modal accessible?" | a11y-dialogs |
| TC-P1.7-03b | "my dropdown traps keyboard focus, help" | a11y-keyboard (or a11y-dialogs; must mention SC 2.1.2 non-interference) |
| TC-P1.7-03c | "how should form validation errors be announced?" | a11y-forms |
| TC-P1.7-04 | "make this Power Pages form accessible" | a11y-pages, which states automated portal audit is not yet available |
| TC-P1.7-04b | "accessible name for a PCF control property?" | a11y-pcf — automated PCF audit is available from v2 (`packages/rules-pcf`); the skill answers directly and can point at `a11y-audit` for the automated check |
| negative | "fix this TypeScript compile error" | none of the a11y skills |
