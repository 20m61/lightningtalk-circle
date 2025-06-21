/**
 * Modal component stories for Lightning Talk registration forms
 */

export default {
  title: 'Lightning Talk/Modal',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Modal component for registration forms and information dialogs'
      }
    }
  },
  argTypes: {
    type: {
      options: ['general', 'listener', 'speaker', 'walkin-info'],
      control: { type: 'select' },
      description: 'Modal type'
    },
    isOpen: {
      control: 'boolean',
      description: 'Modal open state'
    },
    onClose: { action: 'closed' },
    onSubmit: { action: 'submitted' }
  }
};

const getRegistrationForm = (type) => {
  const typeConfig = {
    general: {
      title: '📝 イベント参加登録',
      subtitle: 'なんでもライトニングトークへの参加をお待ちしています！'
    },
    listener: {
      title: '👥 聴講参加登録',
      subtitle: '様々な発表を聞いて楽しもう！'
    },
    speaker: {
      title: '🎤 発表者登録',
      subtitle: 'あなたの「なんでも」を5分間で発表しませんか？'
    }
  };

  const config = typeConfig[type] || typeConfig.general;
  const showSpeakerFields = type === 'speaker';

  return `
    <h2 style="color: #333; margin-bottom: 10px;">${config.title}</h2>
    <p style="color: #666; margin-bottom: 30px;">${config.subtitle}</p>
    
    <form class="registration-form">
      <div class="form-group">
        <label for="name">お名前 *</label>
        <input type="text" id="name" name="name" required>
      </div>
      
      <div class="form-group">
        <label for="email">メールアドレス *</label>
        <input type="email" id="email" name="email" required>
      </div>
      
      <div class="form-group">
        <label for="participation">参加方法 *</label>
        <select id="participation" name="participation" required>
          <option value="">選択してください</option>
          <option value="onsite">現地参加</option>
          <option value="online">オンライン参加</option>
          <option value="undecided">当日決める</option>
        </select>
      </div>
      
      ${showSpeakerFields ? `
      <div class="form-group">
        <label for="talkTitle">発表タイトル *</label>
        <input type="text" id="talkTitle" name="talkTitle" required placeholder="例: 猫の写真で学ぶマシンラーニング">
      </div>
      
      <div class="form-group">
        <label for="talkDescription">発表概要 *</label>
        <textarea id="talkDescription" name="talkDescription" required placeholder="どんな内容を5分間で話すか、簡単に教えてください"></textarea>
      </div>
      
      <div class="form-group">
        <label for="category">カテゴリー</label>
        <select id="category" name="category">
          <option value="">選択してください</option>
          <option value="tech">💻 プログラミング・技術</option>
          <option value="hobby">🎨 趣味・アート・創作</option>
          <option value="learning">📚 読書・学習体験</option>
          <option value="travel">🌍 旅行・文化体験</option>
          <option value="food">🍳 料理・グルメ</option>
          <option value="game">🎮 ゲーム・エンタメ</option>
          <option value="lifehack">💡 ライフハック・効率化</option>
          <option value="pet">🐱 ペット・動物</option>
          <option value="garden">🌱 ガーデニング・植物</option>
          <option value="money">📈 投資・副業</option>
          <option value="sports">🏃‍♂️ スポーツ・健康</option>
          <option value="music">🎵 音楽・演奏</option>
          <option value="other">🌟 その他</option>
        </select>
      </div>
      ` : ''}
      
      <div class="form-group">
        <label for="message">メッセージ・質問など</label>
        <textarea id="message" name="message" placeholder="何かご質問やメッセージがあればお聞かせください"></textarea>
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" name="newsletter" value="yes">
          今後のイベント情報を受け取る
        </label>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <button type="submit" class="btn">
          ${showSpeakerFields ? '🎤 発表申込み' : '📝 参加登録'}
        </button>
      </div>
    </form>
  `;
};

