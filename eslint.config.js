import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        browser: true,
        es2022: true,
        node: true,
        jest: true,
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        window: 'readonly',
        document: 'readonly',
        URL: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
        test: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    },

    rules: {
      // エラーレベル - 開発フレンドリーに調整
      'no-console': 'warn',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      'no-undef': 'warn',
      'no-unreachable': 'warn',
      'no-duplicate-case': 'warn',
      'no-empty': 'warn',

      // コードスタイル - 警告レベルに変更
      indent: ['warn', 2],
      'linebreak-style': ['warn', 'unix'],
      quotes: ['warn', 'single', { avoidEscape: true }],
      semi: ['warn', 'always'],
      'comma-dangle': ['warn', 'never'],
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
      'space-before-function-paren': ['warn', 'never'],
      'keyword-spacing': ['warn', { before: true, after: true }],
      'space-infix-ops': 'warn',
      'eol-last': ['warn', 'always'],
      'no-trailing-spaces': 'warn',

      // ベストプラクティス - 警告レベルに変更
      eqeqeq: ['warn', 'always'],
      curly: ['warn', 'all'],
      'no-eval': 'warn',
      'no-implied-eval': 'warn',
      'no-new-func': 'warn',
      'no-return-assign': 'warn',
      'no-sequences': 'warn',
      'no-throw-literal': 'warn',
      'no-unmodified-loop-condition': 'warn',
      'no-useless-call': 'warn',
      'no-useless-concat': 'warn',
      'no-useless-return': 'warn',
      'prefer-promise-reject-errors': 'warn',

      // ES6+ features - 警告レベルに変更
      'arrow-spacing': ['warn', { before: true, after: true }],
      'no-var': 'warn',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'template-curly-spacing': ['warn', 'never'],
      'object-shorthand': ['warn', 'always'],
      'prefer-destructuring': [
        'warn',
        {
          array: true,
          object: true
        },
        {
          enforceForRenamedProperties: false
        }
      ]
    }
  },

  // テストファイル用の設定
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        jest: true
      }
    },
    rules: {
      'no-console': 'off'
    }
  },

  // スクリプトファイル用の設定
  {
    files: ['scripts/**/*.js'],
    rules: {
      'no-console': 'off'
    }
  },

  // Gulpファイル用の設定
  {
    files: ['gulpfile.js', 'gulp/**/*.js'],
    rules: {
      'no-console': 'off'
    }
  },

  // CDKファイル用の設定
  {
    files: ['cdk/**/*.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off'
    }
  },

  // 設定ファイル用の設定
  {
    files: ['*.config.js', '*.config.mjs', '.*.js', '.*.cjs'],
    languageOptions: {
      globals: {
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      'quotes': 'off',
      'comma-dangle': 'off',
      'eol-last': 'off',
      'no-trailing-spaces': 'off'
    }
  },

  // フロントエンド用の設定
  {
    files: ['public/**/*.js', 'frontend/**/*.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        URL: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off'
    }
  },

  // 無視するファイル/ディレクトリ
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '.jest-cache/',
      'wordpress/lightningtalk-child/assets/js/vendor/',
      'public/js/vendor/',
      'lightningtalk-modern/packages/*/dist/',
      'lightningtalk-modern/packages/*/build/',
      'cdk/lib/stacks/*.js',
      'cdk/lambda/*.js'
    ]
  }
];
