/**
 * Lightning Talk WordPress Theme - Main JavaScript
 * Version: 1.1.0
 */

/* global jQuery, lightningtalk_ajax, google, LightningTalk, LightningTalkChat, LightningTalkMaps */

(function($) {
  'use strict';

  // Global Lightning Talk object
  window.LightningTalk = {
    init() {
      this.initRegistrationForms();
      this.initSurveyVoting();
      this.initModals();
      this.initParticipantCounters();
      this.bindEvents();
    },

    // Registration Form Handling
    initRegistrationForms() {
      $('.lt-registration-form').on('submit', this.handleRegistration.bind(this));
    },

    handleRegistration(e) {
      e.preventDefault();

      const $form = $(e.target);
      const $submitBtn = $form.find('.lt-btn-submit');
      const originalText = $submitBtn.text();

      // Form validation
      const formData = this.getFormData($form);
      if (!this.validateRegistrationForm(formData)) {
        return;
      }

      // Start loading state
      this.setLoadingState($submitBtn, true);

      // AJAX request
      $.ajax({
        url: lightningtalk_ajax.ajax_url,
        type: 'POST',
        data: {
          action: 'lightningtalk_register',
          nonce: lightningtalk_ajax.nonce,
          event_id: formData.event_id,
          participant_type: formData.participant_type,
          name: formData.name,
          email: formData.email,
          emergency_contact: formData.emergency_contact || '',
          dietary_restrictions: formData.dietary_restrictions || '',
          accessibility_needs: formData.accessibility_needs || ''
        },
        success: (response) => {
          if (response.success) {
            this.showAlert('success', response.data);
            $form[0].reset();
            this.closeModal();
            this.refreshParticipantCounts();
          } else {
            this.showAlert('danger', response.data);
          }
        },
        error: () => {
          this.showAlert('danger', lightningtalk_ajax.strings.registration_error);
        },
        complete: () => {
          this.setLoadingState($submitBtn, false, originalText);
        }
      });
    },

    // Survey Voting
    initSurveyVoting() {
      $('.lt-survey-option').on('click', this.handleSurveyVote.bind(this));
    },

    handleSurveyVote(e) {
      const $option = $(e.currentTarget);
      const $survey = $option.closest('.lt-survey');
      const eventId = $survey.data('event-id');
      const voteType = $option.data('vote-type');

      // Check if already voted (localStorage)
      const voteKey = `lt_vote_${eventId}`;
      if (localStorage.getItem(voteKey)) {
        this.showAlert('warning', '既に投票済みです。');
        return;
      }

      // Visual feedback
      $survey.find('.lt-survey-option').removeClass('selected');
      $option.addClass('selected');

      // AJAX request
      $.ajax({
        url: lightningtalk_ajax.ajax_url,
        type: 'POST',
        data: {
          action: 'lightningtalk_survey_vote',
          nonce: lightningtalk_ajax.nonce,
          event_id: eventId,
          vote_type: voteType
        },
        success: (response) => {
          if (response.success) {
            // Store vote in localStorage
            localStorage.setItem(voteKey, voteType);

            // Update counts
            this.updateSurveyCounts(eventId, response.data.counts);
            this.showAlert('success', response.data.message);
          } else {
            $option.removeClass('selected');
            this.showAlert('danger', response.data);
          }
        },
        error: () => {
          $option.removeClass('selected');
          this.showAlert('danger', '投票処理中にエラーが発生しました。');
        }
      });
    },

    // Modal Management
    initModals() {
      // Open modal triggers
      $('[data-modal]').on('click', this.openModal.bind(this));

      // Close modal triggers
      $('.lt-modal-close, .lt-modal').on('click', (e) => {
        if (e.target === e.currentTarget) {
          this.closeModal();
        }
      });

      // ESC key to close modal
      $(document).on('keydown', (e) => {
        if (e.keyCode === 27) {
          this.closeModal();
        }
      });
    },

    openModal(e) {
      e.preventDefault();
      const modalId = $(e.currentTarget).data('modal');
      const $modal = $(modalId);

      if ($modal.length) {
        $modal.fadeIn(300);
        $('body').addClass('lt-modal-open');

        // Focus first input
        setTimeout(() => {
          $modal.find('input:first').focus();
        }, 350);
      }
    },

    closeModal() {
      $('.lt-modal').fadeOut(300);
      $('body').removeClass('lt-modal-open');
    },

    // Participant Counters
    initParticipantCounters() {
      this.refreshParticipantCounts();

      // Auto-refresh every 30 seconds
      setInterval(() => {
        this.refreshParticipantCounts();
      }, 30000);
    },

    refreshParticipantCounts() {
      $('.lt-participants-count').each((index, element) => {
        const $counter = $(element);
        const eventId = $counter.data('event-id');

        if (eventId) {
          this.updateParticipantCount(eventId, $counter);
        }
      });
    },

    updateParticipantCount(eventId, $counter) {
      $.ajax({
        url: lightningtalk_ajax.ajax_url,
        type: 'POST',
        data: {
          action: 'lightningtalk_get_participant_count',
          nonce: lightningtalk_ajax.nonce,
          event_id: eventId
        },
        success: (response) => {
          if (response.success) {
            const counts = response.data;

            $counter.find('[data-count=\"total\"]').text(counts.total);
            $counter.find('[data-count=\"listeners\"]').text(counts.listeners);
            $counter.find('[data-count=\"speakers\"]').text(counts.speakers);
          }
        }
      });
    },

    // Survey Count Updates
    updateSurveyCounts(eventId, counts) {
      const $survey = $(`.lt-survey[data-event-id=\"${eventId}\"]`);

      $survey.find('[data-vote-type=\"online\"] .lt-survey-option-count').text(counts.online);
      $survey.find('[data-vote-type=\"offline\"] .lt-survey-option-count').text(counts.offline);

      // Update total if exists
      const total = counts.online + counts.offline;
      $survey.find('.lt-survey-total').text(total);
    },

    // Utility Functions
    getFormData($form) {
      const formData = {};
      $form.serializeArray().forEach(item => {
        formData[item.name] = item.value;
      });
      return formData;
    },

    validateRegistrationForm(data) {
      const errors = [];

      if (!data.name || data.name.trim().length < 2) {
        errors.push('名前は2文字以上で入力してください。');
      }

      if (!data.email || !this.isValidEmail(data.email)) {
        errors.push('有効なメールアドレスを入力してください。');
      }

      if (!data.participant_type) {
        errors.push('参加タイプを選択してください。');
      }

      if (errors.length > 0) {
        this.showAlert('danger', errors.join('<br>'));
        return false;
      }

      return true;
    },

    isValidEmail(email) {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      return emailRegex.test(email);
    },

    setLoadingState($button, loading, originalText = '') {
      if (loading) {
        $button
          .prop('disabled', true)
          .html(`<span class=\"lt-spinner\"></span> ${lightningtalk_ajax.strings.loading}`);
      } else {
        $button
          .prop('disabled', false)
          .text(originalText || $button.text().replace(lightningtalk_ajax.strings.loading, '').trim());
      }
    },

    showAlert(type, message) {
      const alertClass = `lt-alert-${type}`;
      const $alert = $(`
                <div class="lt-alert ${alertClass}" style="display: none;">
                    ${message}
                </div>
            `);

      // Remove existing alerts
      $('.lt-alert').remove();

      // Add new alert
      $('body').prepend($alert);
      $alert.slideDown(300);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        $alert.slideUp(300, () => $alert.remove());
      }, 5000);
    },

    // Event Bindings
    bindEvents() {
      // Smooth scrolling for anchor links
      $('a[href^=\"#\"]').on('click', function(e) {
        e.preventDefault();
        const target = $(this.getAttribute('href'));
        if (target.length) {
          $('html, body').animate({
            scrollTop: target.offset().top - 80
          }, 600);
        }
      });

      // Auto-resize textareas
      $('textarea').on('input', function() {
        this.style.height = 'auto';
        this.style.height = `${this.scrollHeight}px`;
      });

      // Form field animations
      $('.lt-form-input, .lt-form-select').on('focus blur', function(e) {
        const $field = $(this);
        const $group = $field.closest('.lt-form-group');

        if (e.type === 'focus') {
          $group.addClass('focused');
        } else {
          $group.removeClass('focused');

          if ($field.val()) {
            $group.addClass('filled');
          } else {
            $group.removeClass('filled');
          }
        }
      });

      // Initialize filled state for pre-filled fields
      $('.lt-form-input, .lt-form-select').each(function() {
        const $field = $(this);
        const $group = $field.closest('.lt-form-group');

        if ($field.val()) {
          $group.addClass('filled');
        }
      });
    }
  };

  // Chat Widget (adapted from original)
  window.LightningTalkChat = {
    init() {
      this.loadMessages();
      this.bindChatEvents();
    },

    bindChatEvents() {
      $('#lt-chat-form').on('submit', this.sendMessage.bind(this));
      $('#lt-chat-toggle').on('click', this.toggleChat.bind(this));
    },

    sendMessage(e) {
      e.preventDefault();

      const $form = $(e.target);
      const message = $form.find('#lt-chat-message').val().trim();
      const name = $form.find('#lt-chat-name').val().trim();

      if (!message || !name) {return;}

      const messageData = {
        id: Date.now(),
        name,
        message,
        timestamp: new Date().toLocaleTimeString()
      };

      this.addMessage(messageData);
      this.saveMessage(messageData);

      $form.find('#lt-chat-message').val('').focus();
    },

    addMessage(messageData) {
      const $chatMessages = $('#lt-chat-messages');
      const messageHtml = `
                <div class="lt-chat-message">
                    <div class="lt-chat-message-header">
                        <strong>${this.escapeHtml(messageData.name)}</strong>
                        <span class="lt-chat-timestamp">${messageData.timestamp}</span>
                    </div>
                    <div class="lt-chat-message-body">
                        ${this.escapeHtml(messageData.message)}
                    </div>
                </div>
            `;

      $chatMessages.append(messageHtml);
      $chatMessages.scrollTop($chatMessages[0].scrollHeight);
    },

    loadMessages() {
      const messages = JSON.parse(localStorage.getItem('lt_chat_messages') || '[]');
      messages.forEach(message => this.addMessage(message));
    },

    saveMessage(messageData) {
      const messages = JSON.parse(localStorage.getItem('lt_chat_messages') || '[]');
      messages.push(messageData);

      // Keep only last 50 messages
      if (messages.length > 50) {
        messages.splice(0, messages.length - 50);
      }

      localStorage.setItem('lt_chat_messages', JSON.stringify(messages));
    },

    toggleChat() {
      $('#lt-chat-widget').toggleClass('open');
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // Google Maps Integration
  window.LightningTalkMaps = {
    maps: [],

    init() {
      if (typeof google !== 'undefined' && google.maps) {
        this.initializeMaps();
      }
    },

    initializeMaps() {
      $('.lt-map').each((index, element) => {
        const $map = $(element);
        const lat = parseFloat($map.data('lat'));
        const lng = parseFloat($map.data('lng'));
        const title = $map.data('title') || 'イベント会場';

        if (lat && lng) {
          this.createMap(element, lat, lng, title);
        }
      });
    },

    createMap(element, lat, lng, title) {
      const map = new google.maps.Map(element, {
        center: { lat, lng },
        zoom: 15,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title,
        animation: google.maps.Animation.DROP
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 10px;"><strong>${title}</strong></div>`
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      this.maps.push(map);
    }
  };

  // Initialize everything when document is ready
  $(document).ready(() => {
    LightningTalk.init();
    LightningTalkChat.init();
    LightningTalkMaps.init();
  });

  // Additional AJAX actions
  $(document).ready(() => {
    // Get participant count action
    window.getLightningTalkParticipantCount = function(eventId, callback) {
      $.ajax({
        url: lightningtalk_ajax.ajax_url,
        type: 'POST',
        data: {
          action: 'lightningtalk_get_participant_count',
          nonce: lightningtalk_ajax.nonce,
          event_id: eventId
        },
        success: callback
      });
    };

    // Get survey results action
    window.getLightningTalkSurveyResults = function(eventId, callback) {
      $.ajax({
        url: lightningtalk_ajax.ajax_url,
        type: 'POST',
        data: {
          action: 'lightningtalk_get_survey_results',
          nonce: lightningtalk_ajax.nonce,
          event_id: eventId
        },
        success: callback
      });
    };
  });

})(jQuery);

// Add CSS for modal open state
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
        body.lt-modal-open {
            overflow: hidden;
        }
        
        .lt-chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            height: 400px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            transform: translateY(100%);
            transition: transform 0.3s ease;
            z-index: 1000;
        }
        
        .lt-chat-widget.open {
            transform: translateY(0);
        }
        
        .lt-chat-header {
            background: linear-gradient(135deg, var(--lt-primary) 0%, var(--lt-secondary) 100%);
            color: white;
            padding: 15px;
            border-radius: 10px 10px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .lt-chat-messages {
            height: 250px;
            overflow-y: auto;
            padding: 10px;
            font-size: 0.9rem;
        }
        
        .lt-chat-message {
            margin-bottom: 10px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .lt-chat-message-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 0.8rem;
        }
        
        .lt-chat-timestamp {
            color: #666;
        }
        
        .lt-chat-form {
            padding: 10px;
            border-top: 1px solid #eee;
        }
        
        .lt-chat-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin-bottom: 5px;
            font-size: 0.9rem;
        }
        
        .lt-chat-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, var(--lt-primary) 0%, var(--lt-secondary) 100%);
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            z-index: 999;
        }
    `;
  document.head.appendChild(style);
});
