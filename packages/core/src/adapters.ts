import type { RawFinding } from './finding.js';

/**
 * Framework axis (DESIGN §2.2): what Layer 1's static parser needs to
 * understand. A new framework is a new package implementing this interface
 * plus a registration line in the registry — nothing in core changes.
 */
export interface FrameworkAdapter {
  id: string;
  detect(projectRoot: string): boolean;
  lint(files: string[], projectRoot: string): Promise<RawFinding[]>;
  devServerCommand?: string;
}

/**
 * Surface axis (DESIGN §2.1): which product target this repo/folder is.
 * Decides Layer 2 targets and Layer 3 domain rules. First non-web-app
 * implementation lands in Phase 5 (PCF).
 */
export interface SurfaceAdapter {
  id: string;
  detect(projectRoot: string): boolean;
  layer1Packs: string[];
  layer2Target?(config: unknown): string | undefined;
  layer3RuleFiles: string[];
}
