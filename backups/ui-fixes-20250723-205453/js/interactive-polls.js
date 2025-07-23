/**
 * Interactive Polls & Feedback System v1
 * Real-time polling, Q&A, and enhanced feedback collection system
 */

class InteractivePollsSystem {
  constructor() {
    this.apiEndpoint = window.API_CONFIG?.apiEndpoint || '/api';
    this.authToken = localStorage.getItem('authToken');
    this.currentEventId = null;
    this.currentPoll = null;
    this.polls = [];
    this.isAdmin = false;
    this.websocketService = null;
    this.pollUpdateInterval = null;
    this.activeParticipation = new Map(); // Track user participation

    this.init();
  }

  async init() {
    // Initialize WebSocket connection for real-time updates
    this.initializeWebSocket();

    // Setup event listeners
    this.setupEventListeners();

    // Load initial data
    await this.loadEventPolls();

    // Start periodic updates for active polls
    this.startPollUpdates();
  }

  initializeWebSocket() {
    if (window.socketService) {
      this.websocketService = window.socketService;

      // Subscribe to poll events
      this.websocketService.on('pollStarted', data => {
        this.handlePollStarted(data);
      });

      this.websocketService.on('pollEnded', data => {
        this.handlePollEnded(data);
      });

      this.websocketService.on('pollResponse', data => {
        this.handleNewResponse(data);
      });
    }
  }

  setupEventListeners() {
    // Create poll button
    const createPollBtn = document.getElementById('createPollBtn');
    if (createPollBtn) {
      createPollBtn.addEventListener('click', () => this.showCreatePollModal());
    }

    // Poll type selector
    document.addEventListener('change', e => {
      if (e.target.id === 'pollType') {
        this.updatePollOptionsUI(e.target.value);
      }
    });

    // Response submission
    document.addEventListener('click', e => {
      if (e.target.classList.contains('submit-response-btn')) {
        const { pollId } = e.target.dataset;
        this.submitResponse(pollId);
      }

      if (e.target.classList.contains('start-poll-btn')) {
        const { pollId } = e.target.dataset;
        this.startPoll(pollId);
      }

      if (e.target.classList.contains('end-poll-btn')) {
        const { pollId } = e.target.dataset;
        this.endPoll(pollId);
      }

      if (e.target.classList.contains('view-results-btn')) {
        const { pollId } = e.target.dataset;
        this.viewResults(pollId);
      }
    });

    // Event selector change
    const eventSelector = document.getElementById('eventSelector');
    if (eventSelector) {
      eventSelector.addEventListener('change', e => {
        this.currentEventId = e.target.value;
        this.loadEventPolls();
      });
    }
  }

