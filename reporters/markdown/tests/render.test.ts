import { describe, expect, it } from 'vitest';
import { renderMarkdown, type ReporterFinding } from '../src/index.js';

const meta = { profile: 'standard', wcagVersion: '2.2', failOn: 'error' };

const sample: ReporterFinding[] = [
  {
    ruleId: 'react-alt-text',
    severity: 'error',
    wcagRef: '1.1.1',
    message: 'img elements must have an alt prop',
    file: 'src/App.tsx',
    range: { startLine: 4, startCol: 7 },
  },
  {
    ruleId: 'react-no-distracting-elements',
    severity: 'error',
    wcagRef: '2.2.2',
    message: 'Do not use <marquee> elements',
    file: 'src/App.tsx',
    range: { startLine: 10, startCol: 7 },
    nonInterference: true,
  },
  {
    ruleId: 'react-tabindex-no-positive',
    severity: 'warning',
    wcagRef: '2.4.3',
    message: 'Avoid positive integer values for tabIndex',
    file: 'src/App.tsx',
    range: { startLine: 7, startCol: 7 },
  },
  {
    ruleId: 'fluent-spinner-label',
    severity: 'warning',
    wcagRef: '4.1.2',
    message: 'Fluent <Spinner> has no label',
    file: 'src/Widget.tsx',
    range: { startLine: 3, startCol: 5 },
  },
  {
    ruleId: 'demo-info',
    severity: 'info',
    wcagRef: '1.3.1',
    message: 'informational note',
    file: 'src/App.tsx',
  },
];

describe('markdown reporter', () => {
  it('TC-P1.5-01: golden snapshot for mixed severities', () => {
    expect(renderMarkdown({ findings: sample, meta })).toMatchSnapshot();
  });

  it('TC-P1.5-02: zero findings renders an explicit pass, not an empty string', () => {
    const out = renderMarkdown({ findings: [], meta });
    expect(out).toContain('No findings');
    expect(out).toContain('✅');
  });

  it('TC-P1.5-03: markdown-hostile characters are escaped', () => {
    const out = renderMarkdown({
      findings: [
        {
          ruleId: 'x',
          severity: 'error',
          wcagRef: '1.1.1',
          message: 'pipe | angle <script> tick `code`',
          file: 'a.tsx',
          range: { startLine: 1, startCol: 1 },
        },
      ],
      meta,
    });
    expect(out).toContain('pipe \\| angle &lt;script> tick \\`code\\`');
  });

  it('TC-P1.5-04: pure transform — identical output for identical input', () => {
    expect(renderMarkdown({ findings: sample, meta })).toBe(
      renderMarkdown({ findings: sample, meta }),
    );
  });

  it('TC-P1.5-05: WCAG link points at the correct Understanding page', () => {
    const out = renderMarkdown({ findings: sample, meta });
    expect(out).toContain('https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html');
    expect(out).toContain('https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html');
  });

  it('verdict follows failOn: warnings only + fail-on error = pass', () => {
    const warnOnly = sample.filter((f) => f.severity === 'warning');
    expect(renderMarkdown({ findings: warnOnly, meta })).toContain('✅ Pass');
    expect(
      renderMarkdown({ findings: warnOnly, meta: { ...meta, failOn: 'warning' } }),
    ).toContain('❌ Fail');
  });

  it('flags non-interference findings', () => {
    expect(renderMarkdown({ findings: sample, meta })).toContain('non-interference');
  });
});
