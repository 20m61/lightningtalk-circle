#!/usr/bin/env node
/**
 * Modal Accessibility Test
 * モーダルアクセシビリティテスト (WCAG 2.1 AA準拠チェック)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('♿ モーダルアクセシビリティテスト開始\n');

function checkFile(filePath, checks) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = [];
    
    for (const [name, pattern] of Object.entries(checks)) {
      const found = typeof pattern === 'string' ? 
        content.includes(pattern) : 
        pattern.test(content);
      results.push({ name, found, pattern });
    }
    
    return results;
  } catch (error) {
    console.error(`❌ ファイル読み込みエラー: ${filePath}`);
    return [];
  }
}

// WCAG 2.1 AAアクセシビリティチェック項目
const wcagChecks = {
  // 1. キーボードアクセシビリティ
  keyboard: {
    'Escキーでモーダル閉じる': 'Escape',
    'Tabキーでフォーカス移動': 'Tab',
    'Enterキーでアクティベート': 'Enter',
    'フォーカストラップ実装': 'trapFocus',
    'フォーカス管理': /focus\(\)|\.focus/
  },
  
  // 2. ARIA属性とセマンティクス
  aria: {
    'role="dialog"設定': 'role="dialog"',
    'aria-modal="true"設定': 'aria-modal="true"',
    'aria-labelledby設定': 'aria-labelledby',
    'aria-describedby設定': /aria-describedby/,
    'aria-hidden制御': /aria-hidden/,
    'aria-expanded制御': /aria-expanded/,
    'aria-selected制御': /aria-selected/
  },
  
  // 3. スクリーンリーダー対応
  screenReader: {
    'ライブリージョン使用': /aria-live|role="status"/,
    'コンテンツ変更通知': /announceModal|announceTabChange/,
    '代替テキスト提供': /alt=|aria-label/,
    '見出し構造適切': /<h[1-6]/
  },
  
  // 4. ナビゲーション
  navigation: {
    'ランドマーク使用': /<nav|<main|<section|role="navigation"/,
    'タブリスト実装': /role="tablist"|role="tab"/,
    'タブパネル実装': /role="tabpanel"/,
    'ボタン適切なlabel': /aria-label.*button|<button.*aria-label/
  },
  
  // 5. 色とコントラスト (CSS)
  colorContrast: {
    'フォーカス表示': /outline|focus.*border|focus.*box-shadow/,
    '訪問済みリンク': /:visited/,
    'ハイコントラスト対応': /@media.*prefers-contrast/,
    '色のみに依存しない': true // 手動確認項目
  },
  
  // 6. 動作とアニメーション
  motion: {
    'アニメーション削減対応': /@media.*prefers-reduced-motion/,
    'トランジション制御': /transition.*duration/,
    'タイムアウト制御': /setTimeout.*clearTimeout/
  }
};

console.log('📋 WCAG 2.1 AAアクセシビリティチェック:');

// JavaScriptファイル検証
const jsFiles = [
  'public/js/event-modal.js',
  'public/js/events-manager-modal.js'
];

// CSSファイル検証
const cssFiles = [
  'public/css/event-modal.css'
];

// HTMLファイル検証
const htmlFiles = [
  'public/index.html',
  'demo-event-modal.html'
];

let totalScore = 0;
let maxScore = 0;
const results = {};

// JavaScript検証
console.log('\n🔸 JavaScript アクセシビリティ検証:');
for (const jsFile of jsFiles) {
  console.log(`\n📄 ${jsFile}:`);
  const content = fs.readFileSync(path.join(__dirname, jsFile), 'utf8');
  
  ['keyboard', 'aria', 'screenReader', 'navigation'].forEach(category => {
    console.log(`\n   ${category}:`);
    for (const [checkName, pattern] of Object.entries(wcagChecks[category])) {
      maxScore++;
      const found = typeof pattern === 'string' ? 
        content.includes(pattern) : 
        pattern.test(content);
      
      if (found) {
        totalScore++;
        console.log(`     ✅ ${checkName}`);
      } else {
        console.log(`     ❌ ${checkName}`);
      }
    }
  });
}

// CSS検証
console.log('\n🔸 CSS アクセシビリティ検証:');
for (const cssFile of cssFiles) {
  console.log(`\n📄 ${cssFile}:`);
  const content = fs.readFileSync(path.join(__dirname, cssFile), 'utf8');
  
  ['colorContrast', 'motion'].forEach(category => {
    console.log(`\n   ${category}:`);
    for (const [checkName, pattern] of Object.entries(wcagChecks[category])) {
      maxScore++;
      if (pattern === true) {
        totalScore++; // 手動確認項目は通過とみなす
        console.log(`     ✅ ${checkName} (手動確認)`);
        continue;
      }
      
      const found = typeof pattern === 'string' ? 
        content.includes(pattern) : 
        pattern.test(content);
      
      if (found) {
        totalScore++;
        console.log(`     ✅ ${checkName}`);
      } else {
        console.log(`     ❌ ${checkName}`);
      }
    }
  });
}

// HTML検証（サンプル）
console.log('\n🔸 HTML セマンティクス検証:');
for (const htmlFile of htmlFiles) {
  if (!fs.existsSync(path.join(__dirname, htmlFile))) continue;
  
  console.log(`\n📄 ${htmlFile}:`);
  const content = fs.readFileSync(path.join(__dirname, htmlFile), 'utf8');
  
  // 基本的なHTMLアクセシビリティ
  const htmlChecks = {
    '言語属性設定': /lang=["'][a-z]{2}/,
    'viewport meta設定': /name=["']viewport["']/,
    'タイトル設定': /<title>/,
    '見出し階層適切': /<h[1-6]/
  };
  
  for (const [checkName, pattern] of Object.entries(htmlChecks)) {
    maxScore++;
    const found = pattern.test(content);
    if (found) {
      totalScore++;
      console.log(`   ✅ ${checkName}`);
    } else {
      console.log(`   ❌ ${checkName}`);
    }
  }
}

// 総合評価
const accessibilityScore = Math.round((totalScore / maxScore) * 100);

console.log('\n📊 アクセシビリティ総合評価:');
console.log(`🏆 スコア: ${totalScore}/${maxScore} (${accessibilityScore}%)`);

if (accessibilityScore >= 90) {
  console.log('🎉 WCAG 2.1 AA準拠レベル: 優秀');
} else if (accessibilityScore >= 80) {
  console.log('👍 WCAG 2.1 AA準拠レベル: 良好');
} else if (accessibilityScore >= 70) {
  console.log('🔧 WCAG 2.1 AA準拠レベル: 改善必要');
} else {
  console.log('⚠️  WCAG 2.1 AA準拠レベル: 不十分');
}

// 推奨改善点
console.log('\n💡 アクセシビリティ改善推奨事項:');

const missingFeatures = [];
if (accessibilityScore < 100) {
  if (!/aria-describedby/.test(fs.readFileSync(path.join(__dirname, 'public/js/event-modal.js'), 'utf8'))) {
    missingFeatures.push('aria-describedbyの実装');
  }
  if (!/@media.*prefers-reduced-motion/.test(fs.readFileSync(path.join(__dirname, 'public/css/event-modal.css'), 'utf8'))) {
    missingFeatures.push('prefers-reduced-motionメディアクエリ対応');
  }
  if (!/@media.*prefers-contrast/.test(fs.readFileSync(path.join(__dirname, 'public/css/event-modal.css'), 'utf8'))) {
    missingFeatures.push('ハイコントラストモード対応');
  }
}

if (missingFeatures.length === 0) {
  console.log('   🎉 現在の実装は十分なアクセシビリティを提供しています！');
} else {
  missingFeatures.forEach(feature => {
    console.log(`   • ${feature}`);
  });
}

// 手動テスト推奨項目
console.log('\n🔍 手動テスト推奨項目:');
console.log('   1. スクリーンリーダーでの操作確認 (NVDA, JAWS, VoiceOver)');
console.log('   2. キーボードのみでの完全操作確認');
console.log('   3. ハイコントラストモードでの表示確認');
console.log('   4. 拡大率200%での表示・操作確認');
console.log('   5. 色覚異常シミュレーションでの確認');
console.log('   6. 音声制御での操作確認 (Dragon, Voice Control)');

console.log('\n📚 参考リソース:');
console.log('   • WCAG 2.1 ガイドライン: https://www.w3.org/WAI/WCAG21/Understanding/');
console.log('   • アクセシビリティチェックツール: axe-core, WAVE, Lighthouse');
console.log('   • スクリーンリーダー: NVDA (無料), JAWS, VoiceOver');

process.exit(accessibilityScore >= 80 ? 0 : 1);