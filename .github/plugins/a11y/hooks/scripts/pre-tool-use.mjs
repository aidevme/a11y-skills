#!/usr/bin/env node
/**
 * PreToolUse hook (DESIGN.md §2.3d). Runs the Layer 1 pass on the pending
 * content of a Write/Edit targeting a UI file, before it lands on disk.
 * No-ops unless .a11yrc.json has hooksEnabled: true (see a11y-init --with-hooks).
 *
 * Perf note: this shells out to `npx @aidevme/a11y`, since a plugin install
 * only ships .github/plugins/a11y/ — there is no sibling packages/ tree to
 * import directly. On a cold npx cache this can exceed the "low single-digit
 * seconds" budget from the design; the timeout below is set generously
 * rather than risk false hard-failures. See docs/safety-and-guardrails.md.
 */
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { execSync } from 'node:child_process';

const LINTABLE_EXTENSIONS = ['.tsx', '.jsx', '.vue', '.svelte', '.html'];
// Recognized as UI surfaces but no rule pack ships for them yet (PCF lands in
// Phase 5, Liquid templates aren't in scope) — classify, but don't block.
const RECOGNIZED_UNLINTABLE_SUFFIXES = ['.liquid', 'ControlManifest.Input.xml'];

const BOM = String.fromCharCode(0xfeff);

function readStdin() {
  const chunks = [];
  process.stdin.setEncoding('utf8');
  return new Promise((resolve) => {
    process.stdin.on('data', (c) => chunks.push(c));
    process.stdin.on('end', () => {
      const text = chunks.join('');
      resolve(text.startsWith(BOM) ? text.slice(1) : text);
    });
    process.stdin.on('error', () => resolve(''));
  });
}

function allow() {
  process.stdout.write('{}');
  process.exit(0);
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
      systemMessage: reason,
    }),
  );
  process.exit(0);
}

function classify(filePath) {
  if (RECOGNIZED_UNLINTABLE_SUFFIXES.some((s) => filePath.endsWith(s))) return 'unlintable';
  if (LINTABLE_EXTENSIONS.includes(extname(filePath))) return 'lintable';
  return 'irrelevant';
}

/** Reconstructs the file's content as it would read after the pending edit lands. */
function resolvePendingContent(toolName, toolInput, filePath) {
  if (toolName === 'Write') {
    return typeof toolInput.content === 'string' ? toolInput.content : null;
  }
  if (!existsSync(filePath)) return null;
  const current = readFileSync(filePath, 'utf8');
  const oldStr = toolInput.old_string;
  const newStr = toolInput.new_string;
  if (typeof oldStr !== 'string' || typeof newStr !== 'string' || !current.includes(oldStr)) {
    return null; // can't safely reconstruct — caller should allow, never guess-deny
  }
  return toolInput.replace_all ? current.split(oldStr).join(newStr) : current.replace(oldStr, newStr);
}

async function main() {
  let input;
  try {
    input = JSON.parse(await readStdin());
  } catch {
    allow();
    return;
  }

  const cwd = input.cwd || process.cwd();
  const toolName = input.tool_name;
  const toolInput = input.tool_input || {};

  if (toolName !== 'Write' && toolName !== 'Edit') {
    allow();
    return;
  }

  const filePath = toolInput.file_path;
  if (!filePath) {
    allow();
    return;
  }

  const configPath = join(cwd, '.a11yrc.json');
  if (!existsSync(configPath)) {
    allow();
    return;
  }
  let parsedConfig;
  try {
    parsedConfig = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch {
    allow();
    return;
  }
  if (parsedConfig.hooksEnabled !== true) {
    allow();
    return;
  }

  if (classify(filePath) !== 'lintable') {
    allow();
    return;
  }

  const pendingContent = resolvePendingContent(toolName, toolInput, filePath);
  if (pendingContent === null) {
    allow();
    return;
  }

  const ext = extname(filePath);
  const tempPath = join(dirname(filePath), `.a11y-pending-${process.pid}-${Date.now()}${ext}`);
  writeFileSync(tempPath, pendingContent, 'utf8');

  let findings;
  try {
    const escape = (s) => `"${s.replace(/"/g, '\\"')}"`;
    const cmd = [
      'npx',
      '--yes',
      '@aidevme/a11y',
      'audit',
      escape(cwd),
      '--files',
      escape(tempPath),
      '--format',
      'json',
      '--fail-on',
      'never',
    ].join(' ');
    const out = execSync(cmd, { encoding: 'utf8', timeout: 15000, windowsHide: true });
    findings = JSON.parse(out);
  } catch {
    // The check itself failed to run (npx unavailable, package fetch failed,
    // timeout, malformed output) — fail open. A malfunctioning gate must
    // never block a write; that's a worse failure mode than missing a finding.
    try {
      unlinkSync(tempPath);
    } catch {
      // best-effort cleanup
    }
    allow();
    return;
  }
  try {
    unlinkSync(tempPath);
  } catch {
    // best-effort cleanup
  }

  const violations = Array.isArray(findings) ? findings.filter((f) => f.severity === 'error') : [];
  if (violations.length === 0) {
    allow();
    return;
  }

  const lines = violations.map((f) => {
    const line = f.range?.startLine ?? '?';
    return `  ${filePath}:${line}  ${f.message} [${f.ruleId}, WCAG SC ${f.wcagRef}]`;
  });
  deny(
    `Accessibility check failed for this write (${violations.length} issue${violations.length === 1 ? '' : 's'}) — fix before proceeding:\n${lines.join('\n')}`,
  );
}

main();
