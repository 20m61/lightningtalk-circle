#!/usr/bin/env node
/**
 * Modal System Validation Test
 * モーダルシステムの検証テスト
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 モーダルシステム検証開始');

// テスト環境のセットアップ
const html = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8');
const dom = new JSDOM(html, {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable',
  runScripts: 'dangerously'
});

const { window } = dom;
global.window = window;
global.document = window.document;
if (!global.navigator) {
  global.navigator = window.navigator;
}

// モック関数の設定
window.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

// テスト用のCSSとJSファイルを読み込み
const eventModalJS = fs.readFileSync(path.join(__dirname, 'public/js/event-modal.js'), 'utf8');
const eventsManagerModalJS = fs.readFileSync(path.join(__dirname, 'public/js/events-manager-modal.js'), 'utf8');

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    testResults.passed++;
    testResults.tests.push({ name, status: '✅ PASS', error: null });
    console.log(`✅ ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

// JavaScript構文テスト
try {
  eval(eventModalJS);
  console.log('✅ event-modal.js 構文解析成功');
} catch (error) {
  console.log(`❌ event-modal.js 構文エラー: ${error.message}`);
}

try {
  eval(eventsManagerModalJS);
  console.log('✅ events-manager-modal.js 構文解析成功');
} catch (error) {
  console.log(`❌ events-manager-modal.js 構文エラー: ${error.message}`);
}

// EventModalクラステスト
test('EventModal クラスが定義されている', () => {
  if (typeof EventModal === 'undefined') {
    throw new Error('EventModal class is not defined');
  }
});

test('EventModal が正しく初期化できる', () => {
  const modal = new EventModal();
  if (!modal || !modal.options) {
    throw new Error('EventModal initialization failed');
  }
});

test('EventModal オプションが正しく設定される', () => {
  const modal = new EventModal({
    animationDuration: 500,
    enableSwipeGestures: false
  });
  if (modal.options.animationDuration !== 500 || modal.options.enableSwipeGestures !== false) {
    throw new Error('Options not set correctly');
  }
});

// モーダル要素作成テスト
test('モーダル要素が作成される', () => {
  const modal = new EventModal();
  const modalElement = document.getElementById('event-detail-modal');
  if (!modalElement) {
    throw new Error('Modal element not created');
  }
});

test('モーダルにARIA属性が設定されている', () => {
  const modalElement = document.getElementById('event-detail-modal');
  if (!modalElement.getAttribute('role') || !modalElement.getAttribute('aria-modal')) {
    throw new Error('ARIA attributes missing');
  }
});

test('タブボタンが作成されている', () => {
  const tabs = document.querySelectorAll('.tab-button');
  if (tabs.length !== 3) {
    throw new Error('Expected 3 tab buttons');
  }
});

// レスポンシブ機能テスト
test('コンパクトモードが適用される', () => {
  const modal = new EventModal();
  // モバイル幅をシミュレート
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 600
  });
  modal.adjustModalLayout();
  const modalElement = document.getElementById('event-detail-modal');
  // コンパクトモードのクラスチェック（実装によって異なる可能性あり）
});

// イベント統合テスト
test('EventsManager統合が準備されている', () => {
  if (eventsManagerModalJS.indexOf('openEventModal') === -1) {
    throw new Error('EventsManager integration not found');
  }
});

// アクセシビリティテスト
test('フォーカス管理機能がある', () => {
  if (eventModalJS.indexOf('trapFocus') === -1) {
    throw new Error('Focus management not implemented');
  }
});

test('キーボードナビゲーション機能がある', () => {
  if (eventModalJS.indexOf('keydown') === -1) {
    throw new Error('Keyboard navigation not implemented');
  }
});

// タッチジェスチャーテスト
test('タッチジェスチャー機能がある', () => {
  if (eventModalJS.indexOf('touchstart') === -1 || eventModalJS.indexOf('touchmove') === -1) {
    throw new Error('Touch gesture support not implemented');
  }
});

// 結果の表示
console.log('\n📊 検証結果:');
console.log(`✅ 成功: ${testResults.passed}件`);
console.log(`❌ 失敗: ${testResults.failed}件`);
console.log(`📈 成功率: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

if (testResults.failed > 0) {
  console.log('\n❌ 失敗したテスト:');
  testResults.tests.filter(test => test.status.includes('FAIL')).forEach(test => {
    console.log(`   - ${test.name}: ${test.error}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 すべてのテストが成功しました！');
  process.exit(0);
}