import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// eslint-config-next 16 já publica flat config. Não usar FlatCompat aqui:
// a combinação quebra com "Converting circular structure to JSON".
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
    // `dist/` é resíduo do build antigo do Vite: some do repositório, mas pode
  // reaparecer numa cópia local antiga. Analisá-lo gera centenas de avisos
  // em código minificado.
  globalIgnores(['.next/**', 'out/**', 'build/**', 'dist/**', 'next-env.d.ts']),
])

export default eslintConfig
