/**
 * Speaker Dashboard v2
 * Comprehensive speaker management interface with voting system integration
 */

class SpeakerDashboard {
  constructor() {
    this.apiEndpoint = window.API_CONFIG?.apiEndpoint || '/api';
    this.authToken = null;
    this.currentUser = null;
    this.speakerProfile = null;
    this.currentSection = 'overview';
    this.talks = [];
    this.analytics = null;
    this.timer = null;
    this.timerDuration = 300; // 5 minutes in seconds
    this.timerRemaining = this.timerDuration;
    this.isTimerRunning = false;
    this.currentTalkId = null;
    this.practiceElapsed = 0;
    this.practiceStartTime = null;

    this.init();
  }

  async init() {
    // Check authentication
    this.authToken = localStorage.getItem('authToken');
    if (!this.authToken) {
      window.location.href = '/login.html?redirect=/speaker-dashboard.html';
      return;
    }

    // Initialize components
    await this.loadUserProfile();
    await this.loadSpeakerProfile();
    this.setupNavigation();
    this.setupTimer();
    this.setupEventListeners();

    // Load initial data
    await this.loadDashboardData();

    // Subscribe to real-time updates
    this.subscribeToUpdates();
  }

  async loadUserProfile() {
    try {
      const response = await fetch(`${this.apiEndpoint}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load user profile');
      }

      const data = await response.json();
      this.currentUser = data.user;
      this.updateUserUI();
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.showNotification('プロフィールの読み込みに失敗しました', 'error');
    }
  }

  async loadSpeakerProfile() {
    try {
      const response = await fetch(`${this.apiEndpoint}/speakers/profile`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load speaker profile');
      }

      const data = await response.json();
      this.speakerProfile = data.data;
      this.updateSpeakerProfileUI();
    } catch (error) {
      console.error('Error loading speaker profile:', error);
      this.showNotification('スピーカープロフィールの読み込みに失敗しました', 'error');
    }
  }

  updateUserUI() {
    if (!this.currentUser) {
      return;
    }

    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-name');

    if (userAvatar) {
      userAvatar.src = this.currentUser.avatar || '/images/default-avatar.png';
    }

    if (userName) {
      userName.textContent = this.currentUser.name;
    }
  }

  updateSpeakerProfileUI() {
    if (!this.speakerProfile) {
      return;
    }

    const profileImage = document.querySelector('.profile-image');
    const profileName = document.querySelector('.profile-name');
    const totalTalks = document.querySelector('.stat-item:nth-child(1) .stat-value');
    const avgRating = document.querySelector('.stat-item:nth-child(2) .stat-value');

    if (profileImage) {
      profileImage.src = this.speakerProfile.user?.avatar || '/images/default-avatar.png';
    }

    if (profileName) {
      profileName.textContent = this.speakerProfile.user?.name || 'Unknown Speaker';
    }

    if (totalTalks) {
      totalTalks.textContent = this.speakerProfile.statistics?.totalTalks || 0;
    }

    if (avgRating) {
      avgRating.textContent = (this.speakerProfile.statistics?.averageRating || 0).toFixed(1);
    }
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

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
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === `#${sectionId}`) {
        item.classList.add('active');
      }
    });

