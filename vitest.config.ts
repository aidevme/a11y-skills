import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/**/*.test.ts',
      'reporters/**/*.test.ts',
      'evals/**/*.test.ts',
    ],
    passWithNoTests: true,
  },
});
