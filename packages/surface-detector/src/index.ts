import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

/** Surface axis (DESIGN §2.1): which product target a directory tree is. */
export type Surface = 'pcf' | 'code-apps' | 'power-pages' | 'web-app';

export interface SurfaceDetection {
  surface: Surface;
  /** Absolute path to the root of this surface's subtree. */
  root: string;
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'out', '.next']);
const UI_EXTENSIONS = ['.tsx', '.jsx', '.vue', '.svelte', '.html'];
/** Liquid's own tag/output delimiters — the DESIGN §2.1 heuristic for Power Pages .html templates. */
const LIQUID_PATTERN = /\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/;

function isUnder(file: string, dir: string): boolean {
  const rel = relative(dir, file);
  return rel !== '' && !rel.startsWith('..') && !rel.startsWith(`.${sep}..`);
}

function looksLikeLiquid(file: string): boolean {
  try {
    return LIQUID_PATTERN.test(readFileSync(file, 'utf8'));
  } catch {
    return false;
  }
}

/** Single recursive pass visiting every file/directory once, skipping build/vendor dirs. */
function walk(dir: string, visitFile: (full: string, entry: string) => void, visitDir: (full: string, entry: string) => void): void {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') && entry !== '.portalconfig.json') continue;
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      visitDir(full, entry);
      walk(full, visitFile, visitDir);
    } else {
      visitFile(full, entry);
    }
  }
}

/**
 * Detection heuristics (DESIGN §2.1 table). Each specific-surface marker
 * defines a subtree root at the marker's containing directory; a
 * `web-app` entry is added for `projectRoot` only when UI-relevant files
 * exist outside every specific subtree, so a project that's purely a PCF
 * control (no other UI code) reports a single `pcf` result rather than a
 * redundant `web-app` one that would cover the same files. When nothing
 * specific is found at all, the whole tree is one `web-app` fallback.
 *
 * Multi-surface repos (§2.1): detection is per-directory-tree, so a
 * monorepo with e.g. `apps/web` and `controls/my-pcf` reports one result
 * per subtree.
 */
export function detectSurfaces(projectRoot: string): SurfaceDetection[] {
  const pcfRoots = new Set<string>();
  const codeAppsRoots = new Set<string>();
  const powerPagesRoots = new Set<string>();

  walk(
    projectRoot,
    (full, entry) => {
      if (entry === 'ControlManifest.Input.xml') pcfRoots.add(dirname(full));
      else if (entry === 'power.config.json') codeAppsRoots.add(dirname(full));
      else if (entry === '.portalconfig.json') powerPagesRoots.add(dirname(full));
      else if (entry.endsWith('.html') && looksLikeLiquid(full)) powerPagesRoots.add(dirname(full));
    },
    (full, entry) => {
      if (entry === 'power-pages') powerPagesRoots.add(full);
    },
  );

  // Precedence when the same directory matches more than one marker type
  // (pcf > code-apps > power-pages) — an edge case, but must stay deterministic.
  const specific: SurfaceDetection[] = [
    ...[...pcfRoots].map((root): SurfaceDetection => ({ surface: 'pcf', root })),
    ...[...codeAppsRoots].filter((r) => !pcfRoots.has(r)).map((root): SurfaceDetection => ({ surface: 'code-apps', root })),
    ...[...powerPagesRoots]
      .filter((r) => !pcfRoots.has(r) && !codeAppsRoots.has(r))
      .map((root): SurfaceDetection => ({ surface: 'power-pages', root })),
  ];

  if (specific.length === 0) {
    return [{ surface: 'web-app', root: projectRoot }];
  }

  const specificRoots = specific.map((s) => s.root);
  let hasOutsideFile = false;
  walk(
    projectRoot,
    (full, entry) => {
      if (hasOutsideFile) return;
      if (!UI_EXTENSIONS.some((ext) => entry.endsWith(ext))) return;
      if (specificRoots.some((r) => isUnder(full, r) || full === r)) return;
      hasOutsideFile = true;
    },
    () => {},
  );

  if (hasOutsideFile) {
    specific.push({ surface: 'web-app', root: projectRoot });
  }

  return specific;
}

/**
 * Resolves which detected surface a given absolute file path belongs to:
 * the entry whose `root` is the longest (most specific) ancestor path.
 * Falls back to the first entry (there is always at least one) so a file
 * outside every listed root still gets a deterministic answer.
 */
export function surfaceForFile(file: string, surfaces: SurfaceDetection[]): Surface {
  let best: SurfaceDetection | undefined;
  for (const s of surfaces) {
    if (file !== s.root && !isUnder(file, s.root)) continue;
    if (!best || s.root.length > best.root.length) best = s;
  }
  return (best ?? surfaces[0]).surface;
}
