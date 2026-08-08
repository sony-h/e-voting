// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import baseConfig from '@e-voting/eslint-config';

export default defineConfig(
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  globalIgnores(['dist/**', 'node_modules/**', 'prisma/generated/**']),
);
