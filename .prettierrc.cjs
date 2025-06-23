module.exports = {
  // 基本設定
  semi: true,
  trailingComma: 'none',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  
  // 改行とスペース
  endOfLine: 'lf',
  insertPragma: false,
  requirePragma: false,
  proseWrap: 'preserve',
  
  // 括弧とクォート
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  quoteProps: 'as-needed',
  
  // HTML/JSX設定（将来のReactコンポーネント用）
  htmlWhitespaceSensitivity: 'css',
  vueIndentScriptAndStyle: false,
  embeddedLanguageFormatting: 'auto',
  
  // ファイル固有の設定
  overrides: [
    {
      files: ['*.json', '*.jsonc'],
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: ['*.md'],
      options: {
        printWidth: 80,
        proseWrap: 'always'
      }
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    },
    {
      files: ['*.css', '*.scss', '*.sass'],
      options: {
        singleQuote: false
      }
    },
    {
      files: ['*.php'],
      options: {
        printWidth: 120,
        tabWidth: 4,
        phpVersion: '8.0'
      }
    }
  ]
};