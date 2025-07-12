import { Button } from '../src/components/Button';

export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl']
    },
    fullWidth: {
      control: 'boolean'
    },
    disabled: {
      control: 'boolean'
    },
    loading: {
      control: 'boolean'
    }
  }
};

export const Primary = {
  args: {
    children: '参加登録する',
    variant: 'primary'
  }
};

export const Secondary = {
  args: {
    children: '詳細を見る',
    variant: 'secondary'
  }
};

export const WithIcon = {
  args: {
    children: 'イベントを作成',
    variant: 'primary',
    icon: '✨'
  }
};

export const Loading = {
  args: {
    children: '送信中...',
    variant: 'primary',
    loading: true
  }
};

export const Sizes = {
  render: () => (
    <div className="flex items-center gap-4 flex-wrap">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  )
};

export const Variants = {
  render: () => (
    <div className="flex items-center gap-4 flex-wrap">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  )
};
