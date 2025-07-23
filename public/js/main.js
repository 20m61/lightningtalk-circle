/**
 * Lightning Talk Event Management System
 * Main JavaScript functionality
 */

class LightningTalkApp {
  constructor() {
    this.eventDate = new Date('2025-07-15T19:00:00+09:00');

    // Frontend Logger
    this.logger = window.Logger;

    // Cognito Configuration - SECURE: Retrieved from environment
    this.cognitoConfig = {
      userPoolId: 'SET_VIA_ENVIRONMENT',
      clientId: 'SET_VIA_ENVIRONMENT',
      region: 'ap-northeast-1',
      domain: 'SET_VIA_ENVIRONMENT'
    };

    // Animation Manager Reference
    this.animationManager = window.AnimationManager;

    // Mobile Systems References
    this.mobileTouch = window.MobileTouchManager;
    this.mobileComponents = window.MobileComponentSystem;
    this.performanceOptimizer = window.MobilePerformanceOptimizer;

    // Configuration - Survey counter feature toggle
    this.config = {
      showSurveyCounters: false // Set to true to enable counter display
    };

    this.surveyCounters = {
      online: parseInt(localStorage.getItem('onlineCount') || '0'),
      offline: parseInt(localStorage.getItem('offlineCount') || '0')
    };
    this.chatMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');

    // Participation vote data per event
    this.participationVotes = JSON.parse(localStorage.getItem('participationVotes') || '{}');

    // WebSocket for real-time updates
    this.ws = null;
    this.wsReconnectInterval = null;

    // Current vote context
    this.currentVoteType = null;
    this.currentEventId = null;

    // Event modal reference
    this.eventModal = null;

    // Cache frequently used DOM elements
    this.elements = {
      modal: null,
      modalBody: null,
      header: null,
      chatWidget: null,
      chatContainer: null,
      chatMessages: null,
      chatInput: null,
      voteModal: null,
      voteForm: null,
      countdownElements: {
        days: null,
        hours: null,
        minutes: null,
        seconds: null,
        message: null
      },
      surveyCounters: {
        online: null,
        offline: null
      }
    };

    this.init();
  }

  // Helper method to safely get environment variables
  getEnvVar(name, defaultValue) {
    try {
      if (typeof process !== 'undefined' && process.env && process.env[name]) {
        return process.env[name];
      }
    } catch (e) {
      // process is not defined in browser
    }
    return defaultValue;
  }

  init() {
    try {
      this.cacheDOMElements();
      this.setupEventListeners();

      // 存在しない要素に依存する機能は安全にスキップ
      if (this.elements.header) {
        this.setupScrollAnimations();
        this.setupParallax();
      }

      this.setupSmoothScroll();
      this.updateFeedbackButton();
      this.startPeriodicUpdates();
      this.setupFloatingEffects();
      this.setupModalHandlers();
      this.setupTopicInteractions();
      this.initEventModal();
      this.setupMobileMenu();

      if (this.elements.surveyCounters.online || this.elements.surveyCounters.offline) {
        this.updateSurveyCounters();
      }

      if (this.elements.chatWidget) {
        this.setupChatWidget();
      }

      if (Object.values(this.elements.countdownElements).some(el => el !== null)) {
        this.setupCountdownTimer();
      }

      this.setupParticipationVoting();
      this.connectWebSocket();
    } catch (error) {
      if (this.logger) {
        this.logger.error('Initialization error', { error: error.message, category: 'app_init' });
      } else {
        console.error('App initialization error:', error);
      }
    }
  }

  cacheDOMElements() {
    // Cache modal elements
    this.elements.modal = document.getElementById('registerModal');
    this.elements.modalBody = document.getElementById('modalBody');

    // Cache header
    this.elements.header = document.querySelector('header');

    // Cache chat elements
    this.elements.chatWidget = document.getElementById('chatWidget');
    this.elements.chatContainer = document.getElementById('chatContainer');
    this.elements.chatMessages = document.getElementById('chatMessages');
    this.elements.chatInput = document.getElementById('chatInput');

    // Cache countdown elements
    this.elements.countdownElements.days = document.getElementById('days');
    this.elements.countdownElements.hours = document.getElementById('hours');
    this.elements.countdownElements.minutes = document.getElementById('minutes');
    this.elements.countdownElements.seconds = document.getElementById('seconds');
    this.elements.countdownElements.message = document.getElementById('countdown-message');

    // Cache survey counter elements
    this.elements.surveyCounters.online = document.getElementById('onlineCount');
    this.elements.surveyCounters.offline = document.getElementById('offlineCount');

    // Cache vote modal elements
    this.elements.voteModal = document.getElementById('voteModal');
    this.elements.voteForm = document.getElementById('voteForm');
  }

