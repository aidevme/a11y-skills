import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface FrameworkDetection {
  /** Detected framework ids, e.g. ["react"]. Empty when no UI framework found. */
  frameworks: string[];
  /** True when Fluent UI v9 (@fluentui/react-components) is a dependency. */
  fluent: boolean;
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'out', '.next']);

function readDeps(projectRoot: string): Record<string, string> {
  const pkgPath = join(projectRoot, 'package.json');
  if (!existsSync(pkgPath)) return {};
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    return {};
  }
}

function hasFileWithExt(dir: string, exts: string[]): boolean {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (hasFileWithExt(full, exts)) return true;
    } else if (exts.some((e) => entry.endsWith(e))) {
      return true;
    }
  }
  return false;
}

/**
 * Detection table (DESIGN §2.2): React = `.jsx`/`.tsx` files or `react` in
 * package.json dependencies (dev included). Fluent is a sub-flag of React.
 * Later frameworks (Vue, Angular, Svelte, static HTML) extend this table.
 */
export function detectFrameworks(projectRoot: string): FrameworkDetection {
  const deps = readDeps(projectRoot);
  const hasReact = 'react' in deps || hasFileWithExt(projectRoot, ['.tsx', '.jsx']);
  return {
    frameworks: hasReact ? ['react'] : [],
    fluent: hasReact && '@fluentui/react-components' in deps,
  };
}
