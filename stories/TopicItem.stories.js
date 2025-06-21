/**
 * Topic Item component stories for Lightning Talk categories
 */

export default {
  title: 'Lightning Talk/Topic Item',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Interactive topic items for Lightning Talk categories'
      }
    }
  },
  argTypes: {
    category: {
      control: 'text',
      description: 'Topic category identifier'
    },
    label: {
      control: 'text',
      description: 'Topic display text'
    },
    selected: {
      control: 'boolean',
      description: 'Selected state'
    },
    onClick: { action: 'clicked' }
  }
};

const Template = ({ category, label, selected, onClick }) => {
  const topicItem = document.createElement('div');
  topicItem.className = `topic-item${selected ? ' selected' : ''}`;
  topicItem.dataset.category = category;
  topicItem.textContent = label;
  
  topicItem.addEventListener('click', () => {
    onClick(category);
  });
  
  // Add hover effect
  topicItem.addEventListener('mouseenter', () => {
    if (!selected) {
      topicItem.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3)';
    }
  });
  
  topicItem.addEventListener('mouseleave', () => {
    if (!selected) {
      topicItem.style.boxShadow = '';
    }
  });
  
  return topicItem;
};

export const Tech = Template.bind({});
Tech.args = {
  category: 'tech',
  label: '💻 プログラミング・技術',
  selected: false
};

export const Hobby = Template.bind({});
Hobby.args = {
  category: 'hobby',
  label: '🎨 趣味・アート・創作',
  selected: false
};

export const Learning = Template.bind({});
Learning.args = {
  category: 'learning',
  label: '📚 読書・学習体験',
  selected: false
};

export const Travel = Template.bind({});
Travel.args = {
  category: 'travel',
  label: '🌍 旅行・文化体験',
  selected: false
};

export const Food = Template.bind({});
Food.args = {
  category: 'food',
  label: '🍳 料理・グルメ',
  selected: false
};

export const Game = Template.bind({});
Game.args = {
  category: 'game',
  label: '🎮 ゲーム・エンタメ',
  selected: false
};

export const Lifehack = Template.bind({});
Lifehack.args = {
  category: 'lifehack',
  label: '💡 ライフハック・効率化',
  selected: false
};

export const Pet = Template.bind({});
Pet.args = {
  category: 'pet',
  label: '🐱 ペット・動物',
  selected: false
};

export const Garden = Template.bind({});
Garden.args = {
  category: 'garden',
  label: '🌱 ガーデニング・植物',
  selected: false
};

export const Money = Template.bind({});
Money.args = {
  category: 'money',
  label: '📈 投資・副業',
  selected: false
};

export const Sports = Template.bind({});
Sports.args = {
  category: 'sports',
  label: '🏃‍♂️ スポーツ・健康',
  selected: false
};

export const Music = Template.bind({});
Music.args = {
  category: 'music',
  label: '🎵 音楽・演奏',
  selected: false
};

export const Selected = Template.bind({});
Selected.args = {
  category: 'tech',
  label: '💻 プログラミング・技術',
  selected: true
};

// Topic Grid example
export const TopicGrid = () => {
  const container = document.createElement('div');
  container.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    max-width: 800px;
    padding: 20px;
  `;
  
  const topics = [
    { category: 'tech', label: '💻 プログラミング・技術' },
    { category: 'hobby', label: '🎨 趣味・アート・創作' },
    { category: 'learning', label: '📚 読書・学習体験' },
    { category: 'travel', label: '🌍 旅行・文化体験' },
    { category: 'food', label: '🍳 料理・グルメ' },
    { category: 'game', label: '🎮 ゲーム・エンタメ' },
    { category: 'lifehack', label: '💡 ライフハック・効率化' },
    { category: 'pet', label: '🐱 ペット・動物' },
    { category: 'garden', label: '🌱 ガーデニング・植物' },
    { category: 'money', label: '📈 投資・副業' },
    { category: 'sports', label: '🏃‍♂️ スポーツ・健康' },
    { category: 'music', label: '🎵 音楽・演奏' }
  ];
  
  topics.forEach(topic => {
    const item = Template({
      category: topic.category,
      label: topic.label,
      selected: false,
      onClick: (category) => console.log('Selected:', category)
    });
    container.appendChild(item);
  });
  
  return container;
};

// Topic item styles
const topicCSS = `
  .topic-item {
    padding: 10px 15px;
    background: linear-gradient(45deg, #f8f9fa, #e9ecef);
    border-radius: 10px;
    border: 2px solid #dee2e6;
    transition: all 0.3s ease;
    cursor: pointer;
    text-align: center;
    user-select: none;
    font-weight: 500;
  }

  .topic-item:hover {
    background: linear-gradient(45deg, #FFD93D, #FF6B6B);
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  }

  .topic-item.selected {
    background: linear-gradient(45deg, #FFD700, #FF6B6B) !important;
    color: #fff !important;
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important;
  }

  .topic-item.selected:hover {
    transform: translateY(-2px) scale(1.02);
  }
`;

// Inject topic styles
if (!document.getElementById('lightning-talk-topic-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'lightning-talk-topic-styles';
  styleSheet.textContent = topicCSS;
  document.head.appendChild(styleSheet);
}