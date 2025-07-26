#!/usr/bin/env node

/**
 * DynamoDBイベント更新スクリプト
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import fs from 'fs';

const client = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(client);

const eventData = {
  id: 'event-001',
  title: '第1回 なんでもライトニングトーク',
  description: '5分間で世界を変える！あなたの「なんでも」を聞かせて！',
  date: '2025-07-30T19:00:00+09:00',
  endDate: '2025-07-30T21:00:00+09:00',
  venue: {
    name: '新宿会場',
    address: '西新宿8-14-19 小林第二ビル8階',
    capacity: 50,
    online: true,
    onlineUrl: 'https://meet.google.com/ycp-sdec-xsr'
  },
  status: 'upcoming',
  registrationOpen: true,
  talkSubmissionOpen: true,
  maxTalks: 20,
  talkDuration: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

async function updateEvent(tableName, environment) {
  try {
    console.log(`\n🔄 ${environment}環境のテーブル (${tableName}) を更新中...`);

    const params = {
      TableName: tableName,
      Item: eventData
    };

    await docClient.send(new PutCommand(params));
    console.log(`✅ ${environment}環境のイベントデータ更新完了`);
    console.log(`   - タイトル: ${eventData.title}`);
    console.log('   - 日時: 2025年7月30日(水) 19:00-21:00');
  } catch (error) {
    console.error(`❌ ${environment}環境の更新エラー:`, error.message);
  }
}

async function main() {
  console.log('🚀 DynamoDBイベントデータ更新を開始します\n');

  // 開発環境のテーブル更新
  const devTables = ['lightningtalk-circle-events', 'lightningtalk-dev-events'];

  for (const table of devTables) {
    await updateEvent(table, '開発');
  }

  // 本番環境のテーブル更新
  const prodTables = ['lightningtalk-circle-prod-events', 'lightningtalk-prod-events'];

  for (const table of prodTables) {
    await updateEvent(table, '本番');
  }

  console.log('\n✅ すべての更新が完了しました！');
  console.log('\n📅 新しい開催日時: 2025年7月30日(水) 19:00-21:00');
}

main().catch(console.error);
