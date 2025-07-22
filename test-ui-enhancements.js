#!/usr/bin/env node
/**
 * UI/UX Enhancement Test Suite
 * UI/UX改修の動作確認スクリプト
 */

import { promises as fs } from 'fs';
import path from 'path';

console.log('🧪 UI/UX Enhancement Test Suite');
console.log('='.repeat(50));

const tests = [];

function test(name, condition, details = '') {
  const result = condition();
  tests.push({
    name,
    passed: result,
    details
  });
  
  console.log(`${result ? '✅' : '❌'} ${name}${details ? ' - ' + details : ''}`);
  return result;
}

async function runTests() {
  console.log('\n📁 ファイル存在確認:');
  
  // 新規作成ファイルの存在確認
  test('enhanced-interactions.css が作成されている', () => {
    try {
      return fs.statSync('public/css/enhanced-interactions.css').isFile();
    } catch {
      return false;
    }
  });

  test('modal-enhancements.js が作成されている', () => {
    try {
      return fs.statSync('public/js/modal-enhancements.js').isFile();
    } catch {
      return false;
    }
  });

  console.log('\n📝 コード改修確認:');

  // main.js の handleAction 拡張確認
  try {
    const mainJs = await fs.readFile('public/js/main.js', 'utf8');
    
    test('view-detail アクションが実装されている', () => {
      return mainJs.includes("case 'view-detail':");
    });

    test('チャット関連アクションが実装されている', () => {
      return mainJs.includes("case 'toggle-participants':") &&
             mainJs.includes("case 'toggle-settings':") &&
             mainJs.includes("case 'minimize':");
    });

    test('ファイル添付アクションが実装されている', () => {
      return mainJs.includes("case 'attach-file':");
    });

    test('絵文字ピッカーアクションが実装されている', () => {
      return mainJs.includes("case 'emoji':");
    });

    test('openEventDetailModal メソッドが実装されている', () => {
      return mainJs.includes('openEventDetailModal(eventId)');
    });

    test('toggleParticipantsList メソッドが実装されている', () => {
      return mainJs.includes('toggleParticipantsList()');
    });

    test('通知システムが実装されている', () => {
      return mainJs.includes('showNotification(message, type');
    });

  } catch (error) {
    console.error('❌ main.js の読み込みエラー:', error.message);
  }

  console.log('\n🎨 CSS機能確認:');

  try {
    const enhancedCss = await fs.readFile('public/css/enhanced-interactions.css', 'utf8');
    
    test('ボタン強化スタイルが含まれている', () => {
      return enhancedCss.includes('.btn:hover') && enhancedCss.includes('.btn:focus-visible');
    });

    test('ローディングスタイルが含まれている', () => {
      return enhancedCss.includes('.loading-spinner') && enhancedCss.includes('@keyframes spin');
    });

    test('通知アニメーションが含まれている', () => {
      return enhancedCss.includes('@keyframes slideInRight') && enhancedCss.includes('@keyframes slideOutRight');
    });

    test('絵文字ピッカースタイルが含まれている', () => {
      return enhancedCss.includes('.emoji-picker') && enhancedCss.includes('.emoji-grid');
    });

    test('モーダル強化スタイルが含まれている', () => {
      return enhancedCss.includes('.modal') && enhancedCss.includes('.modal-content');
    });

    test('フォーム強化スタイルが含まれている', () => {
      return enhancedCss.includes('.form-group.success') && enhancedCss.includes('.form-group.error');
    });

    test('レスポンシブ対応が含まれている', () => {
      return enhancedCss.includes('@media (max-width: 768px)');
    });

    test('ダークモード対応が含まれている', () => {
      return enhancedCss.includes('@media (prefers-color-scheme: dark)');
    });

    test('アクセシビリティ配慮が含まれている', () => {
      return enhancedCss.includes('@media (prefers-reduced-motion: reduce)') && 
             enhancedCss.includes('.sr-only');
    });

  } catch (error) {
    console.error('❌ enhanced-interactions.css の読み込みエラー:', error.message);
  }

  console.log('\n🔧 HTML統合確認:');

  try {
    const html = await fs.readFile('public/index.html', 'utf8');
    
    test('enhanced-interactions.css が読み込まれている', () => {
      return html.includes('enhanced-interactions.css');
    });

    test('modal-enhancements.js が読み込まれている', () => {
      return html.includes('modal-enhancements.js');
    });

  } catch (error) {
    console.error('❌ index.html の読み込みエラー:', error.message);
  }

  console.log('\n📚 ドキュメント確認:');

  test('UI/UX Enhancement Plan が作成されている', () => {
    try {
      return fs.statSync('docs/UI_UX_ENHANCEMENT_PLAN.md').isFile();
    } catch {
      return false;
    }
  });

  test('analyze-actions.cjs が作成されている', () => {
    try {
      return fs.statSync('analyze-actions.cjs').isFile();
    } catch {
      return false;
    }
  });

  // テスト結果サマリー
  console.log('\n📊 テスト結果サマリー:');
  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;
  const total = tests.length;

  console.log(`✅ 成功: ${passed}/${total} (${Math.round((passed/total)*100)}%)`);
  console.log(`❌ 失敗: ${failed}/${total}`);

  if (failed === 0) {
    console.log('\n🎉 すべてのテストが成功しました！');
    console.log('✨ UI/UX改修が正常に完了しています。');
  } else {
    console.log('\n⚠️  一部のテストが失敗しました。');
    console.log('📋 失敗したテスト:');
    tests.filter(t => !t.passed).forEach(test => {
      console.log(`   - ${test.name}`);
    });
  }

  console.log('\n🔍 次のステップ:');
  console.log('1. ブラウザでページを開いてボタンの動作確認');
  console.log('2. モーダルのキーボードナビゲーション（Tab, Esc）をテスト');
  console.log('3. レスポンシブ表示の確認（デスクトップ/モバイル）');
  console.log('4. アクセシビリティツールでのスコア確認');

  return failed === 0;
}

// メイン実行
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ テスト実行エラー:', error);
  process.exit(1);
});