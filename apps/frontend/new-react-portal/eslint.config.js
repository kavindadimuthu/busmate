import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // This app was ported from management-portal, whose next/typescript
      // config already downgrades these same two rules to warnings for the
      // exact same code — match that established tolerance rather than
      // hard-failing lint on ~500 pre-existing instances.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      // eslint-plugin-react-hooks v7 adds new "React Compiler" diagnostics
      // (set-state-in-effect, static-components, purity, immutability,
      // refs, preserve-manual-memoization) that didn't exist when this code
      // was written. Real signal worth acting on for new code, but with
      // ~200 pre-existing instances here, warn rather than hard-block —
      // `rules-of-hooks` itself (the classic, always-critical rule) stays
      // at its default error severity.
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      // DX-only (breaks Vite Fast Refresh for the file, no runtime effect).
      'react-refresh/only-export-components': 'warn',
    },
  },
])
