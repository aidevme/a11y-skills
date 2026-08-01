#!/usr/bin/env node
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { aggregate } from './aggregate.js';
import {
  applyBaseline,
  loadBaselineEntries,
  pruneBaseline,
  snapshotBaseline,
  writeBaselineEntries,
} from './baseline.js';
import { ConfigError, loadConfig, type A11yConfig } from './config.js';
import { listUiFiles } from './files.js';
import { enrich, type Finding, type RawFinding } from './finding.js';
import { applyProfile } from './profiles.js';
import { BUILTIN_PACKS } from './registry.js';

export class CliError extends Error {}

type Format = 'md' | 'json' | 'sarif' | 'html';
type FailOn = 'error' | 'warning' | 'never';

interface AuditOptions {
  path: string;
  format: Format;
  failOn: FailOn;
  output?: string;
  runtime: boolean;
  urls: string[];
  crawl: boolean;
  compare?: string;
  claim: boolean;
  prune: boolean;
}

const HELP = `Usage: a11y <command> [options]

Commands:
  audit    [path]   Run the accessibility audit (default path: .)
  baseline [path]   Snapshot current findings to .a11y-baseline.json (--prune: only remove fixed entries)
  init     [path]   Generate A11Y.md, .a11yrc.json, and host pointer snippets

Audit options:
  --format md|json|sarif|html   Output format (default: md)
  --fail-on error|warning|never Findings level that causes exit code 1 (default: error)
  --output <file>               Write the report to a file instead of stdout
  --runtime                     Also run the axe-core runtime layer (needs --url or runtime.urls config)
  --url <url>                   Runtime target URL (repeatable)
  --crawl                       Runtime: follow same-origin links one level deep
  --compare <report.html>       HTML format: render trend vs a previous report
  --claim                       HTML/JSON: include a conformance-claim block

Exit codes: 0 = clean or below threshold, 1 = findings at/above threshold, 2 = execution error.
Baselined findings are reported but never fail; non-interference findings always fail.`;

function parseArgs(args: string[]): AuditOptions {
  const opts: AuditOptions = {
    path: '.',
    format: 'md',
    failOn: 'error',
    runtime: false,
    urls: [],
    crawl: false,
    claim: false,
    prune: false,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--format') {
      const v = args[++i];
      if (v !== 'md' && v !== 'json' && v !== 'sarif' && v !== 'html')
        throw new CliError(`invalid --format: ${v ?? '(missing)'}`);
      opts.format = v;
    } else if (arg === '--fail-on') {
      const v = args[++i];
      if (v !== 'error' && v !== 'warning' && v !== 'never')
        throw new CliError(`invalid --fail-on: ${v ?? '(missing)'}`);
      opts.failOn = v;
    } else if (arg === '--output') {
      const v = args[++i];
      if (!v) throw new CliError('missing value for --output');
      opts.output = v;
    } else if (arg === '--url') {
      const v = args[++i];
      if (!v) throw new CliError('missing value for --url');
      opts.urls.push(v);
    } else if (arg === '--compare') {
      const v = args[++i];
      if (!v) throw new CliError('missing value for --compare');
      opts.compare = v;
    } else if (arg === '--runtime') {
      opts.runtime = true;
    } else if (arg === '--crawl') {
      opts.crawl = true;
    } else if (arg === '--claim') {
      opts.claim = true;
    } else if (arg === '--prune') {
      opts.prune = true;
    } else if (arg.startsWith('--')) {
      throw new CliError(`unknown option: ${arg}`);
    } else {
      opts.path = arg;
    }
  }
  return opts;
}

function resolveRoot(path: string): string {
  const root = resolve(path);
  if (!existsSync(root) || !statSync(root).isDirectory())
    throw new CliError(`not a directory: ${root}`);
  return root;
}

/** Shared pipeline: detect → static packs → optional runtime → enrich → profile → aggregate. */
async function collectFindings(
  root: string,
  config: A11yConfig,
  opts: Pick<AuditOptions, 'runtime' | 'urls' | 'crawl'>,
): Promise<{ findings: Finding[]; frameworks: string[] }> {
  const { detectFrameworks } = await import('@aidevme/a11y-framework-detector');
  const detection = detectFrameworks(root);
  const files = listUiFiles(root);

  const raw: RawFinding[] = [];
  for (const pack of BUILTIN_PACKS) {
    if (!pack.frameworks.some((f) => detection.frameworks.includes(f))) continue;
    if (pack.requiresFluent && !detection.fluent) continue;
    const mod = (await import(pack.module)) as {
      runRules: (files: string[], projectRoot: string) => Promise<unknown[]>;
    };
    raw.push(...((await mod.runRules(files, root)) as RawFinding[]));
  }

  if (opts.runtime) {
    const urls = opts.urls.length > 0 ? opts.urls : (config.runtime?.urls ?? []);
    if (urls.length === 0)
      throw new CliError('--runtime needs at least one --url or runtime.urls in .a11yrc.json');
    const { runRuntime } = await import('@aidevme/a11y-runtime-axe');
    raw.push(
      ...((await runRuntime({
        urls,
        viewports: config.runtime?.viewports,
        crawl: opts.crawl,
      })) as RawFinding[]),
    );
  }

  const profiled = applyProfile(enrich(raw, 'web-app'), config);
  const baselined = applyBaseline(profiled, loadBaselineEntries(root));
  return { findings: aggregate(baselined), frameworks: detection.frameworks };
}

