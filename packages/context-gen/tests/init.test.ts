import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runInit, type FrameworkDetection } from '../src/index.js';

const REACT_FLUENT: FrameworkDetection = { frameworks: ['react'], fluent: true };
const REACT_ONLY: FrameworkDetection = { frameworks: ['react'], fluent: false };
const NONE: FrameworkDetection = { frameworks: [], fluent: false };

function tmpProject(files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'a11y-init-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
  return dir;
}

function snapshotDir(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string, prefix: string): void => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(join(d, entry.name), rel);
      else out[rel] = readFileSync(join(d, entry.name), 'utf8');
    }
  };
  walk(dir, '');
  return out;
}

describe('a11y init (context-gen)', () => {
  it('TC-P1.8-01: creates A11Y.md + .a11yrc.json and wires existing hosts', async () => {
    const dir = tmpProject({ '.cursorrules': 'be nice\n', 'CLAUDE.md': '# Project\n' });
    const result = await runInit(dir, REACT_ONLY);
    expect(result.created.sort()).toEqual(['.a11yrc.json', 'A11Y.md']);
    expect(result.updated.sort()).toEqual(['.cursorrules', 'CLAUDE.md']);
    expect(readFileSync(join(dir, 'CLAUDE.md'), 'utf8')).toContain('A11Y.md');
    expect(readFileSync(join(dir, '.cursorrules'), 'utf8')).toContain('A11Y.md');
  });

  it('TC-P1.8-02 / AC-P1-5: second run changes zero bytes', async () => {
    const dir = tmpProject({ '.cursorrules': 'rules\n', 'CLAUDE.md': '# P\n' });
    await runInit(dir, REACT_FLUENT);
    const before = snapshotDir(dir);
    const second = await runInit(dir, REACT_FLUENT);
    expect(snapshotDir(dir)).toEqual(before);
    expect(second.created).toEqual([]);
    expect(second.updated).toEqual([]);
  });

  it('TC-P1.8-03: no host files → creates core files only, invents nothing', async () => {
    const dir = tmpProject();
    const result = await runInit(dir, NONE);
    expect(result.created.sort()).toEqual(['.a11yrc.json', 'A11Y.md']);
    expect(result.updated).toEqual([]);
    expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(false);
    expect(existsSync(join(dir, '.cursorrules'))).toBe(false);
  });

  it('TC-P1.8-04: AGENTS.md and copilot-instructions.md get identical pointers', async () => {
    const dir = tmpProject({
      'AGENTS.md': '# Agents\n',
      '.github/copilot-instructions.md': '# Copilot\n',
    });
    await runInit(dir, REACT_ONLY);
    const agents = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
    const copilot = readFileSync(join(dir, '.github/copilot-instructions.md'), 'utf8');
    const pointerLine = agents.split('\n').find((l) => l.includes('A11Y.md'));
    expect(pointerLine).toBeDefined();
    expect(copilot).toContain(pointerLine as string);
  });

  it('TC-P1.8-05: existing .a11yrc.json is never overwritten', async () => {
    const custom = '{"profile":"mvp"}\n';
    const dir = tmpProject({ '.a11yrc.json': custom });
    const result = await runInit(dir, REACT_ONLY);
    expect(readFileSync(join(dir, '.a11yrc.json'), 'utf8')).toBe(custom);
    expect(result.unchanged).toContain('.a11yrc.json');
  });

  it('TC-P1.8-06: pointer already present mid-file is not duplicated', async () => {
    const dir = tmpProject({ 'CLAUDE.md': '# P\nSee A11Y.md for accessibility.\nMore.\n' });
    await runInit(dir, REACT_ONLY);
    const content = readFileSync(join(dir, 'CLAUDE.md'), 'utf8');
    expect(content.match(/A11Y\.md/g)).toHaveLength(1);
  });

  it('TC-P1.8-07: fluent detection controls the Fluent section; PCF/Pages never appear', async () => {
    const fluentDir = tmpProject();
    await runInit(fluentDir, REACT_FLUENT);
    const withFluent = readFileSync(join(fluentDir, 'A11Y.md'), 'utf8');
    expect(withFluent).toContain('## Fluent UI v9');
    expect(withFluent).toContain('## React');
    expect(withFluent).not.toMatch(/PCF|Power Pages/);

    const plainDir = tmpProject();
    await runInit(plainDir, REACT_ONLY);
    const noFluent = readFileSync(join(plainDir, 'A11Y.md'), 'utf8');
    expect(noFluent).toContain('## React');
    expect(noFluent).not.toContain('## Fluent UI v9');
  });

  it('regenerates the marked block but preserves user content around it', async () => {
    const dir = tmpProject();
    await runInit(dir, REACT_ONLY);
    const path = join(dir, 'A11Y.md');
    const withUserContent = `${readFileSync(path, 'utf8')}\n## Team notes\n\nOur own rules.\n`;
    writeFileSync(path, withUserContent, 'utf8');
    await runInit(dir, REACT_FLUENT); // detection changed → block regenerates
    const after = readFileSync(path, 'utf8');
    expect(after).toContain('## Team notes');
    expect(after).toContain('## Fluent UI v9');
  });
});
