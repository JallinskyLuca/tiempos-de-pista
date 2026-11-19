import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores(['.next/**', '.next-check/**', 'out/**', 'next-env.d.ts', '.work-import/**', 'public/sw.js', 'public/swe-worker-*.js', 'public/serwist-*.js', 'test-results/**', 'playwright-report/**']),
]);
