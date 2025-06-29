/**
 * PostCSS Configuration for Lightning Talk WordPress Theme
 */

module.exports = {
  plugins: [
    require('autoprefixer')({
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'ie >= 11',
        'iOS >= 10',
        'Android >= 6'
      ]
    }),
    require('cssnano')({
      preset: ['default', {
        discardComments: {
          removeAll: true
        },
        normalizeWhitespace: true,
        colormin: true,
        convertValues: true,
        reduceIdents: false,
        zindex: false
      }]
    })
  ]
};