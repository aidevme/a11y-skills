import { scName, understandingUrl, type Finding } from '@aidevme/a11y';

export interface SarifMeta {
  profile: string;
  wcagVersion: string;
  failOn: string;
}

export interface SarifInput {
  findings: Finding[];
  meta: SarifMeta;
}

const LEVEL: Record<string, string> = { error: 'error', warning: 'warning', info: 'note' };

/**
 * Pure transform to SARIF 2.1.0 for GitHub code scanning. Our drift-resilient
 * fingerprint rides in partialFingerprints so alerts track across PRs;
 * baselined findings carry a suppression so they don't page anyone.
 */
export function renderSarif(input: SarifInput): string {
  const { findings } = input;

  const rules = new Map<string, object>();
  for (const f of findings) {
    if (rules.has(f.ruleId)) continue;
    rules.set(f.ruleId, {
      id: f.ruleId,
      shortDescription: { text: `${f.ruleId} (WCAG SC ${f.wcagRef} ${scName(f.wcagRef)})`.trim() },
      helpUri: understandingUrl(f.wcagRef),
      properties: {
        wcagRef: f.wcagRef,
        wcagLevel: f.wcagLevel,
        wcagVersion: f.wcagVersion,
        nonInterference: f.nonInterference,
      },
    });
  }

  const results = findings.map((f) => ({
    ruleId: f.ruleId,
    level: LEVEL[f.severity] ?? 'note',
    message: { text: f.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: f.file },
          ...(f.range
            ? {
                region: {
                  startLine: f.range.startLine,
                  startColumn: f.range.startCol,
                  ...(f.range.endLine ? { endLine: f.range.endLine } : {}),
                  ...(f.range.endCol ? { endColumn: f.range.endCol } : {}),
                },
              }
            : {}),
        },
      },
    ],
    partialFingerprints: { 'a11yFingerprint/v1': f.fingerprint },
    properties: {
      wcagRef: f.wcagRef,
      nonInterference: f.nonInterference,
      baselined: f.baselined === true,
      surface: f.surface,
      layer: f.layer,
    },
    ...(f.baselined
      ? {
          suppressions: [
            { kind: 'external', justification: 'a11y baseline (.a11y-baseline.json)' },
          ],
        }
      : {}),
  }));

  const sarif = {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: '@aidevme/a11y',
            informationUri: 'https://github.com/aidevme/A11Y-skills',
            version: '0.0.1',
            rules: [...rules.values()],
          },
        },
        results,
      },
    ],
  };
  return JSON.stringify(sarif, null, 2);
}
