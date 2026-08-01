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
}

export const BUILTIN_PACKS: RulePackDescriptor[] = [
  { id: 'react', module: '@aidevme/a11y-rules-react', frameworks: ['react'] },
  {
    id: 'fluent-ui',
    module: '@aidevme/a11y-rules-fluent-ui',
    frameworks: ['react'],
    requiresFluent: true,
  },
];
