/**
 * Q&A System v1
 * Question submission and moderation system for events
 */

class QASystem {
  constructor() {
    this.apiEndpoint = window.API_CONFIG?.apiEndpoint || '/api';
    this.authToken = localStorage.getItem('authToken');
    this.currentEventId = null;
    this.questions = [];
    this.isAdmin = false;
    this.websocketService = null;
    this.questionUpdateInterval = null;

    this.init();
  }

  async init() {
    // Initialize WebSocket connection
    this.initializeWebSocket();

    // Setup event listeners
    this.setupEventListeners();

    // Load initial data
    await this.loadEventQuestions();

    // Start periodic updates
    this.startQuestionUpdates();
  }

  initializeWebSocket() {
    if (window.socketService) {
      this.websocketService = window.socketService;

      // Subscribe to Q&A events
      this.websocketService.on('questionSubmitted', data => {
        this.handleNewQuestion(data);
      });

      this.websocketService.on('questionApproved', data => {
        this.handleQuestionApproval(data);
      });

      this.websocketService.on('questionAnswered', data => {
        this.handleQuestionAnswered(data);
      });
    }
  }

  setupEventListeners() {
    // Question submission form
    const submitQuestionBtn = document.getElementById('submitQuestionBtn');
    if (submitQuestionBtn) {
      submitQuestionBtn.addEventListener('click', () => this.showSubmitQuestionModal());
    }

    // Event selector
    const eventSelector = document.getElementById('qaEventSelector');
    if (eventSelector) {
      eventSelector.addEventListener('change', e => {
        this.currentEventId = e.target.value;
        this.loadEventQuestions();
      });
    }

    // Question actions
    document.addEventListener('click', e => {
      if (e.target.classList.contains('upvote-question-btn')) {
        const { questionId } = e.target.dataset;
        this.upvoteQuestion(questionId);
      }

      if (e.target.classList.contains('approve-question-btn')) {
        const { questionId } = e.target.dataset;
        this.approveQuestion(questionId);
      }

      if (e.target.classList.contains('answer-question-btn')) {
        const { questionId } = e.target.dataset;
        this.showAnswerModal(questionId);
      }

      if (e.target.classList.contains('delete-question-btn')) {
        const { questionId } = e.target.dataset;
        this.deleteQuestion(questionId);
      }
    });

    // Filter buttons
    document.addEventListener('click', e => {
      if (e.target.classList.contains('filter-questions-btn')) {
        const { filter } = e.target.dataset;
        this.filterQuestions(filter);
      }
    });
  }

