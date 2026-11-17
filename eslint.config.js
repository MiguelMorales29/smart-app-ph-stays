import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const noSupabasePattern = {
  group: ['@supabase/*'],
  message: 'Only apps/api may import @supabase/* packages.',
};

const noMocksPattern = {
  group: ['**/mocks/**', '@smartapp/data/mocks*'],
  message: 'Apps and screens must never import mock files directly.',
};

const dashboardWallPatterns = [
  {
    group: ['@smartapp/storefront*', '@smartapp/api*', '**/storefront/**', '**/api/**'],
    message: 'apps/dashboard must not import from storefront or api.',
  },
];

const dashboardFeatureWallPatterns = [
  {
    group: ['**/features/**', '@/features/**', '../*/**'],
    message:
      'Features in apps/dashboard must not import another feature; put shared code in apps/dashboard/src/app/.',
  },
];

const storefrontWallPatterns = [
  {
    group: ['@smartapp/dashboard*', '@smartapp/api*', '**/dashboard/**', '**/api/**'],
    message: 'apps/storefront must not import from dashboard or api.',
  },
];

const apiWallPatterns = [
  {
    group: ['@smartapp/dashboard*', '@smartapp/storefront*', '**/dashboard/**', '**/storefront/**'],
    message: 'apps/api must not import from dashboard or storefront.',
  },
];

const coreWallPatterns = [
  {
    group: ['react', 'react-dom', 'react/*', '@smartapp/ui*', '@smartapp/data*'],
    message:
      'packages/core must remain pure and cannot import React, @smartapp/ui, or @smartapp/data.',
  },
];

const uiWallPatterns = [
  {
    group: ['@smartapp/data*'],
    message: 'packages/ui must not import @smartapp/data.',
  },
];

export default [
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/coverage/**',
      'docs/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'never',
        },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-expect-error': true,
          'ts-nocheck': true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.{tsx,jsx}'],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ['apps/storefront/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    ignores: ['apps/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [noSupabasePattern],
        },
      ],
    },
  },
  {
    files: ['packages/core/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [noSupabasePattern, ...coreWallPatterns],
        },
      ],
    },
  },
  {
    files: ['packages/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [noSupabasePattern, ...uiWallPatterns],
        },
      ],
    },
  },
  {
    files: ['packages/ui/src/components/**'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
  {
    files: ['apps/**'],
    ignores: ['apps/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [noSupabasePattern, noMocksPattern],
        },
      ],
    },
  },
  {
    files: ['apps/storefront/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [noSupabasePattern, noMocksPattern, ...storefrontWallPatterns],
        },
      ],
    },
  },
  {
    files: ['apps/dashboard/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [noSupabasePattern, noMocksPattern, ...dashboardWallPatterns],
        },
      ],
    },
  },
  {
    files: ['apps/dashboard/src/features/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noSupabasePattern,
            noMocksPattern,
            ...dashboardWallPatterns,
            ...dashboardFeatureWallPatterns,
          ],
        },
      ],
    },
  },
  {
    files: ['apps/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [noMocksPattern, ...apiWallPatterns],
        },
      ],
    },
  },
];
