module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true
  },
  
  extends: [
    'eslint:recommended'
  ],
  
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  
  rules: {
    // エラーレベル
    'no-console': 'warn',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'error',
    
    // コードスタイル
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    'keyword-spacing': ['error', { before: true, after: true }],
    'space-infix-ops': 'error',
    'eol-last': ['error', 'always'],
    'no-trailing-spaces': 'error',
    
    // ベストプラクティス
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-assign': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // ES6+ features
    'arrow-spacing': ['error', { before: true, after: true }],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],
    'object-shorthand': ['error', 'always'],
    'prefer-destructuring': ['error', {
      array: true,
      object: true
    }, {
      enforceForRenamedProperties: false
    }]
  },
  
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['gulpfile.js', 'gulp/**/*.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ],
  
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '.jest-cache/',
    'wordpress/lightningtalk-child/assets/js/vendor/',
    'public/js/vendor/',
    'lightningtalk-modern/packages/*/dist/',
    'lightningtalk-modern/packages/*/build/'
  ]
};