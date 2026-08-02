/**
 * Ambient declarations for the packages the CLI loads dynamically.
 * Core deliberately has no static imports of packs (avoids a build cycle:
 * packs may depend on core's published types, core only touches packs at
 * runtime). Return payloads are validated structurally by the test suite.
 */

declare module '@aidevme/a11y-framework-detector' {
  export interface FrameworkDetection {
    frameworks: string[];
    fluent: boolean;
  }
  export function detectFrameworks(projectRoot: string): FrameworkDetection;
}

declare module '@aidevme/a11y-rules-react' {
  export function runRules(files: string[], projectRoot: string): Promise<unknown[]>;
}

declare module '@aidevme/a11y-rules-fluent-ui' {
  export function runRules(files: string[], projectRoot: string): Promise<unknown[]>;
}

declare module '@aidevme/a11y-rules-vue' {
  export function runRules(files: string[], projectRoot: string): Promise<unknown[]>;
}

declare module '@aidevme/a11y-rules-static-html' {
  export function runRules(files: string[], projectRoot: string): Promise<unknown[]>;
}

declare module '@aidevme/a11y-rules-angular' {
  export function runRules(files: string[], projectRoot: string): Promise<unknown[]>;
}

declare module '@aidevme/a11y-rules-svelte' {
  export function runRules(files: string[], projectRoot: string): Promise<unknown[]>;
}

declare module '@aidevme/a11y-reporter-markdown' {
  export function renderMarkdown(input: unknown): string;
}

declare module '@aidevme/a11y-reporter-sarif' {
  export function renderSarif(input: unknown): string;
}

declare module '@aidevme/a11y-reporter-html' {
  export function renderHtml(input: unknown): string;
}

declare module '@aidevme/a11y-runtime-axe' {
  export function runRuntime(options: {
    urls: string[];
    viewports?: string[];
    crawl?: boolean;
    maxPages?: number;
  }): Promise<unknown[]>;
}

declare module '@aidevme/a11y-context-gen' {
  export interface InitResult {
    created: string[];
    updated: string[];
    unchanged: string[];
  }
  export function runInit(
    projectRoot: string,
    detection: { frameworks: string[]; fluent: boolean },
    options: { profile: 'strict' | 'standard' | 'mvp'; withPrecommit: boolean; withHooks: boolean },
  ): Promise<InitResult>;
}

declare module '@aidevme/a11y-hooks-precommit' {
  /** Absolute paths of staged, UI-relevant files (git diff --cached, filtered). */
  export function getStagedFiles(projectRoot: string): string[];
}
