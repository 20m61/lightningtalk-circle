#!/usr/bin/env node
/**
 * Button Action Analysis Tool
 * ボタンアクション実装状況の分析
 */

const fs = require('fs');

console.log('🔍 ボタンアクション検証レポート');
console.log('='.repeat(50));

// HTML内のdata-action属性をチェック
const html = fs.readFileSync('public/index.html', 'utf8');
const actionRegex = /data-action=["']([^"']*)["']/g;
const htmlActions = [];
let match;
while ((match = actionRegex.exec(html)) !== null) {
  htmlActions.push(match[1]);
}

console.log('\n📍 HTML内のdata-action属性:');
htmlActions.forEach(action => {
  console.log('  -', action);
});

// main.jsのhandleAction実装をチェック
const mainJs = fs.readFileSync('public/js/main.js', 'utf8');
const handleActionMatch = mainJs.match(/handleAction\(action, element\)\s*\{[\s\S]*?^\s*\}/m);
const jsActions = [];

if (handleActionMatch) {
  const caseRegex = /case\s+["']([^"']*)["']:/g;
  let caseMatch;
  while ((caseMatch = caseRegex.exec(handleActionMatch[0])) !== null) {
    jsActions.push(caseMatch[1]);
  }
}

console.log('\n📍 handleAction実装済みケース:');
jsActions.forEach(action => {
  console.log('  ✅', action);
});

console.log('\n🔍 実装状況チェック:');
htmlActions.forEach(action => {
  if (!jsActions.includes(action)) {
    console.log('  ❌ 未実装:', action);
  } else {
    console.log('  ✅ 実装済み:', action);
  }
});

// 追加のJavaScriptファイル内のdata-action使用状況をチェック
const jsFiles = ['events-manager.js', 'chat-system.js'];
console.log('\n📍 その他JSファイルのdata-action使用:');

jsFiles.forEach(file => {
  try {
    const jsContent = fs.readFileSync(`public/js/${file}`, 'utf8');
    const jsActionRegex = /data-action=["']([^"']*)["']/g;
    const matches = [];
    let jsMatch;
    while ((jsMatch = jsActionRegex.exec(jsContent)) !== null) {
      matches.push(jsMatch[1]);
    }
    if (matches.length > 0) {
      console.log(`  ${file}:`, matches.join(', '));
    }
  } catch (e) {
    console.log(`  ${file}: ファイル未検出`);
  }
});

console.log('\n📊 サマリー:');
console.log('  HTML内のアクション数:', htmlActions.length);
console.log('  実装済みアクション数:', jsActions.length);
console.log('  未実装アクション数:', htmlActions.filter(a => !jsActions.includes(a)).length);