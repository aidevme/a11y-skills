import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import AjvModule, { type ValidateFunction } from 'ajv';

// ajv ships CJS with both `module.exports = Ajv` and `exports.default = Ajv`;
// under NodeNext the module namespace's .default carries the constructable type.
const Ajv = (AjvModule as unknown as { default: typeof AjvModule.default }).default;

export interface A11yConfig {
  rulePacks: string[];
  profile: 'strict' | 'standard' | 'mvp';
  wcagVersion: '2.0' | '2.1' | '2.2';
  overrides: Record<string, 'error' | 'warning' | 'info' | 'off'>;
  runtime?: {
    urls?: string[];
    devServerCommand?: string;
    viewports?: ('mobile' | 'tablet' | 'desktop')[];
  };
  processes?: Record<string, string[]>;
}

export class ConfigError extends Error {}

let validator: ValidateFunction | undefined;

function getValidator(): ValidateFunction {
  if (!validator) {
    const schema = JSON.parse(
      readFileSync(new URL('../schemas/a11yrc.schema.json', import.meta.url), 'utf8'),
    ) as object;
    validator = new Ajv({ allowUnionTypes: true }).compile(schema);
  }
  return validator;
}

/** Loads `.a11yrc.json` from the project root; missing file = all defaults. */
export function loadConfig(projectRoot: string): A11yConfig {
  const file = join(projectRoot, '.a11yrc.json');
  let data: Record<string, unknown> = {};
  if (existsSync(file)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch (err) {
      throw new ConfigError(`invalid JSON in ${file}: ${(err as Error).message}`);
    }
    const validate = getValidator();
    if (!validate(parsed)) {
      const detail = (validate.errors ?? [])
        .map((e) => {
          const extra =
            e.keyword === 'additionalProperties'
              ? `: ${String((e.params as { additionalProperty?: string }).additionalProperty)}`
              : '';
          return `${e.instancePath || '(root)'} ${e.message ?? ''}${extra}`;
        })
        .join('; ');
      throw new ConfigError(`invalid .a11yrc.json: ${detail}`);
    }
    data = parsed as Record<string, unknown>;
  }
  return {
    rulePacks: (data.rulePacks as string[]) ?? [],
    profile: (data.profile as A11yConfig['profile']) ?? 'standard',
    wcagVersion: (data.wcagVersion as A11yConfig['wcagVersion']) ?? '2.2',
    overrides: (data.overrides as A11yConfig['overrides']) ?? {},
    runtime: data.runtime as A11yConfig['runtime'],
    processes: data.processes as A11yConfig['processes'],
  };
}
