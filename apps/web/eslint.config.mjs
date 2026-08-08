import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from '@e-voting/eslint-config/prettier';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig(
  prettierConfig,
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
);
