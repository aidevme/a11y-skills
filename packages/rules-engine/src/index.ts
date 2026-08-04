import { readFileSync } from 'node:fs';

// Structurally identical to core's RawFinding/Severity/WcagLevel/WcagVersion/Layer
// (kept local to avoid a build cycle: core depends on this package, and so
// does every surface rule pack — a dependency back on core would cycle).
export type Severity = 'error' | 'warning' | 'info';
export type WcagLevel = 'A' | 'AA' | 'AAA';
export type WcagVersion = '2.0' | '2.1' | '2.2';
export type Layer = 0 | 1 | 2 | 3;

export interface EngineFinding {
  ruleId: string;
  severity: Severity;
  wcagRef: string;
  wcagLevel: WcagLevel;
  wcagVersion: WcagVersion;
  message: string;
  file: string;
  range?: { startLine: number; startCol: number; endLine?: number; endCol?: number };
  layer: Layer;
  category?: string;
  context?: string;
}

/**
 * Layer 3 (Rule Engine) config shape (DESIGN §5), with the `surface` key
 * added per §2.1 so the same engine can load rule files from multiple
 * surfaces (PCF, Code Apps, Power Pages) without cross-firing.
 */
export interface RuleCondition {
  type: string;
  [key: string]: unknown;
}

export interface RuleDefinition {
  ruleId: string;
  /** Filename suffix a file must end with for this rule to apply (matched via String.endsWith). */
  target: string;
  severity: Severity;
  wcagRef: string;
  wcagLevel: WcagLevel;
  wcagVersion: WcagVersion;
  /** Which SurfaceAdapter this rule belongs to — the engine only fires rules matching the surface being audited. */
  surface: string;
  category?: string;
  condition: RuleCondition;
  /** May contain `{{placeholder}}` tokens, substituted from the evaluator's match — literally, never re-interpolated. */
  message: string;
}

export interface ConditionMatch {
  /** Values substituted into the rule's `{{placeholder}}` message tokens. */
  placeholders?: Record<string, string>;
  line?: number;
  context?: string;
}

/** A condition type's implementation: given a target file's raw content, return zero or more violations. */
export type ConditionEvaluator = (content: string, condition: RuleCondition) => ConditionMatch[];

export class RuleEngineError extends Error {}

const REQUIRED_FIELDS: (keyof RuleDefinition)[] = [
  'ruleId',
  'target',
  'severity',
  'wcagRef',
  'wcagLevel',
  'wcagVersion',
  'surface',
  'condition',
  'message',
];

/**
 * Substitutes `{{key}}` tokens in `template` with `placeholders[key]`,
 * verbatim. Uses a single-pass replace (not a loop), so a substituted
 * value that itself contains `{{` or `}}` is never re-interpolated —
 * required for safe handling of user-authored manifest/XML content that
 * could otherwise inject spoofed placeholder syntax into a report.
 */
export function substitute(template: string, placeholders: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (full, key: string) =>
    Object.prototype.hasOwnProperty.call(placeholders, key) ? placeholders[key] : full,
  );
}

/**
 * Loads and validates a Layer 3 rule file. Fails loudly (RuleEngineError,
 * intended to surface as CLI exit 2) rather than silently skipping a
 * malformed rule or an unrecognized `condition.type` — a Layer 3 rule
 * that quietly never fires is worse than a startup error naming exactly
 * which rule and file is wrong.
 */
export function loadRuleFile(path: string, evaluators: Record<string, ConditionEvaluator>): RuleDefinition[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new RuleEngineError(`${path}: invalid JSON (${(err as Error).message})`);
  }
  if (!Array.isArray(parsed)) {
    throw new RuleEngineError(`${path}: expected a JSON array of rule definitions`);
  }

  const rules: RuleDefinition[] = [];
  parsed.forEach((entry, index) => {
    const r = entry as Partial<RuleDefinition>;
    const label = r.ruleId ? `"${r.ruleId}"` : `at index ${index}`;
    for (const field of REQUIRED_FIELDS) {
      if (r[field] === undefined) {
        throw new RuleEngineError(`${path}: rule ${label} is missing required field "${field}"`);
      }
    }
    const conditionType = r.condition!.type;
    if (!evaluators[conditionType]) {
      throw new RuleEngineError(`${path}: rule ${label} uses unknown condition type "${conditionType}"`);
    }
    rules.push(r as RuleDefinition);
  });
  return rules;
}

export interface EngineFile {
  /** Path relative to the audited root, posix separators — becomes EngineFinding.file. */
  relPath: string;
  content: string;
}

/**
 * Evaluates a set of already-loaded rules against a set of files for one
 * surface. Rules whose `surface` doesn't match are skipped entirely (never
 * evaluated, so a Power Pages rule loaded during a PCF audit cannot fire —
 * AC-P5-2 / TC-P5.2-03), as are files that don't match a rule's `target`.
 */
export function evaluateRules(
  rules: RuleDefinition[],
  surface: string,
  files: EngineFile[],
  evaluators: Record<string, ConditionEvaluator>,
  layer: Layer = 3,
): EngineFinding[] {
  const findings: EngineFinding[] = [];
  for (const rule of rules) {
    if (rule.surface !== surface) continue;
    const evaluator = evaluators[rule.condition.type];
    if (!evaluator) {
      throw new RuleEngineError(`rule "${rule.ruleId}" uses unregistered condition type "${rule.condition.type}"`);
    }
    for (const file of files) {
      if (!file.relPath.endsWith(rule.target)) continue;
      for (const match of evaluator(file.content, rule.condition)) {
        findings.push({
          ruleId: rule.ruleId,
          severity: rule.severity,
          wcagRef: rule.wcagRef,
          wcagLevel: rule.wcagLevel,
          wcagVersion: rule.wcagVersion,
          message: substitute(rule.message, match.placeholders ?? {}),
          file: file.relPath,
          range: match.line !== undefined ? { startLine: match.line, startCol: 1 } : undefined,
          layer,
          category: rule.category,
          context: match.context,
        });
      }
    }
  }
  return findings;
}
