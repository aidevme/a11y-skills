/**
 * Rule-pack registry. Each pack is an npm package exporting
 * `runRules(files, projectRoot)`; adding a pack is one descriptor here
 * (the "registration line" from DESIGN §2.2) — core logic never changes.
 */
export interface RulePackDescriptor {
  id: string;
  module: string;
  /** Framework ids (from the framework detector) this pack applies to. */
  frameworks: string[];
  /** Pack only runs when Fluent UI is detected. */
  requiresFluent?: boolean;
  /** File extensions this pack's runRules() understands — scoped per pack so e.g. rules-vue never sees a .tsx file. */
  extensions: string[];
}

export const BUILTIN_PACKS: RulePackDescriptor[] = [
  {
    id: 'react',
    module: '@aidevme/a11y-rules-react',
    frameworks: ['react'],
    extensions: ['.tsx', '.jsx'],
  },
  {
    id: 'fluent-ui',
    module: '@aidevme/a11y-rules-fluent-ui',
    frameworks: ['react'],
    requiresFluent: true,
    extensions: ['.tsx', '.jsx'],
  },
  {
    id: 'vue',
    module: '@aidevme/a11y-rules-vue',
    frameworks: ['vue'],
    extensions: ['.vue'],
  },
  {
    id: 'static-html',
    module: '@aidevme/a11y-rules-static-html',
    frameworks: ['static-html'],
    extensions: ['.html'],
  },
  {
    id: 'angular',
    module: '@aidevme/a11y-rules-angular',
    frameworks: ['angular'],
    extensions: ['.html'],
  },
  {
    id: 'svelte',
    module: '@aidevme/a11y-rules-svelte',
    frameworks: ['svelte'],
    extensions: ['.svelte'],
  },
];