  async loadEventQuestions() {
    if (!this.currentEventId) {
      return;
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/qa/events/${this.currentEventId}`, {
        headers: this.authToken
          ? {
              Authorization: `Bearer ${this.authToken}`
            }
          : {}
      });

      if (!response.ok) {
        throw new Error('Failed to load questions');
      }

      const data = await response.json();
      this.questions = data.data || [];
      this.renderQuestions();
    } catch (error) {
      console.error('Error loading questions:', error);
      this.showNotification('質問の読み込みに失敗しました', 'error');
    }
  }

  renderQuestions() {
    const questionsContainer = document.getElementById('questionsContainer');
    if (!questionsContainer) {
      return;
    }

    questionsContainer.innerHTML = '';

    if (this.questions.length === 0) {
      questionsContainer.innerHTML = `
        <div class="no-questions">
          <h3>まだ質問がありません</h3>
          <p>最初の質問を投稿してみましょう！</p>
        </div>
      `;
      return;
    }

    // Sort questions by votes and submission time
    const sortedQuestions = [...this.questions].sort((a, b) => {
      if (a.status === 'approved' && b.status !== 'approved') {
        return -1;
      }
      if (b.status === 'approved' && a.status !== 'approved') {
        return 1;
      }
      if (a.votes !== b.votes) {
        return b.votes - a.votes;
      }
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    });

    sortedQuestions.forEach(question => {
      const questionCard = this.createQuestionCard(question);
      questionsContainer.appendChild(questionCard);
    });
  }

  createQuestionCard(question) {
    const questionCard = document.createElement('div');
    questionCard.className = `question-card ${question.status}`;
    questionCard.dataset.questionId = question.id;

    const statusText = this.getStatusText(question.status);
    const canUpvote = question.status === 'pending' || question.status === 'approved';
    const canModerate = this.isAdmin && question.status === 'pending';

    questionCard.innerHTML = `
      <div class="question-header">
        <div class="question-status ${question.status}">${statusText}</div>
        <div class="question-meta">
          <span class="question-time">${this.formatDateTime(question.submittedAt)}</span>
          ${question.category ? `<span class="question-category">${this.escapeHtml(question.category)}</span>` : ''}
        </div>
      </div>
      
      <div class="question-content">
        <h3 class="question-text">${this.escapeHtml(question.question)}</h3>
        ${question.details ? `<p class="question-details">${this.escapeHtml(question.details)}</p>` : ''}
        
        ${
          question.answer
            ? `
          <div class="question-answer">
            <h4>回答</h4>
            <p>${this.escapeHtml(question.answer)}</p>
            ${question.answeredAt ? `<span class="answer-time">回答日時: ${this.formatDateTime(question.answeredAt)}</span>` : ''}
          </div>
        `
            : ''
        }
      </div>
      
      <div class="question-footer">
        <div class="question-stats">
          <span class="vote-count">👍 ${question.votes}票</span>
          ${question.submitterName ? `<span class="submitter">質問者: ${this.escapeHtml(question.submitterName)}</span>` : ''}
        </div>
        
        <div class="question-actions">
          ${
            canUpvote
              ? `
            <button class="btn btn-outline upvote-question-btn" data-question-id="${question.id}">
              👍 投票
            </button>
          `
              : ''
          }
          
          ${
            canModerate
              ? `
            <button class="btn btn-success approve-question-btn" data-question-id="${question.id}">
              ✅ 承認
            </button>
          `
              : ''
          }
          
          ${
            this.isAdmin && question.status === 'approved' && !question.answer
              ? `
            <button class="btn btn-primary answer-question-btn" data-question-id="${question.id}">
              💬 回答
            </button>
          `
              : ''
          }
          
          ${
            this.isAdmin
              ? `
            <button class="btn btn-danger delete-question-btn" data-question-id="${question.id}">
              🗑️ 削除
            </button>
          `
              : ''
          }
        </div>
      </div>
    `;

    return questionCard;
  }

  showSubmitQuestionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content question-submission-modal">
        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
        <h2>質問を投稿</h2>
        
        <form id="submitQuestionForm">
          <div class="form-group">
            <label for="questionText">質問内容 *</label>
            <textarea id="questionText" required maxlength="500" rows="3"
                      placeholder="スピーカーに聞きたいことを入力してください"></textarea>
            <div class="character-count">0/500文字</div>
          </div>
          
          <div class="form-group">
            <label for="questionDetails">詳細（任意）</label>
            <textarea id="questionDetails" maxlength="1000" rows="3"
                      placeholder="質問の背景や詳細があれば入力してください"></textarea>
            <div class="character-count">0/1000文字</div>
          </div>
          
          <div class="form-group">
            <label for="questionCategory">カテゴリー</label>
            <select id="questionCategory">
              <option value="">カテゴリーを選択...</option>
              <option value="技術">技術</option>
              <option value="キャリア">キャリア</option>
              <option value="学習">学習</option>
              <option value="ツール">ツール・環境</option>
              <option value="その他">その他</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="submitterName">お名前（任意）</label>
            <input type="text" id="submitterName" maxlength="50" 
                   placeholder="匿名で投稿する場合は空欄にしてください">
          </div>
          
          <div class="submission-notes">
            <h4>📝 投稿について</h4>
            <ul>
              <li>質問は投稿後にモデレーションが行われます</li>
              <li>承認された質問はイベント中に回答される可能性があります</li>
              <li>他の参加者が投票できるようになります</li>
              <li>不適切な内容は削除される場合があります</li>
            </ul>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">質問を投稿</button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
              キャンセル
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup character counters
    this.setupCharacterCounters(modal);

    // Handle form submission
    const form = modal.querySelector('#submitQuestionForm');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      await this.submitQuestion(new FormData(form));
      modal.remove();
    });
  }

  setupCharacterCounters(modal) {
    const textareas = modal.querySelectorAll('textarea[maxlength]');
    textareas.forEach(textarea => {
      const counter = textarea.parentElement.querySelector('.character-count');

      textarea.addEventListener('input', () => {
        const current = textarea.value.length;
        const max = textarea.maxLength;
        counter.textContent = `${current}/${max}文字`;

        if (current > max * 0.9) {
          counter.style.color = 'var(--warning, #f39c12)';
        } else {
          counter.style.color = 'var(--text-secondary, #7f8c8d)';
        }
      });
    });
  }

  async submitQuestion(formData) {
    try {
      const questionData = {
        eventId: this.currentEventId,
        question: formData.get('questionText'),
        details: formData.get('questionDetails') || '',
        category: formData.get('questionCategory') || '',
        submitterName: formData.get('submitterName') || ''
      };

      const response = await fetch(`${this.apiEndpoint}/qa/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` })
        },
        body: JSON.stringify(questionData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit question');
      }

      this.showNotification('質問を投稿しました！モデレーション後に表示されます。', 'success');
      await this.loadEventQuestions();
    } catch (error) {
      console.error('Error submitting question:', error);
      this.showNotification(error.message || '質問の投稿に失敗しました', 'error');
    }
  }

  async upvoteQuestion(questionId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/qa/questions/${questionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` })
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to vote');
      }

      this.showNotification('投票しました！', 'success');
      await this.loadEventQuestions();
    } catch (error) {
      console.error('Error voting on question:', error);
      this.showNotification(error.message || '投票に失敗しました', 'error');
    }
  }

  async approveQuestion(questionId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/qa/questions/${questionId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve question');
      }

      this.showNotification('質問を承認しました', 'success');
      await this.loadEventQuestions();
    } catch (error) {
      console.error('Error approving question:', error);
      this.showNotification(error.message || '質問の承認に失敗しました', 'error');
    }
  }

  showAnswerModal(questionId) {
    const question = this.questions.find(q => q.id === questionId);
    if (!question) {
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content answer-modal">
        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
        <h2>質問に回答</h2>
        
        <div class="question-preview">
          <h3>質問</h3>
          <p>${this.escapeHtml(question.question)}</p>
          ${question.details ? `<p class="question-details">${this.escapeHtml(question.details)}</p>` : ''}
        </div>
        
        <form id="answerQuestionForm">
          <div class="form-group">
            <label for="answerText">回答 *</label>
            <textarea id="answerText" required maxlength="2000" rows="5"
                      placeholder="質問への回答を入力してください"></textarea>
            <div class="character-count">0/2000文字</div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">回答を投稿</button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
              キャンセル
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup character counter
    this.setupCharacterCounters(modal);

    // Handle form submission
    const form = modal.querySelector('#answerQuestionForm');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      await this.answerQuestion(questionId, new FormData(form));
      modal.remove();
    });
  }

  async answerQuestion(questionId, formData) {
    try {
      const answerData = {
        answer: formData.get('answerText')
      };

      const response = await fetch(`${this.apiEndpoint}/qa/questions/${questionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify(answerData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to answer question');
      }

      this.showNotification('回答を投稿しました', 'success');
      await this.loadEventQuestions();
    } catch (error) {
      console.error('Error answering question:', error);
      this.showNotification(error.message || '回答の投稿に失敗しました', 'error');
    }
  }

  async deleteQuestion(questionId) {
    if (!confirm('この質問を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/qa/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete question');
      }

      this.showNotification('質問を削除しました', 'success');
      await this.loadEventQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      this.showNotification(error.message || '質問の削除に失敗しました', 'error');
    }
  }

  filterQuestions(filter) {
    // Update active filter button
    document.querySelectorAll('.filter-questions-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.filter === filter) {
        btn.classList.add('active');
      }
    });

    // Filter and re-render questions
    let filteredQuestions;
    switch (filter) {
      case 'all':
        filteredQuestions = this.questions;
        break;
      case 'pending':
        filteredQuestions = this.questions.filter(q => q.status === 'pending');
        break;
      case 'approved':
        filteredQuestions = this.questions.filter(q => q.status === 'approved');
        break;
      case 'answered':
        filteredQuestions = this.questions.filter(q => q.answer);
        break;
      default:
        filteredQuestions = this.questions;
    }

    // Temporarily replace questions for rendering
    const originalQuestions = this.questions;
    this.questions = filteredQuestions;
    this.renderQuestions();
    this.questions = originalQuestions;
  }

  // WebSocket event handlers
  handleNewQuestion(data) {
    if (data.eventId === this.currentEventId) {
      this.showNotification('新しい質問が投稿されました', 'info');
      this.loadEventQuestions();
    }
  }

  handleQuestionApproval(data) {
    if (data.eventId === this.currentEventId) {
      this.showNotification('質問が承認されました', 'info');
      this.loadEventQuestions();
    }
  }

  handleQuestionAnswered(data) {
    if (data.eventId === this.currentEventId) {
      this.showNotification('質問に回答が投稿されました', 'info');
      this.loadEventQuestions();
    }
  }

  // Utility functions
  getStatusText(status) {
    const statusMap = {
      pending: '保留中',
      approved: '承認済み',
      rejected: '却下',
      answered: '回答済み'
    };
    return statusMap[status] || status;
  }

  startQuestionUpdates() {
    // Update questions every 30 seconds
    this.questionUpdateInterval = setInterval(() => {
      if (this.currentEventId) {
        this.loadEventQuestions();
      }
    }, 30000);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Cleanup
  destroy() {
    if (this.questionUpdateInterval) {
      clearInterval(this.questionUpdateInterval);
    }

    if (this.websocketService) {
      this.websocketService.off('questionSubmitted');
      this.websocketService.off('questionApproved');
      this.websocketService.off('questionAnswered');
    }
  }
}

// Initialize Q&A system when DOM is ready
let qaSystem = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on a page that uses Q&A
  if (document.getElementById('questionsContainer') || document.querySelector('.qa-section')) {
    qaSystem = new QASystem();
    window.qaSystem = qaSystem;
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (qaSystem) {
    qaSystem.destroy();
  }
});

export default QASystem;
