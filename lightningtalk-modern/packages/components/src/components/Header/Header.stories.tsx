/**
 * Header Stories
 * Lightning Talk Circle navigation header with responsive design
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './Header';

const meta: Meta<typeof Header> = {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Lightning Talk Circle navigation header with responsive design and user authentication.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'transparent', 'compact']
    },
    sticky: {
      control: { type: 'boolean' }
    },
    showLogin: {
      control: { type: 'boolean' }
    },
    showMobileMenu: {
      control: { type: 'boolean' }
    },
    onLogin: { action: 'login' },
    onLogout: { action: 'logout' },
    onUserMenu: { action: 'user-menu' },
    onMobileMenuToggle: { action: 'mobile-menu-toggle' }
  }
};

export default meta;
type Story = StoryObj<typeof Header>;

// Sample navigation items
const navItems = [
  { label: 'ホーム', href: '/', active: true },
  { label: 'イベント', href: '/events' },
  { label: 'スピーカー', href: '/speakers' },
  { label: 'について', href: '/about' }
];

// Default story
export const Default: Story = {
  args: {
    navItems
  }
};

// With user logged in
export const LoggedIn: Story = {
  args: {
    navItems,
    user: {
      name: '山田太郎',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    }
  }
};

// Transparent variant
export const Transparent: Story = {
  args: {
    navItems,
    variant: 'transparent'
  }
};

// Compact variant
export const Compact: Story = {
  args: {
    navItems,
    variant: 'compact'
  }
};

// Sticky header
export const Sticky: Story = {
  args: {
    navItems,
    sticky: true
  },
  decorators: [
    Story => (
      <div style={{ height: '200vh', background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)' }}>
        <Story />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>スクロールして確認してください</h2>
          <p>ヘッダーが上部に固定されます</p>
        </div>
      </div>
    )
  ]
};

// Without login button
export const WithoutLogin: Story = {
  args: {
    navItems,
    showLogin: false
  }
};

// Mobile view
export const Mobile: Story = {
  args: {
    navItems,
    user: {
      name: '田中花子'
    }
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
};

// Custom title
export const CustomTitle: Story = {
  args: {
    title: 'LT Circle ⚡',
    navItems
  }
};

// Minimal navigation
export const Minimal: Story = {
  args: {
    navItems: [
      { label: 'ホーム', href: '/', active: true },
      { label: 'イベント', href: '/events' }
    ]
  }
};

// External links
export const WithExternalLinks: Story = {
  args: {
    navItems: [
      { label: 'ホーム', href: '/', active: true },
      { label: 'イベント', href: '/events' },
      { label: 'GitHub', href: 'https://github.com/lightningtalk-circle', external: true },
      { label: 'Twitter', href: 'https://twitter.com/lt_circle', external: true }
    ]
  }
};

// User with avatar placeholder
export const UserWithoutAvatar: Story = {
  args: {
    navItems,
    user: {
      name: '佐藤三郎'
    }
  }
};

// Interactive demo
export const Interactive: Story = {
  args: {
    navItems,
    onLogin: () => {
      alert('ログインボタンがクリックされました');
    },
    onLogout: () => {
      alert('ログアウトボタンがクリックされました');
    },
    onUserMenu: () => {
      alert('ユーザーメニューがクリックされました');
    },
    onMobileMenuToggle: (open: boolean) => {
      console.log('モバイルメニュー:', open ? 'オープン' : 'クローズ');
    }
  }
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3>Default</h3>
        <Header navItems={navItems} />
      </div>
      <div>
        <h3>Transparent</h3>
        <Header navItems={navItems} variant="transparent" />
      </div>
      <div>
        <h3>Compact</h3>
        <Header navItems={navItems} variant="compact" />
      </div>
      <div>
        <h3>With User</h3>
        <Header
          navItems={navItems}
          user={{
            name: '山田太郎',
            avatar:
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
          }}
        />
      </div>
    </div>
  )
};
