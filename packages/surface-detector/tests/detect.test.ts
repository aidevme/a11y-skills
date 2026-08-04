import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { detectSurfaces, surfaceForFile } from '../src/index.js';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const fixture = (name: string): string => join(repoRoot, 'examples', name);

describe('detectSurfaces', () => {
  it('TC-P5.1-01: dir with ControlManifest.Input.xml -> surface = pcf', () => {
    const root = fixture('pcf-seeded');
    expect(detectSurfaces(root)).toEqual([{ surface: 'pcf', root }]);
  });

  it('TC-P5.1-02: dir with power.config.json -> surface = code-apps', () => {
    const root = fixture('surface-code-apps');
    expect(detectSurfaces(root)).toEqual([{ surface: 'code-apps', root }]);
  });

  it('TC-P5.1-03: dir with Liquid template files -> surface = power-pages', () => {
    const root = fixture('surface-power-pages');
    expect(detectSurfaces(root)).toEqual([{ surface: 'power-pages', root: join(root, 'templates') }]);
  });

  it('a directory literally named power-pages is its own marker (no Liquid content needed)', () => {
    const root = fixture('surface-power-pages-folder');
    expect(detectSurfaces(root)).toEqual([{ surface: 'power-pages', root: join(root, 'power-pages') }]);
  });

  it('.portalconfig.json alone is a power-pages marker', () => {
    const root = fixture('surface-portalconfig');
    expect(detectSurfaces(root)).toEqual([{ surface: 'power-pages', root }]);
  });

  it('TC-P5.1-04: none of the markers -> surface = web-app fallback', () => {
    const root = fixture('surface-web-app-only');
    expect(detectSurfaces(root)).toEqual([{ surface: 'web-app', root }]);
  });

  it('TC-P5.1-05: monorepo (apps/web + controls/my-pcf) -> two results, each with its own surface', () => {
    const root = fixture('surface-monorepo');
    const result = detectSurfaces(root);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ surface: 'pcf', root: join(root, 'controls', 'my-pcf') });
    expect(result).toContainEqual({ surface: 'web-app', root });
  });

  it('surfaceForFile resolves the monorepo web file to web-app and the PCF file to pcf', () => {
    const root = fixture('surface-monorepo');
    const surfaces = detectSurfaces(root);
    expect(surfaceForFile(join(root, 'apps', 'web', 'src', 'App.tsx'), surfaces)).toBe('web-app');
    expect(surfaceForFile(join(root, 'controls', 'my-pcf', 'ControlManifest.Input.xml'), surfaces)).toBe('pcf');
  });

  it('a single-surface PCF project reports no redundant web-app entry', () => {
    expect(detectSurfaces(fixture('pcf-seeded'))).toHaveLength(1);
  });
});
