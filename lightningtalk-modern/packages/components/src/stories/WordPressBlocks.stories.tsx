/**
 * WordPress Blocks Stories - Lightning Talk Circle
 * WordPressブロック専用のStorybook表示
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { 
  LightningButtonBlock,
  LightningEventBlock,  
  LightningSpeakerBlock
} from '../wordpress/blocks';

const meta: Meta = {
  title: 'WordPress Integration/Blocks',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
WordPress Gutenberg Block Editor用のLightning Talk専用ブロック。

## 特徴
- ⚡ Lightning Talk専用デザイン
- 🎨 統合デザイントークンシステム対応
- 📝 WordPressブロックエディター完全対応
- ♿ アクセシビリティ準拠
- 🎨 カスタマイザー対応
- 📱 レスポンシブ対応

## ブロック種類
- **Lightning Button**: CTA用ボタンブロック
- **Lightning Event**: イベント情報表示ブロック  
- **Lightning Speaker**: スピーカープロフィールブロック
        `
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Lightning Button Block Stories
export const LightningButton: Story = {
  render: () => (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h2>Lightning Button Block</h2>
      <div style={{ display: 'grid', gap: '2rem' }}>
        <LightningButtonBlock 
          text="⚡ Lightning Talk 参加登録"
          variant="lightning"
          size="lg"
          lightningEffect={true}
          align="center"
        />
        
        <LightningButtonBlock 
          text="詳細を見る"
          variant="primary"
          size="md"
          align="left"
        />
        
        <LightningButtonBlock 
          text="サポートページ"
          variant="outline"
          size="sm"
          align="right"
        />
      </div>
    </div>
  )
};

export const LightningButtonSelected: Story = {
  render: () => (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h2>Lightning Button Block (編集モード)</h2>
      <LightningButtonBlock 
        text="⚡ Lightning Talk 開始"
        variant="lightning"
        size="lg"
        lightningEffect={true}
        align="center"
        isSelected={true}
      />
    </div>
  )
};

// Lightning Event Block Stories
export const LightningEvent: Story = {
  render: () => (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h2>Lightning Event Block</h2>
      <LightningEventBlock 
        eventTitle="Lightning Talk Circle #42"
        eventDescription="技術から趣味まで、様々なテーマで短時間プレゼンテーションを行うイベントです。初心者歓迎！"
        eventDate="2025年8月15日 19:00-21:00"
        eventLocation="オンライン（Zoom）"
        maxParticipants={20}
        currentParticipants={12}
        registrationUrl="https://example.com/register"
      />
    </div>
  )
};

export const LightningEventFull: Story = {
  render: () => (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h2>Lightning Event Block (満席近い)</h2>
      <LightningEventBlock 
        eventTitle="人気のLightning Talk Circle"
        eventDescription="大好評のライトニングトークイベント。残席わずかです！"
        eventDate="2025年8月20日 14:00-17:00"
        eventLocation="渋谷コワーキングスペース"
        maxParticipants={15}
        currentParticipants={14}
        registrationUrl="https://example.com/register"
        backgroundColor="var(--color-primary-50)"
      />
    </div>
  )
};

export const LightningEventSelected: Story = {
  render: () => (
    <div style={{ padding: '2rem', maxWidth: '800px', position: 'relative' }}>
      <h2>Lightning Event Block (編集モード)</h2>
      <LightningEventBlock 
        eventTitle="Lightning Talk Circle"
        eventDescription="編集モードでのイベントブロックの表示例"
        eventDate="2025年8月25日"
        eventLocation="オンライン"
        maxParticipants={10}
        currentParticipants={5}
        isSelected={true}
      />
    </div>
  )
};

// Lightning Speaker Block Stories
export const LightningSpeaker: Story = {
  render: () => (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h2>Lightning Speaker Block</h2>
      <div style={{ display: 'grid', gap: '2rem' }}>
        <LightningSpeakerBlock 
          speakerName="田中 雷太"
          speakerTitle="Lightning Talk エバンジェリスト"
          speakerBio="10年以上のソフトウェア開発経験を持ち、Lightning Talkの魅力を多くの人に伝える活動をしています。分かりやすい技術解説と情熱的なプレゼンテーションが特徴です。"
          talkTitle="5分で理解するReactフック"
          socialLinks={{
            twitter: "https://twitter.com/lightning_dev",
            github: "https://github.com/lightning-dev",
            website: "https://lightning-talks.dev"
          }}
          layout="horizontal"
        />
        
        <LightningSpeakerBlock 
          speakerName="佐藤 光子"
          speakerTitle="UX Designer | Lightning Talk Lover"
          speakerBio="デザインの力でユーザー体験を向上させることに情熱を注いでいます。Lightning Talkを通じてデザインの面白さを伝えます。"
          talkTitle="デザインシステムの作り方"
          layout="vertical"
          socialLinks={{
            linkedin: "https://linkedin.com/in/mitsuko-sato",
            website: "https://mitsuko-design.com"
          }}
        />
      </div>
    </div>
  )
};

export const LightningSpeakerSelected: Story = {
  render: () => (
    <div style={{ padding: '2rem', maxWidth: '800px', position: 'relative' }}>
      <h2>Lightning Speaker Block (編集モード)</h2>
      <LightningSpeakerBlock 
        speakerName="山田 電光"
        speakerTitle="CTO @ Lightning Corp"
        speakerBio="編集モードでのスピーカーブロック表示例です。"
        talkTitle="Lightning Talkの未来"
        layout="horizontal"
        isSelected={true}
      />
    </div>
  )
};

// All Blocks Demo
export const AllBlocks: Story = {
  render: () => (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '3rem',
        color: 'var(--color-primary-600)'
      }}>
        ⚡ Lightning Talk Circle イベントページ
      </h1>
      
      {/* Event Information */}
      <section style={{ marginBottom: '3rem' }}>
        <LightningEventBlock 
          eventTitle="Lightning Talk Circle #50 記念大会"
          eventDescription="Lightning Talk Circle 50回目の記念大会！技術、キャリア、趣味など様々なテーマのショートプレゼンテーションをお楽しみください。ネットワーキングタイムもあります。"
          eventDate="2025年9月1日 13:00-17:00"
          eventLocation="東京都渋谷区 Lightning Talk Hall"
          maxParticipants={50}
          currentParticipants={38}
          registrationUrl="https://lightning-talk.example.com/register/50"
        />
      </section>
      
      {/* Speakers */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ 
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-primary-600)',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          ✨ Featured Speakers
        </h2>
        
        <div style={{ display: 'grid', gap: '2rem' }}>
          <LightningSpeakerBlock 
            speakerName="鈴木 閃光"
            speakerTitle="Senior Software Engineer @ TechCorp"
            speakerBio="フロントエンド開発のスペシャリスト。React、TypeScript、パフォーマンス最適化に深い知見を持つ。Lightning Talkでは技術の楽しさを分かりやすく伝えることを心がけている。"
            talkTitle="モダンフロントエンドの5分間ツアー"
            socialLinks={{
              twitter: "https://twitter.com/senkou_suzuki",
              github: "https://github.com/senkou-suzuki"
            }}
            layout="horizontal"
          />
          
          <LightningSpeakerBlock 
            speakerName="高橋 雷鳴"
            speakerTitle="Product Manager & Lightning Talk Enthusiast"
            speakerBio="プロダクトマネジメントの経験を活かし、技術とビジネスの橋渡しを行う。Lightning Talkでプロダクト開発の面白さを伝える。"
            talkTitle="5分で学ぶプロダクト思考"
            socialLinks={{
              linkedin: "https://linkedin.com/in/raimei-takahashi",
              website: "https://raimei.pm"
            }}
            layout="horizontal"
          />
        </div>
      </section>
      
      {/* CTA Buttons */}
      <section style={{ 
        textAlign: 'center',
        background: 'var(--color-primary-50)',
        padding: '2rem',
        borderRadius: 'var(--border-radius-xl)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ 
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-primary-600)',
          marginBottom: '1rem'
        }}>
          参加をお待ちしています！
        </h3>
        <p style={{ 
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-neutral-700)',
          marginBottom: '2rem'
        }}>
          あなたも Lightning Talk にチャレンジしてみませんか？
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <LightningButtonBlock 
            text="⚡ 今すぐ参加登録"
            variant="lightning"
            size="lg"
            lightningEffect={true}
            url="https://lightning-talk.example.com/register"
          />
          
          <LightningButtonBlock 
            text="イベント詳細を見る"
            variant="outline"
            size="lg"
            url="https://lightning-talk.example.com/event/50"
          />
        </div>
      </section>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '全ブロックを組み合わせた実際のWordPressページの例です。'
      }
    }
  }
};

