import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'out', '.next']);

/** Recursively lists UI source files, sorted for deterministic audits. */
export function listUiFiles(root: string, exts: string[] = ['.tsx', '.jsx']): string[] {
  const results: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (exts.some((e) => entry.endsWith(e))) results.push(full);
    }
  };
  walk(root);
  return results.sort();
}
