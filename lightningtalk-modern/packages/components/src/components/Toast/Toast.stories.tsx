import type { Meta, StoryObj } from '@storybook/react';
import { Toast, ToastContainer, useToast } from './Toast';
import { useState } from 'react';

const meta = {
  title: 'Components/Molecules/Toast',
  component: Toast,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Toast コンポーネント

一時的な通知メッセージを表示するトーストコンポーネントです。成功、エラー、警告、情報などの状態を視覚的に伝えます。

## 機能

- **複数の種類**: success, error, warning, info
- **自動消去**: 指定時間後に自動的に消える
- **アクション**: カスタムアクションボタンの追加
- **位置指定**: 6つの位置から選択可能
- **アクセシビリティ**: ARIA属性とキーボード操作対応
- **アニメーション**: スムーズな表示・非表示アニメーション
- **プログレスバー**: 残り時間の視覚的表示

## 使用例

\`\`\`tsx
import { ToastContainer, useToast } from '@lightningtalk/components';

function App() {
  const { toasts, showToast, removeToast } = useToast();

  const handleSuccess = () => {
    showToast({
      message: '保存しました',
      type: 'success',
    });
  };

  return (
    <>
      <button onClick={handleSuccess}>保存</button>
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
        position="top-right"
      />
    </>
  );
}
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      control: 'text',
      description: 'トーストの一意識別子',
    },
    message: {
      control: 'text',
      description: 'メッセージ内容',
    },
    type: {
      control: 'radio',
      options: ['success', 'error', 'warning', 'info'],
      description: 'トーストの種類',
    },
    duration: {
      control: 'number',
      description: '表示時間（ミリ秒）',
    },
    closable: {
      control: 'boolean',
      description: '閉じるボタンの表示',
    },
    onClose: {
      action: 'closed',
      description: '閉じる時のコールバック',
    },
    action: {
      control: 'object',
      description: 'アクションボタンの設定',
    },
    animated: {
      control: 'boolean',
      description: 'アニメーションの有効化',
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'toast-1',
    message: 'これは通知メッセージです',
    type: 'info',
  },
};

export const Success: Story = {
  args: {
    id: 'toast-success',
    message: '正常に保存されました',
    type: 'success',
  },
};

export const Error: Story = {
  args: {
    id: 'toast-error',
    message: 'エラーが発生しました。もう一度お試しください。',
    type: 'error',
  },
};

export const Warning: Story = {
  args: {
    id: 'toast-warning',
    message: '未保存の変更があります',
    type: 'warning',
  },
};

export const WithAction: Story = {
  args: {
    id: 'toast-action',
    message: 'ファイルがアップロードされました',
    type: 'success',
    action: {
      label: '詳細を見る',
      onClick: () => console.log('Action clicked'),
    },
  },
};

export const LongMessage: Story = {
  args: {
    id: 'toast-long',
    message: 'これは非常に長いメッセージの例です。トーストコンポーネントは長いテキストでも適切に表示され、必要に応じて改行されます。ユーザーが内容を理解しやすいように配慮されています。',
    type: 'info',
  },
};

export const WithCustomIcon: Story = {
  args: {
    id: 'toast-custom',
    message: 'カスタムアイコン付きトースト',
    type: 'info',
    icon: '🎉',
  },
};

export const NoAutoClose: Story = {
  args: {
    id: 'toast-manual',
    message: 'このトーストは自動的に閉じません',
    type: 'info',
    duration: 0,
  },
};

export const NotClosable: Story = {
  args: {
    id: 'toast-not-closable',
    message: '閉じるボタンがないトースト',
    type: 'warning',
    closable: false,
    duration: 0,
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const { toasts, showToast, removeToast } = useToast();

    const showSuccessToast = () => {
      showToast({
        message: 'イベントが正常に作成されました',
        type: 'success',
      });
    };

    const showErrorToast = () => {
      showToast({
        message: 'ネットワークエラーが発生しました',
        type: 'error',
        action: {
          label: '再試行',
          onClick: () => console.log('Retry clicked'),
        },
      });
    };

    const showWarningToast = () => {
      showToast({
        message: '5分後にセッションがタイムアウトします',
        type: 'warning',
        duration: 10000,
      });
    };

    const showInfoToast = () => {
      showToast({
        message: '新しいアップデートが利用可能です',
        type: 'info',
        action: {
          label: '今すぐ更新',
          onClick: () => console.log('Update clicked'),
        },
      });
    };

    return (
      <div style={{ padding: '2rem' }}>
        <h3>Toast通知デモ</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={showSuccessToast}>成功</button>
          <button onClick={showErrorToast}>エラー</button>
          <button onClick={showWarningToast}>警告</button>
          <button onClick={showInfoToast}>情報</button>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  },
};

export const PositionDemo: Story = {
  render: () => {
    const [position, setPosition] = useState<'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left'>('top-right');
    const { toasts, showToast, removeToast } = useToast();

    const showToastAtPosition = () => {
      showToast({
        message: `トーストが ${position} に表示されています`,
        type: 'info',
      });
    };

    return (
      <div style={{ padding: '2rem', minHeight: '400px' }}>
        <h3>位置指定デモ</h3>
        <div style={{ marginTop: '1rem' }}>
          <select 
            value={position} 
            onChange={(e) => setPosition(e.target.value as any)}
            style={{ marginRight: '1rem' }}
          >
            <option value="top-right">右上</option>
            <option value="top-center">中央上</option>
            <option value="top-left">左上</option>
            <option value="bottom-right">右下</option>
            <option value="bottom-center">中央下</option>
            <option value="bottom-left">左下</option>
          </select>
          <button onClick={showToastAtPosition}>トーストを表示</button>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} position={position} />
      </div>
    );
  },
};

export const MultipleToasts: Story = {
  render: () => {
    const { toasts, showToast, removeToast, clearToasts } = useToast();

    const showMultiple = () => {
      showToast({ message: '1つ目のトースト', type: 'success' });
      setTimeout(() => {
        showToast({ message: '2つ目のトースト', type: 'warning' });
      }, 500);
      setTimeout(() => {
        showToast({ message: '3つ目のトースト', type: 'info' });
      }, 1000);
    };

    return (
      <div style={{ padding: '2rem' }}>
        <h3>複数トーストデモ</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={showMultiple}>複数表示</button>
          <button onClick={clearToasts}>すべてクリア</button>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  },
};

export const DarkMode: Story = {
  args: {
    id: 'toast-dark',
    message: 'ダークモードでのトースト表示',
    type: 'info',
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ background: '#111827', minHeight: '200px', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};

export const Mobile: Story = {
  args: {
    id: 'toast-mobile',
    message: 'モバイル表示でのトースト',
    type: 'success',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};