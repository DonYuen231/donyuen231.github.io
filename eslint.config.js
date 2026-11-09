import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      '.superpowers/',
      'docs/',
      'playwright-report/',
      'test-results/',
      '.lighthouseci/',
    ],
  },
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
];