function shouldFail(findings: Finding[], failOn: FailOn): boolean {
  const active = findings.filter((f) => !f.baselined);
  if (failOn === 'never') return false;
  if (failOn === 'warning')
    return active.some((f) => f.severity === 'error' || f.severity === 'warning');
  return active.some((f) => f.severity === 'error');
}

function extractPreviousFindings(reportPath: string): unknown[] {
  if (!existsSync(reportPath)) throw new CliError(`--compare file not found: ${reportPath}`);
  const html = readFileSync(reportPath, 'utf8');
  const m = html.match(/<script type="application\/json" id="a11y-data">([\s\S]*?)<\/script>/);
  if (!m) throw new CliError(`--compare file has no embedded a11y-data block: ${reportPath}`);
  return JSON.parse(m[1]) as unknown[];
}

async function audit(opts: AuditOptions): Promise<number> {
  const root = resolveRoot(opts.path);
  const config = loadConfig(root);
  const { findings, frameworks } = await collectFindings(root, config, opts);

  const meta = {
    profile: config.profile,
    wcagVersion: config.wcagVersion,
    failOn: opts.failOn,
    generatedAt: new Date().toISOString(),
    processes: config.processes,
    claim: opts.claim
      ? {
          date: new Date().toISOString().slice(0, 10),
          wcagVersion: config.wcagVersion,
          level: config.profile === 'strict' ? 'AAA' : config.profile === 'mvp' ? 'A' : 'AA',
          pages: [...new Set(findings.map((f) => f.page).filter(Boolean))] as string[],
          technologies: frameworks,
        }
      : undefined,
  };

  let out: string;
  if (opts.format === 'json') {
    out = JSON.stringify(opts.claim ? { claim: meta.claim, findings } : findings, null, 2);
  } else if (opts.format === 'sarif') {
    const { renderSarif } = await import('@aidevme/a11y-reporter-sarif');
    out = renderSarif({ findings, meta });
  } else if (opts.format === 'html') {
    const { renderHtml } = await import('@aidevme/a11y-reporter-html');
    const previousFindings = opts.compare ? extractPreviousFindings(opts.compare) : undefined;
    out = renderHtml({ findings, meta, previousFindings });
  } else {
    const { renderMarkdown } = await import('@aidevme/a11y-reporter-markdown');
    out = renderMarkdown({ findings, meta });
  }
  if (opts.output) writeFileSync(opts.output, out, 'utf8');
  else console.log(out);

  return shouldFail(findings, opts.failOn) ? 1 : 0;
}

async function baseline(opts: AuditOptions): Promise<number> {
  const root = resolveRoot(opts.path);
  const config = loadConfig(root);
  const { findings } = await collectFindings(root, config, opts);
  const existing = loadBaselineEntries(root);

  if (opts.prune) {
    if (!existing) throw new CliError('nothing to prune: no .a11y-baseline.json found');
    const { entries, pruned } = pruneBaseline(existing, findings);
    writeBaselineEntries(root, entries);
    console.log(`baseline pruned: ${pruned} fixed entr${pruned === 1 ? 'y' : 'ies'} removed, ${entries.length} remain`);
    return 0;
  }

  const { entries, refusedNonInterference } = snapshotBaseline(findings);
  writeBaselineEntries(root, entries);
  console.log(`baseline written: ${entries.length} finding(s) recorded`);
  if (refusedNonInterference > 0) {
    console.error(
      `warning: ${refusedNonInterference} non-interference finding(s) (SC 1.4.2/2.1.2/2.2.2/2.3.1) were NOT baselined — they must be fixed and will keep failing the audit`,
    );
  }
  return 0;
}

async function init(args: string[]): Promise<number> {
  const root = resolveRoot(args[0] ?? '.');
  const { detectFrameworks } = await import('@aidevme/a11y-framework-detector');
  const { runInit } = await import('@aidevme/a11y-context-gen');
  const result = await runInit(root, detectFrameworks(root));
  for (const f of result.created) console.log(`created   ${f}`);
  for (const f of result.updated) console.log(`updated   ${f}`);
  for (const f of result.unchanged) console.log(`unchanged ${f}`);
  return 0;
}

export async function main(argv: string[]): Promise<number> {
  const [cmd, ...rest] = argv;
  try {
    if (cmd === 'audit') return await audit(parseArgs(rest));
    if (cmd === 'baseline') return await baseline(parseArgs(rest));
    if (cmd === 'init') return await init(rest);
    if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
      console.log(HELP);
      return 0;
    }
    throw new CliError(`unknown command: ${cmd}\n${HELP}`);
  } catch (err) {
    if (err instanceof CliError || err instanceof ConfigError) {
      console.error(`a11y: ${err.message}`);
    } else {
      console.error(`a11y: unexpected error: ${(err as Error).message}`);
    }
    return 2;
  }
}

if (process.argv[1] && /cli\.(js|mjs)$/.test(process.argv[1].replace(/\\/g, '/'))) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
