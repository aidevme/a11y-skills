import { createHash } from 'node:crypto';

export type Severity = 'error' | 'warning' | 'info';
export type WcagLevel = 'A' | 'AA' | 'AAA';
export type WcagVersion = '2.0' | '2.1' | '2.2';
export type Surface = 'web-app' | 'pcf' | 'code-apps' | 'power-pages';
export type Layer = 0 | 1 | 2 | 3;
export type RuleCategory = 'semantic' | 'visual' | 'interaction';

export interface Range {
  startLine: number;
  startCol: number;
  endLine?: number;
  endCol?: number;
}

/** What rule packs emit — core derives the rest (fingerprint, nonInterference, surface). */
export interface RawFinding {
  ruleId: string;
  severity: Severity;
  wcagRef: string;
  wcagLevel: WcagLevel;
  wcagVersion: WcagVersion;
  message: string;
  file: string;
  range?: Range;
  layer: Layer;
  framework?: string;
  /** Rule category (semantic | visual | interaction) — drives mvp-profile relaxation. */
  category?: string;
  /** Normalized source context (trimmed line text or DOM selector) — input to the fingerprint. */
  context?: string;
  /** Page URL for Layer 2 findings (per-page conformance grouping). */
  page?: string;
  /** Viewports a runtime finding was observed at (mobile | tablet | desktop). */
  viewports?: string[];
  fix?: { description: string; diff?: string };
}

export interface Finding extends RawFinding {
  /** The rule's own severity before profile mapping. */
  baseSeverity: Severity;
  nonInterference: boolean;
  surface: Surface;
  fingerprint: string;
  /** True when masked by .a11y-baseline.json — reported but non-failing. */
  baselined?: boolean;
}

/**
 * WCAG 5.2.5 non-interference criteria: violations can make an entire page
 * unusable, so rules mapped to these are never relaxed by any profile and
 * never baseline-eligible.
 */
export const NON_INTERFERENCE_CRITERIA: ReadonlySet<string> = new Set([
  '1.4.2',
  '2.1.2',
  '2.2.2',
  '2.3.1',
]);

/** Line-number-drift-resilient identity: rule + file + normalized context. */
export function fingerprintOf(ruleId: string, file: string, context: string): string {
  return createHash('sha256').update(`${ruleId}|${file}|${context}`).digest('hex').slice(0, 32);
}

export function enrich(raw: RawFinding[], surface: Surface): Finding[] {
  return raw.map((f) => ({
    ...f,
    baseSeverity: f.severity,
    nonInterference: NON_INTERFERENCE_CRITERIA.has(f.wcagRef),
    surface,
    fingerprint: fingerprintOf(f.ruleId, f.file, f.context ?? ''),
  }));
}
