import { readFileSync } from 'node:fs';
import { basename, relative } from 'node:path';
import { Linter } from 'eslint';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import * as angularTemplateParser from '@angular-eslint/template-parser';

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

/** Angular a11y linting only applies to component templates, per DESIGN §2.2 — not the app shell (index.html) or any other .html file. */
function isComponentTemplate(file: string): boolean {
  return basename(file).endsWith('.component.html');
}

/**
 * Runs @angular-eslint/eslint-plugin-template's a11y rules over `*.component.html`
 * files via @angular-eslint/template-parser. Same Linter({ cwd }) pattern as
 * every other pack — see rules-react for why that matters under ESLint's
 * flat-config file matching.
 */
export async function runRules(files: string[], projectRoot: string): Promise<PackFinding[]> {
  const templateFiles = files.filter(isComponentTemplate);
  if (templateFiles.length === 0) return [];

  const ruleMap = loadRuleMap();
  const linter = new Linter({ cwd: projectRoot });

  const eslintRules: Record<string, 'error'> = {};
  for (const name of Object.keys(ruleMap)) eslintRules[`angular-template/${name}`] = 'error';

  const config = {
    files: ['**/*.html'],
    plugins: { 'angular-template': angularTemplate as never },
    languageOptions: {
      parser: angularTemplateParser as never,
    },
    rules: eslintRules,
  } as never;

  const findings: PackFinding[] = [];
  for (const file of templateFiles) {
    const code = readFileSync(file, 'utf8');
    const lines = code.split(/\r?\n/);
    const messages = linter.verify(code, config, file);
    for (const m of messages) {
      if (!m.ruleId) continue; // parse errors: surface elsewhere, not as findings
      const key = m.ruleId.replace(/^angular-template\//, '');
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
        framework: 'angular',
        category: meta.category,
        context: lines[m.line - 1]?.trim() ?? '',
      });
    }
  }
  return findings;
}
