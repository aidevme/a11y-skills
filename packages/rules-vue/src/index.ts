import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { Linter } from 'eslint';
import vuejsAccessibility from 'eslint-plugin-vuejs-accessibility';
import * as vueParser from 'vue-eslint-parser';

/** Structurally identical to core's RawFinding (kept local to avoid a build cycle). */
export interface PackFinding {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  wcagRef: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagVersion: '2.0' | '2.1' | '2.2';
  message: string;
  file: string;
  range?: { startLine: number; startCol: number; endLine?: number; endCol?: number };
  layer: 0 | 1 | 2 | 3;
  framework?: string;
  category?: string;
  context?: string;
}

export interface RuleMeta {
  ruleId: string;
  severity: PackFinding['severity'];
  wcagRef: string;
  wcagLevel: PackFinding['wcagLevel'];
  wcagVersion: PackFinding['wcagVersion'];
  category: string;
  summary: string;
}

export function loadRuleMap(): Record<string, RuleMeta> {
  return JSON.parse(
    readFileSync(new URL('../rules-map.json', import.meta.url), 'utf8'),
  ) as Record<string, RuleMeta>;
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Runs the mapped subset of eslint-plugin-vuejs-accessibility over the given
 * .vue files via vue-eslint-parser. Same architecture as rules-react: pin
 * the Linter's cwd to projectRoot so the flat-config `files` glob still
 * matches when the audited path is outside process.cwd() (see rules-react
 * for the full explanation — an ESLint 9/10 flat-config behavior, not
 * specific to this pack).
 */
/**
 * label-has-for defaults to requiring BOTH nesting and a for/id match
 * (`{ every: ["nesting", "id"] }`) — stricter than the equivalent React
 * rule, and stricter than common practice, where either association method
 * alone is valid. Relax it to "either is fine", matching jsx-a11y's default.
 */
const RULE_OPTIONS: Record<string, unknown[]> = {
  'label-has-for': [{ required: { some: ['nesting', 'id'] } }],
};

export async function runRules(files: string[], projectRoot: string): Promise<PackFinding[]> {
  const ruleMap = loadRuleMap();
  const linter = new Linter({ cwd: projectRoot });

  const eslintRules: Record<string, unknown[]> = {};
  for (const name of Object.keys(ruleMap)) {
    eslintRules[`vuejs-accessibility/${name}`] = ['error', ...(RULE_OPTIONS[name] ?? [])];
  }

  const config = {
    files: ['**/*.vue'],
    plugins: { 'vuejs-accessibility': vuejsAccessibility as never },
    languageOptions: {
      parser: vueParser as never,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: eslintRules,
  } as never;

  const findings: PackFinding[] = [];
  for (const file of files) {
    const code = readFileSync(file, 'utf8');
    const lines = code.split(/\r?\n/);
    const messages = linter.verify(code, config, file);
    for (const m of messages) {
      if (!m.ruleId) continue; // parse errors: surface elsewhere, not as findings
      const key = m.ruleId.replace(/^vuejs-accessibility\//, '');
      const meta = ruleMap[key];
      if (!meta) continue;
      findings.push({
        ruleId: meta.ruleId,
        severity: meta.severity,
        wcagRef: meta.wcagRef,
        wcagLevel: meta.wcagLevel,
        wcagVersion: meta.wcagVersion,
        message: m.message,
        file: toPosix(relative(projectRoot, file)),
        range: {
          startLine: m.line,
          startCol: m.column,
          endLine: m.endLine,
          endCol: m.endColumn,
        },
        layer: 1,
        framework: 'vue',
        category: meta.category,
        context: lines[m.line - 1]?.trim() ?? '',
      });
    }
  }
  return findings;
}
