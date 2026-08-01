import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const schema = JSON.parse(
  readFileSync(new URL('../schemas/a11yrc.schema.json', import.meta.url), 'utf8'),
);
const example = JSON.parse(
  readFileSync(new URL('../../../examples/.a11yrc.json', import.meta.url), 'utf8'),
);

const ajv = new Ajv({ allowUnionTypes: true });
const validate = ajv.compile(schema);

describe('.a11yrc.json schema', () => {
  it('accepts the committed example config', () => {
    const valid = validate(example);
    expect(validate.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });

  it('accepts an empty config (all fields optional, defaults apply)', () => {
    expect(validate({})).toBe(true);
  });

  it('rejects an unknown profile', () => {
    expect(validate({ profile: 'lenient' })).toBe(false);
  });

  it('rejects an unknown wcagVersion', () => {
    expect(validate({ wcagVersion: '3.0' })).toBe(false);
  });

  it('rejects an invalid override severity', () => {
    expect(validate({ overrides: { 'react-img-alt': 'fatal' } })).toBe(false);
  });

  it('rejects unknown top-level properties', () => {
    expect(validate({ rulepacks: [] })).toBe(false);
  });
});
