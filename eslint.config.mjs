// @ts-check
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * Quality gate for humans and AI agents alike. Every rule here is an error:
 * `npm run lint` runs with --max-warnings=0 and is part of `npm run check`.
 */

const NODE_GLOBALS = {
  console: 'readonly',
  process: 'readonly',
  URL: 'readonly',
};

const FOCUSED_OR_SKIPPED_TESTS = {
  selector:
    'CallExpression[callee.object.name=/^(describe|it|test)$/][callee.property.name=/^(only|skip|todo)$/]',
  message: 'Focused, skipped or todo tests must not be committed.',
};

export default defineConfig([
  globalIgnores([
    'dist/',
    'coverage/',
    'out-tsc/',
    '.angular/',
    'playwright-report/',
    'test-results/',
    'src/fake-backend/mockServiceWorker.js',
  ]),

  // TypeScript (application, specs, fake backend, e2e)
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      angular.configs.tsRecommended,
      sonarjs.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      // Base quality
      curly: 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-else-return': ['error', { allowElseIf: false }],
      'no-nested-ternary': 'error',
      'no-param-reassign': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

      // Metrics: keep functions small, flat and simple
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      'max-nested-callbacks': ['error', 4],
      'max-lines': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 60, skipBlankLines: true, skipComments: true },
      ],
      'sonarjs/cognitive-complexity': ['error', 10],
      // TODOs are allowed but must be tracked in TODOS.md (see skill track-todos)
      'sonarjs/todo-tag': 'off',
      // Semantic atoms (`type Token = string`) in shared/models are an architecture convention
      'sonarjs/redundant-type-aliases': 'off',

      // TypeScript conventions
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { inheritedMethods: false } },
      ],
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowWithDecorator: true },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit', overrides: { constructors: 'no-public' } },
      ],
      // Angular's static `Validators.*` are designed to be passed by reference (false positives)
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: ['variable', 'classProperty'],
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'has', 'should', 'can'],
          filter: { regex: '^(_|[A-Z_]+$)', match: false },
        },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE', 'PascalCase'] },
      ],

      // Modern Angular only (no legacy APIs)
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/no-async-lifecycle-method': 'error',
      '@angular-eslint/no-lifecycle-call': 'error',
      '@angular-eslint/no-attribute-decorator': 'error',
      '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
      '@angular-eslint/consistent-component-styles': 'error',
      '@angular-eslint/sort-lifecycle-methods': 'error',
      '@angular-eslint/use-component-view-encapsulation': 'error',
      '@angular-eslint/use-injectable-provided-in': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',

      // Architecture: async/await instead of subscribe() (interceptors excepted)
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='subscribe']",
          message:
            'Use async/await (firstValueFrom). subscribe() is only allowed in interceptors.',
        },
      ],
    },
  },

  // Layering (also enforced by dependency-cruiser): core/ and shared/ never depend on pages/
  {
    files: ['src/app/core/**/*.ts', 'src/app/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@pages/*'],
              message: 'core/ and shared/ must not depend on pages/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/core/interceptors/**/*.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['src/fake-backend/**/*.ts'],
    rules: {
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/pseudo-random': 'off',
    },
  },

  // Specs and e2e: same rigor, relaxed only where test ergonomics require it
  {
    files: ['**/*.spec.ts', 'e2e/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', FOCUSED_OR_SKIPPED_TESTS],
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      // Partial stubs of framework classes (e.g. route snapshots) are a legitimate test technique
      '@typescript-eslint/no-unsafe-class-instance-assignment': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/no-nested-functions': 'off',
    },
  },

  // Angular templates (external and inline)
  {
    files: ['**/*.html'],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/prefer-ngsrc': 'error',
      '@angular-eslint/template/no-inline-styles': 'error',
      '@angular-eslint/template/no-any': 'error',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
      '@angular-eslint/template/no-interpolation-in-attributes': 'error',
      '@angular-eslint/template/no-positive-tabindex': 'error',
      '@angular-eslint/template/conditional-complexity': [
        'error',
        { maxComplexity: 4 },
      ],
      '@angular-eslint/template/cyclomatic-complexity': [
        'error',
        { maxComplexity: 10 },
      ],
      '@angular-eslint/template/eqeqeq': 'error',
    },
  },

  // Plain JS tooling files (configs, scripts)
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [eslint.configs.recommended],
    languageOptions: { globals: NODE_GLOBALS },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...NODE_GLOBALS, module: 'writable', require: 'readonly' },
    },
  },

  prettier,
]);
