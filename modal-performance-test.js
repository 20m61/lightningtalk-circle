#!/usr/bin/env node
/**
 * Modal Performance Test
 * モーダルパフォーマンステスト
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('⚡ モーダルパフォーマンステスト開始\n');

// ファイルサイズ測定
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// パフォーマンス指標
const performanceMetrics = {
  files: {
    'event-modal.js': getFileSize(path.join(__dirname, 'public/js/event-modal.js')),
    'events-manager-modal.js': getFileSize(path.join(__dirname, 'public/js/events-manager-modal.js')),
    'event-modal.css': getFileSize(path.join(__dirname, 'public/css/event-modal.css'))
  }
};

console.log('📁 ファイルサイズ分析:');
let totalSize = 0;
for (const [file, size] of Object.entries(performanceMetrics.files)) {
  console.log(`   ${file}: ${formatBytes(size)}`);
  totalSize += size;
}
console.log(`   合計: ${formatBytes(totalSize)}\n`);

// コード複雑度分析
function analyzeCodeComplexity(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const lines = code.split('\n').length;
    const functions = (code.match(/function\s+\w+|=>\s*{|\w+\s*\(/g) || []).length;
    const events = (code.match(/addEventListener|on\w+\s*=/g) || []).length;
    const classes = (code.match(/class\s+\w+/g) || []).length;
    
    return { lines, functions, events, classes };
  } catch (error) {
    return { lines: 0, functions: 0, events: 0, classes: 0 };
  }
}

console.log('🔍 コード複雑度分析:');
const eventModalStats = analyzeCodeComplexity(path.join(__dirname, 'public/js/event-modal.js'));
const eventsManagerStats = analyzeCodeComplexity(path.join(__dirname, 'public/js/events-manager-modal.js'));

console.log('   event-modal.js:');
console.log(`     - 行数: ${eventModalStats.lines}`);
console.log(`     - 関数数: ${eventModalStats.functions}`);
console.log(`     - イベント数: ${eventModalStats.events}`);
console.log(`     - クラス数: ${eventModalStats.classes}`);

console.log('   events-manager-modal.js:');
console.log(`     - 行数: ${eventsManagerStats.lines}`);
console.log(`     - 関数数: ${eventsManagerStats.functions}`);
console.log(`     - イベント数: ${eventsManagerStats.events}`);
console.log(`     - クラス数: ${eventsManagerStats.classes}\n`);

// パフォーマンス最適化チェック
function checkOptimizations(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const optimizations = [];
    
    if (code.includes('debounce')) {
      optimizations.push('✅ debounce使用');
    }
    if (code.includes('passive: true')) {
      optimizations.push('✅ passiveリスナー使用');
    }
    if (code.includes('requestAnimationFrame')) {
      optimizations.push('✅ requestAnimationFrame使用');
    }
    if (code.includes('setTimeout')) {
      optimizations.push('⚠️  setTimeout使用（最適化可能）');
    }
    if (code.includes('querySelector')) {
      optimizations.push('⚠️  querySelector使用（キャッシュ推奨）');
    }
    
    return optimizations;
  } catch (error) {
    return [];
  }
}

console.log('🚀 パフォーマンス最適化チェック:');
const eventModalOptimizations = checkOptimizations(path.join(__dirname, 'public/js/event-modal.js'));
const eventsManagerOptimizations = checkOptimizations(path.join(__dirname, 'public/js/events-manager-modal.js'));

console.log('   event-modal.js:');
eventModalOptimizations.forEach(opt => console.log(`     ${opt}`));

console.log('   events-manager-modal.js:');
eventsManagerOptimizations.forEach(opt => console.log(`     ${opt}`));

// レスポンシブ対応チェック
function checkResponsive() {
  try {
    const cssCode = fs.readFileSync(path.join(__dirname, 'public/css/event-modal.css'), 'utf8');
    const mediaQueries = (cssCode.match(/@media[^{]+{/g) || []).length;
    const viewportUnits = (cssCode.match(/\d+vw|\d+vh|\d+vmin|\d+vmax/g) || []).length;
    const flexbox = cssCode.includes('display: flex');
    const grid = cssCode.includes('display: grid');
    
    return { mediaQueries, viewportUnits, flexbox, grid };
  } catch (error) {
    return { mediaQueries: 0, viewportUnits: 0, flexbox: false, grid: false };
  }
}

console.log('\n📱 レスポンシブデザインチェック:');
const responsiveStats = checkResponsive();
console.log(`   メディアクエリ数: ${responsiveStats.mediaQueries}`);
console.log(`   ビューポート単位使用: ${responsiveStats.viewportUnits}箇所`);
console.log(`   Flexbox使用: ${responsiveStats.flexbox ? '✅' : '❌'}`);
console.log(`   Grid使用: ${responsiveStats.grid ? '✅' : '❌'}`);

// 総合評価
console.log('\n📊 総合パフォーマンス評価:');

let score = 0;
let maxScore = 0;

// ファイルサイズ評価 (25点満点)
maxScore += 25;
if (totalSize < 50 * 1024) { // 50KB未満
  score += 25;
  console.log('✅ ファイルサイズ: 優秀 (25/25)');
} else if (totalSize < 100 * 1024) { // 100KB未満
  score += 20;
  console.log('🟡 ファイルサイズ: 良好 (20/25)');
} else {
  score += 15;
  console.log('🟠 ファイルサイズ: 改善推奨 (15/25)');
}

// コード品質評価 (25点満点)
maxScore += 25;
const totalFunctions = eventModalStats.functions + eventsManagerStats.functions;
if (totalFunctions < 30) {
  score += 25;
  console.log('✅ 関数複雑度: 優秀 (25/25)');
} else if (totalFunctions < 50) {
  score += 20;
  console.log('🟡 関数複雑度: 良好 (20/25)');
} else {
  score += 15;
  console.log('🟠 関数複雑度: 改善推奨 (15/25)');
}

// 最適化評価 (25点満点)
maxScore += 25;
const allOptimizations = [...eventModalOptimizations, ...eventsManagerOptimizations];
const positiveOptimizations = allOptimizations.filter(opt => opt.includes('✅')).length;
if (positiveOptimizations >= 3) {
  score += 25;
  console.log('✅ 最適化: 優秀 (25/25)');
} else if (positiveOptimizations >= 2) {
  score += 20;
  console.log('🟡 最適化: 良好 (20/25)');
} else {
  score += 15;
  console.log('🟠 最適化: 改善推奨 (15/25)');
}

// レスポンシブ評価 (25点満点)
maxScore += 25;
if (responsiveStats.mediaQueries >= 2 && responsiveStats.flexbox) {
  score += 25;
  console.log('✅ レスポンシブ: 優秀 (25/25)');
} else if (responsiveStats.mediaQueries >= 1) {
  score += 20;
  console.log('🟡 レスポンシブ: 良好 (20/25)');
} else {
  score += 15;
  console.log('🟠 レスポンシブ: 改善推奨 (15/25)');
}

const finalScore = Math.round((score / maxScore) * 100);
console.log(`\n🏆 総合スコア: ${score}/${maxScore} (${finalScore}%)`);

if (finalScore >= 90) {
  console.log('🎉 優秀なパフォーマンスです！');
} else if (finalScore >= 80) {
  console.log('👍 良好なパフォーマンスです。');
} else if (finalScore >= 70) {
  console.log('🔧 改善の余地があります。');
} else {
  console.log('⚠️  最適化が必要です。');
}

console.log('\n💡 推奨改善点:');
if (totalSize > 50 * 1024) {
  console.log('   - ファイルサイズの最適化（ミニファイ、gzip圧縮）');
}
if (totalFunctions > 30) {
  console.log('   - 関数の分割とモジュール化');
}
if (allOptimizations.some(opt => opt.includes('querySelector'))) {
  console.log('   - DOM要素のキャッシュ化');
}
if (responsiveStats.mediaQueries < 2) {
  console.log('   - より詳細なレスポンシブ対応');
}

process.exit(0);