/**
 * Lightning Talk Button component stories
 */

export default {
  title: 'Lightning Talk/Button',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Button component with various states and styles for Lightning Talk event management'
      }
    }
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Button text content'
    },
    variant: {
      options: ['primary', 'secondary', 'disabled', 'survey'],
      control: { type: 'select' },
      description: 'Button variant'
    },
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'select' },
      description: 'Button size'
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state'
    },
    onClick: { action: 'clicked' }
  }
};

const Template = ({ label, variant, size, disabled, onClick }) => {
  const button = document.createElement('button');
  
  // Apply base styles
  let className = 'btn';
  
  // Apply variant styles
  switch (variant) {
    case 'secondary':
      className += ' btn-secondary';
      break;
    case 'disabled':
      className += ' btn-disabled';
      break;
    case 'survey':
      className += ' survey-btn';
      break;
    default:
      // primary is default
      break;
  }
  
  // Apply size styles
  switch (size) {
    case 'small':
      className += ' btn-small';
      break;
    case 'large':
      className += ' btn-large';
      break;
    default:
      // medium is default
      break;
  }
  
  button.className = className;
  button.innerText = label;
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  
  return button;
};

export const Primary = Template.bind({});
Primary.args = {
  label: '📝 参加登録',
  variant: 'primary',
  size: 'medium',
  disabled: false
};

export const Secondary = Template.bind({});
Secondary.args = {
  label: '詳細を見る',
  variant: 'secondary',
  size: 'medium',
  disabled: false
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: '💭 感想アンケート（開催後に有効）',
  variant: 'disabled',
  size: 'medium',
  disabled: true
};

export const Survey = Template.bind({});
Survey.args = {
  label: '💻 オンライン参加',
  variant: 'survey',
  size: 'medium',
  disabled: false
};

export const SpeakerRegistration = Template.bind({});
SpeakerRegistration.args = {
  label: '🎤 発表申込み',
  variant: 'primary',
  size: 'medium',
  disabled: false
};

export const ListenerRegistration = Template.bind({});
ListenerRegistration.args = {
  label: '👥 聴講参加登録',
  variant: 'primary',
  size: 'medium',
  disabled: false
};

export const WalkinInfo = Template.bind({});
WalkinInfo.args = {
  label: '⚡ 当日飛び入り発表',
  variant: 'primary',
  size: 'medium',
  disabled: false
};

export const Small = Template.bind({});
Small.args = {
  label: '詳細',
  variant: 'primary',
  size: 'small',
  disabled: false
};

export const Large = Template.bind({});
Large.args = {
  label: '🚀 第1回イベント詳細を見る',
  variant: 'primary',
  size: 'large',
  disabled: false
};

// Additional styles for button variants
const additionalCSS = `
  .btn {
    display: inline-block;
    padding: 15px 30px;
    background: linear-gradient(45deg, #FF6B6B, #FFD93D);
    color: #fff;
    text-decoration: none;
    border-radius: 50px;
    font-weight: bold;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    position: relative;
    overflow: hidden;
  }
  
  .btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.3);
  }
  
  .btn-secondary {
    background: linear-gradient(45deg, #6c757d, #adb5bd) !important;
  }
  
  .btn-secondary:hover {
    background: linear-gradient(45deg, #5a6268, #95a5a6) !important;
  }
  
  .btn-disabled {
    background: #ccc !important;
    cursor: not-allowed !important;
    opacity: 0.6;
  }
  
  .btn-disabled:hover {
    transform: none !important;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2) !important;
  }
  
  .survey-btn {
    position: relative;
    min-width: 160px;
    transition: all 0.3s ease;
  }
  
  .survey-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  
  .btn-small {
    padding: 8px 16px !important;
    font-size: 0.9rem !important;
  }
  
  .btn-large {
    padding: 20px 40px !important;
    font-size: 1.3rem !important;
  }
`;

// Inject additional styles
if (!document.getElementById('lightning-talk-button-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'lightning-talk-button-styles';
  styleSheet.textContent = additionalCSS;
  document.head.appendChild(styleSheet);
}