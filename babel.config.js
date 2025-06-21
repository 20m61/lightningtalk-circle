/**
 * Babel Configuration for Lightning Talk WordPress Theme
 */

module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: [
          '> 1%',
          'last 2 versions',
          'ie >= 11'
        ]
      },
      useBuiltIns: 'usage',
      corejs: 3,
      modules: false
    }]
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current'
          }
        }]
      ]
    }
  }
};