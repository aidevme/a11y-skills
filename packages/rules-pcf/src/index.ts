import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluateRules,
  loadRuleFile,
  type EngineFile,
  type EngineFinding,
  type RuleDefinition,
} from '@aidevme/a11y-rules-engine';
import { PCF_EVALUATORS } from './evaluators.js';

export type { EngineFinding as PackFinding } from '@aidevme/a11y-rules-engine';
export { PCF_EVALUATORS } from './evaluators.js';

export interface RuleMeta {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  wcagRef: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagVersion: '2.0' | '2.1' | '2.2';
  category: string;
  summary: string;
}

export function loadRuleMap(): Record<string, RuleMeta> {
  return JSON.parse(
    readFileSync(new URL('../rules-map.json', import.meta.url), 'utf8'),
  ) as Record<string, RuleMeta>;
}

const RULE_FILES = ['../rules/pcf-manifest.json', '../rules/dataverse-form.json'];

function loadAllRules(): RuleDefinition[] {
  const rules: RuleDefinition[] = [];
  for (const rel of RULE_FILES) {
    const path = fileURLToPath(new URL(rel, import.meta.url));
    rules.push(...loadRuleFile(path, PCF_EVALUATORS));
  }
  return rules;
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Runs the PCF manifest + Dataverse form XML Layer 3 domain rules (DESIGN
 * §5, §2.1: rules-pcf is the first Layer 3 pack) against the given files.
 * Rules are surface-scoped to "pcf" — evaluateRules never fires a rule
 * tagged for a different surface (AC-P5-2).
 */
export async function runRules(files: string[], projectRoot: string): Promise<EngineFinding[]> {
  const rules = loadAllRules();
  const engineFiles: EngineFile[] = files.map((file) => ({
    relPath: toPosix(relative(projectRoot, file)),
    content: readFileSync(file, 'utf8'),
  }));
  return evaluateRules(rules, 'pcf', engineFiles, PCF_EVALUATORS);
}