const getWalkinInfo = () => {
  return `
    <h2 style="color: #333; margin-bottom: 20px;">⚡ 当日飛び入り発表について</h2>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
      <h3 style="color: #333; margin-bottom: 15px;">🎤 どんな人におすすめ？</h3>
      <ul style="color: #666; line-height: 1.8;">
        <li>「思いついたことをすぐ話したい！」という人</li>
        <li>「準備は苦手だけど話すのは好き」という人</li>
        <li>「その場の雰囲気で決めたい」という人</li>
        <li>「5分なら話せるかも」という人</li>
      </ul>
    </div>
    
    <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
      <h3 style="color: #333; margin-bottom: 15px;">📋 当日の流れ</h3>
      <ol style="color: #666; line-height: 1.8;">
        <li>イベント開始時に飛び入り発表の時間をお知らせします</li>
        <li>話したい方は挙手やチャットで意思表示</li>
        <li>発表順を決めて、5分間でお話しいただきます</li>
        <li>スライドなしでもOK！自由なスタイルで</li>
      </ol>
    </div>
    
    <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
      <h3 style="color: #333; margin-bottom: 15px;">💡 飛び入り発表のコツ</h3>
      <ul style="color: #666; line-height: 1.8;">
        <li><strong>結論から話す:</strong> 5分は意外と短いです</li>
        <li><strong>体験談を入れる:</strong> 聞く人が親しみやすくなります</li>
        <li><strong>完璧を目指さない:</strong> 気軽に、楽しく話しましょう</li>
        <li><strong>質問を歓迎:</strong> 対話形式でも面白いです</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      <p style="color: #666; margin-bottom: 20px;">
        準備不要！あなたの「話したい！」という気持ちだけお持ちください 🌟
      </p>
      <button class="btn" onclick="this.closest('.modal').style.display='none'">
        了解しました！
      </button>
    </div>
  `;
};

const Template = ({ type, isOpen, onClose, onSubmit }) => {
  const container = document.createElement('div');
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = isOpen ? 'block' : 'none';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  
  const closeBtn = document.createElement('span');
  closeBtn.className = 'close';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', onClose);
  
  const modalBody = document.createElement('div');
  modalBody.id = 'modalBody';
  
  if (type === 'walkin-info') {
    modalBody.innerHTML = getWalkinInfo();
  } else {
    modalBody.innerHTML = getRegistrationForm(type);
    
    // Setup form submission
    const form = modalBody.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        onSubmit(Object.fromEntries(formData));
      });
    }
  }
  
  modalContent.appendChild(closeBtn);
  modalContent.appendChild(modalBody);
  modal.appendChild(modalContent);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      onClose();
    }
  });
  
  container.appendChild(modal);
  return container;
};

export const GeneralRegistration = Template.bind({});
GeneralRegistration.args = {
  type: 'general',
  isOpen: true
};

export const ListenerRegistration = Template.bind({});
ListenerRegistration.args = {
  type: 'listener',
  isOpen: true
};

export const SpeakerRegistration = Template.bind({});
SpeakerRegistration.args = {
  type: 'speaker',
  isOpen: true
};

export const WalkinInfo = Template.bind({});
WalkinInfo.args = {
  type: 'walkin-info',
  isOpen: true
};

export const Closed = Template.bind({});
Closed.args = {
  type: 'general',
  isOpen: false
};

// Modal styles
const modalCSS = `
  .modal {
    position: fixed;
    z-index: 2000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    backdrop-filter: blur(5px);
  }

  .modal-content {
    background-color: #fff;
    margin: 5% auto;
    padding: 30px;
    border-radius: 20px;
    width: 90%;
    max-width: 600px;
    position: relative;
  }

  .close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    position: absolute;
    top: 15px;
    right: 20px;
  }

  .close:hover,
  .close:focus {
    color: #000;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #333;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 10px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #FF6B6B;
  }

  .form-group textarea {
    resize: vertical;
    min-height: 100px;
  }

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
  }

  .btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.3);
  }

  .registration-form {
    animation: fadeInUp 0.3s ease;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Inject modal styles
if (!document.getElementById('lightning-talk-modal-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'lightning-talk-modal-styles';
  styleSheet.textContent = modalCSS;
  document.head.appendChild(styleSheet);
}