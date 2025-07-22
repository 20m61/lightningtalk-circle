/**
 * Button Component Stories - Lightning Talk Circle
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import React from 'react';

const meta: Meta<typeof Button> = {
  title: 'Components/Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Lightning Talk Circle統合ボタンコンポーネント。

## 特徴
- ⚡ Lightning Talk専用ブランドスタイリング
- 🎨 統合デザイントークンシステム対応
- ♿ WCAG 2.1 AAアクセシビリティ準拠
- 📱 レスポンシブデザイン対応
- 🚀 パフォーマンス最適化

## バリエーション
- **Primary**: メインアクション用
- **Secondary**: サブアクション用  
- **Outline**: 境界線スタイル
- **Ghost**: 背景なしスタイル
- **Lightning**: ⚡ Lightning Talk専用エフェクト

## サイズ
- **XS**: 28px height - 小さなUIコンポーネント用
- **SM**: 32px height - コンパクトなエリア用
- **MD**: 40px height - 標準サイズ（推奨）
- **LG**: 48px height - 重要なアクション用
- **XL**: 56px height - ヒーローセクション用
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'lightning'],
      description: 'ボタンのバリエーション'
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'ボタンのサイズ'
    },
    state: {
      control: { type: 'select' },
      options: ['default', 'hover', 'active', 'disabled', 'loading'],
      description: 'ボタンの状態'
    },
    fullWidth: {
      control: 'boolean',
      description: 'フルワイド表示'
    },
    lightningEffect: {
      control: 'boolean',
      description: 'Lightning Talk専用エフェクト'
    },
    disabled: {
      control: 'boolean',
      description: '無効状態'
    },
    children: {
      control: 'text',
      description: 'ボタンのテキスト'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

// Default Story
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md'
  }
};

// All Variants
export const AllVariants: Story = {
  render: () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem',
      padding: '2rem'
    }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="lightning">⚡ Lightning</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '全てのバリエーションを表示します。'
      }
    }
  }
};

// All Sizes
export const AllSizes: Story = {
  render: () => (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '1rem',
      padding: '2rem',
      alignItems: 'flex-start'
    }}>
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '全てのサイズバリエーションを表示します。'
      }
    }
  }
};

// Lightning Effect
export const LightningEffect: Story = {
  args: {
    children: '⚡ Lightning Talk開始',
    variant: 'lightning',
    size: 'lg',
    lightningEffect: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Lightning Talk専用のエフェクトを適用したボタンです。'
      }
    }
  }
};

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      padding: '2rem'
    }}>
      <Button 
        iconLeft={<span>🚀</span>}
        variant="primary"
      >
        Start Lightning Talk
      </Button>
      <Button 
        iconRight={<span>📊</span>}
        variant="secondary"
      >
        View Analytics
      </Button>
      <Button 
        iconLeft={<span>⚡</span>}
        iconRight={<span>🎤</span>}
        variant="lightning"
        lightningEffect
      >
        Lightning Session
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'アイコンを含むボタンの例です。'
      }
    }
  }
};

// Loading State
export const LoadingState: Story = {
  render: () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem',
      padding: '2rem'
    }}>
      <Button state="loading" variant="primary">Saving...</Button>
      <Button state="loading" variant="secondary">Loading...</Button>
      <Button state="loading" variant="lightning">⚡ Processing...</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ローディング状態のボタンです。'
      }
    }
  }
};

// Disabled State
export const DisabledState: Story = {
  render: () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem',
      padding: '2rem'
    }}>
      <Button disabled variant="primary">Disabled</Button>
      <Button disabled variant="secondary">Disabled</Button>
      <Button disabled variant="outline">Disabled</Button>
      <Button disabled variant="ghost">Disabled</Button>
      <Button disabled variant="lightning">Disabled</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '無効状態のボタンです。'
      }
    }
  }
};

// Full Width
export const FullWidth: Story = {
  render: () => (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '1rem',
      padding: '2rem',
      width: '400px'
    }}>
      <Button fullWidth variant="primary">Full Width Primary</Button>
      <Button fullWidth variant="lightning" lightningEffect>
        ⚡ Full Width Lightning
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'フルワイドなボタンです。'
      }
    }
  }
};

// Interactive Demo
export const InteractiveDemo: Story = {
  render: () => {
    const [clickCount, setClickCount] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleClick = async () => {
      setIsLoading(true);
      setClickCount(prev => prev + 1);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
    };

    return (
      <div style={{ 
        textAlign: 'center',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <Button 
          variant="lightning"
          size="lg"
          lightningEffect
          onClick={handleClick}
          state={isLoading ? 'loading' : 'default'}
          iconLeft={<span>⚡</span>}
        >
          {isLoading ? '処理中...' : `Lightning Talk クリック (${clickCount})`}
        </Button>
        
        <p style={{ 
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-neutral-600)'
        }}>
          ボタンをクリックしてインタラクションを体験してください
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'インタラクティブなボタンデモです。クリックして動作を確認できます。'
      }
    }
  }
};

// Accessibility Demo
export const AccessibilityDemo: Story = {
  render: () => (
    <div style={{ 
      display: 'grid', 
      gap: '1rem',
      padding: '2rem'
    }}>
      <div>
        <h3>フォーカス管理</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button>First Button</Button>
          <Button variant="secondary">Second Button</Button>
          <Button variant="outline">Third Button</Button>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-600)' }}>
          Tabキーでフォーカスを移動し、Enterキーで実行できます
        </p>
      </div>
      
      <div>
        <h3>スクリーンリーダー対応</h3>
        <Button 
          variant="lightning"
          aria-label="Lightning Talkセッションを開始します"
        >
          ⚡ Start Session
        </Button>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-600)' }}>
          aria-labelで詳細な説明を提供
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'アクセシビリティ機能のデモです。'
      }
    }
  }
};