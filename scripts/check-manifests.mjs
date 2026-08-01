#!/usr/bin/env node
/**
 * Checks that all four marketplace manifests agree on the plugin's
 * name, canonical source path, and version (IMPLEMENTATION.md step 0.2).
 * Exit code 0 = consistent, 1 = drift detected.
 */
import { readFileSync } from 'node:fs';

const MANIFEST_FILES = [
  '.claude-plugin/marketplace.json',
  '.cursor-plugin/marketplace.json',
  '.github/plugin/marketplace.json',
  '.agents/plugins/marketplace.json',
];

const EXPECTED_NAME = 'a11y';
const EXPECTED_SOURCE = '.github/plugins/a11y';

function normalizeSource(source) {
  const raw = typeof source === 'string' ? source : (source?.path ?? '');
  return raw.replace(/^\.\//, '').replace(/\\/g, '/');
}

let failed = 0;
const versions = new Map();

for (const file of MANIFEST_FILES) {
  const errors = [];
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`x ${file}\n    - unreadable or invalid JSON: ${err.message}`);
    failed++;
    continue;
  }

  const plugin = manifest.plugins?.[0];
  if (!plugin) {
    errors.push('no plugins[] entry');
  } else {
    if (plugin.name !== EXPECTED_NAME) {
      errors.push(`plugin name "${plugin.name}" != "${EXPECTED_NAME}"`);
    }
    const source = normalizeSource(plugin.source);
    if (source !== EXPECTED_SOURCE) {
      errors.push(`source "${source}" != "${EXPECTED_SOURCE}"`);
    }
    for (const v of [plugin.version, manifest.metadata?.version]) {
      if (v !== undefined) versions.set(`${file}: ${v}`, v);
    }
  }

  if (errors.length > 0) {
    failed++;
    console.error(`x ${file}`);
    for (const e of errors) console.error(`    - ${e}`);
  } else {
    console.log(`ok ${file}`);
  }
}

const distinct = new Set(versions.values());
if (distinct.size > 1) {
  failed++;
  console.error('x version drift across manifests:');
  for (const key of versions.keys()) console.error(`    - ${key}`);
}

if (failed === 0) {
  console.log(`\nAll manifests agree (version: ${[...distinct][0] ?? 'none declared'})`);
}
process.exit(failed > 0 ? 1 : 0);
