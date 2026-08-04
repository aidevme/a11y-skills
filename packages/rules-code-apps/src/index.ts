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
import { CODE_APPS_EVALUATORS } from './evaluators.js';

export type { EngineFinding as PackFinding } from '@aidevme/a11y-rules-engine';
export { CODE_APPS_EVALUATORS } from './evaluators.js';

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

function loadAllRules(): RuleDefinition[] {
  const path = fileURLToPath(new URL('../rules/code-apps.json', import.meta.url));
  return loadRuleFile(path, CODE_APPS_EVALUATORS);
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Runs the Power Apps Code Apps generated CRUD/grid Layer 3 domain rules
 * (DESIGN §2.1) against the given `.tsx`/`.jsx` files. Runs *alongside*
 * Layer 1 (rules-react/rules-fluent-ui), never in place of it — a Code
 * Apps project is React underneath, so both fire on the same files with no
 * overlap (this pack checks patterns jsx-a11y/fluent-a11y don't: aria-sort
 * on clickable headers, labeled numeric pagination buttons, live regions
 * on data-bound screens).
 */
export async function runRules(files: string[], projectRoot: string): Promise<EngineFinding[]> {
  const rules = loadAllRules();
  const engineFiles: EngineFile[] = files.map((file) => ({
    relPath: toPosix(relative(projectRoot, file)),
    content: readFileSync(file, 'utf8'),
  }));
  return evaluateRules(rules, 'code-apps', engineFiles, CODE_APPS_EVALUATORS);
}
