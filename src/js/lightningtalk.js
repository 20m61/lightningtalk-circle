/**
 * Lightning Talk WordPress Integration Main Script
 * WordPressテーマとの統合用メインスクリプト
 */

// 元のLightning Talkアプリケーションクラスをインポート
import { LightningTalkApp } from './wordpress-adapter.js';

/**
 * WordPress環境での初期化
 */
class WordPressLightningTalkApp extends LightningTalkApp {
    constructor() {
        super();
        this.wpConfig = window.LightningTalkConfig || {};
        this.apiUrl = this.wpConfig.apiUrl || '/wp-json/lightningtalk/v1/';
        this.nonce = this.wpConfig.nonce || '';
        this.isWordPress = true;
        
        this.initWordPressIntegration();
    }

    /**
     * WordPress固有の初期化
     */
    initWordPressIntegration() {
        // WordPress REST APIの設定
        this.setupWordPressAPI();
        
        // Cocoonテーマとの統合
        this.integrateCocoonTheme();
        
        // WordPress固有のイベントリスナー
        this.setupWordPressEvents();
        
        // WordPress管理バー対応
        this.adjustForAdminBar();
        
        console.log('🚀 Lightning Talk WordPress統合完了');
    }

    /**
     * WordPress REST APIの設定
     */
    setupWordPressAPI() {
        this.api = {
            base: this.apiUrl,
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.nonce
            }
        };
    }

    /**
     * Cocoonテーマとの統合
     */
    integrateCocoonTheme() {
        // Cocoonのスタイルと競合しないようにクラス名を調整
        document.querySelectorAll('.btn').forEach(btn => {
            btn.classList.add('lt-btn');
        });

        // Cocoonのレスポンシブ対応
        if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
            this.setupMobileOptimization();
        }

        // Cocoonのダークモード対応
        if (document.body.classList.contains('dark-mode')) {
            this.applyDarkModeStyles();
        }
    }

    /**
     * WordPress固有のイベントリスナー
     */
    setupWordPressEvents() {
        // WordPressページ遷移対応
        document.addEventListener('wp-after-load', () => {
            this.reinitialize();
        });

        // WordPress AJAX完了イベント
        jQuery(document).on('wp_ajax_complete', () => {
            this.updateComponents();
        });

        // Cocoonのテーマ切り替え対応
        if (typeof cocoon_theme_switcher !== 'undefined') {
            cocoon_theme_switcher.on('change', () => {
                this.handleThemeChange();
            });
        }
    }

    /**
     * WordPress管理バー対応
     */
    adjustForAdminBar() {
        const adminBar = document.getElementById('wpadminbar');
        if (adminBar) {
            const adminBarHeight = adminBar.offsetHeight;
            document.documentElement.style.setProperty('--wp-admin-bar-height', `${adminBarHeight}px`);
            
            // ヘッダーの位置調整
            const header = document.querySelector('header');
            if (header) {
                header.style.top = `${adminBarHeight}px`;
            }
        }
    }

    /**
     * 参加登録処理（WordPress API使用）
     */
    async handleRegistration(formData, type) {
        try {
            // WordPress REST APIに送信
            const response = await fetch(`${this.apiUrl}register`, {
                method: 'POST',
                headers: this.api.headers,
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    participation_type: formData.get('participation'),
                    talk_title: formData.get('talkTitle'),
                    talk_description: formData.get('talkDescription'),
                    category: formData.get('category'),
                    message: formData.get('message'),
                    newsletter: formData.get('newsletter'),
                    event_id: this.wpConfig.defaultEventId || 1
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.showRegistrationSuccess(type, result.message);
                this.closeModal();
                
                // WordPress イベント発火
                window.dispatchEvent(new CustomEvent('lightningtalk:registration:success', {
                    detail: { type, result }
                }));
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(
                window.lightningtalk_ajax?.translations?.registration_error || 
                '登録に失敗しました。もう一度お試しください。', 
                'error'
            );
        }
    }

    /**
     * イベント情報を取得（WordPress API使用）
     */
    async loadEventData(eventId = null) {
        try {
            const id = eventId || this.wpConfig.defaultEventId || 1;
            const response = await fetch(`${this.apiUrl}events/${id}`, {
                headers: {
                    'X-WP-Nonce': this.nonce
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const eventData = await response.json();
            this.updateEventDisplay(eventData);
            
            return eventData;
        } catch (error) {
            console.error('Failed to load event data:', error);
            return null;
        }
    }

    /**
     * イベント表示の更新
     */
    updateEventDisplay(eventData) {
        // 日付の更新
        const dateElements = document.querySelectorAll('.date-highlight');
        dateElements.forEach(el => {
            if (eventData.date) {
                el.textContent = `📅 ${this.formatEventDate(eventData.date)}`;
            }
        });

        // 会場情報の更新
        const venueElements = document.querySelectorAll('.venue-status p');
        if (venueElements.length > 0 && eventData.venue) {
            venueElements[0].innerHTML = `<strong>${eventData.venue}</strong>`;
            if (eventData.venue_address) {
                venueElements[1].textContent = eventData.venue_address;
            }
        }

        // オンライン情報の更新
        const onlineLink = document.querySelector('.online-info a');
        if (onlineLink && eventData.online_url) {
            onlineLink.href = eventData.online_url;
        }
    }

    /**
     * 日付フォーマット（日本語）
     */
    formatEventDate(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Tokyo'
        };
        return date.toLocaleDateString('ja-JP', options);
    }

    /**
     * モバイル最適化
     */
    setupMobileOptimization() {
        // Cocoonのモバイルメニューとの統合
        document.body.classList.add('lt-mobile-optimized');
        
        // タッチイベントの最適化
        document.querySelectorAll('.topic-item').forEach(item => {
            item.addEventListener('touchstart', () => {
                item.classList.add('touch-active');
            });
            
            item.addEventListener('touchend', () => {
                setTimeout(() => {
                    item.classList.remove('touch-active');
                }, 150);
            });
        });
    }

    /**
     * ダークモード対応
     */
    applyDarkModeStyles() {
        document.body.classList.add('lt-dark-mode');
        
        // CSS カスタムプロパティでダークモード色を設定
        document.documentElement.style.setProperty('--lt-bg-primary', '#1a1a1a');
        document.documentElement.style.setProperty('--lt-text-primary', '#ffffff');
        document.documentElement.style.setProperty('--lt-card-bg', '#2d2d2d');
    }

    /**
     * テーマ変更対応
     */
    handleThemeChange() {
        // Cocoonテーマ変更時の再初期化
        setTimeout(() => {
            this.integrateCocoonTheme();
            this.updateComponents();
        }, 100);
    }

    /**
     * コンポーネントの更新
     */
    updateComponents() {
        // イベントリスナーの再設定
        this.setupEventListeners();
        
        // モーダルハンドラーの再設定
        this.setupModalHandlers();
        
        // 新しく追加された要素の初期化
        this.initializeNewElements();
    }

    /**
     * 新規要素の初期化
     */
    initializeNewElements() {
        // 新しく追加されたボタンのイベントリスナー設定
        document.querySelectorAll('[data-action]:not(.lt-initialized)').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAction(e.target.dataset.action, e.target);
            });
            button.classList.add('lt-initialized');
        });
    }

    /**
     * 再初期化
     */
    reinitialize() {
        console.log('🔄 Lightning Talk 再初期化中...');
        this.updateComponents();
        this.loadEventData();
    }

    /**
     * WordPress ショートコード対応
     */
    static initFromShortcode(config = {}) {
        // ショートコードから初期化される場合の設定
        window.LightningTalkConfig = {
            ...window.LightningTalkConfig,
            ...config
        };
        
        return new WordPressLightningTalkApp();
    }
}

// WordPress環境での自動初期化
if (typeof window !== 'undefined' && window.wp) {
    // DOMContentLoaded または wp-ready イベントで初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.lightningTalkApp = new WordPressLightningTalkApp();
        });
    } else {
        window.lightningTalkApp = new WordPressLightningTalkApp();
    }
}

// モジュールとしてエクスポート
export { WordPressLightningTalkApp };
export default WordPressLightningTalkApp;