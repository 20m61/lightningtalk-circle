/**
 * Speaker Dashboard JavaScript
 * スピーカーダッシュボードの機能実装
 */

class SpeakerDashboard {
  constructor() {
    this.currentSection = 'overview';
    this.timer = null;
    this.timerDuration = 300; // 5 minutes in seconds
    this.timerRemaining = this.timerDuration;
    this.isTimerRunning = false;

    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupTimer();
    this.loadDashboardData();
    this.setupEventListeners();
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const targetSection = item.getAttribute('href').substring(1);
        this.switchSection(targetSection);
      });
    });
  }

  switchSection(sectionId) {
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[href="#${sectionId}"]`).classList.add('active');

    // Update section visibility
    document.querySelectorAll('.dashboard-section').forEach(section => {
      section.classList.remove('active');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    this.currentSection = sectionId;
  }

  async loadDashboardData() {
    try {
      // Load speaker stats
      const statsResponse = await fetch('/api/speakers/me/stats');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        this.updateStats(stats);
      }

      // Load upcoming talks
      const upcomingResponse = await fetch('/api/speakers/me/talks?status=upcoming');
      if (upcomingResponse.ok) {
        const talks = await upcomingResponse.json();
        this.renderUpcomingTalks(talks);
      }

      // Load recent feedback
      const feedbackResponse = await fetch('/api/speakers/me/feedback?limit=5');
      if (feedbackResponse.ok) {
        const feedback = await feedbackResponse.json();
        this.renderRecentFeedback(feedback);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  updateStats(stats) {
    // Update stat cards
    const statElements = {
      monthlyTalks: document.querySelector('.stat-card:nth-child(1) .stat-number'),
      totalViewers: document.querySelector('.stat-card:nth-child(2) .stat-number'),
      averageRating: document.querySelector('.stat-card:nth-child(3) .stat-number'),
      qaAnswers: document.querySelector('.stat-card:nth-child(4) .stat-number')
    };

    if (statElements.monthlyTalks) {
      statElements.monthlyTalks.textContent = stats.monthlyTalks || '0';
    }
    if (statElements.totalViewers) {
      statElements.totalViewers.textContent = stats.totalViewers || '0';
    }
    if (statElements.averageRating) {
      statElements.averageRating.textContent = `${stats.averageRating || '0'}/5.0`;
    }
    if (statElements.qaAnswers) {
      statElements.qaAnswers.textContent = stats.qaAnswers || '0';
    }
  }

  renderUpcomingTalks(talks) {
    const container = document.querySelector('.upcoming-talks');
    if (!container || talks.length === 0) {
      return;
    }

    const talksHtml = talks
      .map(
        talk => `
      <div class="talk-card upcoming">
        <div class="talk-date">${new Date(talk.scheduledDate).toLocaleString('ja-JP')}</div>
        <h4 class="talk-title">${this.escapeHtml(talk.title)}</h4>
        <div class="talk-meta">
          <span class="event-name">${this.escapeHtml(talk.eventName)}</span>
          <span class="talk-duration">${talk.duration}分</span>
        </div>
        <div class="talk-actions">
          <button class="btn btn-primary" onclick="dashboard.uploadSlides('${talk.id}')">
            スライドをアップロード
          </button>
          <button class="btn btn-secondary" onclick="dashboard.openPracticeTimer()">
            練習タイマー
          </button>
        </div>
      </div>
    `
      )
      .join('');

    container.innerHTML = '<h3>次回の発表</h3>' + talksHtml;
  }

  renderRecentFeedback(feedbackList) {
    const container = document.querySelector('.feedback-list');
    if (!container || feedbackList.length === 0) return;

    const feedbackHtml = feedbackList
      .map(
        feedback => `
      <div class="feedback-item">
        <div class="feedback-header">
          <span class="feedback-author">${feedback.isAnonymous ? '匿名' : this.escapeHtml(feedback.authorName)}</span>
          <span class="feedback-date">${new Date(feedback.createdAt).toLocaleDateString('ja-JP')}</span>
        </div>
        <div class="feedback-rating">${'⭐'.repeat(feedback.rating)}</div>
        <p class="feedback-text">${this.escapeHtml(feedback.comment)}</p>
      </div>
    `
      )
      .join('');

    container.innerHTML = feedbackHtml;
  }

  setupTimer() {
    const modal = document.getElementById('practiceTimerModal');
    const closeBtn = modal.querySelector('.close');
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const resetBtn = document.getElementById('resetTimer');

    closeBtn.addEventListener('click', () => {
      this.closePracticeTimer();
    });

    startBtn.addEventListener('click', () => {
      this.startTimer();
    });

    pauseBtn.addEventListener('click', () => {
      this.pauseTimer();
    });

    resetBtn.addEventListener('click', () => {
      this.resetTimer();
    });

    window.addEventListener('click', e => {
      if (e.target === modal) {
        this.closePracticeTimer();
      }
    });
  }

  openPracticeTimer() {
    const modal = document.getElementById('practiceTimerModal');
    modal.style.display = 'block';
    this.resetTimer();
  }

  closePracticeTimer() {
    const modal = document.getElementById('practiceTimerModal');
    modal.style.display = 'none';
    this.pauseTimer();
  }

  startTimer() {
    if (this.isTimerRunning) return;

    this.isTimerRunning = true;
    document.getElementById('startTimer').disabled = true;
    document.getElementById('pauseTimer').disabled = false;

    this.timer = setInterval(() => {
      this.timerRemaining--;
      this.updateTimerDisplay();

      if (this.timerRemaining <= 0) {
        this.timerComplete();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isTimerRunning = false;
    clearInterval(this.timer);
    document.getElementById('startTimer').disabled = false;
    document.getElementById('pauseTimer').disabled = true;
  }

  resetTimer() {
    this.pauseTimer();
    this.timerRemaining = this.timerDuration;
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timerRemaining / 60);
    const seconds = this.timerRemaining % 60;

    document.getElementById('timerMinutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('timerSeconds').textContent = seconds.toString().padStart(2, '0');

    // Update progress circle
    const progress = (this.timerDuration - this.timerRemaining) / this.timerDuration;
    const circumference = 2 * Math.PI * 90; // radius = 90
    const offset = circumference * (1 - progress);

    const progressCircle = document.getElementById('timerProgress');
    progressCircle.style.strokeDashoffset = offset;

    // Change color based on remaining time
    if (this.timerRemaining <= 30) {
      progressCircle.style.stroke = '#f44336'; // Red
    } else if (this.timerRemaining <= 60) {
      progressCircle.style.stroke = '#ff9800'; // Orange
    } else {
      progressCircle.style.stroke = '#4CAF50'; // Green
    }
  }

  timerComplete() {
    this.pauseTimer();
    alert('時間終了です！お疲れ様でした！');

    // Play sound if available
    const audio = new Audio('/sounds/timer-end.mp3');
    audio.play().catch(() => {
      // Ignore audio play errors
    });
  }

  setupEventListeners() {
    // File upload handlers
    document.addEventListener('change', e => {
      if (e.target.matches('input[type="file"]')) {
        this.handleFileUpload(e.target);
      }
    });

    // New talk creation
    const createTalkBtn = document.querySelector('.btn-primary');
    if (createTalkBtn && createTalkBtn.textContent === '新規発表を作成') {
      createTalkBtn.addEventListener('click', () => {
        this.createNewTalk();
      });
    }
  }

  async uploadSlides(talkId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.ppt,.pptx,.key';

    input.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('slides', file);

      try {
        const response = await fetch(`/api/talks/${talkId}/slides`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          this.showNotification('スライドがアップロードされました', 'success');
          this.loadDashboardData();
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Failed to upload slides:', error);
        this.showNotification('スライドのアップロードに失敗しました', 'error');
      }
    };

    input.click();
  }

  createNewTalk() {
    // This would open a modal or redirect to talk creation page
    window.location.href = '/talks/new';
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
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new SpeakerDashboard();
});

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
