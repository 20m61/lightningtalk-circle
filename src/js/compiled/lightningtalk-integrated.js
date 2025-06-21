/**
 * Lightning Talk WordPress Integrated Script
 * 統合されたJavaScriptファイル
 */

// WordPressアダプターを含む統合スクリプト
(function() {
    'use strict';
    
    // 元のLightning Talkクラスを定義（簡易版）
    class LightningTalkApp {
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
            this.updateSurveyCounters();
            
            if (this.isWordPress) {
                this.initWordPressFeatures();
            }
            
            console.log('⚡ Lightning Talk WordPress統合完了');
        }

        setupEventListeners() {
            document.querySelectorAll('[data-action]').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleAction(e.target.dataset.action, e.target);
                });
            });
        }

        handleAction(action, element) {
            switch(action) {
                case 'register':
                case 'wp-register':
                    this.openRegistrationModal(element.dataset.type || 'general');
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
            if (this.isWordPress) {
                this.openWordPressRegistrationModal(type);
            } else {
                console.log('Registration modal:', type);
            }
        }

        openWordPressRegistrationModal(type) {
            // WordPress用の登録モーダル（簡易版）
            const modal = document.createElement('div');
            modal.className = 'lt-modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="lt-modal-content">
                    <span class="lt-close">&times;</span>
                    <h2>${this.getRegistrationTitle(type)}</h2>
                    <form class="lt-registration-form">
                        <div class="lt-form-group">
                            <label>お名前 *</label>
                            <input type="text" name="name" required>
                        </div>
                        <div class="lt-form-group">
                            <label>メールアドレス *</label>
                            <input type="email" name="email" required>
                        </div>
                        <div class="lt-form-group">
                            <label>参加方法 *</label>
                            <select name="participation" required>
                                <option value="">選択してください</option>
                                <option value="onsite">現地参加</option>
                                <option value="online">オンライン参加</option>
                            </select>
                        </div>
                        <button type="submit" class="lt-btn">登録</button>
                    </form>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // 閉じるボタン
            modal.querySelector('.lt-close').addEventListener('click', () => {
                modal.remove();
            });
            
            // フォーム送信
            modal.querySelector('form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration(new FormData(e.target), type);
                modal.remove();
            });
        }

        getRegistrationTitle(type) {
            const titles = {
                general: '📝 イベント参加登録',
                listener: '👥 聴講参加登録',
                speaker: '🎤 発表者登録'
            };
            return titles[type] || titles.general;
        }

        async handleRegistration(formData, type) {
            if (this.isWordPress && window.lightningtalk_ajax) {
                // WordPress REST API呼び出し
                try {
                    const response = await fetch(window.lightningtalk_ajax.api_base + 'register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-WP-Nonce': window.lightningtalk_ajax.nonce
                        },
                        body: JSON.stringify(Object.fromEntries(formData))
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        this.showNotification('参加登録が完了しました！', 'success');
                    } else {
                        throw new Error('Registration failed');
                    }
                } catch (error) {
                    this.showNotification('登録に失敗しました。', 'error');
                }
            } else {
                // スタンドアロン版の処理
                console.log('Registration data:', Object.fromEntries(formData));
                this.showNotification('登録が完了しました！', 'success');
            }
        }

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

        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `lt-notification lt-notification-${type}`;
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
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        initWordPressFeatures() {
            // WordPress固有の初期化
            this.setupWordPressAPI();
            this.integrateCocoonTheme();
        }

        setupWordPressAPI() {
            this.wpAPI = {
                baseUrl: window.lightningtalk_ajax?.api_base || '/wp-json/lightningtalk/v1/',
                nonce: window.lightningtalk_ajax?.nonce || ''
            };
        }

        integrateCocoonTheme() {
            // Cocoonテーマとの統合
            document.body.classList.add('lt-wordpress-integrated');
            
            // ダークモード対応
            if (document.body.classList.contains('dark-mode')) {
                document.body.classList.add('lt-dark-mode');
            }
        }
    }

    // WordPress環境での自動初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.lightningTalkApp = new LightningTalkApp();
        });
    } else {
        window.lightningTalkApp = new LightningTalkApp();
    }

    // グローバルに公開
    window.LightningTalkApp = LightningTalkApp;

})();