  async loadEventPolls() {
    if (!this.currentEventId) {
      return;
    }

    try {
      const response = await fetch(
        `${this.apiEndpoint}/polls/events/${this.currentEventId}?includeResults=true`,
        {
          headers: this.authToken
            ? {
                Authorization: `Bearer ${this.authToken}`
              }
            : {}
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load polls');
      }

      const data = await response.json();
      this.polls = data.data || [];
      this.renderPolls();
    } catch (error) {
      console.error('Error loading polls:', error);
      this.showNotification('投票の読み込みに失敗しました', 'error');
    }
  }

  renderPolls() {
    const pollsContainer = document.getElementById('pollsContainer');
    if (!pollsContainer) {
      return;
    }

    pollsContainer.innerHTML = '';

    if (this.polls.length === 0) {
      pollsContainer.innerHTML = `
        <div class="no-polls">
          <h3>投票はまだありません</h3>
          <p>イベント主催者が投票を作成すると、ここに表示されます。</p>
        </div>
      `;
      return;
    }

    this.polls.forEach(poll => {
      const pollCard = this.createPollCard(poll);
      pollsContainer.appendChild(pollCard);
    });
  }

  createPollCard(poll) {
    const pollCard = document.createElement('div');
    pollCard.className = `poll-card ${poll.status}`;
    pollCard.dataset.pollId = poll.id;

    const statusText = this.getStatusText(poll.status);
    const canParticipate = poll.status === 'active' && !poll.hasResponded;
    const canViewResults = this.canViewResults(poll);

    pollCard.innerHTML = `
      <div class="poll-header">
        <div class="poll-status ${poll.status}">${statusText}</div>
        <div class="poll-meta">
          <span class="poll-type">${this.getPollTypeText(poll.type)}</span>
          ${poll.settings.duration ? `<span class="poll-duration">${poll.settings.duration}秒</span>` : ''}
        </div>
      </div>
      
      <div class="poll-content">
        <h3 class="poll-title">${this.escapeHtml(poll.title)}</h3>
        ${poll.description ? `<p class="poll-description">${this.escapeHtml(poll.description)}</p>` : ''}
        
        ${this.renderPollInterface(poll, canParticipate)}
        
        ${canViewResults ? this.renderPollResults(poll) : ''}
        
        <div class="poll-stats">
          <span>📊 ${poll.totalResponses || 0}件の回答</span>
          ${poll.statistics?.uniqueParticipants ? `<span>👥 ${poll.statistics.uniqueParticipants}人が参加</span>` : ''}
        </div>
      </div>
      
      <div class="poll-actions">
        ${this.renderPollActions(poll, canParticipate, canViewResults)}
      </div>
    `;

    return pollCard;
  }

  renderPollInterface(poll, canParticipate) {
    if (!canParticipate && poll.status !== 'active') {
      return '';
    }

    switch (poll.type) {
      case 'multiple_choice':
        return this.renderMultipleChoice(poll);
      case 'rating_scale':
        return this.renderRatingScale(poll);
      case 'text_input':
        return this.renderTextInput(poll);
      case 'yes_no':
        return this.renderYesNo(poll);
      case 'ranking':
        return this.renderRanking(poll);
      default:
        return '';
    }
  }

  renderMultipleChoice(poll) {
    const inputType = poll.settings.multipleAnswers ? 'checkbox' : 'radio';
    const inputName = `poll_${poll.id}`;

    return `
      <div class="poll-interface multiple-choice">
        <div class="poll-options">
          ${poll.options
            .map(
              (option, index) => `
            <label class="poll-option">
              <input type="${inputType}" name="${inputName}" value="${this.escapeHtml(option)}" data-index="${index}">
              <span class="option-text">${this.escapeHtml(option)}</span>
            </label>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  renderRatingScale(poll) {
    return `
      <div class="poll-interface rating-scale">
        <div class="rating-options">
          ${[1, 2, 3, 4, 5]
            .map(
              rating => `
            <label class="rating-option">
              <input type="radio" name="poll_${poll.id}" value="${rating}">
              <span class="rating-star" data-rating="${rating}">⭐</span>
              <span class="rating-text">${rating}</span>
            </label>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  renderTextInput(poll) {
    return `
      <div class="poll-interface text-input">
        <textarea 
          class="poll-text-input" 
          placeholder="あなたの回答を入力してください..."
          maxlength="500"
          rows="3"
          data-poll-id="${poll.id}"
        ></textarea>
        <div class="character-count">0/500文字</div>
      </div>
    `;
  }

  renderYesNo(poll) {
    return `
      <div class="poll-interface yes-no">
        <div class="yes-no-options">
          <label class="poll-option yes-option">
            <input type="radio" name="poll_${poll.id}" value="yes">
            <span class="option-text">✅ はい</span>
          </label>
          <label class="poll-option no-option">
            <input type="radio" name="poll_${poll.id}" value="no">
            <span class="option-text">❌ いいえ</span>
          </label>
        </div>
      </div>
    `;
  }

  renderRanking(poll) {
    return `
      <div class="poll-interface ranking">
        <div class="ranking-instructions">
          <p>選択肢を優先順位でドラッグして並び替えてください</p>
        </div>
        <div class="ranking-options" data-poll-id="${poll.id}">
          ${poll.options
            .map(
              (option, index) => `
            <div class="ranking-item" draggable="true" data-option="${this.escapeHtml(option)}" data-original-index="${index}">
              <span class="ranking-handle">⋮⋮</span>
              <span class="option-text">${this.escapeHtml(option)}</span>
              <span class="ranking-position">${index + 1}</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  renderPollResults(poll) {
    if (!poll.results) {
      return '';
    }

    switch (poll.type) {
      case 'multiple_choice':
      case 'yes_no':
        return this.renderChoiceResults(poll.results);
      case 'rating_scale':
        return this.renderRatingResults(poll.results);
      case 'text_input':
        return this.renderTextResults(poll.results);
      case 'ranking':
        return this.renderRankingResults(poll.results);
      default:
        return '';
    }
  }

  renderChoiceResults(results) {
    if (!results.analysis || results.analysis.length === 0) {
      return '<div class="poll-results"><p>まだ結果がありません</p></div>';
    }

    const maxCount = Math.max(...results.analysis.map(item => item.count));

    return `
      <div class="poll-results choice-results">
        <h4>結果</h4>
        <div class="results-chart">
          ${results.analysis
            .map(
              item => `
            <div class="result-item">
              <div class="result-label">${this.escapeHtml(item.option)}</div>
              <div class="result-bar">
                <div class="result-fill" style="width: ${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%"></div>
                <div class="result-stats">
                  <span class="result-count">${item.count}票</span>
                  <span class="result-percentage">(${item.percentage}%)</span>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  renderRatingResults(results) {
    if (!results.analysis) {
      return '<div class="poll-results"><p>まだ結果がありません</p></div>';
    }

    return `
      <div class="poll-results rating-results">
        <h4>結果</h4>
        <div class="rating-summary">
          <div class="average-rating">
            <span class="rating-value">${results.analysis.average}</span>
            <span class="rating-label">平均評価</span>
          </div>
          <div class="rating-distribution">
            ${results.analysis.distribution
              .map(
                item => `
              <div class="rating-dist-item">
                <span class="rating-stars">${'⭐'.repeat(item.rating)}</span>
                <span class="rating-count">${item.count} (${item.percentage}%)</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderTextResults(results) {
    if (!results.analysis || results.analysis.responses.length === 0) {
      return '<div class="poll-results"><p>まだ結果がありません</p></div>';
    }

    return `
      <div class="poll-results text-results">
        <h4>回答 (${results.analysis.responses.length}件)</h4>
        <div class="text-responses">
          ${results.analysis.responses
            .slice(0, 5)
            .map(
              response => `
            <div class="text-response">
              <p>${this.escapeHtml(response.text)}</p>
              <span class="response-time">${this.formatDateTime(response.submittedAt)}</span>
            </div>
          `
            )
            .join('')}
          ${
            results.analysis.responses.length > 5
              ? `
            <div class="view-more">
              <button class="btn-link view-all-responses" data-poll-id="${this.currentPoll?.id}">
                すべての回答を見る (${results.analysis.responses.length - 5}件)
              </button>
            </div>
          `
              : ''
          }
        </div>
        ${
          results.analysis.topWords && results.analysis.topWords.length > 0
            ? `
          <div class="word-cloud">
            <h5>頻出キーワード</h5>
            <div class="keywords">
              ${results.analysis.topWords
                .slice(0, 10)
                .map(
                  word => `
                <span class="keyword" style="font-size: ${Math.min(1 + word.count / 10, 2)}rem">
                  ${this.escapeHtml(word.word)} (${word.count})
                </span>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  renderRankingResults(results) {
    if (!results.analysis || results.analysis.length === 0) {
      return '<div class="poll-results"><p>まだ結果がありません</p></div>';
    }

    return `
      <div class="poll-results ranking-results">
        <h4>ランキング結果</h4>
        <div class="ranking-chart">
          ${results.analysis
            .map(
              (item, index) => `
            <div class="ranking-result-item">
              <span class="rank-position">${index + 1}</span>
              <span class="rank-option">${this.escapeHtml(item.option)}</span>
              <span class="rank-score">平均順位: ${item.averagePosition}</span>
              <span class="rank-mentions">${item.mentions}回選択</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  renderPollActions(poll, canParticipate, canViewResults) {
    const actions = [];

    if (canParticipate) {
      actions.push(`
        <button class="btn btn-primary submit-response-btn" data-poll-id="${poll.id}">
          回答を送信
        </button>
      `);
    }

    if (this.isAdmin && poll.status === 'draft') {
      actions.push(`
        <button class="btn btn-success start-poll-btn" data-poll-id="${poll.id}">
          投票開始
        </button>
      `);
    }

    if (this.isAdmin && poll.status === 'active') {
      actions.push(`
        <button class="btn btn-warning end-poll-btn" data-poll-id="${poll.id}">
          投票終了
        </button>
      `);
    }

    if (canViewResults) {
      actions.push(`
        <button class="btn btn-outline view-results-btn" data-poll-id="${poll.id}">
          詳細結果
        </button>
      `);
    }

    return actions.join('');
  }

  async submitResponse(pollId) {
    const poll = this.polls.find(p => p.id === pollId);
    if (!poll) {
      return;
    }

    try {
      const answers = this.collectAnswers(poll);
      if (!answers || answers.length === 0) {
        this.showNotification('回答を選択してください', 'warning');
        return;
      }

      const response = await fetch(`${this.apiEndpoint}/polls/${pollId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` })
        },
        body: JSON.stringify({
          answers,
          participantInfo: {}
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit response');
      }

      this.showNotification('回答を送信しました！', 'success');

      // Mark as participated
      this.activeParticipation.set(pollId, true);

      // Reload poll data
      await this.loadEventPolls();
    } catch (error) {
      console.error('Error submitting response:', error);
      this.showNotification(error.message || '回答の送信に失敗しました', 'error');
    }
  }

  collectAnswers(poll) {
    const pollInterface = document.querySelector(`[data-poll-id="${poll.id}"]`);
    if (!pollInterface) {
      return [];
    }

    switch (poll.type) {
      case 'multiple_choice': {
        const checkboxes = pollInterface.querySelectorAll('input:checked');
        return Array.from(checkboxes).map(cb => cb.value);
      }

      case 'rating_scale':
      case 'yes_no': {
        const radio = pollInterface.querySelector('input:checked');
        return radio ? [poll.type === 'rating_scale' ? parseInt(radio.value) : radio.value] : [];
      }

      case 'text_input': {
        const textarea = pollInterface.querySelector('.poll-text-input');
        return textarea && textarea.value.trim() ? [textarea.value.trim()] : [];
      }

      case 'ranking': {
        const rankingItems = pollInterface.querySelectorAll('.ranking-item');
        return Array.from(rankingItems).map(item => item.dataset.option);
      }

      default:
        return [];
    }
  }

  async startPoll(pollId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/polls/${pollId}/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start poll');
      }

      this.showNotification('投票を開始しました', 'success');
      await this.loadEventPolls();
    } catch (error) {
      console.error('Error starting poll:', error);
      this.showNotification(error.message || '投票の開始に失敗しました', 'error');
    }
  }

  async endPoll(pollId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/polls/${pollId}/end`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to end poll');
      }

      this.showNotification('投票を終了しました', 'success');
      await this.loadEventPolls();
    } catch (error) {
      console.error('Error ending poll:', error);
      this.showNotification(error.message || '投票の終了に失敗しました', 'error');
    }
  }

  showCreatePollModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content poll-creation-modal">
        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
        <h2>新しい投票を作成</h2>
        
        <form id="createPollForm">
          <div class="form-group">
            <label for="pollTitle">投票タイトル *</label>
            <input type="text" id="pollTitle" required maxlength="200" 
                   placeholder="投票の質問を入力してください">
          </div>
          
          <div class="form-group">
            <label for="pollDescription">説明（任意）</label>
            <textarea id="pollDescription" maxlength="1000" rows="3"
                      placeholder="投票の詳細説明"></textarea>
          </div>
          
          <div class="form-group">
            <label for="pollType">投票タイプ *</label>
            <select id="pollType" required>
              <option value="multiple_choice">複数選択</option>
              <option value="rating_scale">評価スケール（1-5）</option>
              <option value="text_input">テキスト入力</option>
              <option value="yes_no">はい/いいえ</option>
              <option value="ranking">ランキング</option>
            </select>
          </div>
          
          <div id="pollOptions" class="form-group" style="display: block;">
            <label>選択肢</label>
            <div id="optionsList">
              <input type="text" class="poll-option-input" placeholder="選択肢 1" maxlength="100">
              <input type="text" class="poll-option-input" placeholder="選択肢 2" maxlength="100">
            </div>
            <button type="button" id="addOptionBtn" class="btn btn-outline">選択肢を追加</button>
          </div>
          
          <div class="form-group">
            <label>設定</label>
            <div class="poll-settings">
              <label class="checkbox-label">
                <input type="checkbox" id="allowMultiple">
                <span>複数回答を許可</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="anonymousVoting" checked>
                <span>匿名投票</span>
              </label>
              <div class="setting-group">
                <label for="showResults">結果表示タイミング</label>
                <select id="showResults">
                  <option value="after_voting">投票後に表示</option>
                  <option value="immediately">即座に表示</option>
                  <option value="never">表示しない</option>
                  <option value="manual">手動で表示</option>
                </select>
              </div>
              <div class="setting-group">
                <label for="pollDuration">制限時間（秒）</label>
                <input type="number" id="pollDuration" min="10" max="3600" placeholder="無制限">
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">投票を作成</button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
              キャンセル
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup form handlers
    this.setupCreatePollForm(modal);
  }

  setupCreatePollForm(modal) {
    const form = modal.querySelector('#createPollForm');
    const pollType = modal.querySelector('#pollType');
    const addOptionBtn = modal.querySelector('#addOptionBtn');

    // Poll type change handler
    pollType.addEventListener('change', e => {
      this.updatePollOptionsUI(e.target.value);
    });

    // Add option button
    addOptionBtn.addEventListener('click', () => {
      this.addPollOption();
    });

    // Form submission
    form.addEventListener('submit', async e => {
      e.preventDefault();
      await this.createPoll(form);
      modal.remove();
    });
  }

  updatePollOptionsUI(pollType) {
    const optionsGroup = document.getElementById('pollOptions');
    const allowMultiple = document.getElementById('allowMultiple');

    switch (pollType) {
      case 'multiple_choice':
      case 'ranking':
        optionsGroup.style.display = 'block';
        allowMultiple.parentElement.style.display =
          pollType === 'multiple_choice' ? 'block' : 'none';
        break;
      case 'text_input':
      case 'rating_scale':
      case 'yes_no':
        optionsGroup.style.display = 'none';
        allowMultiple.parentElement.style.display = 'none';
        break;
    }
  }

  addPollOption() {
    const optionsList = document.getElementById('optionsList');
    const optionCount = optionsList.children.length + 1;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'poll-option-input';
    input.placeholder = `選択肢 ${optionCount}`;
    input.maxLength = 100;

    optionsList.appendChild(input);
  }

  async createPoll(form) {
    try {
      const formData = new FormData(form);
      const pollType = formData.get('pollType');

      // Collect options for relevant poll types
      let options = [];
      if (['multiple_choice', 'ranking'].includes(pollType)) {
        const optionInputs = form.querySelectorAll('.poll-option-input');
        options = Array.from(optionInputs)
          .map(input => input.value.trim())
          .filter(value => value.length > 0);

        if (options.length < 2) {
          throw new Error('最低2つの選択肢が必要です');
        }
      }

      const pollData = {
        eventId: this.currentEventId,
        title: formData.get('pollTitle'),
        description: formData.get('pollDescription') || '',
        type: pollType,
        options,
        settings: {
          anonymous: document.getElementById('anonymousVoting').checked,
          multipleAnswers: document.getElementById('allowMultiple').checked,
          showResults: formData.get('showResults'),
          duration: formData.get('pollDuration') ? parseInt(formData.get('pollDuration')) : null
        }
      };

      const response = await fetch(`${this.apiEndpoint}/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify(pollData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create poll');
      }

      this.showNotification('投票を作成しました', 'success');
      await this.loadEventPolls();
    } catch (error) {
      console.error('Error creating poll:', error);
      this.showNotification(error.message || '投票の作成に失敗しました', 'error');
    }
  }

  // WebSocket event handlers
  handlePollStarted(data) {
    if (data.eventId === this.currentEventId) {
      this.showNotification(`投票「${data.poll.title}」が開始されました！`, 'info');
      this.loadEventPolls();
    }
  }

  handlePollEnded(data) {
    if (data.eventId === this.currentEventId) {
      this.showNotification('投票が終了しました', 'info');
      this.loadEventPolls();
    }
  }

  handleNewResponse(data) {
    if (data.eventId === this.currentEventId) {
      // Update poll statistics in real-time
      const pollCard = document.querySelector(`[data-poll-id="${data.pollId}"]`);
      if (pollCard) {
        const statsElement = pollCard.querySelector('.poll-stats');
        if (statsElement && data.statistics) {
          statsElement.innerHTML = `
            <span>📊 ${data.statistics.totalResponses}件の回答</span>
            <span>👥 ${data.statistics.uniqueParticipants}人が参加</span>
          `;
        }
      }
    }
  }

  // Utility functions
  canViewResults(poll) {
    if (poll.status === 'ended') {
      return true;
    }
    if (poll.settings.showResults === 'immediately') {
      return true;
    }
    if (poll.settings.showResults === 'after_voting' && poll.hasResponded) {
      return true;
    }
    if (this.isAdmin) {
      return true;
    }
    return false;
  }

  getStatusText(status) {
    const statusMap = {
      draft: '下書き',
      active: '投票中',
      paused: '一時停止',
      ended: '終了'
    };
    return statusMap[status] || status;
  }

  getPollTypeText(type) {
    const typeMap = {
      multiple_choice: '複数選択',
      rating_scale: '評価',
      text_input: 'テキスト',
      yes_no: 'はい/いいえ',
      ranking: 'ランキング'
    };
    return typeMap[type] || type;
  }

  startPollUpdates() {
    // Update active polls every 30 seconds
    this.pollUpdateInterval = setInterval(() => {
      if (this.currentEventId && this.polls.some(p => p.status === 'active')) {
        this.loadEventPolls();
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
    if (this.pollUpdateInterval) {
      clearInterval(this.pollUpdateInterval);
    }

    if (this.websocketService) {
      this.websocketService.off('pollStarted');
      this.websocketService.off('pollEnded');
      this.websocketService.off('pollResponse');
    }
  }
}

// Initialize the system when DOM is ready
let interactivePollsSystem = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on a page that uses polls
  if (document.getElementById('pollsContainer') || document.querySelector('.polls-section')) {
    interactivePollsSystem = new InteractivePollsSystem();
    window.interactivePollsSystem = interactivePollsSystem;
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (interactivePollsSystem) {
    interactivePollsSystem.destroy();
  }
});

export default InteractivePollsSystem;