  // Performance utility methods
  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(
          () => {
            func.apply(this, args);
            lastExecTime = Date.now();
          },
          delay - (currentTime - lastExecTime)
        );
      }
    };
  }

  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  setupEventListeners() {
    // Register buttons with enhanced animations
    document.querySelectorAll('[data-action]').forEach(button => {
      // Add hover animation
      button.addEventListener('mouseenter', () => {
        if (this.animationManager) {
          this.animationManager.createAnimation(
            button,
            [
              { transform: 'scale(1)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
              { transform: 'scale(1.05)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }
            ],
            {
              duration: 200,
              easing: 'ease-out',
              fill: 'forwards'
            }
          );
        }
      });

      button.addEventListener('mouseleave', () => {
        if (this.animationManager) {
          this.animationManager.createAnimation(
            button,
            [
              { transform: 'scale(1.05)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
              { transform: 'scale(1)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
            ],
            {
              duration: 200,
              easing: 'ease-out',
              fill: 'forwards'
            }
          );
        }
      });

      button.addEventListener('click', e => {
        e.preventDefault();

        // Click ripple effect
        if (this.animationManager) {
          this.animationManager.createParticleEffect(
            {
              x: e.clientX,
              y: e.clientY
            },
            {
              count: 15,
              spread: 30,
              duration: 800,
              colors: ['#ff6b35', '#4ecdc4']
            }
          );
        }

        this.handleAction(e.target.dataset.action, e.target);
      });
    });

    // Topic items with enhanced animations
    document.querySelectorAll('.topic-item').forEach((item, index) => {
      // Staggered entrance animation
      if (this.animationManager) {
        this.animationManager.createAnimation(
          item,
          [
            { transform: 'translateY(20px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 }
          ],
          {
            duration: 500,
            delay: index * 50,
            easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
          }
        );
      }

      item.addEventListener('click', () => {
        this.highlightTopic(item);

        // Spring animation on selection
        if (this.animationManager) {
          this.animationManager.createSpringAnimation(item, 0, {
            stiffness: 300,
            damping: 20,
            onComplete: () => {
              item.style.transform = 'translateX(0)';
            }
          });
        }
      });
    });

    // Window events with throttling for better performance
    const throttledScroll = this.throttle(() => {
      this.updateHeaderOnScroll();
      this.updateParallax();
    }, 16); // ~60fps

    const throttledResize = this.throttle(() => {
      this.handleResize();
    }, 100);

    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('resize', throttledResize, { passive: true });

    // Cleanup on page unload to prevent memory leaks
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  handleAction(action, element) {
    // ローディング状態の表示
    if (element && element.classList) {
      element.classList.add('loading');
      element.disabled = true;
    }

    try {
      switch (action) {
        case 'register':
          this.openRegistrationModal('general');
          break;
        case 'register-listener':
          this.openRegistrationModal('listener');
          break;
        case 'register-speaker':
          this.openRegistrationModal('speaker');
          break;
        case 'feedback':
          this.openFeedbackForm();
          break;
        case 'walkin-info':
          this.showWalkinInfo();
          break;
        case 'survey-online':
          this.incrementSurveyCounter('online');
          break;
        case 'survey-offline':
          this.incrementSurveyCounter('offline');
          break;
        case 'view-detail':
          this.openEventDetailModal(element.dataset.eventId);
          break;
        case 'toggle-participants':
          this.toggleParticipantsList();
          break;
        case 'toggle-settings':
          this.toggleChatSettings();
          break;
        case 'minimize':
          this.minimizeChat();
          break;
        case 'attach-file':
          this.openFileAttachment();
          break;
        case 'emoji':
          this.toggleEmojiPicker();
          break;
        default:
          this.logger.warn('Unknown action:', { action });
      }
    } catch (error) {
      this.logger.error('Action execution failed:', { action, error: error.message });
      this.showNotification('アクション実行中にエラーが発生しました', 'error');
    } finally {
      // ローディング状態の解除
      if (element && element.classList) {
        setTimeout(() => {
          element.classList.remove('loading');
          element.disabled = false;
        }, 500);
      }
    }
  }

  openRegistrationModal(type = 'general') {
    if (!this.elements.modal || !this.elements.modalBody) {
      // Fallback if elements aren't cached yet
      this.elements.modal = document.getElementById('registerModal');
      this.elements.modalBody = document.getElementById('modalBody');
    }

    this.elements.modalBody.innerHTML = this.getRegistrationForm(type);
    this.elements.modal.style.display = 'block';

    // Setup form submission
    const form = this.elements.modalBody.querySelector('form');
    if (form) {
      // Setup real-time validation
      this.setupFormValidation(form, type);

      form.addEventListener('submit', e => {
        e.preventDefault();
        if (this.validateForm(form, type)) {
          this.handleRegistration(new FormData(form), type);
        }
      });
    }
  }

  getRegistrationForm(type) {
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
            
            <form class="registration-form" novalidate>
                <div class="form-group">
                    <label for="name">お名前 *</label>
                    <input type="text" id="name" name="name" required maxlength="100">
                    <span class="field-hint">例: 山田太郎</span>
                    <span class="field-error" id="name-error"></span>
                </div>
                
                <div class="form-group">
                    <label for="email">メールアドレス *</label>
                    <input type="email" id="email" name="email" required>
                    <span class="field-hint">例: example@email.com</span>
                    <span class="field-error" id="email-error"></span>
                </div>
                
                <div class="form-group">
                    <label for="participation">参加方法 *</label>
                    <select id="participation" name="participationType" required>
                        <option value="">選択してください</option>
                        <option value="onsite">現地参加</option>
                        <option value="online">オンライン参加</option>
                        <option value="undecided">当日決める</option>
                    </select>
                    <span class="field-error" id="participation-error"></span>
                </div>
                
                ${
                  showSpeakerFields
                    ? `
                <div class="form-group">
                    <label for="talkTitle">発表タイトル *</label>
                    <input type="text" id="talkTitle" name="talkTitle" required maxlength="200" placeholder="例: 猫の写真で学ぶマシンラーニング">
                    <span class="field-hint">5分間の発表内容を表すタイトル (最大200文字)</span>
                    <span class="field-error" id="talkTitle-error"></span>
                </div>
                
                <div class="form-group">
                    <label for="talkDescription">発表概要 *</label>
                    <textarea id="talkDescription" name="talkDescription" required maxlength="2000" placeholder="どんな内容を5分間で話すか、簡単に教えてください"></textarea>
                    <span class="field-hint">発表の内容や狙いを説明してください (最大2000文字)</span>
                    <span class="field-error" id="talkDescription-error"></span>
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
                `
                    : ''
                }
                
                <div class="form-group">
                    <label for="message">メッセージ・質問など</label>
                    <textarea id="message" name="message" maxlength="1000" placeholder="何かご質問やメッセージがあればお聞かせください"></textarea>
                    <span class="field-hint">最大1000文字</span>
                    <span class="field-error" id="message-error"></span>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="newsletter" value="true">
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
  }

  async handleRegistration(formData, type) {
    // Show loading state
    const submitBtn = document.querySelector('.registration-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '送信中...';
    submitBtn.disabled = true;

    try {
      // Actual API call to backend
      const registrationData = Object.fromEntries(formData);
      registrationData.eventId = 'event-001'; // Add default event ID

      const response = await fetch('/api/participants/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.showRegistrationSuccess(type);
        this.closeModal();

        // Update UI with participant count if available
        if (result.participant) {
          this.logger.business('Registration successful', {
            participantName: result.participant.name,
            type: 'user_registration'
          });
        }
      } else {
        // Handle validation errors from server
        if (result.details && Array.isArray(result.details)) {
          this.handleServerValidationErrors(result.details);
        } else {
          throw new Error(result.message || 'Registration failed');
        }
      }
    } catch (error) {
      this.logger.error('Registration error', {
        error: error.message,
        stack: error.stack,
        category: 'registration'
      });
      this.showRegistrationError(error.message);
    } finally {
      // Reset button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  showRegistrationSuccess(type) {
    const typeMessages = {
      general: '参加登録が完了しました！',
      listener: '聴講参加の登録が完了しました！',
      speaker: '発表申込みが完了しました！'
    };

    const message = typeMessages[type] || typeMessages.general;

    this.showNotification(`${message} 詳細は登録されたメールアドレスに送信されます。`, 'success');
  }

  showRegistrationError(errorMessage) {
    const message = errorMessage || '登録処理中にエラーが発生しました。';
    this.showNotification(`❌ エラー: ${message}\n時間をおいて再度お試しください。`, 'error');
  }

  // Form validation methods
  setupFormValidation(form, type) {
    const fields = form.querySelectorAll('input, textarea, select');

    fields.forEach(field => {
      // Real-time validation on blur and input
      field.addEventListener('blur', () => this.validateField(field, type));
      field.addEventListener('input', () => {
        this.clearFieldError(field);
        // Only validate on input if field was previously invalid
        if (field.getAttribute('data-invalid') === 'true') {
          this.validateField(field, type);
        }
      });

      // Character count for textarea fields
      if (field.tagName === 'TEXTAREA' && field.hasAttribute('maxlength')) {
        this.setupCharacterCount(field);
      }
    });
  }

  setupCharacterCount(field) {
    const maxLength = parseInt(field.getAttribute('maxlength'));
    const fieldGroup = field.closest('.form-group');
    const hint = fieldGroup.querySelector('.field-hint');

    const updateCount = () => {
      const remaining = maxLength - field.value.length;
      const originalHint = hint.textContent.split(' (')[0];
      hint.textContent = `${originalHint} (残り${remaining}文字)`;

      if (remaining < 100) {
        hint.style.color = remaining < 20 ? '#e74c3c' : '#f39c12';
      } else {
        hint.style.color = '';
      }
    };

    field.addEventListener('input', updateCount);
    updateCount(); // Initial count
  }

  validateField(field, type) {
    const fieldName = field.name;
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Clear previous error state
    this.clearFieldError(field);

    // Required field validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'この項目は必須です';
    }
    // Email validation
    else if (fieldName === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = '有効なメールアドレスを入力してください';
      }
    }
    // Name validation
    else if (fieldName === 'name' && value) {
      if (value.length < 1 || value.length > 100) {
        isValid = false;
        errorMessage = '名前は1文字以上100文字以内で入力してください';
      }
    }
    // Talk title validation
    else if (fieldName === 'talkTitle' && value) {
      if (value.length < 1 || value.length > 200) {
        isValid = false;
        errorMessage = 'タイトルは1文字以上200文字以内で入力してください';
      }
    }
    // Talk description validation
    else if (fieldName === 'talkDescription' && value) {
      if (value.length < 1 || value.length > 2000) {
        isValid = false;
        errorMessage = '発表概要は1文字以上2000文字以内で入力してください';
      }
    }
    // Message validation
    else if (fieldName === 'message' && value && value.length > 1000) {
      isValid = false;
      errorMessage = 'メッセージは1000文字以内で入力してください';
    }

    if (!isValid) {
      this.showFieldError(field, errorMessage);
      field.setAttribute('data-invalid', 'true');
    } else {
      field.removeAttribute('data-invalid');
    }

    return isValid;
  }

  validateForm(form, type) {
    const fields = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isFormValid = true;

    fields.forEach(field => {
      if (!this.validateField(field, type)) {
        isFormValid = false;
      }
    });

    // Additional validation for speaker forms
    if (type === 'speaker') {
      const talkTitle = form.querySelector('[name="talkTitle"]');
      const talkDescription = form.querySelector('[name="talkDescription"]');

      if (talkTitle && !this.validateField(talkTitle, type)) {
        isFormValid = false;
      }
      if (talkDescription && !this.validateField(talkDescription, type)) {
        isFormValid = false;
      }
    }

    if (!isFormValid) {
      this.showNotification(
        '入力内容に問題があります。エラーメッセージをご確認ください。',
        'error'
      );
    }

    return isFormValid;
  }

  showFieldError(field, message) {
    const fieldGroup = field.closest('.form-group');
    const errorElement = fieldGroup.querySelector('.field-error');

    field.classList.add('field-invalid');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearFieldError(field) {
    const fieldGroup = field.closest('.form-group');
    const errorElement = fieldGroup.querySelector('.field-error');

    field.classList.remove('field-invalid');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  handleServerValidationErrors(errors) {
    const errorMessages = [];

    errors.forEach(error => {
      const fieldName = error.path || error.param;
      const message = error.msg || error.message;

      // Map server field names to client field names
      const fieldMapping = {
        participationType: 'participation'
      };

      const clientFieldName = fieldMapping[fieldName] || fieldName;
      const field = document.querySelector(`[name="${clientFieldName}"]`);

      if (field) {
        this.showFieldError(field, message);
        field.setAttribute('data-invalid', 'true');
      }

      errorMessages.push(message);
    });

    if (errorMessages.length > 0) {
      this.showNotification(`入力内容にエラーがあります: ${errorMessages.join(', ')}`, 'error');
    }
  }

  openFeedbackForm() {
    window.open(
      'https://docs.google.com/forms/d/e/1FAIpQLSfLqwSY_c93TiaoqR3RcMKd8L4c05q0WA54Fn8SZQrnBxhzMA/viewform',
      '_blank'
    );
  }

  showWalkinInfo() {
    const modal = document.getElementById('registerModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
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

    modal.style.display = 'block';
  }

  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          const headerHeight = document.querySelector('header').offsetHeight;
          const targetPosition = target.offsetTop - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  setupScrollAnimations() {
    // Use Animation Manager for scroll-triggered animations
    if (this.animationManager) {
      // Fade-in elements
      document.querySelectorAll('.fade-in').forEach((el, index) => {
        this.animationManager.createScrollAnimation(
          el,
          [
            { transform: 'translateY(30px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 }
          ],
          {
            threshold: 0.2,
            once: true
          }
        );
      });

      // Event cards with stagger
      document.querySelectorAll('.event-card').forEach((card, index) => {
        this.animationManager.createScrollAnimation(
          card,
          [
            { transform: 'translateX(-50px) scale(0.95)', opacity: 0 },
            { transform: 'translateX(0) scale(1)', opacity: 1 }
          ],
          {
            threshold: 0.3,
            once: true
          }
        );
      });

      // Timeline items with alternating animations
      document.querySelectorAll('.timeline-item').forEach((item, index) => {
        const isEven = index % 2 === 0;
        this.animationManager.createScrollAnimation(
          item,
          [
            {
              transform: `translateX(${isEven ? '-50px' : '50px'}) rotate(${isEven ? '-2deg' : '2deg'})`,
              opacity: 0
            },
            {
              transform: 'translateX(0) rotate(0)',
              opacity: 1
            }
          ],
          {
            threshold: 0.4,
            once: true
          }
        );
      });
    } else {
      // Fallback to CSS-based animations
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, observerOptions);

      document.querySelectorAll('.fade-in, .event-card, .timeline-item').forEach(el => {
        observer.observe(el);
      });
    }
  }

  updateFeedbackButton() {
    const now = new Date();
    const feedbackBtn = document.getElementById('feedbackBtn');

    if (!feedbackBtn) {
      return;
    }

    if (now >= this.eventDate) {
      feedbackBtn.disabled = false;
      feedbackBtn.classList.remove('btn-disabled');
      feedbackBtn.innerHTML = '💭 感想アンケート';
    } else {
      const timeUntilEvent = this.eventDate - now;
      const days = Math.floor(timeUntilEvent / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeUntilEvent % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        feedbackBtn.innerHTML = `💭 感想アンケート（${days}日後に有効）`;
      } else if (hours > 0) {
        feedbackBtn.innerHTML = `💭 感想アンケート（${hours}時間後に有効）`;
      } else {
        feedbackBtn.innerHTML = '💭 感想アンケート（まもなく有効）';
      }
    }
  }

  // Legacy startPeriodicUpdates moved to optimized version below

  setupParallax() {
    this.floatingElements = document.querySelector('.floating-elements');
  }

  updateParallax() {
    if (!this.floatingElements) {
      return;
    }

    const scrolled = window.pageYOffset;
    this.floatingElements.style.transform = `translateY(${scrolled * 0.5}px)`;
  }

  updateHeaderOnScroll() {
    const header = document.querySelector('header');
    const scrolled = window.pageYOffset > 50;

    header.classList.toggle('scrolled', scrolled);
  }

  setupFloatingEffects() {
    this.setupStarTrail();
  }

  setupStarTrail() {
    let mouseX = 0,
      mouseY = 0;
    let lastStarTime = 0;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      const now = Date.now();
      if (now - lastStarTime > 200) {
        this.createStarTrail(mouseX, mouseY);
        lastStarTime = now;
      }
    });
  }

  createStarTrail(x, y) {
    const star = document.createElement('div');
    star.innerHTML = '✨';
    star.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            font-size: 1rem;
            z-index: 1001;
            animation: starFade 1s ease-out forwards;
        `;

    document.body.appendChild(star);

    setTimeout(() => {
      star.remove();
    }, 1000);
  }

  createFloatingEmoji() {
    const emojis = ['⚡', '🌟', '💡', '🚀', '🎤', '🌸', '😸', '🐸'];
    const emoji = document.createElement('div');
    emoji.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.cssText = `
            position: fixed;
            left: ${Math.random() * 100}vw;
            top: 100vh;
            font-size: 2rem;
            pointer-events: none;
            z-index: 100;
            animation: floatUp 4s linear forwards;
        `;

    document.body.appendChild(emoji);

    setTimeout(() => {
      emoji.remove();
    }, 4000);
  }

  setupModalHandlers() {
    const modal = document.getElementById('registerModal');
    const closeBtn = modal.querySelector('.close');

    closeBtn.addEventListener('click', () => {
      this.closeModal();
    });

    window.addEventListener('click', e => {
      if (e.target === modal) {
        this.closeModal();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        this.closeModal();
      }
    });
  }

  closeModal() {
    const modal = document.getElementById('registerModal');
    modal.style.display = 'none';
  }

  setupTopicInteractions() {
    document.querySelectorAll('.topic-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        this.showTopicPreview(item);
      });
    });
  }

  highlightTopic(topicElement) {
    // Remove previous highlights
    document.querySelectorAll('.topic-item').forEach(item => {
      item.classList.remove('selected');
    });

    // Add highlight to clicked topic
    topicElement.classList.add('selected');

    // Show related information
    this.showTopicDetails(topicElement.dataset.category);
  }

  showTopicPreview(topicElement) {
    // Add a subtle glow effect
    topicElement.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3)';

    setTimeout(() => {
      topicElement.style.boxShadow = '';
    }, 300);
  }

  showTopicDetails(category) {
    const examples = {
      tech: ['プログラミング言語の比較', 'AI/ML の活用事例', 'Web開発のトレンド'],
      hobby: ['手作りアクセサリーの作り方', '写真撮影のコツ', '音楽制作体験'],
      learning: ['効果的な読書法', 'オンライン学習の活用', '資格取得体験談'],
      travel: ['海外一人旅の準備', '国内の隠れた名所', '文化の違いから学んだこと'],
      food: ['簡単で美味しいレシピ', '地方グルメの発見', '食材の面白い豆知識'],
      game: ['インディーゲームの魅力', 'eスポーツの世界', 'ゲーム開発入門'],
      lifehack: ['時間管理術', '整理整頓のコツ', 'ストレス解消法'],
      pet: ['ペットとの生活', '動物の面白い行動', 'ペット写真の撮り方'],
      garden: ['ベランダ菜園のすすめ', '観葉植物の育て方', '季節の花の楽しみ方'],
      money: ['初心者向け投資入門', '副業体験談', '節約術の実践'],
      sports: ['運動習慣の作り方', 'スポーツ観戦の楽しみ', '健康管理のコツ'],
      music: ['楽器演奏の魅力', '音楽鑑賞のポイント', '作曲・編曲入門']
    };

    const categoryExamples = examples[category] || [
      'あなただけの体験談',
      '新しい発見',
      '面白いエピソード'
    ];

    this.showNotification(
      `${topicElement.textContent}の発表例: ${categoryExamples.join('、')}など`,
      'info'
    );
  }

  setupMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!toggle || !navLinks) {
      return;
    }

    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');

      // Animate hamburger menu
      const spans = toggle.querySelectorAll('span');
      spans.forEach((span, index) => {
        span.style.transform = navLinks.classList.contains('active')
          ? `rotate(${index === 1 ? 0 : index === 0 ? 45 : -45}deg) translateY(${index === 1 ? 0 : index === 0 ? 7 : -7}px)`
          : 'none';
      });
    });

    // Close mobile menu when clicking on links
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const spans = toggle.querySelectorAll('span');
        spans.forEach(span => {
          span.style.transform = 'none';
        });
      });
    });
  }

  handleResize() {
    // Recalculate positions for responsive elements
    this.updateParallax();
  }

  showNotification(message, type = 'info') {
    // 統一コンポーネントシステムを使用
    if (window.UnifiedComponentSystem) {
      const notificationContainer =
        document.getElementById('notification-container') ||
        (() => {
          const container = document.createElement('div');
          container.id = 'notification-container';
          container.style.cssText = `
          position: fixed;
          top: 100px;
          right: 20px;
          z-index: 2001;
          display: flex;
          flex-direction: column;
          gap: 10px;
        `;
          document.body.appendChild(container);
          return container;
        })();

      const alert = window.UnifiedComponentSystem.create(
        'Alert',
        {
          type: type === 'error' ? 'error' : type === 'success' ? 'success' : 'info',
          dismissible: true,
          icon: true,
          onDismiss: () => this.logger.debug('Notification dismissed')
        },
        message
      );

      alert.style.animation = 'slideInRight 0.3s ease';
      notificationContainer.appendChild(alert);

      setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => alert.remove(), 300);
      }, 5000);
    } else {
      // フォールバック: 従来の実装
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.style.cssText = `
              position: fixed;
              top: 100px;
              right: 20px;
              background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
              color: white;
              padding: 15px 20px;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              z-index: 2001;
              max-width: 300px;
              animation: slideInRight 0.3s ease;
          `;
      notification.textContent = message;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 4000);
    }
  }

  // Survey counter methods
  incrementSurveyCounter(type) {
    this.surveyCounters[type]++;
    localStorage.setItem(`${type}Count`, this.surveyCounters[type].toString());
    this.updateSurveyCounters();

    // Only show notification if counters are visible
    if (this.config.showSurveyCounters) {
      this.showNotification(
        `${type === 'online' ? 'オンライン' : '現地'}参加をカウントしました！`,
        'success'
      );
    } else {
      // Still show a thank you message without revealing the count
      this.showNotification('ご回答ありがとうございます！', 'success');
    }
  }

  updateSurveyCounters() {
    // Use cached elements for better performance
    const { online: onlineCountEl, offline: offlineCountEl } = this.elements.surveyCounters;

    if (onlineCountEl) {
      if (this.config.showSurveyCounters) {
        onlineCountEl.textContent = this.surveyCounters.online.toString();
        onlineCountEl.style.display = 'inline';
      } else {
        onlineCountEl.style.display = 'none';
      }
    }
    if (offlineCountEl) {
      if (this.config.showSurveyCounters) {
        offlineCountEl.textContent = this.surveyCounters.offline.toString();
        offlineCountEl.style.display = 'inline';
      } else {
        offlineCountEl.style.display = 'none';
      }
    }
  }

  // Utility methods
  formatDate(date) {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }

  formatTime(date) {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Chat widget functionality
  setupChatWidget() {
    const chatToggle = document.getElementById('chatToggle');
    const chatContainer = document.getElementById('chatContainer');
    const chatClose = document.querySelector('.chat-close');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');

    // Load existing messages
    this.loadChatMessages();

    // Toggle chat
    chatToggle.addEventListener('click', () => {
      const isOpen = chatContainer.style.display === 'block';
      chatContainer.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) {
        chatInput.focus();
        this.markMessagesAsRead();
      }
    });

    // Close chat
    chatClose.addEventListener('click', () => {
      chatContainer.style.display = 'none';
    });

    // Send message
    const sendMessage = () => {
      const message = chatInput.value.trim();
      if (message) {
        this.addChatMessage(message, 'user');
        chatInput.value = '';

        // Simulate response after a short delay
        setTimeout(() => {
          this.addAutoResponse(message);
        }, 1000);
      }
    };

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }

  loadChatMessages() {
    const chatMessagesEl = document.getElementById('chatMessages');
    this.chatMessages.forEach(msg => {
      this.displayMessage(msg);
    });
    this.scrollToBottom();
  }

  addChatMessage(text, sender) {
    const message = {
      text,
      sender,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };

    this.chatMessages.push(message);
    this.saveChatMessages();
    this.displayMessage(message);
    this.scrollToBottom();

    if (sender === 'bot') {
      this.showNotificationBadge();
    }
  }

  displayMessage(message) {
    const chatMessagesEl = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${message.sender}`;

    const time = new Date(message.timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });

    messageEl.innerHTML = `
            <div class="message-content">${this.escapeHtml(message.text)}</div>
            <div class="message-time">${time}</div>
        `;

    chatMessagesEl.appendChild(messageEl);
  }

  addAutoResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    let response = '';

    if (lowerMessage.includes('会場') || lowerMessage.includes('場所')) {
      response = '会場は西新宿8-14-19 小林第二ビル8階です。地図リンクからご確認ください 📍';
    } else if (lowerMessage.includes('時間') || lowerMessage.includes('何時')) {
      response =
        'イベントは6月25日（水）19:00からです。オンライン参加の方は18:30から入室可能です ⏰';
    } else if (lowerMessage.includes('参加') || lowerMessage.includes('申込')) {
      response =
        '参加申込みは上部の「当日参加申込み」ボタンからお願いします。当日飛び入り参加も歓迎です！ 🎉';
    } else if (lowerMessage.includes('発表') || lowerMessage.includes('LT')) {
      response =
        '5分間のライトニングトークです。テーマは自由！技術、趣味、日常の発見など、なんでもOKです ⚡';
    } else if (lowerMessage.includes('オンライン')) {
      response =
        'オンライン参加はGoogle Meetを使用します。参加リンクは会場情報セクションにあります 💻';
    } else {
      response =
        'ご質問ありがとうございます！詳細は各セクションをご確認いただくか、緊急連絡先までお問い合わせください 📞';
    }

    this.addChatMessage(response, 'bot');
  }

  saveChatMessages() {
    // Keep only last 50 messages
    if (this.chatMessages.length > 50) {
      this.chatMessages = this.chatMessages.slice(-50);
    }
    localStorage.setItem('chatMessages', JSON.stringify(this.chatMessages));
  }

  scrollToBottom() {
    const chatMessagesEl = document.getElementById('chatMessages');
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  showNotificationBadge() {
    const badge = document.querySelector('.chat-notification-badge');
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer.style.display === 'none') {
      badge.style.display = 'inline';
    }
  }

  markMessagesAsRead() {
    const badge = document.querySelector('.chat-notification-badge');
    badge.style.display = 'none';
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Event Modal Integration
  initEventModal() {
    // Set up event modal integration
    if (window.eventModal) {
      this.eventModal = window.eventModal;

      // Listen for registration events from modal
      window.addEventListener('openRegistration', e => {
        this.handleModalRegistration(e.detail.event);
      });

      // Listen for survey events from modal
      window.addEventListener('openSurvey', e => {
        this.handleModalSurvey(e.detail.event);
      });
    }
  }

  handleModalRegistration(event) {
    // Convert modal registration to existing registration system
    const registrationType = event.format === 'online' ? 'listener' : 'speaker';
    this.handleAction(`register-${registrationType}`, null);
  }

  handleModalSurvey(event) {
    // Convert modal survey to existing vote system
    this.currentEventId = event.id;
    this.openVoteModal('online'); // Default to online, user can change in modal
  }

  // ===== 新規追加アクションメソッド =====

  openEventDetailModal(eventId) {
    if (!eventId) {
      this.logger.warn('Event ID not provided for detail modal');
      return;
    }

    // イベントデータ取得（EventsManagerから）
    const event = this.getEventById(eventId);
    if (!event) {
      this.logger.error('Event not found:', eventId);
      return;
    }

    // Event Modal システムを使用（既存の event-modal.js との統合）
    if (window.EventModal) {
      window.EventModal.open(event);
    } else {
      // フォールバック実装
      this.showEventDetailFallback(event);
    }
  }

  showEventDetailFallback(event) {
    // 簡易イベント詳細表示のフォールバック
    const modalBody = document.getElementById('modalBody');
    if (modalBody) {
      modalBody.innerHTML = `
        <h2>${event.title || 'イベント詳細'}</h2>
        <p><strong>日時:</strong> ${event.date || '未定'}</p>
        <p><strong>形式:</strong> ${event.format || '未定'}</p>
        <p><strong>説明:</strong> ${event.description || '詳細情報なし'}</p>
        <div class="modal-actions">
          <button class="btn btn-primary" data-action="register" data-event-id="${event.id}">
            参加登録
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">
            閉じる
          </button>
        </div>
      `;
      document.getElementById('registerModal').style.display = 'block';
    }
  }

  getEventById(eventId) {
    // EventsManager経由でイベント取得
    if (window.EventsManager && window.EventsManager.events) {
      return window.EventsManager.events.find(event => event.id === eventId);
    }

    // フォールバック: ローカルデータから取得
    const fallbackEvents = [
      {
        id: '1',
        title: 'なんでもライトニングトーク',
        date: '2025-07-15T19:00:00+09:00',
        format: 'ハイブリッド',
        description: '5分で伝える、みんなのアイデア'
      }
    ];
    return fallbackEvents.find(event => event.id === eventId) || fallbackEvents[0];
  }

  // チャット関連アクションメソッド
  toggleParticipantsList() {
    const participantsList = document.getElementById('chat-participants-list');
    if (participantsList) {
      participantsList.classList.toggle('hidden');

      // アイコン状態の更新
      const toggleBtn = document.querySelector('[data-action="toggle-participants"]');
      if (toggleBtn) {
        const isVisible = !participantsList.classList.contains('hidden');
        toggleBtn.classList.toggle('active', isVisible);
        toggleBtn.setAttribute('aria-pressed', isVisible.toString());
      }

      this.logger.info('Participants list toggled', {
        visible: !participantsList.classList.contains('hidden')
      });
    }
  }

  toggleChatSettings() {
    const settingsPanel = document.getElementById('chat-settings-panel');
    if (settingsPanel) {
      settingsPanel.classList.toggle('hidden');

      // 設定ボタン状態の更新
      const settingsBtn = document.querySelector('[data-action="toggle-settings"]');
      if (settingsBtn) {
        const isVisible = !settingsPanel.classList.contains('hidden');
        settingsBtn.classList.toggle('active', isVisible);
        settingsBtn.setAttribute('aria-pressed', isVisible.toString());
      }

      this.logger.info('Chat settings toggled', {
        visible: !settingsPanel.classList.contains('hidden')
      });
    }
  }

  minimizeChat() {
    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget) {
      chatWidget.classList.toggle('minimized');

      // 最小化ボタンのアイコン変更
      const minimizeBtn = document.querySelector('[data-action="minimize"]');
      if (minimizeBtn) {
        const isMinimized = chatWidget.classList.contains('minimized');
        minimizeBtn.innerHTML = isMinimized ? '🔼' : '🔽';
        minimizeBtn.title = isMinimized ? '最大化' : '最小化';
      }

      this.logger.info('Chat minimized/maximized', {
        minimized: chatWidget.classList.contains('minimized')
      });
    }
  }

  openFileAttachment() {
    // ファイル選択ダイアログの作成
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';

    fileInput.onchange = e => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        this.handleFileSelection(files);
      }
    };

    fileInput.click();
    this.logger.info('File attachment dialog opened');
  }

  handleFileSelection(files) {
    // ファイル添付処理（実装要）
    this.logger.info('Files selected for attachment', {
      count: files.length,
      files: files.map(f => f.name)
    });

    // チャットシステムにファイル情報を渡す
    if (window.ChatSystem && window.ChatSystem.attachFiles) {
      window.ChatSystem.attachFiles(files);
    } else {
      // 簡易フィードバック
      this.showNotification(`${files.length}個のファイルが選択されました`, 'info');
    }
  }

  toggleEmojiPicker() {
    let emojiPicker = document.getElementById('emoji-picker');

    if (!emojiPicker) {
      emojiPicker = this.createEmojiPicker();
    }

    emojiPicker.classList.toggle('hidden');

    // 絵文字ボタンの状態更新
    const emojiBtn = document.querySelector('[data-action="emoji"]');
    if (emojiBtn) {
      const isVisible = !emojiPicker.classList.contains('hidden');
      emojiBtn.classList.toggle('active', isVisible);
    }

    this.logger.info('Emoji picker toggled', {
      visible: !emojiPicker.classList.contains('hidden')
    });
  }

  createEmojiPicker() {
    const picker = document.createElement('div');
    picker.id = 'emoji-picker';
    picker.className = 'emoji-picker hidden';

    const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '💪', '🔥', '✨', '💡'];

    picker.innerHTML = `
      <div class="emoji-grid">
        ${commonEmojis
          .map(emoji => `<button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`)
          .join('')}
      </div>
    `;

    // 絵文字選択イベント
    picker.addEventListener('click', e => {
      if (e.target.classList.contains('emoji-btn')) {
        const emoji = e.target.dataset.emoji;
        this.insertEmoji(emoji);
        picker.classList.add('hidden');
      }
    });

    // チャット入力エリアの近くに配置
    const chatInput = document.querySelector('.chat-input-container');
    if (chatInput) {
      chatInput.appendChild(picker);
    } else {
      document.body.appendChild(picker);
    }

    return picker;
  }

  insertEmoji(emoji) {
    const chatInput =
      document.getElementById('chat-message-input') || document.querySelector('.chat-input');
    if (chatInput) {
      const currentValue = chatInput.value;
      const cursorPos = chatInput.selectionStart;
      const newValue = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);

      chatInput.value = newValue;
      chatInput.focus();
      chatInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);

      this.logger.info('Emoji inserted', { emoji });
    }
  }

  // Mobile Optimization Methods
  setupMobileEventListeners() {
    // モバイルカスタムジェスチャーイベントリスナー
    document.addEventListener('mobiletap', e => {
      this.handleMobileTap(e);
    });

    document.addEventListener('mobileswipe', e => {
      this.handleMobileSwipe(e);
    });

    document.addEventListener('mobilelongpress', e => {
      this.handleMobileLongPress(e);
    });

    document.addEventListener('mobilegesture:pullToRefresh', e => {
      this.handlePullToRefresh(e);
    });

    // モバイル専用UI調整
    this.setupMobileNavigation();
    this.setupMobileModals();
    this.setupMobileForms();
  }

  applyMobileEnhancements() {
    // モバイルデバイス判定
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      document.body.classList.add('mobile-device');

      // タッチターゲットサイズの調整
      this.adjustTouchTargets();

      // モバイル専用ナビゲーションの追加
      this.addMobileNavigation();

      // スワイプジェスチャーの有効化
      this.enableSwipeGestures();

      // モバイル最適化されたアニメーションの適用
      this.applyMobileAnimations();
    }
  }

  handleMobileTap(event) {
    const { target, x, y, duration } = event.detail;

    // 短いタップでリップルエフェクト
    if (duration < 150 && target.closest('.touch-btn, .nav-link, .card')) {
      this.createRippleEffect(target, x, y);
    }
  }

  handleMobileSwipe(event) {
    const { direction, target } = event.detail;

    // モーダルを下スワイプで閉じる
    if (direction === 'down' && target.closest('.modal')) {
      const modal = target.closest('.modal');
      if (modal && modal.style.display !== 'none') {
        modal.style.display = 'none';
      }
    }

    // チャットを右スワイプで閉じる
    if (direction === 'right' && target.closest('#chatContainer')) {
      this.toggleChat();
    }
  }

  handleMobileLongPress(event) {
    const { target } = event.detail;

    // カードの長押しでアクションシート表示
    if (target.closest('.event-card, .participant-item')) {
      this.showMobileActionSheet(target);
    }
  }

  handlePullToRefresh(event) {
    this.logger.userAction('Pull to refresh triggered');

    // ページの再読み込みまたはデータの更新
    this.refreshData().then(() => {
      this.showNotification('データを更新しました', 'success');
    });
  }

  adjustTouchTargets() {
    // すべてのインタラクティブ要素のタッチターゲットサイズを調整
    const interactiveElements = document.querySelectorAll('button, a, input, .clickable');

    interactiveElements.forEach(element => {
      const computedStyle = getComputedStyle(element);
      const minSize = 44; // iOS HIG推奨

      if (parseInt(computedStyle.height) < minSize) {
        element.style.minHeight = `${minSize}px`;
      }

      if (parseInt(computedStyle.width) < minSize) {
        element.style.minWidth = `${minSize}px`;
      }
    });
  }

  addMobileNavigation() {
    // モバイル専用ナビゲーションを追加
    const mobileNav = this.mobileComponents.create('MobileNavigation', {
      items: [
        { label: 'ホーム', icon: '🏠', href: '#hero', active: true },
        { label: 'イベント', icon: '📅', href: '#event' },
        { label: '参加', icon: '✋', href: '#join' },
        { label: 'チャット', icon: '💬', href: '#', onClick: () => this.toggleChat() }
      ]
    });

    if (mobileNav) {
      document.body.appendChild(mobileNav);
    }
  }

  enableSwipeGestures() {
    // スワイプ可能な要素にクラスを追加
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.add('swipe-to-close');
    });

    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
      chatContainer.classList.add('swipe-to-close');
    }
  }

  applyMobileAnimations() {
    // モバイル用の軽量アニメーション設定
    if (this.performanceOptimizer.device.isLowEndDevice) {
      document.documentElement.style.setProperty('--animation-duration', '0.2s');
    } else {
      document.documentElement.style.setProperty('--animation-duration', '0.3s');
    }
  }

  setupMobileNavigation() {
    // モバイルメニューのハンバーガーボタン機能強化
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
      // タッチ最適化
      mobileToggle.style.minHeight = '44px';
      mobileToggle.style.minWidth = '44px';

      // ハプティックフィードバック付きイベント
      mobileToggle.addEventListener(
        'touchstart',
        () => {
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
        },
        { passive: true }
      );
    }
  }

  setupMobileModals() {
    // モバイル向けモーダルの最適化
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
      // フルスクリーンモードの追加
      if (window.innerWidth < 480) {
        modal.classList.add('mobile-fullscreen');
      }

      // スワイプで閉じる機能
      let startY = 0;
      modal.addEventListener(
        'touchstart',
        e => {
          startY = e.touches[0].clientY;
        },
        { passive: true }
      );

      modal.addEventListener(
        'touchmove',
        e => {
          const currentY = e.touches[0].clientY;
          const deltaY = currentY - startY;

          if (deltaY > 50) {
            modal.style.transform = `translateY(${deltaY}px)`;
          }
        },
        { passive: true }
      );

      modal.addEventListener(
        'touchend',
        e => {
          const currentY = e.changedTouches[0].clientY;
          const deltaY = currentY - startY;

          if (deltaY > 100) {
            modal.style.display = 'none';
          } else {
            modal.style.transform = 'translateY(0)';
          }
        },
        { passive: true }
      );
    });
  }

  setupMobileForms() {
    // モバイル向けフォームの最適化
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');

      inputs.forEach(input => {
        // タッチ最適化
        input.style.minHeight = '44px';

        // フォーカス時のズーム防止（iOS）
        if (input.type !== 'file') {
          input.style.fontSize = '16px';
        }

        // タッチ開始時のフィードバック
        input.addEventListener(
          'touchstart',
          () => {
            input.style.borderColor = 'var(--mobile-primary)';
          },
          { passive: true }
        );
      });
    });
  }

  createRippleEffect(target, x, y) {
    const ripple = document.createElement('span');
    ripple.className = 'mobile-ripple';

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const offsetX = x - rect.left - size / 2;
    const offsetY = y - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${offsetX}px`;
    ripple.style.top = `${offsetY}px`;

    target.style.position = 'relative';
    target.style.overflow = 'hidden';
    target.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  showMobileActionSheet(target) {
    // モバイル専用アクションシートの表示
    const actions = [];

    if (target.closest('.event-card')) {
      actions.push(
        { text: '詳細を見る', handler: () => this.showEventDetails(target) },
        { text: '参加登録', handler: () => this.openRegistrationModal() },
        { text: '共有', handler: () => this.shareEvent(target) }
      );
    }

    if (target.closest('.participant-item')) {
      actions.push(
        { text: 'プロフィール', handler: () => this.showParticipantProfile(target) },
        { text: 'メッセージ', handler: () => this.sendMessage(target) }
      );
    }

    const actionSheet = this.mobileComponents.create('ActionSheet', {
      title: 'アクション選択',
      actions
    });

    if (actionSheet) {
      document.body.appendChild(actionSheet);
    }
  }

  async refreshData() {
    // データの再読み込み
    try {
      // 必要に応じてAPI呼び出しやデータ更新
      await new Promise(resolve => setTimeout(resolve, 1000)); // シミュレーション

      // UI更新
      this.updateCountdown();

      return true;
    } catch (error) {
      this.logger.error('Data refresh failed', {
        error: error.message,
        category: 'data_refresh'
      });
      return false;
    }
  }

  // Countdown Timer functionality
  setupCountdownTimer() {
    // Initialize countdown timer
    this.updateCountdown();

    // Update every second
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  // Enhanced cleanup methods for comprehensive memory leak prevention
  cleanup() {
    // Clear all intervals with logging for debugging
    const intervals = [
      'countdownInterval',
      'periodicUpdateInterval',
      'feedbackUpdateInterval',
      'floatingEmojiInterval',
      'wsKeepAlive',
      'votePollingInterval',
      'wsReconnectInterval'
    ];

    intervals.forEach(intervalName => {
      if (this[intervalName]) {
        clearInterval(this[intervalName]);
        this[intervalName] = null;
      }
    });

    // Stop vote polling with cleanup
    this.stopVotePolling();

    // WebSocket cleanup with error handling
    if (this.ws) {
      try {
        this.ws.removeEventListener('open', this.onWebSocketOpen);
        this.ws.removeEventListener('message', this.onWebSocketMessage);
        this.ws.removeEventListener('close', this.onWebSocketClose);
        this.ws.removeEventListener('error', this.onWebSocketError);
        this.ws.close(1000, 'Page unloading');
      } catch (error) {
        this.logger.warn('WebSocket cleanup error', { error: error.message });
      }
      this.ws = null;
    }

    // Clear cached DOM elements to prevent memory leaks
    this.elements = {};

    // Clear data caches
    this.chatMessages = [];
    this.participationVotes = {};

    // Remove global event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.cleanup.bind(this));
      window.removeEventListener('unload', this.cleanup.bind(this));
      window.removeEventListener('pagehide', this.cleanup.bind(this));
    }

    // Clear any remaining timeouts
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }

    this.logger.info('LightningTalkApp cleanup completed');
  }

  // Enhanced periodic updates with proper cleanup
  startPeriodicUpdates() {
    // Clear existing intervals first
    if (this.periodicUpdateInterval) {
      clearInterval(this.periodicUpdateInterval);
    }
    if (this.feedbackUpdateInterval) {
      clearInterval(this.feedbackUpdateInterval);
    }
    if (this.floatingEmojiInterval) {
      clearInterval(this.floatingEmojiInterval);
    }

    // Main periodic updates
    this.periodicUpdateInterval = setInterval(() => {
      this.checkForUpdates();
    }, 30000); // Check every 30 seconds

    // Update feedback button every minute
    this.feedbackUpdateInterval = setInterval(() => {
      this.updateFeedbackButton();
    }, 60000);

    // Start floating emoji effect
    this.floatingEmojiInterval = setInterval(() => {
      this.createFloatingEmoji();
    }, 3000);
  }

  checkForUpdates() {
    // Placeholder for periodic update checks
    // This could check for new events, participant counts, etc.
    console.debug('Checking for updates...');
  }

  // Participation Voting Methods
  setupParticipationVoting() {
    // Get all vote containers
    const voteContainers = document.querySelectorAll('.vote-container');

    voteContainers.forEach(container => {
      const { eventId } = container.dataset;

      // Initialize vote counts for this event
      if (!this.participationVotes[eventId]) {
        this.participationVotes[eventId] = {
          online: [],
          onsite: []
        };
      }

      // Update vote counts display
      this.updateVoteCounts(eventId);

      // Setup vote buttons
      const voteButtons = container.querySelectorAll('.vote-btn');
      voteButtons.forEach(btn => {
        btn.addEventListener('click', e => {
          this.handleVoteClick(e, eventId);
        });
      });
    });
  }

  handleVoteClick(e, eventId) {
    const btn = e.target;
    const voteType = btn.dataset.type;

    this.currentVoteType = voteType;
    this.currentEventId = eventId;

    // Show modal
    this.elements.voteModal.style.display = 'block';
    const voteTypeText = document.getElementById('vote-type-text');
    voteTypeText.textContent =
      voteType === 'online' ? '💻 オンラインで参加予定' : '🏢 現地で参加予定';

    // Focus name input
    setTimeout(() => {
      document.getElementById('voteName').focus();
    }, 100);
  }

  updateVoteCounts(eventId) {
    const container = document.querySelector(`[data-event-id="${eventId}"]`);
    if (!container) {
      return;
    }

    const votes = this.participationVotes[eventId] || { online: [], onsite: [] };

    const onlineCount = container.querySelector('#online-count');
    const onsiteCount = container.querySelector('#onsite-count');

    if (onlineCount) {
      onlineCount.textContent = votes.online.length;
    }
    if (onsiteCount) {
      onsiteCount.textContent = votes.onsite.length;
    }
  }

  connectWebSocket() {
    // Prevent multiple connection attempts
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    // API Gateway WebSocketを使用
    const wsUrl =
      window.APP_CONFIG?.environment === 'development'
        ? 'wss://cqqhjkqzcj.execute-api.ap-northeast-1.amazonaws.com/prod'
        : 'wss://YOUR_PRODUCTION_WEBSOCKET_API.execute-api.ap-northeast-1.amazonaws.com/prod';

    // WebSocketが無効な場合は、直接ポーリングモードに移行
    if (!wsUrl) {
      Logger.info('WebSocket disabled - using polling mode');
      this.fallbackToPolling();
      return;
    }

    // Initialize reconnection state
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second

    try {
      this.ws = new WebSocket(wsUrl);

      // Bind event handlers to preserve 'this' context
      this.onWebSocketOpen = this.handleWebSocketOpen.bind(this);
      this.onWebSocketMessage = this.handleWebSocketMessage.bind(this);
      this.onWebSocketClose = this.handleWebSocketClose.bind(this);
      this.onWebSocketError = this.handleWebSocketError.bind(this);

      this.ws.addEventListener('open', this.onWebSocketOpen);
      this.ws.addEventListener('message', this.onWebSocketMessage);
      this.ws.addEventListener('close', this.onWebSocketClose);
      this.ws.addEventListener('error', this.onWebSocketError);
    } catch (error) {
      this.logger.error('Failed to create WebSocket', {
        error: error.message,
        category: 'websocket'
      });
      this.fallbackToPolling();
    }
  }

  handleWebSocketOpen() {
    this.logger.info('WebSocket connected to API Gateway');
    this.reconnectAttempts = 0; // Reset reconnection attempts
    this.stopVotePolling();

    // Start optimized keep-alive with exponential backoff protection
    this.startKeepAlive();
  }

  handleWebSocketMessage(event) {
    try {
      const data = JSON.parse(event.data);

      // Handle different message types efficiently
      switch (data.type) {
        case 'voteUpdate':
          this.handleVoteUpdate(data);
          break;
        case 'pong':
          // Keep-alive response, no action needed
          break;
        default:
          this.logger.warn('Unknown WebSocket message type', { type: data.type, data });
      }
    } catch (error) {
      this.logger.error('Error parsing WebSocket message', {
        error: error.message,
        rawMessage: event.data?.substring(0, 200)
      });
    }
  }

  handleWebSocketClose(event) {
    this.logger.warn('WebSocket disconnected', {
      code: event.code,
      reason: event.reason,
      category: 'websocket'
    });

    // Clean up keep-alive
    this.stopKeepAlive();

    // Attempt reconnection with exponential backoff (unless manually closed)
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnection();
    } else {
      this.fallbackToPolling();
    }
  }

  handleWebSocketError(error) {
    this.logger.error('WebSocket error', {
      error: error.message || error,
      category: 'websocket'
    });
    this.fallbackToPolling();
  }

  scheduleReconnection() {
    if (this.wsReconnectInterval) {
      clearTimeout(this.wsReconnectInterval);
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Exponential backoff

    this.wsReconnectInterval = setTimeout(
      () => {
        this.reconnectAttempts++;
        this.logger.info('WebSocket reconnection attempt', {
          attempt: this.reconnectAttempts,
          maxAttempts: this.maxReconnectAttempts,
          category: 'websocket'
        });
        this.connectWebSocket();
      },
      Math.min(delay, 30000)
    ); // Cap at 30 seconds
  }

  startKeepAlive() {
    this.stopKeepAlive();

    this.wsKeepAlive = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 30000); // 30秒ごと
  }

  stopKeepAlive() {
    if (this.wsKeepAlive) {
      clearInterval(this.wsKeepAlive);
      this.wsKeepAlive = null;
    }
  }

  handleVoteUpdate(data) {
    if (data.eventId && data.votes) {
      this.participationVotes[data.eventId] = data.votes;

      // Batch localStorage updates to improve performance
      this.batchUpdateLocalStorage();
      this.updateVoteCounts(data.eventId);
    }
  }

  fallbackToPolling() {
    this.logger.info('Falling back to polling mode', { category: 'websocket' });
    this.startVotePolling();
  }

  // Performance optimization: Batch localStorage updates
  batchUpdateLocalStorage() {
    if (this.localStorageUpdateTimeout) {
      clearTimeout(this.localStorageUpdateTimeout);
    }

    // Debounce localStorage updates to avoid excessive writes
    this.localStorageUpdateTimeout = setTimeout(() => {
      try {
        localStorage.setItem('participationVotes', JSON.stringify(this.participationVotes));
        localStorage.setItem('chatMessages', JSON.stringify(this.chatMessages));
        localStorage.setItem('onlineCount', this.surveyCounters.online.toString());
        localStorage.setItem('offlineCount', this.surveyCounters.offline.toString());
      } catch (error) {
        this.logger.warn('localStorage update failed', { error: error.message });
      }
    }, 100); // Batch updates every 100ms
  }

  // Optimized DOM element caching with lazy loading
  getElement(key, selector) {
    if (!this.elements[key]) {
      this.elements[key] = document.querySelector(selector);
    }
    return this.elements[key];
  }

  // Memory-efficient event delegation for dynamic content
  setupEventDelegation() {
    // Use event delegation to handle clicks on dynamically added elements
    document.addEventListener(
      'click',
      event => {
        const { target } = event;

        // Handle vote buttons
        if (target.classList.contains('vote-btn')) {
          event.preventDefault();
          const { voteType } = target.dataset;
          const { eventId } = target.dataset;
          if (voteType && eventId) {
            this.openVoteModal(voteType, eventId);
          }
        }

        // Handle modal close buttons
        if (
          target.classList.contains('close-modal') ||
          target.classList.contains('modal-backdrop')
        ) {
          const modal = target.closest('.modal');
          if (modal) {
            modal.style.display = 'none';
          }
        }
      },
      { passive: false }
    );
  }

  startVotePolling() {
    // 既存のポーリングを停止
    this.stopVotePolling();

    // 初回は即座に更新
    this.fetchAllVoteCounts();

    // 5秒ごとに投票データを更新
    this.votePollingInterval = setInterval(() => {
      this.fetchAllVoteCounts();
    }, 5000);
  }

  stopVotePolling() {
    if (this.votePollingInterval) {
      clearInterval(this.votePollingInterval);
      this.votePollingInterval = null;
    }
  }

  async fetchAllVoteCounts() {
    try {
      const voteContainers = document.querySelectorAll('.vote-container');

      for (const container of voteContainers) {
        const { eventId } = container.dataset;
        if (!eventId) {
          continue;
        }

        // APIから最新の投票データを取得
        const response = await fetch(
          `${window.APP_CONFIG?.apiEndpoint || '/api'}/voting/participation/${eventId}`
        );
        if (response.ok) {
          const data = await response.json();

          // ローカルストレージも更新
          this.participationVotes[eventId] = data;
          localStorage.setItem('participationVotes', JSON.stringify(this.participationVotes));

          // UIを更新
          this.updateVoteCounts(eventId);
        } else {
          // Fallback to mock data for now
          const mockData = { eventId, online: 0, onsite: 0, timestamp: new Date().toISOString() };
          this.participationVotes[eventId] = mockData;
          localStorage.setItem('participationVotes', JSON.stringify(this.participationVotes));
          this.updateVoteCounts(eventId);
        }
      }
    } catch (error) {
      this.logger.error('Failed to fetch vote counts', {
        error: error.message,
        category: 'api_call'
      });
    }
  }

  submitVote(eventId, voteType, voterData) {
    // Add vote to local storage
    const votes = this.participationVotes[eventId];
    const voter = {
      name: voterData.name,
      email: voterData.email,
      timestamp: new Date().toISOString(),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Check if already voted
    const hasVoted =
      votes.online.some(v => v.name === voter.name) ||
      votes.onsite.some(v => v.name === voter.name);

    if (hasVoted) {
      this.showNotification('すでに投票済みです', 'error');
      return;
    }

    votes[voteType].push(voter);
    localStorage.setItem('participationVotes', JSON.stringify(this.participationVotes));
    this.updateVoteCounts(eventId);

    // Send to server via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'vote',
          eventId,
          voteType,
          voter
        })
      );
    }

    // Also send via API
    fetch(`${window.APP_CONFIG?.apiEndpoint || '/api'}/voting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId,
        participationType: voteType,
        participantName: voter.name,
        participantEmail: voter.email
      })
    }).catch(error => {
      this.logger.error('Failed to submit vote to API', {
        error: error.message,
        eventId,
        voteType,
        category: 'api_call'
      });
    });

    this.showNotification('投票ありがとうございました！', 'success');
  }

  updateCountdown() {
    const now = new Date().getTime();
    const eventTime = this.eventDate.getTime();
    const timeLeft = eventTime - now;

    const {
      days: daysEl,
      hours: hoursEl,
      minutes: minutesEl,
      seconds: secondsEl,
      message: messageEl
    } = this.elements.countdownElements;

    // Check if elements exist (page might not be loaded yet)
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl || !messageEl) {
      return;
    }

    // Event is happening now (within 4 hours window)
    if (timeLeft < 0 && timeLeft > -4 * 60 * 60 * 1000) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';

      messageEl.textContent = '🎉 イベント開催中！ 🎉';
      messageEl.className = 'countdown-message event-live';
      return;
    }

    // Event has ended (more than 4 hours ago)
    if (timeLeft < -4 * 60 * 60 * 1000) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';

      messageEl.textContent = 'イベントは終了しました。次回をお楽しみに！';
      messageEl.className = 'countdown-message event-ended';

      // Clear the interval since event is over
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      return;
    }

    // Calculate time units
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Update display with zero padding
    daysEl.textContent = days.toString().padStart(2, '0');
    hoursEl.textContent = hours.toString().padStart(2, '0');
    minutesEl.textContent = minutes.toString().padStart(2, '0');
    secondsEl.textContent = seconds.toString().padStart(2, '0');

    // Update message based on time remaining
    if (days > 7) {
      messageEl.textContent = 'まだまだ時間があります！準備をお忘れなく 📝';
    } else if (days > 1) {
      messageEl.textContent = 'もうすぐです！参加準備はお済みですか？ 🎯';
    } else if (days === 1) {
      messageEl.textContent = '明日開催です！楽しみにお待ちしています 🌟';
    } else if (hours > 1) {
      messageEl.textContent = '本日開催！まもなくスタートです 🚀';
    } else {
      messageEl.textContent = 'まもなく開始！最終確認をお願いします ⚡';
    }

    messageEl.className = 'countdown-message';
  }
}

