/**
 * Lightning Talk Frontend JavaScript
 * フロントエンド用の JavaScript 機能
 */
/* globals lightningtalkFrontend, LightningTalk, google, jQuery */
/* eslint-env browser */

(function ($) {
  'use strict';

  // Lightning Talk オブジェクト
  window.LightningTalk = {
    config: {
      ajaxUrl: lightningtalkFrontend.ajaxUrl,
      nonce: lightningtalkFrontend.nonce,
      eventId: lightningtalkFrontend.eventId || 1
    },

    init() {
      this.bindEvents();
      this.initializeComponents();
      this.loadSurveyData();
    },

    bindEvents() {
      // 参加登録ボタン
      $(document).on('click', '.lt-register-btn', this.handleRegistrationClick);

      // アンケートボタン
      $(document).on('click', '.survey-btn', this.handleSurveyClick);

      // 発表申し込みボタン
      $(document).on('click', '.lt-talk-submit-btn', this.handleTalkSubmissionClick);

      // チャットメッセージ送信
      $(document).on('click', '.chat-send-btn', this.handleChatSend);
      $(document).on('keypress', '.chat-input', this.handleChatKeypress);

      // モーダルの制御
      $(document).on('click', '.modal-close, .modal-overlay', this.closeModal);
      $(document).on('click', '.modal-content', e => {
        e.stopPropagation();
      });
    },

    initializeComponents() {
      // チャット機能の初期化
      this.initializeChat();

      // 地図の初期化
      this.initializeMap();

      // リアルタイム更新の開始
      this.startRealtimeUpdates();
    },

    /**
     * 参加登録処理
     */
    handleRegistrationClick(e) {
      e.preventDefault();
      const $btn = $(this);
      const eventId = $btn.data('event-id') || LightningTalk.config.eventId;

      // 登録モーダルを表示
      LightningTalk.showRegistrationModal(eventId);
    },

    showRegistrationModal(eventId) {
      const modalHtml = `
                <div class="lt-modal" id="registrationModal">
                    <div class="modal-overlay">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>参加登録</h3>
                                <button class="modal-close">&times;</button>
                            </div>
                            <div class="modal-body">
                                <form id="registrationForm">
                                    <div class="form-group">
                                        <label for="reg_name">お名前 <span class="required">*</span></label>
                                        <input type="text" id="reg_name" name="name" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="reg_email">メールアドレス <span class="required">*</span></label>
                                        <input type="email" id="reg_email" name="email" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="reg_type">参加形式 <span class="required">*</span></label>
                                        <select id="reg_type" name="participation_type" required>
                                            <option value="">選択してください</option>
                                            <option value="online">オンライン参加</option>
                                            <option value="offline">現地参加</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="reg_organization">所属組織</label>
                                        <input type="text" id="reg_organization" name="organization">
                                    </div>
                                    <div class="form-group">
                                        <label for="reg_emergency_contact">緊急連絡先</label>
                                        <input type="tel" id="reg_emergency_contact" name="emergency_contact">
                                    </div>
                                    <div class="form-group">
                                        <label>
                                            <input type="checkbox" name="marketing_consent" value="1">
                                            今後のイベント情報を受け取る
                                        </label>
                                    </div>
                                    <input type="hidden" name="event_id" value="${eventId}">
                                    <input type="hidden" name="nonce" value="${LightningTalk.config.nonce}">
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="lt-btn lt-btn-secondary modal-close">キャンセル</button>
                                <button type="submit" form="registrationForm" class="lt-btn lt-btn-primary">登録する</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      $('body').append(modalHtml);
      $('#registrationModal').fadeIn();

      // フォーム送信処理
      $('#registrationForm').on('submit', this.submitRegistration);
    },

    submitRegistration(e) {
      e.preventDefault();
      const $form = $(this);
      const $submitBtn = $form.find('button[type="submit"]');

      $submitBtn.prop('disabled', true).text('送信中...');

      const formData = {
        action: 'lt_register_participant',
        name: $form.find('[name="name"]').val(),
        email: $form.find('[name="email"]').val(),
        participation_type: $form.find('[name="participation_type"]').val(),
        organization: $form.find('[name="organization"]').val(),
        emergency_contact: $form.find('[name="emergency_contact"]').val(),
        marketing_consent: $form.find('[name="marketing_consent"]').is(':checked') ? 1 : 0,
        event_id: $form.find('[name="event_id"]').val(),
        nonce: $form.find('[name="nonce"]').val()
      };

      $.ajax({
        url: LightningTalk.config.ajaxUrl,
        type: 'POST',
        data: formData,
        success(response) {
          if (response.success) {
            alert('参加登録が完了しました！確認メールをお送りしました。');
            LightningTalk.closeModal();
            // 参加者数を更新
            LightningTalk.updateParticipantCount();
          } else {
            alert(`エラー: ${response.data.message}`);
          }
        },
        error() {
          alert('通信エラーが発生しました。再度お試しください。');
        },
        complete() {
          $submitBtn.prop('disabled', false).text('登録する');
        }
      });
    },

    /**
     * アンケート処理
     */
    handleSurveyClick(e) {
      e.preventDefault();
      const $btn = $(this);
      const action = $btn.data('action');

      // ローカルストレージに投票を保存
      const storageKey = `lightningtalk_survey_${LightningTalk.config.eventId}`;
      const currentVote = localStorage.getItem(storageKey);

      if (currentVote) {
        alert('既に投票済みです！');
        return;
      }

      localStorage.setItem(storageKey, action);

      // カウンターを更新
      LightningTalk.updateSurveyCount(action);

      $btn.addClass('voted');
      alert('投票ありがとうございます！');
    },

    updateSurveyCount(type) {
      const storageKey = `lightningtalk_survey_count_${LightningTalk.config.eventId}`;
      const counts = JSON.parse(
        localStorage.getItem(storageKey) || '{"survey-online": 0, "survey-offline": 0}'
      );

      counts[type] = (counts[type] || 0) + 1;
      localStorage.setItem(storageKey, JSON.stringify(counts));

      // 表示を更新
      $('#onlineCount').text(counts['survey-online'] || 0);
      $('#offlineCount').text(counts['survey-offline'] || 0);
    },

    loadSurveyData() {
      const storageKey = `lightningtalk_survey_count_${LightningTalk.config.eventId}`;
      const counts = JSON.parse(
        localStorage.getItem(storageKey) || '{"survey-online": 0, "survey-offline": 0}'
      );

      $('#onlineCount').text(counts['survey-online'] || 0);
      $('#offlineCount').text(counts['survey-offline'] || 0);

      // 既に投票済みかチェック
      const voteKey = `lightningtalk_survey_${LightningTalk.config.eventId}`;
      const userVote = localStorage.getItem(voteKey);
      if (userVote) {
        $(`.survey-btn[data-action="${userVote}"]`).addClass('voted');
      }
    },

    /**
     * チャット機能
     */
    initializeChat() {
      this.loadChatMessages();
    },

    handleChatSend(e) {
      e.preventDefault();
      const $input = $('.chat-input');
      const message = $input.val().trim();

      if (message) {
        LightningTalk.addChatMessage(message);
        $input.val('');
      }
    },

    handleChatKeypress(e) {
      if (e.which === 13) {
        // Enter key
        e.preventDefault();
        $('.chat-send-btn').click();
      }
    },

    addChatMessage(message) {
      const timestamp = new Date().toLocaleTimeString();
      const messageHtml = `
                <div class="chat-message">
                    <span class="chat-time">${timestamp}</span>
                    <span class="chat-text">${this.escapeHtml(message)}</span>
                </div>
            `;

      $('.chat-messages').append(messageHtml);
      $('.chat-messages').scrollTop($('.chat-messages')[0].scrollHeight);

      // ローカルストレージに保存
      this.saveChatMessage(message, timestamp);
    },

    saveChatMessage(message, timestamp) {
      const storageKey = `lightningtalk_chat_${LightningTalk.config.eventId}`;
      let messages = JSON.parse(localStorage.getItem(storageKey) || '[]');

      messages.push({ message, timestamp });

      // 最新50件まで保持
      if (messages.length > 50) {
        messages = messages.slice(-50);
      }

      localStorage.setItem(storageKey, JSON.stringify(messages));
    },

    loadChatMessages() {
      const storageKey = `lightningtalk_chat_${LightningTalk.config.eventId}`;
      const messages = JSON.parse(localStorage.getItem(storageKey) || '[]');

      const $container = $('.chat-messages');
      $container.empty();

      messages.forEach(msg => {
        const messageHtml = `
                    <div class="chat-message">
                        <span class="chat-time">${msg.timestamp}</span>
                        <span class="chat-text">${LightningTalk.escapeHtml(msg.message)}</span>
                    </div>
                `;
        $container.append(messageHtml);
      });

      $container.scrollTop($container[0].scrollHeight);
    },

    /**
     * 地図の初期化
     */
    initializeMap() {
      // Google Maps の初期化（APIキーが設定されている場合）
      if (typeof google !== 'undefined' && google.maps) {
        $('.lt-map-container').each(function () {
          const $container = $(this);
          const lat = parseFloat($container.data('lat'));
          const lng = parseFloat($container.data('lng'));
          const title = $container.data('title') || 'イベント会場';

          if (lat && lng) {
            const map = new google.maps.Map($container[0], {
              center: { lat, lng },
              zoom: 15
            });

            new google.maps.Marker({
              position: { lat, lng },
              map,
              title
            });
          }
        });
      }
    },

    /**
     * リアルタイム更新
     */
    startRealtimeUpdates() {
      // 30秒ごとに参加者数を更新
      setInterval(() => {
        LightningTalk.updateParticipantCount();
      }, 30000);
    },

    updateParticipantCount() {
      $.ajax({
        url: LightningTalk.config.ajaxUrl,
        type: 'POST',
        data: {
          action: 'lt_get_participant_count',
          event_id: LightningTalk.config.eventId,
          nonce: LightningTalk.config.nonce
        },
        success(response) {
          if (response.success) {
            $('.lt-participant-count .count').text(response.data.count);
          }
        }
      });
    },

    /**
     * モーダル制御
     */
    closeModal() {
      $('.lt-modal').fadeOut(function () {
        $(this).remove();
      });
    },

    /**
     * ユーティリティ関数
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // DOM読み込み完了時に初期化
  $(document).ready(() => {
    LightningTalk.init();
  });
})(jQuery);
