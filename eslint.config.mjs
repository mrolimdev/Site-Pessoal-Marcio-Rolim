import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// eslint-config-next 16 já publica flat config. Não usar FlatCompat aqui:
// a combinação quebra com "Converting circular structure to JSON".
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'next-env.d.ts',
    // Código legado do Vite, removido no cutover (Fase 10).
    'App.tsx',
    'index.tsx',
    'main-*.tsx',
    'constants.tsx',
    'types.ts',
    'components/**',
    'services/**',
    'api/**',
    'server.js',
    'vite.config.ts',
  ]),
])

export default eslintConfig