    // Update section visibility
    document.querySelectorAll('.dashboard-section').forEach(section => {
      section.classList.remove('active');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    this.currentSection = sectionId;

    // Load section-specific data
    switch (sectionId) {
    case 'overview':
      this.loadDashboardData();
      break;
    case 'my-talks':
      this.loadMyTalks();
      break;
    case 'upcoming':
      this.loadUpcomingEvents();
      break;
    case 'feedback':
      this.loadFeedback();
      break;
    case 'resources':
      this.loadResources();
      break;
    case 'settings':
      this.loadSettings();
      break;
    }
  }

  async loadDashboardData() {
    try {
      // Load analytics
      const analyticsResponse = await fetch(`${this.apiEndpoint}/speakers/analytics`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (analyticsResponse.ok) {
        const data = await analyticsResponse.json();
        this.analytics = data.data;
        this.updateAnalyticsUI();
      }

      // Load recent talks
      const talksResponse = await fetch(
        `${this.apiEndpoint}/speakers/talks?limit=5&status=presented`,
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`
          }
        }
      );

      if (talksResponse.ok) {
        const data = await talksResponse.json();
        this.updateRecentTalks(data.data);
      }

      // Load upcoming talks
      const upcomingResponse = await fetch(
        `${this.apiEndpoint}/speakers/talks?limit=3&status=approved`,
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`
          }
        }
      );

      if (upcomingResponse.ok) {
        const data = await upcomingResponse.json();
        this.updateUpcomingTalks(data.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.showNotification('ダッシュボードデータの読み込みに失敗しました', 'error');
    }
  }

  updateAnalyticsUI() {
    if (!this.analytics) {
      return;
    }

    // Update stat cards
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers[0]) {
      statNumbers[0].textContent = this.analytics.talksByStatus?.approved || 0;
    }
    if (statNumbers[1]) {
      statNumbers[1].textContent = this.analytics.totalVotes || 0;
    }
    if (statNumbers[2]) {
      statNumbers[2].textContent = `${this.analytics.averageRating.toFixed(1)}/5.0`;
    }
    if (statNumbers[3]) {
      statNumbers[3].textContent =
        this.analytics.recentActivity?.reduce((sum, activity) => sum + activity.feedbackCount, 0) ||
        0;
    }
  }

  updateUpcomingTalks(talks) {
    const upcomingTalks = document.querySelector('.upcoming-talks');
    if (!upcomingTalks) {
      return;
    }

    const talksList = upcomingTalks.querySelector('.talk-card')?.parentElement;
    if (!talksList) {
      return;
    }

    // Clear existing talks except the template
    talksList.innerHTML = '<h3>次回の発表</h3>';

    if (talks.length === 0) {
      talksList.innerHTML += '<p class="no-talks">予定されている発表はありません</p>';
      return;
    }

    talks.forEach(talk => {
      const talkCard = document.createElement('div');
      talkCard.className = 'talk-card upcoming';
      talkCard.innerHTML = `
        <div class="talk-date">${this.formatDateTime(talk.eventDate || talk.createdAt)}</div>
        <h4 class="talk-title">${this.escapeHtml(talk.title)}</h4>
        <div class="talk-meta">
          <span class="event-name">Event ID: ${talk.eventId}</span>
          <span class="talk-duration">${talk.duration}分</span>
        </div>
        <div class="talk-actions">
          <button class="btn btn-primary" data-talk-id="${talk.id}" onclick="speakerDashboard.uploadPresentation('${talk.id}')">スライドをアップロード</button>
          <button class="btn btn-secondary" data-talk-id="${talk.id}" onclick="speakerDashboard.showPracticeTimer('${talk.id}')">練習タイマー</button>
        </div>
      `;
      talksList.appendChild(talkCard);
    });
  }

  updateRecentTalks(talks) {
    const feedbackList = document.querySelector('.feedback-list');
    if (!feedbackList) {
      return;
    }

    feedbackList.innerHTML = '';

    talks.forEach(talk => {
      if (talk.voting && talk.voting.voteCount > 0) {
        const feedbackItem = document.createElement('div');
        feedbackItem.className = 'feedback-item';
        feedbackItem.innerHTML = `
          <div class="feedback-header">
            <span class="feedback-author">${this.escapeHtml(talk.title)}</span>
            <span class="feedback-date">${this.formatDateTime(talk.createdAt)}</span>
          </div>
          <div class="feedback-rating">${this.generateStars(talk.voting.averageRating)}</div>
          <p class="feedback-text">
            投票数: ${talk.voting.voteCount}票 | 平均評価: ${talk.voting.averageRating.toFixed(1)}
          </p>
        `;
        feedbackList.appendChild(feedbackItem);
      }
    });
  }

  async loadMyTalks(filter = 'all') {
    try {
      let url = `${this.apiEndpoint}/speakers/talks?limit=50`;
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load talks');
      }

      const data = await response.json();
      this.talks = data.data;
      this.renderTalksList();
    } catch (error) {
      console.error('Error loading talks:', error);
      this.showNotification('発表の読み込みに失敗しました', 'error');
    }
  }

