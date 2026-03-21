import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  // Ignore patterns (replaces .eslintignore)
  {
    ignores: [
      '**/node_modules/**',
      '**/data/**',
      '**/.actor/**',
      '**/test-results/**',
      'packages/*/src/index.js.bak',
    ],
  },

  // Base JavaScript rules
  js.configs.recommended,

  // Global config for all JS files
  {
    files: ['**/*.js'],
    plugins: {
      jsdoc,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js built-ins
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Date: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        // Modern Web APIs (available in Node.js 18+)
        fetch: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      // Code quality
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      'no-console': 'off', // We use console for debugging/errors
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'warn',
      
      // Best practices
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'no-useless-escape': 'error',
      'preserve-caught-error': 'off', // Too strict for real-world error handling
      
      // JSDoc validation
      'jsdoc/check-alignment': 'warn',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-property-names': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'warn', // Changed to warn (Object vs object is stylistic)
      'jsdoc/require-param': 'warn',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-param-name': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-returns': 'warn',
      'jsdoc/require-returns-description': 'warn',
      'jsdoc/require-returns-type': 'error',
      'jsdoc/valid-types': 'error',
      'jsdoc/no-defaults': 'off', // Allow defaults in @param (useful for documentation)
      'jsdoc/reject-any-type': 'off', // Allow `any` type (sometimes necessary)
      'jsdoc/tag-lines': 'off', // Don't enforce strict spacing (too opinionated)
      
      // Stylistic (light touch)
      'semi': ['error', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
    },
  },

  // JSDoc plugin recommended rules
  {
    files: ['**/*.js'],
    ...jsdoc.configs['flat/recommended-typescript-flavor'],
  },
];
