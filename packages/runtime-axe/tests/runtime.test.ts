import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runRuntime } from '../src/index.js';

const pagesDir = fileURLToPath(new URL('../../../examples/runtime-pages', import.meta.url));

let browserAvailable = true;
try {
  const { chromium } = await import('playwright');
  const b = await chromium.launch();
  await b.close();
} catch {
  browserAvailable = false;
}

let server: Server;
let base = '';

beforeAll(async () => {
  server = createServer((req, res) => {
    const name = (req.url ?? '/').replace(/^\//, '') || 'clean.html';
    try {
      res.setHeader('content-type', 'text/html');
      res.end(readFileSync(join(pagesDir, name)));
    } catch {
      res.statusCode = 404;
      res.end('not found');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address();
  base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
});

afterAll(() => {
  server?.close();
});

describe.skipIf(!browserAvailable)('runtime-axe (TC-P2.3)', () => {
  it('TC-P2.3-01: seeded page yields exactly the expected axe rule ids', async () => {
    const findings = await runRuntime({ urls: [`${base}/axe-seeded.html`], viewports: ['desktop'] });
    const ruleIds = [...new Set(findings.map((f) => f.ruleId))].sort();
    expect(ruleIds).toEqual(['axe-html-has-lang', 'axe-image-alt', 'axe-label']);
    for (const f of findings) {
      expect(f.layer).toBe(2);
      expect(f.page).toBe(`${base}/axe-seeded.html`);
      expect(f.wcagRef).toMatch(/^\d+\.\d+\.\d+$/);
      expect(f.wcagRef).not.toBe('4.1.1');
    }
  }, 60000);

  it('TC-P2.3-02: identical findings dedupe across viewports with a viewports list', async () => {
    const findings = await runRuntime({ urls: [`${base}/axe-seeded.html`] });
    const axeFindings = findings.filter((f) => f.ruleId.startsWith('axe-'));
    expect(axeFindings.length).toBeGreaterThan(0);
    for (const f of axeFindings) {
      expect(f.viewports).toEqual(['mobile', 'tablet', 'desktop']);
    }
  }, 60000);

  it('TC-P2.3-04/-05: reflow fires on fixed-width page at 320px, silent on clean page', async () => {
    const bad = await runRuntime({ urls: [`${base}/reflow-bad.html`], viewports: ['mobile'] });
    const reflow = bad.find((f) => f.ruleId === 'runtime-reflow');
    expect(reflow).toBeDefined();
    expect(reflow?.wcagRef).toBe('1.4.10');
    expect(reflow?.viewports).toEqual(['mobile']);

    const clean = await runRuntime({ urls: [`${base}/clean.html`] });
    expect(clean).toEqual([]);
  }, 60000);

  it('TC-P2.3-06: text-spacing override detects clipped content', async () => {
    const findings = await runRuntime({ urls: [`${base}/spacing-bad.html`], viewports: ['desktop'] });
    const spacing = findings.find((f) => f.ruleId === 'runtime-text-spacing');
    expect(spacing).toBeDefined();
    expect(spacing?.wcagRef).toBe('1.4.12');
    expect(spacing?.context).toContain('#clip');
  }, 60000);

  it('TC-P2.3-07: orientation-locked page is flagged (SC 1.3.4)', async () => {
    const findings = await runRuntime({
      urls: [`${base}/orientation-locked.html`],
      viewports: ['desktop'],
    });
    const orientation = findings.find((f) => f.ruleId === 'runtime-orientation');
    expect(orientation).toBeDefined();
    expect(orientation?.wcagRef).toBe('1.3.4');
  }, 60000);

  it('TC-P2.3-09: 404 target rejects instead of reporting clean', async () => {
    await expect(runRuntime({ urls: [`${base}/nope.html`] })).rejects.toThrow(/HTTP 404/);
  }, 60000);
});

it.skipIf(browserAvailable)('browser unavailable — runtime suite skipped', () => {
  expect(browserAvailable).toBe(false);
});
