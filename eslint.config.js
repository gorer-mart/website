import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * The previous config was the leftover Vite scaffold: it only matched
 * `**\/*.{js,jsx}`, so every .ts/.tsx file in the project — which is nearly all
 * of it — went unlinted, and forcing them through produced only parse errors.
 * `next lint` was also removed in Next.js 16, so `npm run lint` ran ESLint
 * against a directory called "lint" and failed. Both are fixed here.
 */
export default defineConfig([
  globalIgnores(['dist', '.next', 'node_modules', 'next-env.d.ts', 'scripts', '*.mjs']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // The codebase leans on `any` for Sanity/Supabase payloads; flagging every
      // one would bury real findings. Keep it visible as a warning instead.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      'no-unused-vars': 'off',
    },
  },
])
