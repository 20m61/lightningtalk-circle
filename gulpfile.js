/**
 * Gulp Configuration for Lightning Talk WordPress Theme
 * アセットの処理、最適化、WordPress環境での開発支援
 */

const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const browserSync = require('browser-sync').create();
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const del = require('del');
const zip = require('gulp-zip');
const replace = require('gulp-replace');

// 環境設定
const isDev = process.env.NODE_ENV !== 'production';

// パス設定
const paths = {
  src: {
    styles: 'src/styles/**/*.scss',
    scripts: 'src/js/**/*.js',
    images: 'src/images/**/*',
    php: 'wordpress/lightningtalk-child/**/*.php',
    lightningtalk: {
      css: 'public/css/style.css',
      js: 'public/js/main.js'
    }
  },
  dest: {
    styles: 'wordpress/lightningtalk-child/assets/dist/css',
    scripts: 'wordpress/lightningtalk-child/assets/dist/js',
    images: 'wordpress/lightningtalk-child/assets/dist/images',
    theme: 'wordpress/lightningtalk-child'
  },
  watch: {
    styles: ['src/styles/**/*.scss', 'public/css/**/*.css'],
    scripts: ['src/js/**/*.js', 'public/js/**/*.js'],
    images: 'src/images/**/*',
    php: 'wordpress/lightningtalk-child/**/*.php'
  }
};

// WordPress設定
const wpConfig = {
  proxy: 'http://localhost:8888', // Local by Flywheel や MAMP のURL
  port: 3001,
  open: false,
  notify: false
};

/**
 * CSSのコンパイルと最適化
 */
function styles() {
  const plugins = [
    autoprefixer({ overrideBrowserslist: ['> 1%', 'last 2 versions', 'ie >= 11'] })
  ];
  
  if (!isDev) {
    plugins.push(cssnano({ preset: 'default' }));
  }
  
  return gulp.src([paths.src.styles, paths.src.lightningtalk.css])
    .pipe(isDev ? sourcemaps.init() : gulp.dest('./temp'))
    .pipe(sass({ outputStyle: isDev ? 'expanded' : 'compressed' }).on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(concat('lightningtalk.css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(isDev ? sourcemaps.write('.') : gulp.dest('./temp'))
    .pipe(gulp.dest(paths.dest.styles))
    .pipe(browserSync.stream());
}

/**
 * JavaScriptのコンパイルと最適化
 */
function scripts() {
  return gulp.src([paths.src.scripts, paths.src.lightningtalk.js])
    .pipe(isDev ? sourcemaps.init() : gulp.dest('./temp'))
    .pipe(babel({
      presets: [
        ['@babel/preset-env', {
          targets: { browsers: ['> 1%', 'last 2 versions', 'ie >= 11'] }
        }]
      ]
    }))
    .pipe(concat('lightningtalk.js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(isDev ? gulp.dest('./temp') : uglify())
    .pipe(isDev ? sourcemaps.write('.') : gulp.dest('./temp'))
    .pipe(gulp.dest(paths.dest.scripts))
    .pipe(browserSync.stream());
}

/**
 * 画像の最適化
 */
function images() {
  return gulp.src(paths.src.images)
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.mozjpeg({ quality: 85, progressive: true }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: false },
          { cleanupIDs: false }
        ]
      })
    ]))
    .pipe(gulp.dest(paths.dest.images));
}

/**
 * WebP画像の生成
 */
function webpImages() {
  return gulp.src(paths.dest.images + '/**/*.{jpg,jpeg,png}')
    .pipe(webp({ quality: 85 }))
    .pipe(gulp.dest(paths.dest.images));
}

/**
 * WordPress管理画面用のスクリプト
 */