  renderTalksList() {
    const talksList = document.querySelector('.talks-list');
    if (!talksList) {
      return;
    }

    talksList.innerHTML = '';

    if (this.talks.length === 0) {
      talksList.innerHTML = '<p class="no-talks">発表がありません</p>';
      return;
    }

    this.talks.forEach(talk => {
      const talkItem = document.createElement('div');
      talkItem.className = 'talk-item';

      const statusClass = this.getStatusClass(talk.status);
      const statusText = this.getStatusText(talk.status);

      talkItem.innerHTML = `
        <div class="talk-status ${statusClass}">${statusText}</div>
        <div class="talk-info">
          <h4>${this.escapeHtml(talk.title)}</h4>
          <p class="talk-event">Event ID: ${talk.eventId} - ${this.formatDateTime(talk.createdAt)}</p>
          ${
  talk.tags && talk.tags.length > 0
    ? `
            <div class="talk-tags">
              ${talk.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
          `
    : ''
}
          ${
  talk.voting
    ? `
            <div class="talk-metrics">
              <span>👥 ${talk.voting.voteCount}票</span>
              <span>⭐ ${talk.voting.averageRating.toFixed(1)}評価</span>
            </div>
          `
    : ''
}
        </div>
        <div class="talk-actions">
          <button class="btn-icon" title="編集" onclick="speakerDashboard.editTalk('${talk.id}')">✏️</button>
          <button class="btn-icon" title="統計を見る" onclick="speakerDashboard.viewTalkStats('${talk.id}')">📊</button>
          <button class="btn-icon" title="フィードバック" onclick="speakerDashboard.viewFeedback('${talk.id}')">💬</button>
        </div>
      `;

      talksList.appendChild(talkItem);
    });
  }

  getStatusClass(status) {
    const statusMap = {
      draft: 'draft',
      submitted: 'upcoming',
      approved: 'upcoming',
      rejected: 'rejected',
      presented: 'past'
    };
    return statusMap[status] || 'draft';
  }

  getStatusText(status) {
    const statusMap = {
      draft: '下書き',
      submitted: '提出済み',
      approved: '承認済み',
      rejected: '却下',
      presented: '完了'
    };
    return statusMap[status] || status;
  }

  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '⭐'.repeat(fullStars);
    if (hasHalfStar) {
      stars += '⭐';
    } // Could use half-star emoji if available
    stars += '☆'.repeat(emptyStars);

    return stars;
  }

  filterTalks(filter) {
    this.loadMyTalks(filter);
  }

