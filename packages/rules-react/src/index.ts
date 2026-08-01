import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { Linter } from 'eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import * as tsParser from '@typescript-eslint/parser';

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
 * Runs the mapped subset of eslint-plugin-jsx-a11y over the given files and
 * translates ESLint messages into pack findings. Only rules present in
 * rules-map.json are enabled, so fixture expectations stay exact.
 * SC 4.1.1 policy (DESIGN §5) is enforced structurally: no mapping entry may
 * carry wcagRef 4.1.1 (asserted by the test suite).
 */
export async function runRules(files: string[], projectRoot: string): Promise<PackFinding[]> {
  const ruleMap = loadRuleMap();
  // ESLint's flat-config `files` glob is matched against the path relative to
  // the Linter's cwd; without pinning cwd to projectRoot, files outside
  // process.cwd() (e.g. audited via an absolute path elsewhere, or in tests
  // that copy fixtures to a tmp dir) silently fail to match any config and
  // produce zero findings.
  const linter = new Linter({ cwd: projectRoot });

  const eslintRules: Record<string, 'error'> = {};
  for (const name of Object.keys(ruleMap)) eslintRules[`jsx-a11y/${name}`] = 'error';

  const config = {
    files: ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js'],
    plugins: { 'jsx-a11y': jsxA11y as never },
    languageOptions: {
      parser: tsParser as never,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
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
      const key = m.ruleId.replace(/^jsx-a11y\//, '');
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
        framework: 'react',
        category: meta.category,
        context: lines[m.line - 1]?.trim() ?? '',
      });
    }
  }
  return findings;
}
