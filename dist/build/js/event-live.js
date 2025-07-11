/**
 * Event Live Screen JavaScript
 * ライブイベント画面の機能実装
 */

class EventLiveManager {
  constructor() {
    this.socket = null;
    this.currentSessionId = null;
    this.eventId = new URLSearchParams(window.location.search).get('eventId') || 'event-123';
    this.hasVoted = false;
    this.viewerCount = 0;
    this.currentTime = 0;
    this.timerInterval = null;

    this.init();
  }

  init() {
    this.setupWebSocket();
    this.setupEventListeners();
    this.loadEventData();
    this.startTimer();
  }

  setupWebSocket() {
    // In production, this would connect to a real WebSocket server
    if (typeof io !== 'undefined') {
      this.socket = io();

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        this.socket.emit('join-event', { eventId: this.eventId });
      });

      this.socket.on('viewer-count', count => {
        this.updateViewerCount(count);
      });

      this.socket.on('reaction', data => {
        this.showFloatingReaction(data.emoji);
      });

      this.socket.on('voting-started', data => {
        this.showVotingSection(data.sessionId);
      });

      this.socket.on('voting-ended', data => {
        this.showVotingResults(data.results);
      });

      this.socket.on('new-question', question => {
        this.addQuestion(question);
      });

      this.socket.on('talk-changed', data => {
        this.updateCurrentTalk(data);
      });
    }
  }

  setupEventListeners() {
    // Reaction buttons
    document.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const emoji = e.currentTarget.querySelector('.emoji').textContent;
        this.sendReaction(emoji);
      });
    });

    // Vote buttons
    document.querySelectorAll('.vote-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const rating = parseInt(e.currentTarget.getAttribute('onclick').match(/\d/)[0]);
        this.submitVote(rating);
      });
    });

    // Question submission
    const submitBtn = document.querySelector('.btn-primary[onclick="submitQuestion()"]');
    if (submitBtn) {
      submitBtn.removeAttribute('onclick');
      submitBtn.addEventListener('click', () => this.submitQuestion());
    }

    // Question upvoting
    document.addEventListener('click', e => {
      if (e.target.closest('.upvote-btn')) {
        this.upvoteQuestion(e.target.closest('.upvote-btn'));
      }
    });

    // Share button
    const shareBtn = document.querySelector('.btn-share');
    if (shareBtn) {
      shareBtn.removeAttribute('onclick');
      shareBtn.addEventListener('click', () => this.shareEvent());
    }

    // Admin controls
    if (document.getElementById('adminControls')) {
      this.setupAdminControls();
    }
  }

  async loadEventData() {
    try {
      // Load current event data
      const response = await fetch(`/api/events/${this.eventId}/live`);
      if (response.ok) {
        const data = await response.json();
        this.updateEventInfo(data);
      }
    } catch (error) {
      console.error('Failed to load event data:', error);
    }
  }

  updateEventInfo(data) {
    // Update current talk
    if (data.currentTalk) {
      document.querySelector('.current-talk-title').textContent = data.currentTalk.title;
      document.querySelector('.speaker-name').textContent = data.currentTalk.speaker;
      document.querySelector('.talk-category').textContent =
        `${data.currentTalk.categoryEmoji} ${data.currentTalk.category}`;
    }

    // Update viewer count
    this.updateViewerCount(data.viewerCount || 0);

    // Update program status
    this.updateProgramStatus(data.program);
  }

  updateViewerCount(count) {
    this.viewerCount = count;
    document.getElementById('viewerCount').textContent = count;
  }

  sendReaction(emoji) {
    // Update local count
    const btn = document.querySelector(`.reaction-btn:has(.emoji:contains("${emoji}"))`);
    const countEl = btn.querySelector('.count');
    const currentCount = parseInt(countEl.textContent);
    countEl.textContent = currentCount + 1;

    // Show floating reaction locally
    this.showFloatingReaction(emoji);

    // Send to server
    if (this.socket) {
      this.socket.emit('reaction', { eventId: this.eventId, emoji });
    }
  }

  showFloatingReaction(emoji) {
    const container = document.getElementById('floatingReactions');
    const reaction = document.createElement('div');
    reaction.className = 'floating-reaction';
    reaction.textContent = emoji;

    // Random horizontal position
    reaction.style.left = `${Math.random() * 80 + 10}%`;

    container.appendChild(reaction);

    // Animate upward
    reaction.style.animation = 'floatUp 3s ease-out forwards';

    // Remove after animation
    setTimeout(() => {
      reaction.remove();
    }, 3000);
  }

  async submitVote(rating) {
    if (this.hasVoted || !this.currentSessionId) return;

    try {
      const response = await fetch(`/api/voting/sessions/${this.currentSessionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating })
      });

      if (response.ok) {
        const data = await response.json();
        this.hasVoted = true;
        this.showVotingResults(data.results);

        // Disable vote buttons
        document.querySelectorAll('.vote-btn').forEach(btn => {
          btn.disabled = true;
        });
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
  }

  showVotingSection(sessionId) {
    this.currentSessionId = sessionId;
    this.hasVoted = false;

    const votingSection = document.getElementById('votingSection');
    const voteResults = document.getElementById('voteResults');

    votingSection.style.display = 'block';
    voteResults.style.display = 'none';

    // Enable vote buttons
    document.querySelectorAll('.vote-btn').forEach(btn => {
      btn.disabled = false;
    });
  }

  showVotingResults(results) {
    const votingOptions = document.querySelector('.voting-options');
    const voteResults = document.getElementById('voteResults');

    votingOptions.style.display = 'none';
    voteResults.style.display = 'block';

    // Update result bars
    if (results.percentages) {
      for (let rating = 1; rating <= 5; rating++) {
        const bar = voteResults.querySelector(`.result-bar:nth-child(${6 - rating}) .fill`);
        const percentage = voteResults.querySelector(
          `.result-bar:nth-child(${6 - rating}) .percentage`
        );

        if (bar && percentage) {
          bar.style.width = results.percentages[rating] + '%';
          percentage.textContent = results.percentages[rating] + '%';
        }
      }
    }
  }

  async submitQuestion() {
    const input = document.getElementById('questionInput');
    const question = input.value.trim();

    if (!question) return;

    try {
      const response = await fetch(`/api/events/${this.eventId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });

      if (response.ok) {
        const data = await response.json();
        this.addQuestion(data.question);
        input.value = '';
      }
    } catch (error) {
      console.error('Failed to submit question:', error);
      // Still add locally for demo
      this.addQuestion({
        id: Date.now(),
        author: '匿名',
        text: question,
        timestamp: new Date(),
        votes: 0
      });
      input.value = '';
    }
  }

  addQuestion(question) {
    const qaList = document.querySelector('.qa-list');
    const qaItem = document.createElement('div');
    qaItem.className = 'qa-item';
    qaItem.dataset.questionId = question.id;

    const timeAgo = this.getTimeAgo(new Date(question.timestamp));

    qaItem.innerHTML = `
      <div class="qa-header">
        <span class="qa-author">${this.escapeHtml(question.author || '匿名')}</span>
        <span class="qa-time">${timeAgo}</span>
      </div>
      <p class="qa-text">${this.escapeHtml(question.text)}</p>
      <div class="qa-actions">
        <button class="upvote-btn">
          👍 <span class="vote-count">${question.votes || 0}</span>
        </button>
      </div>
    `;

    // Insert at the beginning of the list
    qaList.insertBefore(qaItem, qaList.firstChild);
  }

  async upvoteQuestion(btn) {
    const qaItem = btn.closest('.qa-item');
    const questionId = qaItem.dataset.questionId;
    const voteCount = btn.querySelector('.vote-count');

    try {
      const response = await fetch(`/api/events/${this.eventId}/questions/${questionId}/upvote`, {
        method: 'POST'
      });

      if (response.ok) {
        const currentVotes = parseInt(voteCount.textContent);
        voteCount.textContent = currentVotes + 1;
        btn.disabled = true;
      }
    } catch (error) {
      console.error('Failed to upvote question:', error);
      // Still update locally for demo
      const currentVotes = parseInt(voteCount.textContent);
      voteCount.textContent = currentVotes + 1;
      btn.disabled = true;
    }
  }

  shareEvent() {
    const url = window.location.href;
    const title = document.querySelector('.current-talk-title').textContent;

    if (navigator.share) {
      navigator
        .share({
          title: `なんでもLT - ${title}`,
          text: '現在ライブ配信中！',
          url: url
        })
        .catch(err => console.log('Share cancelled'));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        alert('イベントURLをコピーしました！');
      });
    }
  }

  setupAdminControls() {
    const nextBtn = document.querySelector('button[onclick="nextTalk()"]');
    const pauseBtn = document.querySelector('button[onclick="pauseTimer()"]');
    const endBtn = document.querySelector('button[onclick="endEvent()"]');

    if (nextBtn) {
      nextBtn.removeAttribute('onclick');
      nextBtn.addEventListener('click', () => this.nextTalk());
    }

    if (pauseBtn) {
      pauseBtn.removeAttribute('onclick');
      pauseBtn.addEventListener('click', () => this.pauseTimer());
    }

    if (endBtn) {
      endBtn.removeAttribute('onclick');
      endBtn.addEventListener('click', () => this.endEvent());
    }
  }

  async nextTalk() {
    if (confirm('次の発表に進みますか？')) {
      try {
        await fetch(`/api/events/${this.eventId}/next-talk`, { method: 'POST' });
      } catch (error) {
        console.error('Failed to advance to next talk:', error);
      }
    }
  }

  pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      document.querySelector('.admin-btn:has-text("一時停止")').textContent = '▶️ 再開';
    } else {
      this.startTimer();
      document.querySelector('.admin-btn:has-text("再開")').textContent = '⏸️ 一時停止';
    }
  }

  async endEvent() {
    if (confirm('本当にイベントを終了しますか？')) {
      try {
        await fetch(`/api/events/${this.eventId}/end`, { method: 'POST' });
        window.location.href = '/';
      } catch (error) {
        console.error('Failed to end event:', error);
      }
    }
  }

  startTimer() {
    // Simulate a 5-minute timer
    const duration = 5 * 60; // 5 minutes in seconds
    let elapsed = 252; // Start at 4:12 as shown in the HTML

    this.timerInterval = setInterval(() => {
      elapsed++;
      this.updateTimer(elapsed, duration);

      if (elapsed >= duration) {
        clearInterval(this.timerInterval);
        this.onTimerComplete();
      }
    }, 1000);
  }

  updateTimer(elapsed, duration) {
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    document.getElementById('currentTime').textContent =
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update progress circle
    const progress = elapsed / duration;
    const circumference = 2 * Math.PI * 90; // radius = 90
    const offset = circumference * (1 - progress);

    const progressCircle = document.querySelector('.timer-progress');
    progressCircle.style.strokeDashoffset = offset;

    // Update segment highlighting
    const segments = document.querySelectorAll('.time-segments .segment');
    segments.forEach(s => s.classList.remove('active'));

    if (elapsed < 30) {
      segments[0].classList.add('active'); // Introduction
    } else if (elapsed < 240) {
      segments[1].classList.add('active'); // Main content
    } else {
      segments[2].classList.add('active'); // Conclusion
    }
  }

  onTimerComplete() {
    // Show notification or alert
    console.log('Talk time completed');
  }

  updateProgramStatus(program) {
    if (!program) return;

    // Update program items status
    program.forEach((item, index) => {
      const programItem = document.querySelector(`.program-item:nth-child(${index + 1})`);
      if (!programItem) return;

      programItem.className = `program-item ${item.status}`;

      if (item.status === 'current') {
        programItem.querySelector('.status').textContent = '▶️';
      } else if (item.status === 'completed') {
        programItem.querySelector('.status').textContent = '✅';
      }
    });
  }

  getTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return '今';
    if (diff < 3600) return Math.floor(diff / 60) + '分前';
    if (diff < 86400) return Math.floor(diff / 3600) + '時間前';
    return Math.floor(diff / 86400) + '日前';
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

  updateCurrentTalk(data) {
    // Update UI with new talk information
    document.querySelector('.current-talk-title').textContent = data.title;
    document.querySelector('.speaker-name').textContent = data.speaker;
    document.querySelector('.talk-category').textContent = `${data.categoryEmoji} ${data.category}`;

    // Reset timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.currentTime = 0;
    this.startTimer();

    // Update program status
    this.updateProgramStatus(data.program);
  }
}

// Add CSS for floating reactions
const style = document.createElement('style');
style.textContent = `
  .floating-reaction {
    position: absolute;
    bottom: 0;
    font-size: 2rem;
    animation: floatUp 3s ease-out forwards;
    pointer-events: none;
    z-index: 1000;
  }
  
  @keyframes floatUp {
    0% {
      transform: translateY(0) scale(0.5);
      opacity: 0;
    }
    10% {
      transform: translateY(-20px) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(-300px) scale(1.2);
      opacity: 0;
    }
  }
  
  .vote-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .upvote-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.eventLiveManager = new EventLiveManager();
});

// Remove inline event handlers
window.sendReaction = undefined;
window.vote = undefined;
window.submitQuestion = undefined;
window.upvoteQuestion = undefined;
window.shareEvent = undefined;
window.nextTalk = undefined;
window.pauseTimer = undefined;
window.endEvent = undefined;
