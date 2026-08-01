import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { Linter } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { rules } from './rules.js';

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

/** Runs the Fluent UI v9 semantics rules over the given files. */
export async function runRules(files: string[], projectRoot: string): Promise<PackFinding[]> {
  const ruleMap = loadRuleMap();
  // See rules-react/src/index.ts: pin cwd to projectRoot so the flat-config
  // `files` glob still matches when the audited path is outside process.cwd().
  const linter = new Linter({ cwd: projectRoot });

  const eslintRules: Record<string, 'error'> = {};
  for (const name of Object.keys(ruleMap)) eslintRules[`fluent-a11y/${name}`] = 'error';

  const config = {
    files: ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js'],
    plugins: { 'fluent-a11y': { rules } as never },
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
      if (!m.ruleId) continue;
      const key = m.ruleId.replace(/^fluent-a11y\//, '');
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
