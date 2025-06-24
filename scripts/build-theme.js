#!/usr/bin/env node

/**
 * WordPress Theme Build Script with Timestamp
 *
 * ビルド結果にタイムスタンプを付与してdistディレクトリに出力
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

// タイムスタンプ生成（YYYYMMDD-HHMMSS形式）
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

// ビルド設定
const config = {
  sourceDir: path.join(__dirname, '../wordpress/lightningtalk-child'),
  distDir: path.join(__dirname, '../dist'),
  tempDir: path.join(__dirname, '../.tmp/build'),
  themeName: 'lightningtalk-child',
  timestamp: getTimestamp()
};

// ビルド情報
const buildInfo = {
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  timestamp: config.timestamp,
  environment: process.env.NODE_ENV || 'production'
};

// 除外ファイル・ディレクトリ
const excludePatterns = [
  'node_modules',
  '.git',
  '.gitignore',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  '.env',
  '.env.local',
  '*.map',
  'src/',
  '*.scss',
  '*.ts',
  '*.tsx',
  'package.json',
  'package-lock.json',
  'README.md',
  'webpack.config.js',
  'gulpfile.js'
];

async function ensureDirectories() {
  console.log('📁 ディレクトリを準備しています...');

  // distディレクトリ構造を作成
  const dirs = [
    config.distDir,
    path.join(config.distDir, 'themes'),
    path.join(config.distDir, 'builds'),
    path.join(config.distDir, 'archives'),
    config.tempDir
  ];

  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
}

async function cleanTempDirectory() {
  console.log('🧹 一時ディレクトリをクリーンアップしています...');
  await fs.remove(config.tempDir);
  await fs.ensureDir(config.tempDir);
}

async function copyThemeFiles() {
  console.log('📋 テーマファイルをコピーしています...');

  const targetDir = path.join(config.tempDir, config.themeName);
  await fs.ensureDir(targetDir);

  // ソースディレクトリの存在確認
  if (!await fs.pathExists(config.sourceDir)) {
    throw new Error(`ソースディレクトリが見つかりません: ${config.sourceDir}`);
  }

  // ファイルをコピー（除外パターンを考慮）
  const files = await fs.readdir(config.sourceDir);

  for (const file of files) {
    const shouldExclude = excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(file);
      }
      return file === pattern;
    });

    if (!shouldExclude) {
      const sourcePath = path.join(config.sourceDir, file);
      const targetPath = path.join(targetDir, file);
      await fs.copy(sourcePath, targetPath);
    }
  }

  // ビルド情報ファイルを追加
  const buildInfoPath = path.join(targetDir, 'build-info.json');
  await fs.writeJson(buildInfoPath, buildInfo, { spaces: 2 });
}

async function runAssetBuild() {
  console.log('🔨 アセットをビルドしています...');

  try {
    // npm run buildが存在する場合は実行
    if (await fs.pathExists(path.join(config.sourceDir, 'package.json'))) {
      execSync('npm run build', {
        cwd: config.sourceDir,
        stdio: 'inherit'
      });
    }
  } catch (error) {
    console.warn('⚠️  アセットビルドをスキップしました:', error.message);
  }
}

async function createZipArchive() {
  console.log('📦 ZIPアーカイブを作成しています...');

  const zipFileName = `${config.themeName}_${config.timestamp}.zip`;
  const zipPath = path.join(config.distDir, 'themes', zipFileName);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高圧縮レベル
    });

    output.on('close', () => {
      const size = (archive.pointer() / 1024).toFixed(2);
      console.log(`✅ ZIPファイル作成完了: ${zipFileName} (${size} KB)`);
      resolve({ fileName: zipFileName, path: zipPath, size: archive.pointer() });
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(config.tempDir, false);
    archive.finalize();
  });
}

async function createBuildManifest(zipInfo) {
  console.log('📝 ビルドマニフェストを作成しています...');

  const manifest = {
    build: {
      ...buildInfo,
      files: {
        theme: zipInfo.fileName,
        size: zipInfo.size,
        sizeHuman: `${(zipInfo.size / 1024).toFixed(2)} KB`
      }
    },
    theme: {
      name: config.themeName,
      version: buildInfo.version,
      parent: 'cocoon',
      description: 'Lightning Talk Event Management Child Theme'
    },
    deployment: {
      targetUrl: process.env.WP_SITE_URL || 'https://xn--6wym69a.com',
      targetPath: `/wp-content/themes/${config.themeName}/`
    },
    checksums: {
      md5: await generateChecksum(zipInfo.path, 'md5'),
      sha256: await generateChecksum(zipInfo.path, 'sha256')
    }
  };

  const manifestPath = path.join(config.distDir, 'builds', `build-manifest_${config.timestamp}.json`);
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });

  // 最新ビルドへのシンボリックリンクを作成（Windowsでない場合）
  if (process.platform !== 'win32') {
    const latestLink = path.join(config.distDir, 'themes', `${config.themeName}_latest.zip`);
    const latestManifest = path.join(config.distDir, 'builds', 'build-manifest_latest.json');

    try {
      await fs.remove(latestLink);
      await fs.remove(latestManifest);
      await fs.symlink(zipInfo.path, latestLink);
      await fs.symlink(manifestPath, latestManifest);
    } catch (error) {
      console.warn('⚠️  シンボリックリンクの作成をスキップしました');
    }
  }

  return manifest;
}

async function generateChecksum(filePath, algorithm) {
  const crypto = require('crypto');
  const fileBuffer = await fs.readFile(filePath);
  const hash = crypto.createHash(algorithm);
  hash.update(fileBuffer);
  return hash.digest('hex');
}

async function archiveOldBuilds() {
  console.log('🗄️  古いビルドをアーカイブしています...');

  const themesDir = path.join(config.distDir, 'themes');
  const files = await fs.readdir(themesDir);

  // タイムスタンプ付きのZIPファイルを取得
  const themeFiles = files
    .filter(f => f.startsWith(config.themeName) && f.endsWith('.zip'))
    .filter(f => f !== `${config.themeName}_latest.zip`);

  // 最新5件を残して古いものをアーカイブ
  if (themeFiles.length > 5) {
    const sortedFiles = themeFiles.sort().reverse();
    const toArchive = sortedFiles.slice(5);

    for (const file of toArchive) {
      const sourcePath = path.join(themesDir, file);
      const archivePath = path.join(config.distDir, 'archives', file);
      await fs.move(sourcePath, archivePath);
      console.log(`  📁 アーカイブ: ${file}`);
    }
  }
}

async function generateBuildReport(manifest) {
  console.log('📊 ビルドレポートを生成しています...');

  const report = `
# ビルドレポート

## ビルド情報
- **日時**: ${new Date().toLocaleString('ja-JP')}
- **タイムスタンプ**: ${config.timestamp}
- **バージョン**: ${manifest.theme.version}
- **環境**: ${manifest.build.environment}

## ファイル情報
- **ファイル名**: ${manifest.build.files.theme}
- **サイズ**: ${manifest.build.files.sizeHuman}
- **MD5**: ${manifest.checksums.md5}
- **SHA256**: ${manifest.checksums.sha256}

## デプロイ情報
- **ターゲットURL**: ${manifest.deployment.targetUrl}
- **インストールパス**: ${manifest.deployment.targetPath}

## 次のステップ
1. \`dist/themes/${manifest.build.files.theme}\` をWordPressにアップロード
2. 管理画面でテーマを有効化
3. 動作確認を実施

## コマンド例
\`\`\`bash
# デプロイ
npm run deploy:wordpress

# 手動アップロード
scp dist/themes/${manifest.build.files.theme} user@server:/path/to/wordpress/wp-content/themes/
\`\`\`
`;

  const reportPath = path.join(config.distDir, 'builds', `build-report_${config.timestamp}.md`);
  await fs.writeFile(reportPath, report.trim());

  console.log(`\n${report}`);
}

async function main() {
  console.log('🚀 WordPress テーマビルドを開始します...\n');

  try {
    // 1. ディレクトリ準備
    await ensureDirectories();

    // 2. 一時ディレクトリクリーンアップ
    await cleanTempDirectory();

    // 3. テーマファイルコピー
    await copyThemeFiles();

    // 4. アセットビルド
    await runAssetBuild();

    // 5. ZIPアーカイブ作成
    const zipInfo = await createZipArchive();

    // 6. ビルドマニフェスト作成
    const manifest = await createBuildManifest(zipInfo);

    // 7. 古いビルドをアーカイブ
    await archiveOldBuilds();

    // 8. ビルドレポート生成
    await generateBuildReport(manifest);

    // 9. 一時ディレクトリクリーンアップ
    await cleanTempDirectory();

    console.log('\n✨ ビルドが正常に完了しました！');
    console.log(`📦 出力先: dist/themes/${zipInfo.fileName}`);

  } catch (error) {
    console.error('❌ ビルドエラー:', error.message);
    process.exit(1);
  }
}

// メイン処理を実行
if (require.main === module) {
  main();
}

module.exports = { getTimestamp, config };
