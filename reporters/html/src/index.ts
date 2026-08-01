import { scName, understandingUrl, type Finding } from '@aidevme/a11y';

export interface HtmlMeta {
  profile: string;
  wcagVersion: string;
  failOn: string;
  generatedAt: string;
  processes?: Record<string, string[]>;
  claim?: {
    date: string;
    wcagVersion: string;
    level: string;
    pages: string[];
    technologies: string[];
  };
}

export interface HtmlInput {
  findings: Finding[];
  meta: HtmlMeta;
  /** Findings embedded in a previous report (for --compare trend). */
  previousFindings?: { fingerprint?: string; ruleId?: string }[];
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** JSON payload safe to embed in a <script> block: no "<" survives. */
function embedJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

const CSS = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; margin: 0; color: #1a1a1a; background: #ffffff; line-height: 1.5; }
header, main { max-width: 1100px; margin: 0 auto; padding: 1rem 1.5rem; }
header { border-bottom: 2px solid #d0d0d0; }
h1 { font-size: 1.5rem; margin: 0.5rem 0; }
h2 { font-size: 1.2rem; margin-top: 2rem; }
table { border-collapse: collapse; width: 100%; margin-top: 0.75rem; }
caption { text-align: left; font-weight: 600; padding: 0.25rem 0; }
th, td { border: 1px solid #c8c8c8; padding: 0.4rem 0.6rem; text-align: left; vertical-align: top; font-size: 0.9rem; }
th button { background: none; border: none; font: inherit; font-weight: 700; cursor: pointer; padding: 0; }
th button:focus-visible, a:focus-visible, select:focus-visible, input:focus-visible { outline: 3px solid #0b5394; outline-offset: 2px; }
.badge { display: inline-block; padding: 0 0.4rem; border-radius: 3px; font-size: 0.8rem; font-weight: 700; }
.sev-error { background: #fbe4e4; color: #7a0c0c; }
.sev-warning { background: #fdf3d7; color: #6a4b00; }
.sev-info { background: #e2ecf7; color: #0b3a66; }
.baselined-row { background: #f4f4f4; }
.baselined-tag { font-size: 0.75rem; color: #444444; font-style: italic; }
.ni { font-weight: 700; color: #7a0c0c; }
.controls { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0; align-items: end; }
.controls div { display: flex; flex-direction: column; }
code { background: #f0f0f0; padding: 0 0.25rem; font-size: 0.85em; }
.verdict-pass { color: #1d5e2b; font-weight: 700; }
.verdict-fail { color: #7a0c0c; font-weight: 700; }
.summary-grid { display: flex; gap: 2rem; flex-wrap: wrap; }
a { color: #0b5394; }
`;

const JS = `
(function () {
  var sev = document.getElementById('filter-severity');
  var q = document.getElementById('filter-text');
  var status = document.getElementById('filter-status');
  function apply() {
    var rows = document.querySelectorAll('tbody tr[data-severity]');
    var shown = 0;
    rows.forEach(function (r) {
      var okSev = sev.value === 'all' || r.getAttribute('data-severity') === sev.value;
      var okText = !q.value || r.textContent.toLowerCase().indexOf(q.value.toLowerCase()) !== -1;
      var show = okSev && okText;
      r.hidden = !show;
      if (show) shown++;
    });
    status.textContent = shown + ' of ' + rows.length + ' findings shown';
  }
  if (sev && q) { sev.addEventListener('change', apply); q.addEventListener('input', apply); apply(); }
  document.querySelectorAll('th button[data-col]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var th = btn.closest('th');
      var table = btn.closest('table');
      var tbody = table.querySelector('tbody');
      var idx = Number(btn.getAttribute('data-col'));
      var asc = th.getAttribute('aria-sort') !== 'ascending';
      Array.from(tbody.querySelectorAll('tr'))
        .sort(function (a, b) {
          var x = a.cells[idx].textContent.trim();
          var y = b.cells[idx].textContent.trim();
          return asc ? x.localeCompare(y, undefined, { numeric: true }) : y.localeCompare(x, undefined, { numeric: true });
        })
        .forEach(function (r) { tbody.appendChild(r); });
      table.querySelectorAll('th').forEach(function (h) { h.removeAttribute('aria-sort'); });
      th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
    });
  });
})();
`;

function findingRow(f: Finding): string {
  const loc = f.range ? `${f.file}:${f.range.startLine}` : f.file;
  const url = understandingUrl(f.wcagRef);
  const wcag = url
    ? `<a href="${esc(url)}">SC ${esc(f.wcagRef)}</a>${f.nonInterference ? ' <span class="ni">NI</span>' : ''}`
    : `SC ${esc(f.wcagRef)}`;
  const badge = `<span class="badge sev-${esc(f.severity)}">${esc(f.severity)}</span>${
    f.baselined ? ' <span class="baselined-tag">baselined</span>' : ''
  }`;
  const viewports = f.viewports?.length ? `<br><small>viewports: ${esc(f.viewports.join(', '))}</small>` : '';
  const context = f.context ? `<br><code>${esc(f.context)}</code>` : '';
  return `<tr data-severity="${esc(f.severity)}"${f.baselined ? ' class="baselined-row"' : ''}>
<td>${badge}</td><td><code>${esc(f.ruleId)}</code></td><td>${wcag}</td><td><code>${esc(loc)}</code></td><td>${esc(f.message)}${context}${viewports}</td></tr>`;
}

function findingsTable(findings: Finding[], captionText: string): string {
  const headers = ['Severity', 'Rule', 'WCAG', 'Location', 'Message'];
  const head = headers
    .map((h, i) => `<th scope="col"><button type="button" data-col="${i}">${h}</button></th>`)
    .join('');
  return `<table><caption>${esc(captionText)}</caption><thead><tr>${head}</tr></thead><tbody>
${findings.map(findingRow).join('\n')}
</tbody></table>`;
}

export function renderHtml(input: HtmlInput): string {
  const { findings, meta, previousFindings } = input;
  const active = findings.filter((f) => !f.baselined);
  const baselinedCount = findings.length - active.length;
  const counts = { error: 0, warning: 0, info: 0 };
  for (const f of active) counts[f.severity]++;
  const failed =
    meta.failOn === 'error'
      ? counts.error > 0
      : meta.failOn === 'warning'
        ? counts.error + counts.warning > 0
        : false;

  const bySc = new Map<string, number>();
  for (const f of findings) bySc.set(f.wcagRef, (bySc.get(f.wcagRef) ?? 0) + 1);
  const scRows = [...bySc.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(
      ([ref, n]) =>
        `<tr><td>SC ${esc(ref)} ${esc(scName(ref))}</td><td>${n}</td></tr>`,
    )
    .join('');

  // Trend vs previous report
  let trend = '';
  if (previousFindings) {
    const prev = new Set(previousFindings.map((p) => p.fingerprint).filter(Boolean) as string[]);
    const cur = new Set(findings.map((f) => f.fingerprint));
    const added = [...cur].filter((fp) => !prev.has(fp)).length;
    const fixed = [...prev].filter((fp) => !cur.has(fp)).length;
    const persistent = [...cur].filter((fp) => prev.has(fp)).length;
    trend = `<section aria-labelledby="trend-h"><h2 id="trend-h">Trend vs previous report</h2>
<ul><li>New findings: <strong>${added}</strong></li><li>Fixed since last report: <strong>${fixed}</strong></li><li>Persistent: <strong>${persistent}</strong></li></ul></section>`;
  }

  // Conformance claim (WCAG 5.3.2)
  let claim = '';
  if (meta.claim) {
    const c = meta.claim;
    claim = `<section aria-labelledby="claim-h"><h2 id="claim-h">Conformance claim</h2>
<dl><dt>Date</dt><dd>${esc(c.date)}</dd>
<dt>Target</dt><dd>WCAG ${esc(c.wcagVersion)} Level ${esc(c.level)}</dd>
<dt>Pages in scope</dt><dd>${c.pages.length ? esc(c.pages.join(', ')) : 'static analysis of source files'}</dd>
<dt>Technologies relied upon</dt><dd>${c.technologies.length ? esc(c.technologies.join(', ')) : 'n/a'}</dd></dl></section>`;
  }

  // Process grouping (WCAG 5.2.3): a flow fails if any member page has an active error.
  let processes = '';
  if (meta.processes && Object.keys(meta.processes).length > 0) {
    const rows = Object.entries(meta.processes)
      .map(([flow, pages]) => {
        const flowFails = active.some(
          (f) => f.severity === 'error' && f.page && pages.includes(f.page),
        );
        return `<tr><td>${esc(flow)}</td><td>${esc(pages.join(', '))}</td><td>${
          flowFails
            ? '<span class="verdict-fail">fail</span> (a page in this process fails, so the whole process fails — WCAG 5.2.3)'
            : '<span class="verdict-pass">pass</span>'
        }</td></tr>`;
      })
      .join('');
    processes = `<section aria-labelledby="proc-h"><h2 id="proc-h">Processes</h2>
<table><caption>Complete processes (WCAG 5.2.3)</caption><thead><tr><th scope="col">Process</th><th scope="col">Pages</th><th scope="col">Verdict</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  }

  // Findings grouped per page when runtime pages exist (WCAG 5.2.2)
  const pages = [...new Set(findings.map((f) => f.page).filter(Boolean))] as string[];
  let findingsSection: string;
  if (findings.length === 0) {
    findingsSection = '<p><strong class="verdict-pass">No findings.</strong></p>';
  } else if (pages.length > 0) {
    const staticFindings = findings.filter((f) => !f.page);
    findingsSection = pages
      .map((p) => findingsTable(findings.filter((f) => f.page === p), `Page: ${p}`))
      .join('\n');
    if (staticFindings.length > 0)
      findingsSection += `\n${findingsTable(staticFindings, 'Static analysis (source files)')}`;
  } else {
    findingsSection = findingsTable(findings, 'All findings');
  }

  const controls =
    findings.length === 0
      ? ''
      : `<div class="controls">
<div><label for="filter-severity">Filter by severity</label>
<select id="filter-severity"><option value="all">All</option><option value="error">Error</option><option value="warning">Warning</option><option value="info">Info</option></select></div>
<div><label for="filter-text">Search findings</label><input type="search" id="filter-text"></div>
</div><p id="filter-status" role="status"></p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accessibility Audit Report</title>
<style>${CSS}</style>
</head>
<body>
<header>
<h1>Accessibility Audit Report</h1>
<p>Profile: <strong>${esc(meta.profile)}</strong> · WCAG ${esc(meta.wcagVersion)} · fail on: ${esc(meta.failOn)} · generated ${esc(meta.generatedAt)}</p>
<p>Verdict: <span class="${failed ? 'verdict-fail' : 'verdict-pass'}">${failed ? 'Fail' : 'Pass'}</span> —
${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info${
    baselinedCount > 0 ? `; plus ${baselinedCount} baselined finding(s) reported non-failing` : ''
  }.</p>
</header>
<main>
<section aria-labelledby="summary-h"><h2 id="summary-h">Summary</h2>
<div class="summary-grid">
<table><caption>By severity (new findings)</caption><thead><tr><th scope="col">Severity</th><th scope="col">Count</th></tr></thead>
<tbody><tr><td>error</td><td>${counts.error}</td></tr><tr><td>warning</td><td>${counts.warning}</td></tr><tr><td>info</td><td>${counts.info}</td></tr><tr><td>baselined</td><td>${baselinedCount}</td></tr></tbody></table>
<table><caption>By WCAG success criterion (all findings)</caption><thead><tr><th scope="col">Criterion</th><th scope="col">Count</th></tr></thead><tbody>${scRows || '<tr><td>—</td><td>0</td></tr>'}</tbody></table>
</div></section>
${trend}
${claim}
${processes}
<section aria-labelledby="findings-h"><h2 id="findings-h">Findings</h2>
${controls}
${findingsSection}
</section>
</main>
<script type="application/json" id="a11y-data">${embedJson(findings)}</script>
<script>${JS}</script>
</body>
</html>`;
}
