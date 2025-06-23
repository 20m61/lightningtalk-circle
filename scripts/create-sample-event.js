#!/usr/bin/env node

/**
 * サンプルイベント自動作成スクリプト
 */

require('dotenv').config();

async function createSampleEvent() {
    const fetch = (await import('node-fetch')).default;
    const authString = Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString('base64');
    
    console.log('📝 Lightning Talkサンプルイベント作成');
    console.log('==================================');
    console.log('');
    
    try {
        // Lightning Talkイベント作成
        console.log('1. 第1回イベント作成中...');
        
        const eventData = {
            title: '第1回 なんでもライトニングトーク',
            content: '5分間で世界を変える！あなたの「なんでも」を聞かせて！\\n\\n技術、趣味、日常の発見、面白い話題... 何でも大歓迎！\\n当日参加・飛び入り発表も歓迎です。',
            status: 'publish',
            type: 'lt_event',
            meta: {
                event_date: '2025-06-25 19:00:00',
                venue_name: '新宿会場',
                venue_address: '西新宿8-14-19 小林第二ビル8階',
                map_url: process.env.LT_MAP_URL || 'https://maps.app.goo.gl/51TFv825jmuBsjbq5?g_st=ic',
                emergency_phone: process.env.LT_EMERGENCY_PHONE || '080-4540-7479',
                online_url: process.env.LT_MEET_URL || 'https://meet.google.com/ycp-sdec-xsr',
                capacity: '50',
                event_status: 'active'
            }
        };
        
        const eventResponse = await fetch(`${process.env.WP_API_URL}/lt_event`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });
        
        if (eventResponse.ok) {
            const event = await eventResponse.json();
            console.log(`✅ イベント作成成功 (ID: ${event.id})`);
            console.log(`   タイトル: ${event.title.rendered}`);
            console.log(`   URL: ${event.link}`);
            
            // メタ情報の設定
            console.log('\\n2. イベント詳細情報設定中...');
            for (const [key, value] of Object.entries(eventData.meta)) {
                try {
                    await fetch(`${process.env.WP_API_URL}/lt_event/${event.id}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Basic ${authString}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            meta: { [key]: value }
                        })
                    });
                    console.log(`   ✅ ${key}: ${value}`);
                } catch (error) {
                    console.log(`   ⚠️ ${key}: 手動設定が必要`);
                }
            }
            
        } else {
            throw new Error(`HTTP ${eventResponse.status}: ${eventResponse.statusText}`);
        }
        
        console.log('\\n✅ サンプルイベント作成完了');
        console.log('\\n次のステップ: node scripts/create-lightning-talk-page.js');
        
    } catch (error) {
        console.error('❌ イベント作成エラー:', error.message);
        console.log('\\n手動作成が必要です:');
        console.log('Lightning Talk > Lightning Talkイベント > 新規追加');
        console.log('上記の情報を入力してください');
    }
}

createSampleEvent();