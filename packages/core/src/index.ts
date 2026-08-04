/**
 * @aidevme/a11y — core engine: finding schema, aggregator, config, CLI.
 */
export {
  NON_INTERFERENCE_CRITERIA,
  enrich,
  fingerprintOf,
  type Finding,
  type RawFinding,
  type Range,
  type Severity,
  type Surface,
  type Layer,
  type RuleCategory,
  type WcagLevel,
  type WcagVersion,
} from './finding.js';
export { aggregate } from './aggregate.js';
export { applyProfile } from './profiles.js';
export {
  BASELINE_FILE,
  applyBaseline,
  loadBaselineEntries,
  pruneBaseline,
  snapshotBaseline,
  writeBaselineEntries,
  type BaselineEntry,
} from './baseline.js';
export { SC_INFO, scName, understandingUrl } from './wcag.js';
export { loadConfig, ConfigError, type A11yConfig } from './config.js';
export { listUiFiles } from './files.js';
export { BUILTIN_PACKS, SURFACE_RULE_PACKS, type RulePackDescriptor, type SurfaceRulePackDescriptor } from './registry.js';
export type { FrameworkAdapter, SurfaceAdapter } from './adapters.js';
export {
  evaluateRules,
  loadRuleFile,
  substitute,
  RuleEngineError,
  type ConditionEvaluator,
  type ConditionMatch,
  type EngineFile,
  type RuleCondition,
  type RuleDefinition,
} from '@aidevme/a11y-rules-engine';
export { main as runCli, CliError } from './cli.js';

export const A11Y_CORE_VERSION = '0.0.1';