function adminScripts() {
  return gulp.src('src/js/admin/*.js')
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(concat('admin.js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(isDev ? gulp.dest('./temp') : uglify())
    .pipe(gulp.dest(paths.dest.scripts));
}

/**
 * WordPress管理画面用のスタイル
 */
function adminStyles() {
  const plugins = [autoprefixer()];
  if (!isDev) plugins.push(cssnano());
  
  return gulp.src('src/styles/admin/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(concat('admin.css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.dest.styles));
}

/**
 * PHPファイルの構文チェック
 */
function phpLint() {
  const { exec } = require('child_process');
  
  return new Promise((resolve, reject) => {
    exec('php -l wordpress/lightningtalk-child/functions.php', (error, stdout, stderr) => {
      if (error) {
        console.error('PHP構文エラー:', stderr);
        reject(error);
      } else {
        console.log('PHP構文チェック: OK');
        resolve();
      }
    });
  });
}

/**
 * ファイルのクリーンアップ
 */
function clean() {
  return del([
    paths.dest.styles + '/**/*',
    paths.dest.scripts + '/**/*',
    paths.dest.images + '/**/*'
  ]);
}

/**
 * WordPress テーマのZIPパッケージ作成
 */
function packageTheme() {
  return gulp.src([
    'wordpress/lightningtalk-child/**/*',
    '!wordpress/lightningtalk-child/node_modules/**',
    '!wordpress/lightningtalk-child/src/**',
    '!wordpress/lightningtalk-child/gulpfile.js',
    '!wordpress/lightningtalk-child/package*.json'
  ])
    .pipe(zip('lightningtalk-child.zip'))
    .pipe(gulp.dest('dist'));
}

/**
 * BrowserSyncの初期化
 */
function initBrowserSync(done) {
  browserSync.init({
    proxy: wpConfig.proxy,
    port: wpConfig.port,
    open: wpConfig.open,
    notify: wpConfig.notify,
    files: [
      paths.dest.styles + '/**/*.css',
      paths.dest.scripts + '/**/*.js',
      paths.watch.php
    ]
  });
  done();
}

/**
 * BrowserSyncのリロード
 */
function reload(done) {
  browserSync.reload();
  done();
}

/**
 * ファイル監視
 */
function watchFiles() {
  gulp.watch(paths.watch.styles, styles);
  gulp.watch(paths.watch.scripts, scripts);
  gulp.watch(paths.src.images, images);
  gulp.watch('src/js/admin/*.js', adminScripts);
  gulp.watch('src/styles/admin/*.scss', adminStyles);
  gulp.watch(paths.watch.php, reload);
}

/**
 * Lightning Talk元ファイルの統合
 */
function integrateLightningTalk() {
  // CSSの統合
  gulp.src([
    'public/css/style.css',
    'src/styles/wordpress-integration.scss'
  ])
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(concat('lightningtalk-integrated.css'))
    .pipe(gulp.dest('src/styles/compiled'));
  
  // JSの統合
  return gulp.src([
    'public/js/main.js',
    'src/js/wordpress-adapter.js'
  ])
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(concat('lightningtalk-integrated.js'))
    .pipe(gulp.dest('src/js/compiled'));
}

/**
 * Storybook アセットの同期
 */
function syncStorybook() {
  return gulp.src('stories/assets/**/*')
    .pipe(gulp.dest(paths.dest.theme + '/storybook-assets'));
}

/**
 * WordPress環境での開発用セットアップ
 */
function wpDevSetup(done) {
  console.log(`
🚀 WordPress開発環境セットアップ完了！

📍 設定:
   - Proxy: ${wpConfig.proxy}
   - Port: ${wpConfig.port}
   - Theme: lightningtalk-child

📂 ディレクトリ構造:
   - wordpress/lightningtalk-child/ (WordPressテーマ)
   - src/ (ソースファイル)
   - assets/dist/ (ビルド後ファイル)

🔧 開発コマンド:
   - npm run wp:dev (開発サーバー起動)
   - npm run wp:build (本番ビルド)
   - npm run wp:package (テーマパッケージ作成)

⚡ Next Steps:
   1. WordPressにlightningtalk-childテーマをアップロード
   2. Cocoonを親テーマとして設定
   3. Lightning Talkイベントを作成
  `);
  done();
}

// タスクの定義
const build = gulp.series(
  clean,
  gulp.parallel(
    styles,
    scripts,
    adminStyles,
    adminScripts,
    images,
    integrateLightningTalk,
    syncStorybook
  ),
  webpImages
);

const dev = gulp.series(
  build,
  initBrowserSync,
  watchFiles
);

// エクスポート
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.webpImages = webpImages;
exports.adminStyles = adminStyles;
exports.adminScripts = adminScripts;
exports.clean = clean;
exports.phpLint = phpLint;
exports.package = packageTheme;
exports.integrate = integrateLightningTalk;
exports.storybook = syncStorybook;
exports.setup = wpDevSetup;

exports.build = build;
exports.dev = dev;
exports.default = dev;