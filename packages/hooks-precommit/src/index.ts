import { execSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** File extensions the pre-commit gate considers "UI-relevant" — mirrors the registry's pack extensions. */
export const UI_EXTENSIONS = ['.tsx', '.jsx', '.vue', '.html'];

/**
 * Returns absolute paths of staged files (added/copied/modified — not
 * deleted) matching a UI extension. Change-scoped (DESIGN §12.3): only
 * staged files, never the whole repo. Returns [] outside a git repo or on
 * any git failure, so the hook fails open rather than blocking a commit for
 * an unrelated reason.
 */
export function getStagedFiles(projectRoot: string): string[] {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACM', {
      cwd: projectRoot,
      encoding: 'utf8',
    });
    return out
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((f) => UI_EXTENSIONS.some((ext) => f.endsWith(ext)))
      .map((f) => join(projectRoot, f))
      .filter((f) => existsSync(f));
  } catch {
    return [];
  }
}

const HOOK_MARKER = '# a11y-skills precommit hook — installed by `a11y init --with-precommit`';

const HOOK_SCRIPT = `#!/bin/sh
${HOOK_MARKER}
# Host-independent, change-scoped gate (DESIGN §4.3, §12.3): audits only
# staged UI files, never the whole repo. Safe to remove this file, or
# re-run \`a11y init\` without --with-precommit, to uninstall.
npx --yes @aidevme/a11y precommit "$(git rev-parse --show-toplevel)"
`;

export interface InstallResult {
  installed: boolean;
  path: string;
  reason?: 'not-a-git-repo' | 'existing-hook-not-ours' | 'already-installed';
}

/**
 * Installs a plain git pre-commit hook directly at `.git/hooks/pre-commit`
 * — no husky/lefthook dependency required, so it works the same for every
 * host (Cursor/Copilot/Codex users, who don't get Claude Code's PreToolUse
 * hook). Never clobbers a pre-existing hook it didn't install itself.
 */
export function installPrecommitHook(projectRoot: string): InstallResult {
  const gitDir = join(projectRoot, '.git');
  if (!existsSync(gitDir)) return { installed: false, path: '', reason: 'not-a-git-repo' };

  const hooksDir = join(gitDir, 'hooks');
  if (!existsSync(hooksDir)) mkdirSync(hooksDir, { recursive: true });
  const hookPath = join(hooksDir, 'pre-commit');

  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, 'utf8');
    if (!existing.includes(HOOK_MARKER)) {
      return { installed: false, path: hookPath, reason: 'existing-hook-not-ours' };
    }
    if (existing === HOOK_SCRIPT) {
      return { installed: false, path: hookPath, reason: 'already-installed' };
    }
  }

  writeFileSync(hookPath, HOOK_SCRIPT, 'utf8');
  try {
    chmodSync(hookPath, 0o755);
  } catch {
    // chmod can be a no-op on some platforms/filesystems — non-fatal.
  }
  return { installed: true, path: hookPath };
}
