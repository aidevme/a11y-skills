#!/usr/bin/env node
/**
 * Regenerates docs/rule-reference.md from the rule packs' mapping tables.
 * Rule metadata is the single source of truth (DESIGN §8) — never edit the
 * output by hand. CI fails when the committed copy is stale.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const PACKS = [
  {
    title: 'rules-react (`@aidevme/a11y-rules-react`)',
    note: 'Wraps eslint-plugin-jsx-a11y; only mapped rules are enabled.',
    file: join(repoRoot, 'packages', 'rules-react', 'rules-map.json'),
  },
  {
    title: 'rules-fluent-ui (`@aidevme/a11y-rules-fluent-ui`)',
    note: 'Custom rules for Fluent UI v9 component semantics; runs only when Fluent is detected.',
    file: join(repoRoot, 'packages', 'rules-fluent-ui', 'rules-map.json'),
  },
  {
    title: 'rules-vue (`@aidevme/a11y-rules-vue`)',
    note: 'Wraps eslint-plugin-vuejs-accessibility via vue-eslint-parser.',
    file: join(repoRoot, 'packages', 'rules-vue', 'rules-map.json'),
  },
  {
    title: 'rules-angular (`@aidevme/a11y-rules-angular`)',
    note: 'Wraps @angular-eslint/eslint-plugin-template; scoped to *.component.html only.',
    file: join(repoRoot, 'packages', 'rules-angular', 'rules-map.json'),
  },
  {
    title: 'rules-svelte (`@aidevme/a11y-rules-svelte`)',
    note: 'Captures the Svelte compiler\'s own a11y_* warnings directly, plus eslint-plugin-svelte for checks the compiler does not cover (e.g. no-target-blank).',
    file: join(repoRoot, 'packages', 'rules-svelte', 'rules-map.json'),
  },
  {
    title: 'rules-static-html (`@aidevme/a11y-rules-static-html`)',
    note: 'Custom DOM-tree walker (no build step) checking landmarks, alt text, label pairing, heading order, lang, and skip links.',
    file: join(repoRoot, 'packages', 'rules-static-html', 'rules-map.json'),
  },
];

const NON_INTERFERENCE = new Set(['1.4.2', '2.1.2', '2.2.2', '2.3.1']);

const lines = [];
lines.push('# Rule Reference');
lines.push('');
lines.push('> **Generated file — do not edit by hand.** Regenerate with `npm run docs:rules`.');
lines.push('> Source of truth: each pack\'s `rules-map.json`.');
lines.push('');

let total = 0;
let violation411 = false;

for (const pack of PACKS) {
  const map = JSON.parse(readFileSync(pack.file, 'utf8'));
  const entries = Object.entries(map).sort(([, a], [, b]) => a.ruleId.localeCompare(b.ruleId));
  total += entries.length;
  lines.push(`## ${pack.title}`);
  lines.push('');
  lines.push(pack.note);
  lines.push('');
  lines.push('| Rule | Severity | WCAG SC | Level | Since | Category | Summary |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const [, meta] of entries) {
    if (meta.wcagRef === '4.1.1') violation411 = true;
    const ni = NON_INTERFERENCE.has(meta.wcagRef) ? ' ⚠NI' : '';
    lines.push(
      `| \`${meta.ruleId}\` | ${meta.severity} | ${meta.wcagRef}${ni} | ${meta.wcagLevel} | ${meta.wcagVersion} | ${meta.category} | ${meta.summary.replace(/\|/g, '\\|')} |`,
    );
  }
  lines.push('');
}

lines.push(`_${total} rules total. ⚠NI marks WCAG non-interference criteria (never profile-relaxed, never baseline-eligible)._`);
lines.push('');

if (violation411) {
  console.error('POLICY VIOLATION: a rule maps to SC 4.1.1 (DESIGN §5 forbids this).');
  process.exit(1);
}

writeFileSync(join(repoRoot, 'docs', 'rule-reference.md'), lines.join('\n'), 'utf8');
console.log(`docs/rule-reference.md regenerated (${total} rules).`);
