#!/usr/bin/env node
/**
 * Simple Modal System Validation
 * シンプルなモーダルシステム検証
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 モーダルシステム簡単検証開始\n');

let tests = [];

function test(name, condition) {
  if (condition) {
    tests.push({ name, status: '✅ PASS' });
    console.log(`✅ ${name}`);
  } else {
    tests.push({ name, status: '❌ FAIL' });
    console.log(`❌ ${name}`);
  }
}

try {
  // ファイル存在確認
  test('event-modal.js が存在する', 
    fs.existsSync(path.join(__dirname, 'public/js/event-modal.js')));
  
  test('events-manager-modal.js が存在する', 
    fs.existsSync(path.join(__dirname, 'public/js/events-manager-modal.js')));
  
  test('event-modal.css が存在する', 
    fs.existsSync(path.join(__dirname, 'public/css/event-modal.css')));
  
  test('demo-event-modal.html が存在する', 
    fs.existsSync(path.join(__dirname, 'demo-event-modal.html')));

  // コード内容確認
  const eventModalCode = fs.readFileSync(path.join(__dirname, 'public/js/event-modal.js'), 'utf8');
  const eventsManagerModalCode = fs.readFileSync(path.join(__dirname, 'public/js/events-manager-modal.js'), 'utf8');
  const mainCode = fs.readFileSync(path.join(__dirname, 'public/js/main.js'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8');

  // EventModal クラスの存在確認
  test('EventModal クラスが定義されている', 
    eventModalCode.includes('class EventModal'));
  
  // 主要機能の実装確認
  test('タッチジェスチャーサポートが実装されている', 
    eventModalCode.includes('touchstart') && eventModalCode.includes('touchmove'));
  
  test('キーボードナビゲーションが実装されている', 
    eventModalCode.includes('keydown') && eventModalCode.includes('Escape'));
  
  test('レスポンシブ機能が実装されている', 
    eventModalCode.includes('compact-mode') && eventModalCode.includes('adjustModalLayout'));
  
  test('アクセシビリティサポートが実装されている', 
    eventModalCode.includes('aria-modal') && eventModalCode.includes('trapFocus'));
  
  test('システム統合イベントが実装されている', 
    eventModalCode.includes('openRegistration') && eventModalCode.includes('openSurvey'));

  // EventsManager統合確認
  test('EventsManager統合が実装されている', 
    eventsManagerModalCode.includes('openEventModal') && eventsManagerModalCode.includes('EventsManager'));
  
  test('localStorage統合が実装されている', 
    eventsManagerModalCode.includes('localStorage.getItem'));

  // main.js統合確認
  test('main.jsでモーダル初期化が実装されている', 
    mainCode.includes('initEventModal') && mainCode.includes('handleModalRegistration'));

  // HTML統合確認
  test('index.htmlにモーダルスクリプトが含まれている', 
    indexHtml.includes('event-modal.js') && indexHtml.includes('events-manager-modal.js'));
  
  test('index.htmlにモーダルCSSが含まれている', 
    indexHtml.includes('event-modal.css'));

  // デモページ確認
  const demoHtml = fs.readFileSync(path.join(__dirname, 'demo-event-modal.html'), 'utf8');
  test('デモページが適切に設定されている', 
    demoHtml.includes('Event Modal Demo') && demoHtml.includes('event-modal.js'));

  // SVG可視化確認
  test('SVG可視化ファイルが存在する', 
    fs.existsSync(path.join(__dirname, 'screenshots-temp/event-modal-demo.svg')));

} catch (error) {
  console.error(`❌ エラーが発生しました: ${error.message}`);
  process.exit(1);
}

// 結果集計
const passed = tests.filter(t => t.status.includes('PASS')).length;
const failed = tests.filter(t => t.status.includes('FAIL')).length;

console.log('\n📊 検証結果:');
console.log(`✅ 成功: ${passed}件`);
console.log(`❌ 失敗: ${failed}件`);
console.log(`📈 成功率: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 すべての検証項目が成功しました！');
  console.log('✨ モーダルシステムは正常に実装されています。');
} else {
  console.log('\n⚠️  一部の検証項目で問題があります。');
  tests.filter(t => t.status.includes('FAIL')).forEach(test => {
    console.log(`   - ${test.name}`);
  });
}

console.log('\n📋 次のステップ:');
console.log('1. ブラウザでデモページ(demo-event-modal.html)を確認');
console.log('2. イベントカードクリックでモーダル表示をテスト');
console.log('3. スワイプ・キーボード操作をテスト');
console.log('4. レスポンシブ動作を確認');

process.exit(failed > 0 ? 1 : 0);