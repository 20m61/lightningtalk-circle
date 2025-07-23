#!/usr/bin/env node

/**
 * APIスタック構成確認スクリプト
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkAPIStack() {
  console.log('🔍 APIスタック構成を確認します...\n');

  try {
    // 1. API Gatewayの確認
    console.log('📡 API Gateway確認:');
    const { stdout: restApis } = await execAsync(
      "aws apigateway get-rest-apis --query \"items[?contains(name, 'lightning') || contains(name, 'Lightning')].{id:id,name:name}\" --output json"
    );
    const apis = JSON.parse(restApis);

    if (apis.length > 0) {
      console.log('✅ 利用可能なREST APIs:');
      apis.forEach(api => {
        console.log(`   - ${api.name} (ID: ${api.id})`);
      });
    } else {
      console.log('❌ Lightning Talk関連のAPIが見つかりません');
    }

    // 2. WebSocket APIの確認
    console.log('\n📡 WebSocket API確認:');
    const { stdout: wsApis } = await execAsync(
      "aws apigatewayv2 get-apis --query \"Items[?contains(Name, 'lightning') || contains(Name, 'Lightning')].{ApiId:ApiId,Name:Name,ApiEndpoint:ApiEndpoint}\" --output json"
    );
    const wsApiList = JSON.parse(wsApis);

    if (wsApiList.length > 0) {
      console.log('✅ 利用可能なWebSocket APIs:');
      wsApiList.forEach(api => {
        console.log(`   - ${api.Name}`);
        console.log(`     Endpoint: ${api.ApiEndpoint}`);
      });
    }

    // 3. DynamoDBテーブルの確認
    console.log('\n💾 DynamoDBテーブル確認:');
    const { stdout: tables } = await execAsync(
      "aws dynamodb list-tables --query \"TableNames[?contains(@, 'lightning') || contains(@, 'event')]\" --output json"
    );
    const tableList = JSON.parse(tables);

    if (tableList.length > 0) {
      console.log('✅ 利用可能なテーブル:');
      for (const table of tableList) {
        try {
          const { stdout: itemCount } = await execAsync(
            `aws dynamodb describe-table --table-name ${table} --query "Table.ItemCount" --output text`
          );
          console.log(`   - ${table} (Items: ${itemCount.trim()})`);
        } catch {
          console.log(`   - ${table} (アクセス不可)`);
        }
      }
    }

    // 4. CloudFormationスタックの確認
    console.log('\n🏗️  CloudFormationスタック確認:');
    const { stdout: stacks } = await execAsync(
      "aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query \"StackSummaries[?contains(StackName, 'Lightning') || contains(StackName, 'lightning')].{Name:StackName,Status:StackStatus,Updated:LastUpdatedTime}\" --output json"
    );
    const stackList = JSON.parse(stacks);

    if (stackList.length > 0) {
      console.log('✅ アクティブなスタック:');
      stackList.forEach(stack => {
        console.log(`   - ${stack.Name} (${stack.Status})`);
      });
    }

    // 5. API疎通チェック
    console.log('\n🔗 API疎通チェック:');
    const testEndpoints = [
      'http://localhost:3334/api/health',
      'http://localhost:3334/api/events',
      'https://wf6gf7eisk.execute-api.ap-northeast-1.amazonaws.com/dev/api/health'
    ];

    for (const endpoint of testEndpoints) {
      try {
        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${endpoint}`);
        const statusCode = stdout.trim();
        if (statusCode === '200') {
          console.log(`✅ ${endpoint} - OK (${statusCode})`);
        } else {
          console.log(`⚠️  ${endpoint} - Status: ${statusCode}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - 接続失敗`);
      }
    }

    // 6. 推奨事項
    console.log('\n📋 推奨事項:');
    console.log('1. CSPヘッダーにAPI Gatewayのドメインを追加');
    console.log('   connect-src に https://*.execute-api.ap-northeast-1.amazonaws.com を追加');
    console.log('2. WebSocket接続用にwss://プロトコルも許可');
    console.log('3. 環境変数でAPIエンドポイントを設定');
    console.log('4. CORS設定の確認と調整');
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

// 実行
checkAPIStack().catch(console.error);
