import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { Linter } from 'eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import * as svelteParser from 'svelte-eslint-parser';
import { compile } from 'svelte/compiler';

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

/** Fallback metadata for any compiler a11y_* code not yet in our table (e.g. a future Svelte version adds one) — never silently drop a real compiler warning. */
const FALLBACK_META: Omit<RuleMeta, 'ruleId' | 'summary'> = {
  severity: 'warning',
  wcagRef: '4.1.2',
  wcagLevel: 'A',
  wcagVersion: '2.0',
  category: 'semantic',
};

export function loadRuleMap(): Record<string, RuleMeta> {
  return JSON.parse(
    readFileSync(new URL('../rules-map.json', import.meta.url), 'utf8'),
  ) as Record<string, RuleMeta>;
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

interface CompilerWarning {
  code: string;
  message: string;
  start?: { line: number; column: number };
  end?: { line: number; column: number };
}

/**
 * Captures the Svelte compiler's own `a11y_*` warnings directly, rather
 * than re-implementing them as ESLint rules (DESIGN §2.2 note) — the
 * compiler is the authoritative source for these checks.
 */
function compilerA11yFindings(
  code: string,
  file: string,
  projectRoot: string,
  ruleMap: Record<string, RuleMeta>,
): PackFinding[] {
  const lines = code.split(/\r?\n/);
  let warnings: CompilerWarning[];
  try {
    warnings = compile(code, { generate: false, filename: file }).warnings as CompilerWarning[];
  } catch {
    return []; // unparsable source: surfaced elsewhere, not as an a11y finding
  }

  const findings: PackFinding[] = [];
  for (const w of warnings) {
    if (!w.code.startsWith('a11y_')) continue;
    const meta = ruleMap[w.code] ?? {
      ...FALLBACK_META,
      ruleId: `svelte-${w.code.replace(/_/g, '-')}`,
      summary: w.message.split('\n')[0],
    };
    const line = w.start?.line ?? 1;
    findings.push({
      ruleId: meta.ruleId,
      severity: meta.severity,
      wcagRef: meta.wcagRef,
      wcagLevel: meta.wcagLevel,
      wcagVersion: meta.wcagVersion,
      message: w.message.split('\n')[0],
      file: toPosix(relative(projectRoot, file)),
      range: { startLine: line, startCol: (w.start?.column ?? 0) + 1 },
      layer: 1,
      framework: 'svelte',
      category: meta.category,
      context: lines[line - 1]?.trim() ?? '',
    });
  }
  return findings;
}

/** The one legitimate eslint-plugin-svelte-only check we surface (not sourced from the compiler). */
function pluginFindings(
  files: string[],
  projectRoot: string,
  ruleMap: Record<string, RuleMeta>,
): PackFinding[] {
  const meta = ruleMap['no-target-blank'];
  if (!meta) return [];
  const linter = new Linter({ cwd: projectRoot });
  const config = {
    files: ['**/*.svelte'],
    plugins: { svelte: sveltePlugin as never },
    languageOptions: { parser: svelteParser as never },
    rules: { 'svelte/no-target-blank': 'error' },
  } as never;

  const findings: PackFinding[] = [];
  for (const file of files) {
    const code = readFileSync(file, 'utf8');
    const lines = code.split(/\r?\n/);
    const messages = linter.verify(code, config, file);
    for (const m of messages) {
      if (m.ruleId !== 'svelte/no-target-blank') continue;
      findings.push({
        ruleId: meta.ruleId,
        severity: meta.severity,
        wcagRef: meta.wcagRef,
        wcagLevel: meta.wcagLevel,
        wcagVersion: meta.wcagVersion,
        message: m.message,
        file: toPosix(relative(projectRoot, file)),
        range: { startLine: m.line, startCol: m.column, endLine: m.endLine, endCol: m.endColumn },
        layer: 1,
        framework: 'svelte',
        category: meta.category,
        context: lines[m.line - 1]?.trim() ?? '',
      });
    }
  }
  return findings;
}

export async function runRules(files: string[], projectRoot: string): Promise<PackFinding[]> {
  const ruleMap = loadRuleMap();
  const findings: PackFinding[] = [];
  for (const file of files) {
    const code = readFileSync(file, 'utf8');
    findings.push(...compilerA11yFindings(code, file, projectRoot, ruleMap));
  }
  findings.push(...pluginFindings(files, projectRoot, ruleMap));
  return findings;
}
