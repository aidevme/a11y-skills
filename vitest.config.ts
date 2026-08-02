import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/**/*.test.ts',
      'reporters/**/*.test.ts',
      'evals/**/*.test.ts',
    ],
    passWithNoTests: true,
    // Several tests dynamically import() ESLint plus multiple rule packs on
    // first use (cold JIT + module resolution across a larger workspace) —
    // the default 5s is too tight for that path specifically.
    testTimeout: 15000,
  },
});
