/**
 * Lightning Talk Event Management System
 * Main JavaScript functionality
 */

class LightningTalkApp {
    constructor() {
        this.eventDate = new Date('2025-06-25T19:00:00+09:00');
        this.surveyCounters = {
            online: parseInt(localStorage.getItem('onlineCount') || '0'),
            offline: parseInt(localStorage.getItem('offlineCount') || '0')
        };
        this.chatMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupScrollAnimations();
        this.setupSmoothScroll();
        this.updateFeedbackButton();
        this.startPeriodicUpdates();
        this.setupParallax();
        this.setupFloatingEffects();
        this.setupModalHandlers();
        this.setupTopicInteractions();
        this.setupMobileMenu();
        this.updateSurveyCounters();
        this.setupChatWidget();
    }

    setupEventListeners() {
        // Register buttons
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAction(e.target.dataset.action, e.target);
            });
        });

        // Topic items
        document.querySelectorAll('.topic-item').forEach(item => {
            item.addEventListener('click', () => {
                this.highlightTopic(item);
            });
        });

        // Window events
        window.addEventListener('scroll', () => {
            this.updateHeaderOnScroll();
            this.updateParallax();
        });

        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleAction(action, element) {
        switch(action) {
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
            default:
                console.warn('Unknown action:', action);
        }
    }

    openRegistrationModal(type = 'general') {
        const modal = document.getElementById('registerModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = this.getRegistrationForm(type);
        modal.style.display = 'block';
        
        // Setup form submission
        const form = modalBody.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration(new FormData(form), type);
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
    }

    handleRegistration(formData, type) {
        // Show loading state
        const submitBtn = document.querySelector('.registration-form button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '送信中...';
        submitBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            // Here you would normally send data to your backend
            console.log('Registration data:', Object.fromEntries(formData));
            
            this.showRegistrationSuccess(type);
            this.closeModal();
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }

    showRegistrationSuccess(type) {
        const typeMessages = {
            general: '参加登録が完了しました！',
            listener: '聴講参加の登録が完了しました！',
            speaker: '発表申込みが完了しました！'
        };

        const message = typeMessages[type] || typeMessages.general;
        
        this.showNotification(message + ' 詳細は登録されたメールアドレスに送信されます。', 'success');
    }

    openFeedbackForm() {
        window.open('https://docs.google.com/forms/d/e/1FAIpQLSfLqwSY_c93TiaoqR3RcMKd8L4c05q0WA54Fn8SZQrnBxhzMA/viewform', '_blank');
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
            anchor.addEventListener('click', (e) => {
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
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
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

    updateFeedbackButton() {
        const now = new Date();
        const feedbackBtn = document.getElementById('feedbackBtn');
        
        if (!feedbackBtn) return;
        
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

    startPeriodicUpdates() {
        // Update feedback button every minute
        setInterval(() => {
            this.updateFeedbackButton();
        }, 60000);
        
        // Start floating emoji effect
        setInterval(() => {
            this.createFloatingEmoji();
        }, 3000);
    }

    setupParallax() {
        this.floatingElements = document.querySelector('.floating-elements');
    }

    updateParallax() {
        if (!this.floatingElements) return;
        
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
        let mouseX = 0, mouseY = 0;
        let lastStarTime = 0;
        
        document.addEventListener('mousemove', (e) => {
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
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
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

        const categoryExamples = examples[category] || ['あなただけの体験談', '新しい発見', '面白いエピソード'];
        
        this.showNotification(
            `${topicElement.textContent}の発表例: ${categoryExamples.join('、')}など`, 
            'info'
        );
    }

    setupMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (!toggle || !navLinks) return;
        
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Animate hamburger menu
            const spans = toggle.querySelectorAll('span');
            spans.forEach((span, index) => {
                span.style.transform = navLinks.classList.contains('active') 
                    ? `rotate(${index === 1 ? 0 : (index === 0 ? 45 : -45)}deg) translateY(${index === 1 ? 0 : (index === 0 ? 7 : -7)}px)`
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

    // Survey counter methods
    incrementSurveyCounter(type) {
        this.surveyCounters[type]++;
        localStorage.setItem(`${type}Count`, this.surveyCounters[type].toString());
        this.updateSurveyCounters();
        this.showNotification(`${type === 'online' ? 'オンライン' : '現地'}参加をカウントしました！`, 'success');
    }

    updateSurveyCounters() {
        const onlineCountEl = document.getElementById('onlineCount');
        const offlineCountEl = document.getElementById('offlineCount');
        
        if (onlineCountEl) {
            onlineCountEl.textContent = this.surveyCounters.online.toString();
        }
        if (offlineCountEl) {
            offlineCountEl.textContent = this.surveyCounters.offline.toString();
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
        chatInput.addEventListener('keypress', (e) => {
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
            response = 'イベントは6月25日（水）19:00からです。オンライン参加の方は18:30から入室可能です ⏰';
        } else if (lowerMessage.includes('参加') || lowerMessage.includes('申込')) {
            response = '参加申込みは上部の「当日参加申込み」ボタンからお願いします。当日飛び入り参加も歓迎です！ 🎉';
        } else if (lowerMessage.includes('発表') || lowerMessage.includes('LT')) {
            response = '5分間のライトニングトークです。テーマは自由！技術、趣味、日常の発見など、なんでもOKです ⚡';
        } else if (lowerMessage.includes('オンライン')) {
            response = 'オンライン参加はGoogle Meetを使用します。参加リンクは会場情報セクションにあります 💻';
        } else {
            response = 'ご質問ありがとうございます！詳細は各セクションをご確認いただくか、緊急連絡先までお問い合わせください 📞';
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
document.addEventListener('DOMContentLoaded', () => {
    window.lightningTalkApp = new LightningTalkApp();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LightningTalkApp;
}