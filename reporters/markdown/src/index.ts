/**
 * Markdown reporter — a pure transform from findings to a report string.
 * No independent logic (DESIGN §6): grouping severity → WCAG SC → file.
 */

export interface ReporterFinding {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  wcagRef: string;
  message: string;
  file: string;
  range?: { startLine: number; startCol: number };
  nonInterference?: boolean;
}

export interface ReportMeta {
  profile: string;
  wcagVersion: string;
  failOn: string;
}

export interface MarkdownInput {
  findings: ReporterFinding[];
  meta: ReportMeta;
}

const SC_INFO: Record<string, { name: string; slug: string }> = {
  '1.1.1': { name: 'Non-text Content', slug: 'non-text-content' },
  '1.2.2': { name: 'Captions (Prerecorded)', slug: 'captions-prerecorded' },
  '1.3.1': { name: 'Info and Relationships', slug: 'info-and-relationships' },
  '1.3.4': { name: 'Orientation', slug: 'orientation' },
  '1.3.5': { name: 'Identify Input Purpose', slug: 'identify-input-purpose' },
  '1.4.2': { name: 'Audio Control', slug: 'audio-control' },
  '1.4.10': { name: 'Reflow', slug: 'reflow' },
  '1.4.12': { name: 'Text Spacing', slug: 'text-spacing' },
  '2.1.1': { name: 'Keyboard', slug: 'keyboard' },
  '2.1.2': { name: 'No Keyboard Trap', slug: 'no-keyboard-trap' },
  '2.2.2': { name: 'Pause, Stop, Hide', slug: 'pause-stop-hide' },
  '2.3.1': { name: 'Three Flashes or Below Threshold', slug: 'three-flashes-or-below-threshold' },
  '2.4.1': { name: 'Bypass Blocks', slug: 'bypass-blocks' },
  '2.4.3': { name: 'Focus Order', slug: 'focus-order' },
  '2.4.4': { name: 'Link Purpose (In Context)', slug: 'link-purpose-in-context' },
  '2.4.6': { name: 'Headings and Labels', slug: 'headings-and-labels' },
  '3.1.1': { name: 'Language of Page', slug: 'language-of-page' },
  '3.3.1': { name: 'Error Identification', slug: 'error-identification' },
  '3.3.2': { name: 'Labels or Instructions', slug: 'labels-or-instructions' },
  '4.1.2': { name: 'Name, Role, Value', slug: 'name-role-value' },
};

const SEVERITY_ORDER = ['error', 'warning', 'info'] as const;
const SEVERITY_TITLE = { error: 'Errors', warning: 'Warnings', info: 'Info' } as const;

function escapeMd(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/`/g, '\\`');
}

function scHeading(ref: string): string {
  const info = SC_INFO[ref];
  if (!info) return `SC ${ref}`;
  const url = `https://www.w3.org/WAI/WCAG22/Understanding/${info.slug}.html`;
  return `SC ${ref} ${info.name} ([Understanding](${url}))`;
}

export function renderMarkdown(input: MarkdownInput): string {
  const { findings, meta } = input;
  const counts = { error: 0, warning: 0, info: 0 };
  for (const f of findings) counts[f.severity]++;

  const failed =
    meta.failOn === 'error'
      ? counts.error > 0
      : meta.failOn === 'warning'
        ? counts.error + counts.warning > 0
        : false;

  const lines: string[] = [];
  lines.push('# Accessibility Audit Report');
  lines.push('');
  lines.push(
    `**Profile:** ${meta.profile} · **WCAG:** ${meta.wcagVersion} · **Fail on:** ${meta.failOn}`,
  );
  if (findings.length === 0) {
    lines.push('');
    lines.push('**Verdict:** ✅ No findings — pass.');
    lines.push('');
    return lines.join('\n');
  }
  lines.push('');
  lines.push(
    `**Verdict:** ${failed ? '❌ Fail' : '✅ Pass'} — ${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info.`,
  );

  const nonInterference = findings.filter((f) => f.nonInterference);
  if (nonInterference.length > 0) {
    lines.push('');
    lines.push(
      `> ⚠ ${nonInterference.length} finding(s) violate WCAG non-interference criteria (5.2.5) — these can make an entire page unusable and are never profile-relaxed or baseline-eligible.`,
    );
  }

  for (const severity of SEVERITY_ORDER) {
    const group = findings.filter((f) => f.severity === severity);
    if (group.length === 0) continue;
    lines.push('');
    lines.push(`## ${SEVERITY_TITLE[severity]} (${group.length})`);
    const byRef = new Map<string, ReporterFinding[]>();
    for (const f of group) {
      const list = byRef.get(f.wcagRef) ?? [];
      list.push(f);
      byRef.set(f.wcagRef, list);
    }
    for (const [ref, refFindings] of byRef) {
      lines.push('');
      lines.push(`### ${scHeading(ref)}`);
      lines.push('');
      for (const f of refFindings) {
        const loc = f.range ? `${f.file}:${f.range.startLine}` : f.file;
        lines.push(`- \`${loc}\` — ${escapeMd(f.message)} (\`${f.ruleId}\`)`);
      }
    }
  }
  lines.push('');
  return lines.join('\n');
}
