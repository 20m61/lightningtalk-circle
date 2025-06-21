/**
 * WordPress Adapter for Lightning Talk Application
 * 元のLightning Talkアプリケーションとの互換性を保つアダプター
 */

/**
 * 元のLightning TalkアプリケーションクラスをWordPress用に適応
 */
export class LightningTalkApp {
    constructor() {
        this.eventDate = new Date('2025-06-25T19:00:00+09:00');
        this.surveyCounters = {
            online: parseInt(localStorage.getItem('onlineCount') || '0'),
            offline: parseInt(localStorage.getItem('offlineCount') || '0')
        };
        this.isWordPress = typeof window.wp !== 'undefined';
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
        
        // WordPress固有の初期化
        if (this.isWordPress) {
            this.initWordPressFeatures();
        }
    }

    /**
     * WordPress固有機能の初期化
     */
    initWordPressFeatures() {
        // WordPress REST API対応
        this.setupWordPressAPI();
        
        // ショートコード対応
        this.initShortcodes();
        
        // Gutenbergブロック対応
        this.initGutenbergBlocks();
        
        // WordPress管理画面統合
        if (window.pagenow && (window.pagenow.includes('lt_event') || window.pagenow.includes('lt_talk'))) {
            this.initAdminFeatures();
        }
    }

    /**
     * WordPress REST API設定
     */
    setupWordPressAPI() {
        this.wpAPI = {
            baseUrl: window.LightningTalkConfig?.apiUrl || '/wp-json/lightningtalk/v1/',
            nonce: window.LightningTalkConfig?.nonce || '',
            
            // API呼び出しヘルパー
            async request(endpoint, options = {}) {
                const url = this.baseUrl + endpoint.replace(/^\//, '');
                const defaultOptions = {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': this.nonce
                    }
                };
                
                const mergedOptions = { ...defaultOptions, ...options };
                
                try {
                    const response = await fetch(url, mergedOptions);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return await response.json();
                } catch (error) {
                    console.error('WordPress API Error:', error);
                    throw error;
                }
            }
        };
    }

    /**
     * ショートコード対応の初期化
     */
    initShortcodes() {
        // [lightning_talk_button] ショートコード対応
        document.querySelectorAll('.wp-block-shortcode').forEach(block => {
            if (block.textContent.includes('[lightning_talk_')) {
                this.processShortcodeBlock(block);
            }
        });
    }

    /**
     * Gutenbergブロック対応
     */
    initGutenbergBlocks() {
        // Lightning Talk Gutenbergブロックの初期化
        document.querySelectorAll('.wp-block-lightningtalk').forEach(block => {
            this.initializeLightningTalkBlock(block);
        });
    }

    /**
     * 管理画面機能の初期化
     */
    initAdminFeatures() {
        // 管理画面でのプレビュー機能
        this.setupAdminPreview();
        
        // カスタムフィールドの動的更新
        this.setupCustomFieldHandlers();
        
        // 参加者管理機能
        this.setupParticipantManagement();
    }

