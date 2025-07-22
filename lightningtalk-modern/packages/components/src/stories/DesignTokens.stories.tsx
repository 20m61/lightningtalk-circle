/**
 * Design Tokens Stories - Lightning Talk Circle
 * 統合デザイントークンシステムのStorybook表示
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { lightningTalkTokens } from '../tokens/unified-tokens';

const meta: Meta = {
  title: 'Design System/Design Tokens',
  parameters: {
    docs: {
      description: {
        component: `
Lightning Talk Circle統合デザイントークンシステム。
全プラットフォーム（Web、WordPress、Mobile）で一貫したデザインを提供します。

## 特徴
- ⚡ Lightning Talk専用ブランドカラー
- 🎨 セマンティックカラーシステム
- 📱 レスポンシブ対応（Fluid Typography & Spacing）
- 🌈 ダークモード対応
- ♿ アクセシビリティ対応
- 🚀 パフォーマンス最適化
        `
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// カラーパレット表示コンポーネント
const ColorPalette: React.FC<{ 
  title: string; 
  colors: any; 
  showValues?: boolean; 
}> = ({ title, colors, showValues = true }) => (
  <div style={{ marginBottom: '2rem' }}>
    <h3 style={{ 
      fontSize: 'var(--font-size-xl)', 
      marginBottom: '1rem',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--color-neutral-900)'
    }}>
      {title}
    </h3>
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
      gap: '1rem' 
    }}>
      {Object.entries(colors).map(([key, value]) => (
        <div 
          key={key}
          style={{
            textAlign: 'center',
            border: '1px solid var(--color-neutral-200)',
            borderRadius: 'var(--border-radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div 
            style={{ 
              width: '100%', 
              height: '80px', 
              backgroundColor: String(value),
              border: '1px solid rgba(0,0,0,0.1)'
            }} 
          />
          <div style={{ padding: '0.5rem' }}>
            <div style={{ 
              fontWeight: 'var(--font-weight-medium)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-neutral-900)'
            }}>
              {key}
            </div>
            {showValues && (
              <div style={{ 
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-family-mono)',
                color: 'var(--color-neutral-600)',
                marginTop: '0.25rem'
              }}>
                {String(value)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// タイポグラフィ表示コンポーネント
const TypographyScale: React.FC = () => (
  <div style={{ marginBottom: '2rem' }}>
    <h3 style={{ 
      fontSize: 'var(--font-size-xl)', 
      marginBottom: '1rem',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--color-neutral-900)'
    }}>
      Typography Scale - Fluid Typography
    </h3>
    {Object.entries(lightningTalkTokens.typography.fontSize).map(([size, value]) => (
      <div 
        key={size}
        style={{ 
          marginBottom: '1rem',
          padding: '1rem',
          border: '1px solid var(--color-neutral-200)',
          borderRadius: 'var(--border-radius-md)',
          background: 'var(--color-neutral-50)'
        }}
      >
        <div style={{ fontSize: String(value), lineHeight: 'var(--line-height-normal)' }}>
          {size} - Lightning Talk Circle デザインシステム
        </div>
        <div style={{ 
          fontSize: 'var(--font-size-xs)',
          fontFamily: 'var(--font-family-mono)',
          color: 'var(--color-neutral-600)',
          marginTop: '0.5rem'
        }}>
          {size}: {String(value)}
        </div>
      </div>
    ))}
  </div>
);

// スペーシングスケール表示コンポーネント  
const SpacingScale: React.FC = () => (
  <div style={{ marginBottom: '2rem' }}>
    <h3 style={{ 
      fontSize: 'var(--font-size-xl)', 
      marginBottom: '1rem',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--color-neutral-900)'
    }}>
      Spacing Scale - 8px Base System
    </h3>
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {Object.entries(lightningTalkTokens.spacing).map(([key, value]) => (
        <div 
          key={key}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.5rem',
            border: '1px solid var(--color-neutral-200)',
            borderRadius: 'var(--border-radius-sm)'
          }}
        >
          <div style={{ 
            width: '60px',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {key}
          </div>
          <div 
            style={{ 
              height: '20px',
              width: String(value),
              backgroundColor: 'var(--color-primary-500)',
              borderRadius: 'var(--border-radius-xs)'
            }}
          />
          <div style={{ 
            fontSize: 'var(--font-size-xs)',
            fontFamily: 'var(--font-family-mono)',
            color: 'var(--color-neutral-600)'
          }}>
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Lightning専用カラー表示
const LightningColors: React.FC = () => (
  <div style={{ marginBottom: '2rem' }}>
    <h3 style={{ 
      fontSize: 'var(--font-size-xl)', 
      marginBottom: '1rem',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--color-neutral-900)'
    }}>
      ⚡ Lightning Talk Special Colors
    </h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      {Object.entries(lightningTalkTokens.colors.lightning).map(([key, value]) => (
        <div 
          key={key}
          style={{
            padding: '2rem',
            backgroundColor: String(value),
            borderRadius: 'var(--border-radius-xl)',
            textAlign: 'center',
            boxShadow: key === 'glow' ? 'var(--shadow-lightning-glow)' : 'var(--shadow-md)',
            color: key === 'spark' ? '#000' : '#fff',
            fontWeight: 'var(--font-weight-bold)'
          }}
        >
          <div style={{ fontSize: 'var(--font-size-lg)' }}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </div>
          <div style={{ 
            fontSize: 'var(--font-size-xs)',
            fontFamily: 'var(--font-family-mono)',
            marginTop: '0.5rem',
            opacity: 0.8
          }}>
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// アニメーション表示コンポーネント
const AnimationShowcase: React.FC = () => (
  <div style={{ marginBottom: '2rem' }}>
    <h3 style={{ 
      fontSize: 'var(--font-size-xl)', 
      marginBottom: '1rem',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--color-neutral-900)'
    }}>
      ⚡ Lightning Talk Animations
    </h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
      {Object.entries(lightningTalkTokens.animations.lightning).map(([key, value]) => (
        <div 
          key={key}
          style={{
            padding: '2rem',
            backgroundColor: 'var(--color-primary-500)',
            borderRadius: 'var(--border-radius-lg)',
            textAlign: 'center',
            color: 'white',
            cursor: 'pointer',
            animation: String(value),
            userSelect: 'none'
          }}
          title={`Click to see ${key} animation`}
        >
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </div>
          <div style={{ 
            fontSize: 'var(--font-size-xs)',
            marginTop: '0.5rem',
            opacity: 0.8
          }}>
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// メインストーリー
export const Overview: Story = {
  render: () => (
    <div style={{ 
      fontFamily: 'var(--font-family-primary)',
      padding: '2rem',
      maxWidth: '1200px'
    }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-4xl)',
          fontWeight: 'var(--font-weight-bold)',
          background: 'linear-gradient(45deg, var(--color-primary-500), var(--color-secondary-500))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem'
        }}>
          ⚡ Lightning Talk Circle
        </h1>
        <p style={{ 
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-neutral-700)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          統合デザイントークンシステム - 全プラットフォーム対応
        </p>
      </header>

      <LightningColors />
      <ColorPalette title="Primary Colors - Lightning Electric Orange" colors={lightningTalkTokens.colors.primary} />
      <ColorPalette title="Secondary Colors - Lightning Electric Turquoise" colors={lightningTalkTokens.colors.secondary} />
      <ColorPalette title="Neutral Colors - Grayscale" colors={lightningTalkTokens.colors.neutral} />
      <TypographyScale />
      <SpacingScale />
      <AnimationShowcase />
    </div>
  )
};

export const PrimaryColors: Story = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <ColorPalette title="Primary Colors - Lightning Electric Orange" colors={lightningTalkTokens.colors.primary} />
    </div>
  )
};

export const SecondaryColors: Story = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <ColorPalette title="Secondary Colors - Lightning Electric Turquoise" colors={lightningTalkTokens.colors.secondary} />
    </div>
  )
};

export const SemanticColors: Story = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <ColorPalette title="Success Colors" colors={lightningTalkTokens.colors.semantic.success} />
      <ColorPalette title="Warning Colors" colors={lightningTalkTokens.colors.semantic.warning} />
      <ColorPalette title="Error Colors" colors={lightningTalkTokens.colors.semantic.error} />
      <ColorPalette title="Info Colors" colors={lightningTalkTokens.colors.semantic.info} />
    </div>
  )
};

export const Typography: Story = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <TypographyScale />
    </div>
  )
};

export const Spacing: Story = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <SpacingScale />
    </div>
  )
};

export const Animations: Story = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <AnimationShowcase />
    </div>
  )
};