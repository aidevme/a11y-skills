import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { parseHTML } from 'linkedom';
import { runStaticHtmlChecks } from './checks.js';

export { walkElements } from './walker.js';
export { runStaticHtmlChecks, type RawCheckFinding } from './checks.js';
export { isValidLangTag, ISO_639_1_CODES } from './lang-codes.js';

/** Structurally identical to core's RawFinding (kept local to avoid a build cycle). */
export interface PackFinding {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  wcagRef: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagVersion: '2.0' | '2.1' | '2.2';
  message: string;
  file: string;
  range?: { startLine: number; startCol: number };
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
 * Runs the static-HTML check families over each file (DESIGN §2.2). Pure
 * markup analysis — parses with linkedom, walks the DOM via the shared
 * `walkElements` primitive, no build step or dev server required.
 */
export async function runRules(files: string[], projectRoot: string): Promise<PackFinding[]> {
  const ruleMap = loadRuleMap();
  const findings: PackFinding[] = [];

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const { document } = parseHTML(source);
    const checkFindings = runStaticHtmlChecks(document as unknown as Document, source);
    for (const cf of checkFindings) {
      const meta = ruleMap[cf.ruleKey];
      if (!meta) continue;
      findings.push({
        ruleId: meta.ruleId,
        severity: meta.severity,
        wcagRef: meta.wcagRef,
        wcagLevel: meta.wcagLevel,
        wcagVersion: meta.wcagVersion,
        message: cf.message,
        file: toPosix(relative(projectRoot, file)),
        range: { startLine: cf.line, startCol: 1 },
        layer: 1,
        framework: 'static-html',
        category: meta.category,
        context: cf.context,
      });
    }
  }
  return findings;
}
