#!/usr/bin/env node

/**
 * リンク動作テストスクリプト
 * main.js内でリンクがどのように処理されているかを確認
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testLinkBehavior() {
  console.log('🔍 リンク動作分析を開始します...\n');

  try {
    // main.jsの内容を確認
    const mainJsPath = path.join(__dirname, 'public', 'js', 'main.js');
    const mainJsContent = await fs.readFile(mainJsPath, 'utf-8');

    console.log('📄 main.js のリンク関連コードを分析中...');

    // イベントリスナーやクリックハンドラーを探す
    const clickHandlerPatterns = [
      /addEventListener\s*\(\s*['"]click['"]/g,
      /onclick\s*=/g,
      /\.click\s*\(/g,
      /e\.preventDefault\s*\(\)/g,
      /window\.location/g,
      /href\s*=/g
    ];

    let foundPatterns = [];
    clickHandlerPatterns.forEach((pattern, index) => {
      const matches = mainJsContent.match(pattern);
      if (matches) {
        foundPatterns.push({
          pattern: pattern.toString(),
          count: matches.length,
          matches: matches
        });
      }
    });

    if (foundPatterns.length > 0) {
      console.log('\n✅ 以下のパターンが見つかりました:');
      foundPatterns.forEach(({ pattern, count, matches }) => {
        console.log(`  - ${pattern}: ${count}回`);
        if (pattern.includes('preventDefault')) {
          console.log(
            '    ⚠️  preventDefault()が使用されています - リンクのデフォルト動作が阻止されている可能性があります'
          );
        }
      });
    }

    // イベント委譲パターンを探す
    const delegationPattern = /document\.(body|addEventListener).*click/gi;
    const delegationMatches = mainJsContent.match(delegationPattern);
    if (delegationMatches) {
      console.log('\n⚠️  イベント委譲パターンが検出されました:');
      console.log('  グローバルなクリックハンドラーがリンクの動作に影響している可能性があります');
    }

    // Service Worker関連のコードを探す
    const swPattern = /serviceWorker|caches|fetch.*event/gi;
    const swMatches = mainJsContent.match(swPattern);
    if (swMatches) {
      console.log('\n⚠️  Service Worker関連のコードが検出されました:');
      console.log('  Service Workerがナビゲーションをインターセプトしている可能性があります');
    }

    // 修正案の提示
    console.log('\n📝 修正案:');
    console.log('1. フッターリンクに明示的なクリックハンドラーを追加');
    console.log('2. preventDefault()を使用している箇所を確認し、必要に応じて削除');
    console.log('3. Service Workerのキャッシュ戦略を確認');

    // 修正スクリプトの生成
    const fixScript = `
// フッターリンクの修正スクリプト
document.addEventListener('DOMContentLoaded', () => {
  // フッターリンクを明示的に処理
  const footerLinks = document.querySelectorAll('.footer-links a');
  
  footerLinks.forEach(link => {
    // 既存のイベントリスナーを削除
    const newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);
    
    // 新しいクリックハンドラーを追加
    newLink.addEventListener('click', (e) => {
      // 外部リンクでない場合は通常の動作を許可
      if (!newLink.hostname || newLink.hostname === window.location.hostname) {
        // デフォルト動作を許可（preventDefault()を呼ばない）
        console.log('Navigating to:', newLink.href);
      }
    });
  });
  
  console.log('✅ Footer links fixed');
});
`;

    const fixPath = path.join(__dirname, 'public', 'js', 'fix-footer-links.js');
    await fs.writeFile(fixPath, fixScript);
    console.log(`\n✅ 修正スクリプトを作成しました: ${fixPath}`);

    // dist にもコピー
    const distFixPath = path.join(__dirname, 'dist', 'js', 'fix-footer-links.js');
    await fs.copyFile(fixPath, distFixPath);
    console.log(`✅ distディレクトリにもコピーしました: ${distFixPath}`);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }
}

// 実行
testLinkBehavior().catch(console.error);
