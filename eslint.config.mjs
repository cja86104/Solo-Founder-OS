import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // ─── Ignored paths ──────────────────────────────────────────────────────────
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'public/**',
      'supabase/**',
      '*.config.ts',
      '*.config.mjs',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
    ],
  },

  // ─── Next.js core rules (includes React + React Hooks + import) ─────────────
  ...compat.extends('next/core-web-vitals'),

  // ─── TypeScript rules ───────────────────────────────────────────────────────
  ...compat.extends('next/typescript'),

  // ─── Project-wide overrides ─────────────────────────────────────────────────
  {
    rules: {
      // TypeScript — allow `any` in places the codebase uses it intentionally
      // (Supabase typed client uses heavy casting via `as any` throughout)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // React — not needed with Next.js (JSX transform handles it)
      'react/react-in-jsx-scope': 'off',

      // Next.js — allow <img> alongside next/image where intentional
      '@next/next/no-img-element': 'warn',

      // General code quality
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-duplicate-imports': 'error',
    },
  },
];

export default eslintConfig;
