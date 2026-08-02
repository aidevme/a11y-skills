import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { detectFrameworks } from '../src/index.js';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const fixture = (name: string): string => join(repoRoot, 'examples', name);

describe('detectFrameworks', () => {
  it('TC-P1.2-01: react dep + tsx files → react, fluent false', () => {
    expect(detectFrameworks(fixture('react-seeded'))).toEqual({
      frameworks: ['react'],
      fluent: false,
    });
  });

  it('TC-P1.2-02: fluent dependency → fluent true', () => {
    expect(detectFrameworks(fixture('fluent-seeded'))).toEqual({
      frameworks: ['react'],
      fluent: true,
    });
  });

  it('TC-P1.2-03: plain node project → no frameworks', () => {
    expect(detectFrameworks(fixture('plain-node'))).toEqual({ frameworks: [], fluent: false });
  });

  it('TC-P1.2-04: .jsx files without react dep → react (file marker suffices)', () => {
    expect(detectFrameworks(fixture('jsx-no-dep'))).toEqual({
      frameworks: ['react'],
      fluent: false,
    });
  });

  it('TC-P1.2-05: react only in devDependencies → react', () => {
    expect(detectFrameworks(fixture('react-devdep'))).toEqual({
      frameworks: ['react'],
      fluent: false,
    });
  });

  it('TC-P3: vue dep with no .vue files → vue', () => {
    expect(detectFrameworks(fixture('vue-devdep'))).toEqual({
      frameworks: ['vue'],
      fluent: false,
    });
  });

  it('TC-P3: .vue SFC files → vue (file marker suffices)', () => {
    expect(detectFrameworks(fixture('vue-seeded'))).toEqual({
      frameworks: ['vue'],
      fluent: false,
    });
  });

  it('TC-P3.1: plain .html file, no framework dep → static-html fallback', () => {
    expect(detectFrameworks(fixture('static-html-devdep'))).toEqual({
      frameworks: ['static-html'],
      fluent: false,
    });
  });

  it('TC-P3: react + vue both present → all-match reports both, static-html never added on top', () => {
    expect(detectFrameworks(fixture('react-vue-multi'))).toEqual({
      frameworks: ['react', 'vue'],
      fluent: false,
    });
  });

  it('TC-P4.1: angular.json present → angular', () => {
    expect(detectFrameworks(fixture('angular-devdep'))).toEqual({
      frameworks: ['angular'],
      fluent: false,
    });
  });

  it('TC-P4.1: svelte dep with no .svelte files → svelte', () => {
    expect(detectFrameworks(fixture('svelte-devdep'))).toEqual({
      frameworks: ['svelte'],
      fluent: false,
    });
  });

  it('TC-P4.1: .svelte files → svelte (file marker suffices)', () => {
    expect(detectFrameworks(fixture('svelte-seeded'))).toEqual({
      frameworks: ['svelte'],
      fluent: false,
    });
  });
});