// WordPress Editor Simulation
export const WordPressEditorSimulation: Story = {
  render: () => (
    <div style={{ 
      background: '#f0f0f1',
      padding: '2rem',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'white',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          borderBottom: '1px solid #ddd',
          paddingBottom: '1rem',
          marginBottom: '2rem'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
            ページを編集: Lightning Talk イベント
          </h1>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>
            Lightning Event Block (選択中)
          </h2>
          <LightningEventBlock 
            eventTitle="WordPress Lightning Talk"
            eventDescription="WordPressとモダン開発ツールの組み合わせについて学ぼう"
            eventDate="2025年8月30日 19:00"
            eventLocation="オンライン"
            maxParticipants={30}
            currentParticipants={15}
            isSelected={true}
          />
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>
            Lightning Button Block
          </h2>
          <LightningButtonBlock 
            text="参加する"
            variant="primary"
            size="md"
            align="center"
          />
        </div>
        
        <div>
          <h2 style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>
            Lightning Speaker Block (選択中)
          </h2>
          <LightningSpeakerBlock 
            speakerName="WordPressの達人"
            speakerTitle="WordPress Developer"
            speakerBio="WordPressを使った現代的な開発手法について解説します。"
            talkTitle="Headless WordPressの可能性"
            layout="horizontal"
            isSelected={true}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'WordPress Block Editorでの編集画面をシミュレートした表示です。'
      }
    }
  }
};