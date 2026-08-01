#!/usr/bin/env node
/**
 * Validates every skill under .github/plugins/a11y/skills against the
 * Agent Skills specification (AGENT_SKILLS_SPECIFICATION.md):
 *   - SKILL.md present with YAML frontmatter
 *   - name: 1-64 chars, lowercase alphanumerics + single hyphens, matches directory
 *   - description: 1-1024 chars
 * Exit code 0 = all valid, 1 = failures.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKILLS_DIR = '.github/plugins/a11y/skills';
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const dirs = readdirSync(SKILLS_DIR).filter((d) => statSync(join(SKILLS_DIR, d)).isDirectory());

if (dirs.length === 0) {
  console.error(`No skill directories found under ${SKILLS_DIR}`);
  process.exit(1);
}

let failed = 0;

for (const dir of dirs) {
  const errors = [];
  const skillPath = join(SKILLS_DIR, dir, 'SKILL.md');

  if (!existsSync(skillPath)) {
    errors.push('missing SKILL.md');
  } else {
    const text = readFileSync(skillPath, 'utf8');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
    if (!match) {
      errors.push('missing or malformed YAML frontmatter');
    } else {
      const fm = {};
      for (const line of match[1].split(/\r?\n/)) {
        const kv = line.match(/^([A-Za-z][A-Za-z-]*):\s*(.*)$/);
        if (kv) fm[kv[1]] = kv[2].trim();
      }
      if (!fm.name) {
        errors.push('frontmatter missing required field: name');
      } else {
        if (fm.name.length > 64) errors.push('name exceeds 64 characters');
        if (!NAME_RE.test(fm.name)) errors.push(`invalid name "${fm.name}"`);
        if (fm.name !== dir) errors.push(`name "${fm.name}" does not match directory "${dir}"`);
      }
      if (!fm.description) {
        errors.push('frontmatter missing required field: description');
      } else if (fm.description.length > 1024) {
        errors.push('description exceeds 1024 characters');
      }
    }
  }

  if (errors.length > 0) {
    failed++;
    console.error(`x ${dir}`);
    for (const e of errors) console.error(`    - ${e}`);
  } else {
    console.log(`ok ${dir}`);
  }
}

console.log(`\n${dirs.length - failed}/${dirs.length} skills valid`);
process.exit(failed > 0 ? 1 : 0);