    /**
     * イベントリスナーの設定（WordPress対応版）
     */
    setupEventListeners() {
        // 元の実装 + WordPress対応
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAction(e.target.dataset.action, e.target);
            });
        });

        // WordPress AJAX対応
        jQuery(document).on('wp_ajax_success', (event, response) => {
            this.handleWordPressAjaxSuccess(response);
        });

        jQuery(document).on('wp_ajax_error', (event, response) => {
            this.handleWordPressAjaxError(response);
        });

        // WordPress フック対応
        if (typeof wp !== 'undefined' && wp.hooks) {
            wp.hooks.addAction('lightningtalk.registration.success', 'lightningtalk', this.onRegistrationSuccess.bind(this));
            wp.hooks.addAction('lightningtalk.event.updated', 'lightningtalk', this.onEventUpdated.bind(this));
        }
    }

    /**
     * アクション処理（WordPress拡張版）
     */
    handleAction(action, element) {
        // WordPress固有のアクション処理
        if (this.isWordPress) {
            switch(action) {
                case 'wp-register':
                    this.openWordPressRegistrationModal(element.dataset.type);
                    break;
                case 'wp-edit-event':
                    this.openEventEditor(element.dataset.eventId);
                    break;
                case 'wp-export-participants':
                    this.exportParticipants(element.dataset.eventId);
                    break;
                default:
                    // 元のアクション処理にフォールバック
                    this.handleOriginalAction(action, element);
            }
        } else {
            this.handleOriginalAction(action, element);
        }
    }

    /**
     * 元のアクション処理
     */
    handleOriginalAction(action, element) {
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

    /**
     * WordPress登録モーダルを開く
     */
    openWordPressRegistrationModal(type = 'general') {
        // WordPress用の拡張登録フォーム
        const modal = document.getElementById('registerModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = this.getWordPressRegistrationForm(type);
        modal.style.display = 'block';
        
        // WordPress AJAX フォーム送信の設定
        const form = modalBody.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleWordPressRegistration(new FormData(form), type);
            });
        }
    }

    /**
     * WordPress用登録フォーム
     */
    getWordPressRegistrationForm(type) {
        // 元のフォーム + WordPress固有フィールド
        const baseForm = this.getRegistrationForm(type);
        
        // WordPress nonce フィールドを追加
        const wpNonceField = `<input type="hidden" name="wp_nonce" value="${this.wpAPI.nonce}">`;
        const eventIdField = `<input type="hidden" name="event_id" value="${window.LightningTalkConfig?.defaultEventId || 1}">`;
        
        return baseForm.replace('</form>', wpNonceField + eventIdField + '</form>');
    }

    /**
     * WordPress登録処理
     */
    async handleWordPressRegistration(formData, type) {
        const submitBtn = document.querySelector('.registration-form button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = window.lightningtalk_ajax?.translations?.loading || '送信中...';
        submitBtn.disabled = true;

        try {
            const result = await this.wpAPI.request('register', {
                method: 'POST',
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (result.success) {
                this.showRegistrationSuccess(type, result.message);
                this.closeModal();
                
                // WordPress フック発火
                if (typeof wp !== 'undefined' && wp.hooks) {
                    wp.hooks.doAction('lightningtalk.registration.success', result);
                }
            }
        } catch (error) {
            this.showNotification(
                window.lightningtalk_ajax?.translations?.registration_error || 
                '登録に失敗しました。', 
                'error'
            );
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * WordPress AJAX成功ハンドラー
     */
    handleWordPressAjaxSuccess(response) {
        if (response.action === 'lightningtalk_register') {
            this.showNotification(response.message || '操作が完了しました。', 'success');
        }
    }

    /**
     * WordPress AJAXエラーハンドラー
     */
    handleWordPressAjaxError(response) {
        this.showNotification(response.message || 'エラーが発生しました。', 'error');
    }

    /**
     * 登録成功フック
     */
    onRegistrationSuccess(data) {
        console.log('Registration successful:', data);
        this.updateSurveyCounters();
    }

    /**
     * イベント更新フック
     */
    onEventUpdated(eventData) {
        console.log('Event updated:', eventData);
        this.updateEventDisplay(eventData);
    }

    // 元のメソッドの再実装（必要な部分のみ）
    
    getRegistrationForm(type) {
        // 元の実装をそのまま使用
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

    openRegistrationModal(type = 'general') {
        if (this.isWordPress) {
            this.openWordPressRegistrationModal(type);
        } else {
            // 元の実装
            const modal = document.getElementById('registerModal');
            const modalBody = document.getElementById('modalBody');
            
            modalBody.innerHTML = this.getRegistrationForm(type);
            modal.style.display = 'block';
            
            const form = modalBody.querySelector('form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRegistration(new FormData(form), type);
                });
            }
        }
    }

    // その他の必要なメソッドはここで実装
    setupScrollAnimations() { /* 元の実装 */ }
    setupSmoothScroll() { /* 元の実装 */ }
    updateFeedbackButton() { /* 元の実装 */ }
    startPeriodicUpdates() { /* 元の実装 */ }
    setupParallax() { /* 元の実装 */ }
    setupFloatingEffects() { /* 元の実装 */ }
    setupModalHandlers() { /* 元の実装 */ }
    setupTopicInteractions() { /* 元の実装 */ }
    setupMobileMenu() { /* 元の実装 */ }
    updateSurveyCounters() { /* 元の実装 */ }
    showNotification(message, type) { /* 元の実装 */ }
    showRegistrationSuccess(type, message) { /* 元の実装 */ }
    closeModal() { /* 元の実装 */ }
    incrementSurveyCounter(type) { /* 元の実装 */ }
    openFeedbackForm() { /* 元の実装 */ }
    showWalkinInfo() { /* 元の実装 */ }
}