  showNewTalkModal() {
    // Create modal for new talk submission
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
        <h2>新規発表を作成</h2>
        <form id="newTalkForm">
          <div class="form-group">
            <label for="talkTitle">タイトル *</label>
            <input type="text" id="talkTitle" name="title" required minlength="5" maxlength="200">
          </div>
          <div class="form-group">
            <label for="talkDescription">説明 *</label>
            <textarea id="talkDescription" name="description" required minlength="20" maxlength="2000" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label for="talkAbstract">概要</label>
            <textarea id="talkAbstract" name="abstract" maxlength="500" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="talkEventId">イベントID *</label>
            <input type="text" id="talkEventId" name="eventId" required>
          </div>
          <div class="form-group">
            <label for="talkDuration">発表時間（分）</label>
            <input type="number" id="talkDuration" name="duration" min="5" max="60" value="20">
          </div>
          <div class="form-group">
            <label for="talkTags">タグ（カンマ区切り）</label>
            <input type="text" id="talkTags" name="tags" placeholder="例: プログラミング, 効率化">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">作成</button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">キャンセル</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    const form = document.getElementById('newTalkForm');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      await this.submitNewTalk(new FormData(form));
      modal.remove();
    });
  }

  async submitNewTalk(formData) {
    try {
      const tags = formData.get('tags')
        ? formData
          .get('tags')
          .split(',')
          .map(tag => tag.trim())
        : [];

      const talkData = {
        title: formData.get('title'),
        description: formData.get('description'),
        abstract: formData.get('abstract'),
        eventId: formData.get('eventId'),
        duration: parseInt(formData.get('duration')),
        tags
      };

      const response = await fetch(`${this.apiEndpoint}/speakers/talks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(talkData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create talk');
      }

      const result = await response.json();
      this.showNotification('発表が正常に作成されました', 'success');

      // Reload talks list
      if (this.currentSection === 'my-talks') {
        this.loadMyTalks();
      }
    } catch (error) {
      console.error('Error creating talk:', error);
      this.showNotification(error.message || '発表の作成に失敗しました', 'error');
    }
  }

  async editTalk(talkId) {
    // TODO: Implement talk editing modal
    console.log('Edit talk:', talkId);
    this.showNotification('編集機能は近日公開予定です', 'info');
  }

  async viewTalkStats(talkId) {
    // TODO: Implement talk statistics view
    console.log('View talk stats:', talkId);
    this.showNotification('統計機能は近日公開予定です', 'info');
  }

  async viewFeedback(talkId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/speakers/feedback/${talkId}`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load feedback');
      }

      const data = await response.json();
      this.showFeedbackModal(talkId, data.data);
    } catch (error) {
      console.error('Error loading feedback:', error);
      this.showNotification('フィードバックの読み込みに失敗しました', 'error');
    }
  }

  showFeedbackModal(talkId, feedback) {
    const modal = document.createElement('div');
    modal.className = 'modal active';

    const commentsHtml = feedback.comments
      .map(
        comment => `
      <div class="feedback-comment">
        <div class="comment-header">
          <span class="comment-type">${comment.type === 'vote' ? '投票' : 'フィードバック'}</span>
          <span class="comment-date">${this.formatDateTime(comment.createdAt)}</span>
        </div>
        ${comment.rating ? `<div class="comment-rating">評価: ${comment.rating}/5</div>` : ''}
        ${
  comment.ratings
    ? `
          <div class="detailed-ratings">
            <span>内容: ${comment.ratings.content || 'N/A'}</span>
            <span>発表: ${comment.ratings.delivery || 'N/A'}</span>
            <span>エンゲージメント: ${comment.ratings.engagement || 'N/A'}</span>
          </div>
        `
    : ''
}
        <p class="comment-text">${this.escapeHtml(comment.comment)}</p>
      </div>
    `
      )
      .join('');

    modal.innerHTML = `
      <div class="modal-content feedback-modal">
        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
        <h2>フィードバック詳細</h2>
        
        <div class="feedback-summary">
          <h3>評価サマリー</h3>
          <div class="rating-summary">
            <div class="rating-item">
              <span>内容:</span>
              <span>${feedback.averageRatings.content.toFixed(1)}/5</span>
            </div>
            <div class="rating-item">
              <span>発表:</span>
              <span>${feedback.averageRatings.delivery.toFixed(1)}/5</span>
            </div>
            <div class="rating-item">
              <span>エンゲージメント:</span>
              <span>${feedback.averageRatings.engagement.toFixed(1)}/5</span>
            </div>
          </div>
          <p>合計フィードバック数: ${feedback.totalFeedback}</p>
        </div>
        
        <div class="feedback-comments">
          <h3>コメント</h3>
          ${commentsHtml || '<p>コメントはありません</p>'}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  async uploadPresentation(talkId) {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.ppt,.pptx,.key';

    input.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) {
        return;
      }

      const formData = new FormData();
      formData.append('presentation', file);

      try {
        const response = await fetch(`${this.apiEndpoint}/speakers/talks/${talkId}/presentation`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.authToken}`
          },
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload presentation');
        }

        this.showNotification('プレゼンテーションがアップロードされました', 'success');
      } catch (error) {
        console.error('Error uploading presentation:', error);
        this.showNotification(error.message || 'アップロードに失敗しました', 'error');
      }
    });

    input.click();
  }

  setupTimer() {
    const modal = document.getElementById('practiceTimerModal');
    const closeBtn = modal?.querySelector('.close');
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const resetBtn = document.getElementById('resetTimer');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closePracticeTimer();
      });
    }

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.startTimer();
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.pauseTimer();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetTimer();
      });
    }

    window.addEventListener('click', e => {
      if (e.target === modal) {
        this.closePracticeTimer();
      }
    });
  }

  showPracticeTimer(talkId = null) {
    this.currentTalkId = talkId;
    const modal = document.getElementById('practiceTimerModal');
    if (modal) {
      modal.classList.add('active');
      this.resetTimer();
    }
  }

  closePracticeTimer() {
    const modal = document.getElementById('practiceTimerModal');
    if (modal) {
      modal.classList.remove('active');
    }
    this.pauseTimer();

    // Save practice session if there was elapsed time
    if (this.practiceElapsed > 0 && this.currentTalkId) {
      this.savePracticeSession();
    }
  }

  startTimer() {
    if (this.isTimerRunning) {
      return;
    }

    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');

    if (startBtn) {
      startBtn.disabled = true;
    }
    if (pauseBtn) {
      pauseBtn.disabled = false;
    }

    this.isTimerRunning = true;
    this.practiceStartTime = Date.now();

    this.timer = setInterval(() => {
      this.timerRemaining--;
      const elapsed = this.practiceElapsed + (Date.now() - this.practiceStartTime);
      this.updateTimerDisplay();

      if (this.timerRemaining <= 0) {
        this.timerComplete();
      }
    }, 1000);
  }

  pauseTimer() {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
    this.isTimerRunning = false;

    if (this.practiceStartTime) {
      this.practiceElapsed += Date.now() - this.practiceStartTime;
    }

    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');

    if (startBtn) {
      startBtn.disabled = false;
    }
    if (pauseBtn) {
      pauseBtn.disabled = true;
    }
  }

  resetTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.isTimerRunning = false;
    this.timerRemaining = this.timerDuration;
    this.practiceElapsed = 0;
    this.practiceStartTime = null;
    this.updateTimerDisplay();

    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');

    if (startBtn) {
      startBtn.disabled = false;
    }
    if (pauseBtn) {
      pauseBtn.disabled = true;
    }
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
    this.showNotification('時間終了です！お疲れ様でした！', 'success');

    // Play sound if available
    const audio = new Audio('/sounds/timer-end.mp3');
    audio.play().catch(() => {
      // Ignore audio play errors
    });

    // Save practice session
    if (this.currentTalkId) {
      this.savePracticeSession();
    }
  }

  async savePracticeSession() {
    if (!this.currentTalkId || !this.practiceElapsed) {
      return;
    }

    try {
      const duration = Math.floor(this.practiceElapsed / 1000);

      const response = await fetch(`${this.apiEndpoint}/speakers/practice-timer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          talkId: this.currentTalkId,
          duration,
          notes: ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save practice session');
      }

      this.showNotification('練習セッションが保存されました', 'success');
    } catch (error) {
      console.error('Error saving practice session:', error);
    }
  }

  setupEventListeners() {
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
    }

    // New talk button
    const newTalkBtn = document.querySelector('.btn-primary');
    if (newTalkBtn && newTalkBtn.textContent.includes('新規発表を作成')) {
      newTalkBtn.addEventListener('click', () => this.showNewTalkModal());
    }

    // Filter select
    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect) {
      filterSelect.addEventListener('change', e => this.filterTalks(e.target.value));
    }

    // Practice timer buttons
    const practiceTimerBtns = document.querySelectorAll('.btn-secondary');
    practiceTimerBtns.forEach(btn => {
      if (btn.textContent.includes('練習タイマー')) {
        btn.addEventListener('click', () => this.showPracticeTimer());
      }
    });
  }

  subscribeToUpdates() {
    // Subscribe to real-time updates if WebSocket is available
    if (window.WebSocket && window.socketService) {
      window.socketService.on('talk:updated', data => {
        if (this.currentSection === 'my-talks') {
          this.loadMyTalks();
        }
      });

      window.socketService.on('vote:submitted', data => {
        // Update vote counts in real-time
        const talk = this.talks.find(t => t.id === data.talkId);
        if (talk && talk.voting) {
          talk.voting.voteCount = data.voteCount;
          talk.voting.averageRating = data.averageRating;
          this.renderTalksList();
        }
      });
    }
  }

  toggleMobileMenu() {
    const nav = document.querySelector('.nav-links');
    if (nav) {
      nav.classList.toggle('active');
    }
  }

  async handleLogout() {
    try {
      await fetch(`${this.apiEndpoint}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  formatDateTime(dateString) {
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('ja-JP', options);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Placeholder methods for future implementation
  async loadUpcomingEvents() {
    // TODO: Load speaker's upcoming events
    console.log('Loading upcoming events...');
  }

  async loadFeedback() {
    // TODO: Load all feedback for speaker
    console.log('Loading feedback...');
  }

  async loadResources() {
    // TODO: Load speaker resources
    console.log('Loading resources...');
  }

  async loadSettings() {
    // TODO: Load speaker settings
    console.log('Loading settings...');
  }
}

// Initialize dashboard when DOM is ready
window.speakerDashboard = null;

document.addEventListener('DOMContentLoaded', () => {
  window.speakerDashboard = new SpeakerDashboard();
});

// Export for module usage
export default SpeakerDashboard;