// CSS for additional animations
const additionalStyles = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .topic-item.selected {
        background: linear-gradient(45deg, #FFD700, #FF6B6B) !important;
        color: #fff !important;
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important;
    }
    
    .mobile-menu-toggle span {
        transition: all 0.3s ease;
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
    
    .survey-section {
        margin-top: 20px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 10px;
        text-align: center;
    }
    
    .survey-section h4 {
        margin-bottom: 15px;
        color: #333;
    }
    
    .survey-buttons {
        display: flex;
        gap: 15px;
        justify-content: center;
        flex-wrap: wrap;
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
    
    .count {
        display: inline-block;
        background: rgba(255,255,255,0.3);
        padding: 2px 8px;
        border-radius: 12px;
        margin-left: 8px;
        font-weight: bold;
        min-width: 20px;
    }
    
    .map-link {
        display: inline-block;
        color: #4169E1;
        font-weight: bold;
        text-decoration: none;
        padding: 8px 16px;
        margin: 10px 0;
        border: 2px solid #4169E1;
        border-radius: 20px;
        transition: all 0.3s ease;
        background: rgba(65, 105, 225, 0.1);
    }
    
    .map-link:hover {
        background: #4169E1;
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(65, 105, 225, 0.3);
    }
    
    .emergency-contact {
        margin-top: 20px;
        padding: 15px;
        background: rgba(255, 99, 71, 0.1);
        border-radius: 10px;
        border: 2px solid rgba(255, 99, 71, 0.3);
    }
    
    .emergency-contact h4 {
        color: #ff6347;
        margin-bottom: 10px;
    }
    
    .phone-link {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 24px;
        background: #ff6347;
        color: white;
        text-decoration: none;
        border-radius: 25px;
        font-size: 1.1rem;
        font-weight: bold;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(255, 99, 71, 0.3);
    }
    
    .phone-link:hover {
        background: #ff4500;
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(255, 99, 71, 0.4);
    }
    
    .phone-icon {
        font-size: 1.4rem;
        animation: ring 1s ease-in-out infinite;
    }
    
    @keyframes ring {
        0%, 100% { transform: rotate(0deg); }
        10%, 30% { transform: rotate(-10deg); }
        20%, 40% { transform: rotate(10deg); }
    }
    
    .chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
    }
    
    .chat-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        position: relative;
    }
    
    .chat-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0,0,0,0.4);
    }
    
    .chat-notification-badge {
        position: absolute;
        top: 5px;
        right: 5px;
        color: #ff0000;
        font-size: 0.8rem;
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    .chat-container {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 350px;
        height: 450px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
        animation: slideInUp 0.3s ease;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .chat-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px;
        border-radius: 15px 15px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .chat-header h4 {
        margin: 0;
        font-size: 1.1rem;
    }
    
    .chat-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.3s ease;
    }
    
    .chat-close:hover {
        background: rgba(255,255,255,0.2);
    }
    
    .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        background: #f9f9f9;
    }
    
    .chat-welcome {
        text-align: center;
        color: #666;
        padding: 20px;
        font-size: 0.95rem;
    }
    
    .chat-message {
        margin-bottom: 15px;
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .chat-message.user {
        text-align: right;
    }
    
    .chat-message.bot {
        text-align: left;
    }
    
    .message-content {
        display: inline-block;
        max-width: 80%;
        padding: 10px 15px;
        border-radius: 15px;
        word-wrap: break-word;
    }
    
    .chat-message.user .message-content {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-bottom-right-radius: 5px;
    }
    
    .chat-message.bot .message-content {
        background: white;
        color: #333;
        border: 1px solid #e0e0e0;
        border-bottom-left-radius: 5px;
    }
    
    .message-time {
        font-size: 0.75rem;
        color: #999;
        margin-top: 5px;
    }
    
    .chat-input-container {
        display: flex;
        padding: 15px;
        background: white;
        border-top: 1px solid #e0e0e0;
        border-radius: 0 0 15px 15px;
    }
    
    .chat-input {
        flex: 1;
        padding: 10px 15px;
        border: 1px solid #e0e0e0;
        border-radius: 20px;
        outline: none;
        font-size: 0.95rem;
        transition: border-color 0.3s ease;
    }
    
    .chat-input:focus {
        border-color: #667eea;
    }
    
    .chat-send {
        margin-left: 10px;
        padding: 10px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    
    .chat-send:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
    }
    
    @media (max-width: 768px) {
        .survey-buttons {
            flex-direction: column;
            align-items: center;
        }
        
        .survey-btn {
            width: 100%;
            max-width: 250px;
        }
        
        .chat-container {
            width: calc(100vw - 40px);
            max-width: 350px;
            height: 400px;
        }
        
        .phone-link {
            font-size: 1rem;
            padding: 10px 20px;
        }
    }
`;

// Add additional styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the application when DOM is loaded
function initializeApp() {
  const app = new LightningTalkApp();
  window.lightningTalkApp = app;
  return app;
}

// Check if DOM is already loaded, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = initializeApp();

    // Initialize Mobile Optimizations
    if (
      window.MobileTouchManager &&
      window.MobileComponentSystem &&
      window.MobilePerformanceOptimizer
    ) {
      app.logger.info('Mobile optimization systems initialized', { category: 'mobile' });

      // Set up mobile-specific event listeners
      app.setupMobileEventListeners();

      // Apply mobile-specific UI enhancements
      app.applyMobileEnhancements();
    }

    // Register Service Worker for offline support
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(registration => {
            app.logger.info('Service Worker registered', {
              scope: registration.scope,
              category: 'service_worker'
            });

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              app.logger.info('Service Worker update found', { category: 'service_worker' });

              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker installed, show update notification
                  app.showNotification(
                    '新しいバージョンが利用可能です。ページを更新してください。',
                    'info'
                  );
                }
              });
            });
          })
          .catch(error => {
            app.logger.error('Service Worker registration failed', {
              error: error.message,
              category: 'service_worker'
            });
          });
      });
    }

    // Setup vote form submission
    const voteForm = document.getElementById('voteForm');
    if (voteForm) {
      voteForm.addEventListener('submit', e => {
        e.preventDefault();

        const formData = new FormData(voteForm);
        const voterData = {
          name: formData.get('name').trim(),
          email: formData.get('email').trim()
        };

        if (!voterData.name) {
          alert('お名前を入力してください');
          return;
        }

        app.submitVote(app.currentEventId, app.currentVoteType, voterData);

        // Close modal and reset form
        app.elements.voteModal.style.display = 'none';
        voteForm.reset();
      });
    }

    // Setup admin login form submission
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', async e => {
        e.preventDefault();

        const formData = new FormData(adminLoginForm);
        const loginData = {
          email: formData.get('email').trim(),
          password: formData.get('password'),
          remember: formData.get('remember') ? true : false
        };

        // Hide error message
        document.getElementById('loginError').style.display = 'none';

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
          });

          const data = await response.json();

          if (response.ok) {
            // Store token
            localStorage.setItem('adminToken', data.token);
            if (loginData.remember) {
              localStorage.setItem('adminTokenExpiry', data.expiresAt);
            }

            // Redirect to admin dashboard
            window.location.href = '/admin.html';
          } else {
            // Show error message
            const errorEl = document.getElementById('loginError');
            const errorMessageEl = document.getElementById('loginErrorMessage');
            errorMessageEl.textContent = data.message || 'ログインに失敗しました';
            errorEl.style.display = 'block';
          }
        } catch (error) {
          this.logger.error('Login error', {
            error: error.message,
            category: 'authentication'
          });
          const errorEl = document.getElementById('loginError');
          const errorMessageEl = document.getElementById('loginErrorMessage');
          errorMessageEl.textContent = 'ネットワークエラーが発生しました';
          errorEl.style.display = 'block';
        }
      });
    }

    // Global function to close vote modal
    window.closeVoteModal = () => {
      const voteModal = document.getElementById('voteModal');
      if (voteModal) {
        voteModal.style.display = 'none';
      }
    };

    // Global function to show admin login modal
    window.showAdminLogin = () => {
      // Googleログインのみを使用
      if (window.googleAuth) {
        window.googleAuth.login();
      } else if (window.loginWithGoogle) {
        window.loginWithGoogle();
      }
    };

    // Global function to close admin login modal
    window.closeAdminLogin = () => {
      // 管理者ログインモーダルは削除されたため何もしない
    };

    // Admin login processing - Googleログインのみ使用
    window.processAdminLogin = async () => {
      // Googleログインにリダイレクト
      if (window.googleAuth) {
        window.googleAuth.login();
      } else if (window.loginWithGoogle) {
        window.loginWithGoogle();
      }
    };

    // Close modals when clicking outside
    window.addEventListener('click', e => {
      const voteModal = document.getElementById('voteModal');
      const adminLoginModal = document.getElementById('adminLoginModal');

      if (e.target === voteModal) {
        voteModal.style.display = 'none';
      }

      if (e.target === adminLoginModal) {
        adminLoginModal.style.display = 'none';
      }
    });
  });
} else {
  // DOM is already loaded, initialize immediately
  const app = initializeApp();

  // Initialize Mobile Optimizations
  if (
    window.MobileTouchManager &&
    window.MobileComponentSystem &&
    window.MobilePerformanceOptimizer
  ) {
    app.logger.info('Mobile optimization systems initialized', { category: 'mobile' });

    // Set up mobile-specific event listeners
    app.setupMobileEventListeners();

    // Apply mobile-specific UI enhancements
    app.applyMobileEnhancements();
  }

  // Register Service Worker for offline support
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          app.logger.info('Service Worker registered', {
            scope: registration.scope,
            category: 'service_worker'
          });

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            app.logger.info('Service Worker update found', { category: 'service_worker' });

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker installed, show update notification
                app.showNotification(
                  '新しいバージョンが利用可能です。ページを更新してください。',
                  'info'
                );
              }
            });
          });
        })
        .catch(error => {
          app.logger.error('Service Worker registration failed', {
            error: error.message,
            category: 'service_worker'
          });
        });
    });
  }

  // Setup vote form submission
  const voteForm = document.getElementById('voteForm');
  if (voteForm) {
    voteForm.addEventListener('submit', e => {
      e.preventDefault();

      const formData = new FormData(voteForm);
      const voterData = {
        name: formData.get('name').trim(),
        email: formData.get('email').trim()
      };

      if (!voterData.name) {
        alert('お名前を入力してください');
        return;
      }

      app.submitVote(app.currentEventId, app.currentVoteType, voterData);

      // Close modal and reset form
      app.elements.voteModal.style.display = 'none';
      voteForm.reset();
    });
  }

  // Setup admin login form submission
  const adminLoginForm = document.getElementById('adminLoginForm');
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async e => {
      e.preventDefault();

      const formData = new FormData(adminLoginForm);
      const loginData = {
        email: formData.get('email').trim(),
        password: formData.get('password'),
        remember: formData.get('remember') ? true : false
      };

      // Hide error message
      document.getElementById('loginError').style.display = 'none';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok) {
          // Store token
          localStorage.setItem('adminToken', data.token);
          if (loginData.remember) {
            localStorage.setItem('adminTokenExpiry', data.expiresAt);
          }

          // Redirect to admin dashboard
          window.location.href = '/admin.html';
        } else {
          // Show error message
          const errorEl = document.getElementById('loginError');
          const errorMessageEl = document.getElementById('loginErrorMessage');
          errorMessageEl.textContent = data.message || 'ログインに失敗しました';
          errorEl.style.display = 'block';
        }
      } catch (error) {
        this.logger.error('Login error', {
          error: error.message,
          category: 'authentication'
        });
        const errorEl = document.getElementById('loginError');
        const errorMessageEl = document.getElementById('loginErrorMessage');
        errorMessageEl.textContent = 'ネットワークエラーが発生しました';
        errorEl.style.display = 'block';
      }
    });
  }

  // Global function to close vote modal
  window.closeVoteModal = () => {
    const voteModal = document.getElementById('voteModal');
    if (voteModal) {
      voteModal.style.display = 'none';
    }
  };

  // Global function to show admin login modal
  window.showAdminLogin = () => {
    // Googleログインのみを使用
    if (window.googleAuth) {
      window.googleAuth.login();
    } else if (window.loginWithGoogle) {
      window.loginWithGoogle();
    }
  };

  // Global function to close admin login modal
  window.closeAdminLogin = () => {
    // 管理者ログインモーダルは削除されたため何もしない
  };

  // Admin login processing - Googleログインのみ使用
  window.processAdminLogin = async () => {
    // Googleログインにリダイレクト
    if (window.googleAuth) {
      window.googleAuth.login();
    } else if (window.loginWithGoogle) {
      window.loginWithGoogle();
    }
  };

  // Close modals when clicking outside
  window.addEventListener('click', e => {
    const voteModal = document.getElementById('voteModal');
    const adminLoginModal = document.getElementById('adminLoginModal');

    if (e.target === voteModal) {
      voteModal.style.display = 'none';
    }

    if (e.target === adminLoginModal) {
      adminLoginModal.style.display = 'none';
    }
  });
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LightningTalkApp;
}

// Make class available globally for testing and debugging
window.LightningTalkApp = LightningTalkApp;
