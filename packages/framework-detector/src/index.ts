import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface FrameworkDetection {
  /** Detected framework ids, e.g. ["react"]. Empty when no UI framework found. All-match: a repo can report more than one. */
  frameworks: string[];
  /** True when Fluent UI v9 (@fluentui/react-components) is a dependency. */
  fluent: boolean;
}

interface FileMarkers {
  hasReactFile: boolean;
  hasVueFile: boolean;
  hasSvelteFile: boolean;
  hasHtmlFile: boolean;
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

/** Single recursive pass collecting all file markers at once — avoids re-walking the tree once per framework. */
function scanFileMarkers(dir: string, markers: FileMarkers): void {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      scanFileMarkers(full, markers);
      continue;
    }
    if (entry.endsWith('.tsx') || entry.endsWith('.jsx')) markers.hasReactFile = true;
    else if (entry.endsWith('.vue')) markers.hasVueFile = true;
    else if (entry.endsWith('.svelte')) markers.hasSvelteFile = true;
    else if (entry.endsWith('.html')) markers.hasHtmlFile = true;
  }
}

/**
 * Detection table (DESIGN §2.2): each framework is checked independently
 * ("all-match" per the registry — a repo can be React AND Vue at once).
 * Static HTML is the one exception: it only fires when no other framework
 * matched, since it is explicitly the fallback case (§2.2).
 *
 * Angular is detected via `angular.json` or the `@angular/core` dependency
 * rather than a file-extension marker, since Angular component templates
 * are plain `.html` files — there is no `.angular` extension to scan for.
 */
export function detectFrameworks(projectRoot: string): FrameworkDetection {
  const deps = readDeps(projectRoot);
  const markers: FileMarkers = {
    hasReactFile: false,
    hasVueFile: false,
    hasSvelteFile: false,
    hasHtmlFile: false,
  };
  scanFileMarkers(projectRoot, markers);

  const frameworks: string[] = [];

  const hasReact = 'react' in deps || markers.hasReactFile;
  if (hasReact) frameworks.push('react');

  const hasVue = 'vue' in deps || markers.hasVueFile;
  if (hasVue) frameworks.push('vue');

  const hasAngular = existsSync(join(projectRoot, 'angular.json')) || '@angular/core' in deps;
  if (hasAngular) frameworks.push('angular');

  const hasSvelte = 'svelte' in deps || markers.hasSvelteFile;
  if (hasSvelte) frameworks.push('svelte');

  if (frameworks.length === 0 && markers.hasHtmlFile) {
    frameworks.push('static-html');
  }

  return {
    frameworks,
    fluent: hasReact && '@fluentui/react-components' in deps,
  };
}
