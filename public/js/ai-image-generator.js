/**
 * AI Image Generator v1
 * DALL-E 3 powered image generation with template system
 */

class AIImageGenerator {
  constructor() {
    this.apiEndpoint = window.API_CONFIG?.apiEndpoint || '/api';
    this.authToken = null;
    this.templates = [];
    this.currentGeneration = null;
    this.generations = [];
    this.websocketService = null;
    this.uploadService = null;

    this.init();
  }

  async init() {
    // Check authentication
    this.authToken = localStorage.getItem('authToken');
    if (!this.authToken) {
      this.showNotification('認証が必要です', 'error');
      return;
    }

    // Show AWS-only mode notice
    this.showAWSOnlyNotice();

    // Initialize WebSocket for real-time updates
    if (window.socketService) {
      this.websocketService = window.socketService;
      this.setupWebSocketListeners();
    }

    // Load templates and user data
    await this.loadTemplates();
    await this.loadUserGenerations();
    await this.loadUsageStats();

    this.setupEventListeners();
    this.renderTemplates();
    this.renderGenerations();

    console.log('AI Image Generator initialized (AWS-only mode)');
  }

  /**
   * Show AWS-only mode notice
   */
  async showAWSOnlyNotice() {
    // Check service status first
    const status = await this.checkServiceStatus();

    const notice = document.createElement('div');
    notice.className = status.bedrock?.enabled ? 'aws-ready-notice' : 'aws-only-notice';

    if (status.bedrock?.enabled) {
      notice.innerHTML = `
        <div class="notice-content">
          <span class="notice-icon">✨</span>
          <div class="notice-text">
            <strong>AWS Bedrock 画像生成</strong>
            <p>Claude 3とStable Diffusion XLを使用した高品質な画像生成が利用可能です。</p>
          </div>
          <button class="notice-close">&times;</button>
        </div>
      `;
    } else {
      notice.innerHTML = `
        <div class="notice-content">
          <span class="notice-icon">🔧</span>
          <div class="notice-text">
            <strong>開発中機能</strong>
            <p>AI画像生成機能は現在AWS Bedrockとの統合を準備中です。まもなく利用可能になります。</p>
          </div>
          <button class="notice-close">&times;</button>
        </div>
      `;
    }

    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(notice, container.firstChild);
    }

    // Close notice functionality
    const closeBtn = notice.querySelector('.notice-close');
    closeBtn.addEventListener('click', () => {
      notice.remove();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notice.parentNode) {
        notice.remove();
      }
    }, 10000);
  }

  /**
   * Check service status
   */
  async checkServiceStatus() {
    try {
      const response = await fetch(`${this.apiEndpoint}/ai-images/status`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check service status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking service status:', error);
      return { enabled: false };
    }
  }

  /**
   * Setup WebSocket listeners for real-time updates
   */
  setupWebSocketListeners() {
    if (!this.websocketService) {
      return;
    }

    this.websocketService.on('aiImageGenerated', data => {
      this.handleGenerationComplete(data);
    });

    this.websocketService.on('connected', () => {
      console.log('WebSocket connected - AI image updates enabled');
    });
  }

  /**
   * Load available templates
   */
  async loadTemplates() {
    try {
      const response = await fetch(`${this.apiEndpoint}/ai-images/templates`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const data = await response.json();
      this.templates = data.data;

      console.log(`Loaded ${this.templates.length} AI image templates`);
    } catch (error) {
      console.error('Error loading templates:', error);
      this.showNotification('テンプレートの読み込みに失敗しました', 'error');
    }
  }

  /**
   * Load user's generations
   */
  async loadUserGenerations() {
    try {
      const response = await fetch(`${this.apiEndpoint}/ai-images/generations?limit=50`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load generations');
      }

      const data = await response.json();
      this.generations = data.data;

      console.log(`Loaded ${this.generations.length} user generations`);
    } catch (error) {
      console.error('Error loading generations:', error);
      this.showNotification('生成履歴の読み込みに失敗しました', 'error');
    }
  }

  /**
   * Load usage statistics
   */
  async loadUsageStats() {
    try {
      const response = await fetch(`${this.apiEndpoint}/ai-images/usage`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load usage stats');
      }

      const data = await response.json();
      this.usageStats = data.data;
      this.updateUsageDisplay();

      console.log('Usage stats loaded:', this.usageStats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  }

  /**
   * Update usage display in UI
   */
  updateUsageDisplay() {
    if (!this.usageStats) {
      return;
    }

    const usageDisplay = document.querySelector('.usage-stats');
    if (usageDisplay) {
      const { daily } = this.usageStats;
      usageDisplay.innerHTML = `
        <div class="usage-item">
          <span class="usage-label">今日の使用量:</span>
          <span class="usage-value">${daily.used}/${daily.limit}</span>
        </div>
        <div class="usage-item">
          <span class="usage-label">残り:</span>
          <span class="usage-value ${daily.remaining <= 2 ? 'warning' : ''}">${daily.remaining}</span>
        </div>
        <div class="usage-item">
          <span class="usage-label">プラン:</span>
          <span class="usage-value">${daily.tier}</span>
        </div>
      `;
    }

    // Update progress bar
    const progressBar = document.querySelector('.usage-progress-bar');
    if (progressBar) {
      const percentage = (daily.used / daily.limit) * 100;
      progressBar.style.width = `${percentage}%`;
      progressBar.className = `usage-progress-bar ${percentage >= 80 ? 'warning' : ''}`;
    }
  }

  /**
   * Render templates grid
   */
  renderTemplates() {
    const container = document.querySelector('.templates-grid');
    if (!container) {
      return;
    }

    container.innerHTML = '';

    this.templates.forEach(template => {
      const templateCard = document.createElement('div');
      templateCard.className = 'template-card';
      templateCard.innerHTML = `
        <div class="template-preview">
          <div class="template-icon">${this.getTemplateIcon(template.category)}</div>
          <div class="template-aspect-ratio">${template.aspectRatio}</div>
        </div>
        <div class="template-info">
          <h3 class="template-name">${template.name}</h3>
          <p class="template-description">${template.description}</p>
          <div class="template-tags">
            ${template.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <div class="template-styles">
            ${template.styles.map(style => `<span class="style-tag">${style}</span>`).join('')}
          </div>
        </div>
        <button class="btn btn-primary select-template-btn" data-template-id="${template.id}">
          このテンプレートを使用
        </button>
      `;

      container.appendChild(templateCard);
    });
  }

  /**
   * Get icon for template category
   */
  getTemplateIcon(category) {
    const icons = {
      'event-poster': '🎪',
      'social-media': '📱',
      presentation: '📊',
      banner: '🖼️',
      logo: '⭐'
    };
    return icons[category] || '🎨';
  }

  /**
   * Render user generations
   */
  renderGenerations() {
    const container = document.querySelector('.generations-grid');
    if (!container) {
      return;
    }

    container.innerHTML = '';

    if (this.generations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎨</div>
          <h3>まだ画像を生成していません</h3>
          <p>テンプレートを選択して最初のAI画像を生成してみましょう！</p>
        </div>
      `;
      return;
    }

    this.generations.forEach(generation => {
      const generationCard = document.createElement('div');
      generationCard.className = `generation-card status-${generation.status}`;
      generationCard.innerHTML = `
        <div class="generation-image">
          ${
            generation.status === 'completed' && generation.imageUrl
              ? `<img src="${generation.imageUrl}" alt="Generated image" loading="lazy">`
              : `<div class="generation-placeholder">
                 <div class="loading-spinner ${generation.status === 'pending' || generation.status === 'generating' ? 'active' : ''}"></div>
                 <span class="status-text">${this.getStatusText(generation.status)}</span>
               </div>`
          }
        </div>
        <div class="generation-info">
          <div class="generation-meta">
            <span class="generation-template">${this.getTemplateName(generation.template)}</span>
            <span class="generation-date">${this.formatDate(generation.createdAt)}</span>
          </div>
          <p class="generation-prompt">${this.truncateText(generation.prompt, 100)}</p>
          <div class="generation-details">
            <span class="generation-size">${generation.size}</span>
            <span class="generation-quality">${generation.quality}</span>
            <span class="generation-style">${generation.style}</span>
          </div>
          <div class="generation-actions">
            ${
              generation.status === 'completed'
                ? `
              <button class="btn btn-sm btn-secondary download-btn" data-generation-id="${generation.id}">
                ダウンロード
              </button>
              <button class="btn btn-sm btn-secondary variations-btn" data-generation-id="${generation.id}">
                バリエーション
              </button>
              <button class="btn btn-sm btn-secondary share-btn" data-generation-id="${generation.id}">
                共有
              </button>
            `
                : ''
            }
            <button class="btn btn-sm btn-outline view-details-btn" data-generation-id="${generation.id}">
              詳細
            </button>
          </div>
        </div>
      `;

      container.appendChild(generationCard);
    });
  }

  /**
   * Get template name by ID
   */
  getTemplateName(templateId) {
    const template = this.templates.find(t => t.id === templateId);
    return template ? template.name : templateId;
  }

  /**
   * Get status text in Japanese
   */
  getStatusText(status) {
    const statusTexts = {
      pending: '待機中',
      generating: '生成中',
      completed: '完了',
      failed: '失敗'
    };
    return statusTexts[status] || status;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Template selection
    document.addEventListener('click', e => {
      if (e.target.classList.contains('select-template-btn')) {
        const { templateId } = e.target.dataset;
        this.selectTemplate(templateId);
      }
    });

    // Generation actions
    document.addEventListener('click', e => {
      if (e.target.classList.contains('download-btn')) {
        const { generationId } = e.target.dataset;
        this.downloadGeneration(generationId);
      } else if (e.target.classList.contains('variations-btn')) {
        const { generationId } = e.target.dataset;
        this.generateVariations(generationId);
      } else if (e.target.classList.contains('share-btn')) {
        const { generationId } = e.target.dataset;
        this.shareGeneration(generationId);
      } else if (e.target.classList.contains('view-details-btn')) {
        const { generationId } = e.target.dataset;
        this.viewGenerationDetails(generationId);
      }
    });

    // Generation form
    const generateForm = document.getElementById('generateForm');
    if (generateForm) {
      generateForm.addEventListener('submit', e => {
        e.preventDefault();
        this.handleGenerateSubmit(new FormData(generateForm));
      });
    }

    // Real-time style preview
    const styleInputs = document.querySelectorAll('input[name="style"]');
    styleInputs.forEach(input => {
      input.addEventListener('change', () => {
        this.updateStylePreview(input.value);
      });
    });

    // Prompt suggestions
    const promptInput = document.getElementById('promptInput');
    if (promptInput) {
      promptInput.addEventListener('input', () => {
        this.showPromptSuggestions(promptInput.value);
      });
    }
  }

  /**
   * Select template and show generation form
   */
  selectTemplate(templateId) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      return;
    }

    this.selectedTemplate = template;
    this.showGenerationModal(template);
  }

  /**
   * Show generation modal with template
   */
  showGenerationModal(template) {
    const modal = document.createElement('div');
    modal.className = 'modal ai-generation-modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>AI画像生成 - ${template.name}</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <form id="generateForm" class="generation-form">
            <div class="form-section">
              <h3>基本設定</h3>
              <div class="form-group">
                <label for="promptInput">画像の説明 *</label>
                <textarea 
                  id="promptInput" 
                  name="prompt" 
                  required 
                  minlength="10" 
                  maxlength="1000"
                  placeholder="生成したい画像について詳しく説明してください..."
                  rows="4"
                ></textarea>
                <div class="form-help">例: "モダンなライトニングトークイベントのポスター、青とオレンジのグラデーション、テクノロジー企業向け"</div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="styleSelect">スタイル</label>
                  <select id="styleSelect" name="style">
                    <option value="vivid">ビビッド (鮮やか)</option>
                    <option value="natural">ナチュラル (自然)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="qualitySelect">品質</label>
                  <select id="qualitySelect" name="quality">
                    <option value="standard">標準</option>
                    <option value="hd">HD (高画質)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="sizeSelect">サイズ</label>
                <select id="sizeSelect" name="size">
                  <option value="1024x1024" ${template.aspectRatio === '1024x1024' ? 'selected' : ''}>正方形 (1024x1024)</option>
                  <option value="1792x1024" ${template.aspectRatio === '1792x1024' ? 'selected' : ''}>横長 (1792x1024)</option>
                  <option value="1024x1792" ${template.aspectRatio === '1024x1792' ? 'selected' : ''}>縦長 (1024x1792)</option>
                </select>
              </div>
            </div>

            ${
              template.customFields && template.customFields.length > 0
                ? `
              <div class="form-section">
                <h3>カスタマイズ</h3>
                ${template.customFields
                  .map(
                    field => `
                  <div class="form-group">
                    <label for="custom_${field}">${this.getFieldLabel(field)}</label>
                    <input 
                      type="text" 
                      id="custom_${field}" 
                      name="customizations[${field}]"
                      placeholder="${this.getFieldPlaceholder(field)}"
                    >
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }

            <div class="form-section">
              <h3>プレビュー</h3>
              <div class="style-preview">
                <div class="preview-placeholder">
                  <span>プレビューは生成後に表示されます</span>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <div class="generation-cost">
            <span class="cost-label">予想コスト:</span>
            <span class="cost-value">$0.04 - $0.12</span>
          </div>
          <button type="button" class="btn btn-secondary close-modal">キャンセル</button>
          <button type="submit" form="generateForm" class="btn btn-primary generate-btn">
            <span class="btn-text">画像を生成</span>
            <span class="btn-spinner loading-spinner" style="display: none;"></span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup modal events
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modal.remove();
      });
    });

    // Click outside to close
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Focus on prompt input
    const promptInput = modal.querySelector('#promptInput');
    if (promptInput) {
      promptInput.focus();
    }
  }

  /**
   * Get field label
   */
  getFieldLabel(field) {
    const labels = {
      title: 'タイトル',
      subtitle: 'サブタイトル',
      date: '日付',
      venue: '会場',
      speakers: 'スピーカー',
      theme: 'テーマ',
      handle: 'ハンドル',
      author: '作成者',
      cta: 'コールトゥアクション',
      name: '名前',
      tagline: 'タグライン',
      industry: '業界'
    };
    return labels[field] || field;
  }

  /**
   * Get field placeholder
   */
  getFieldPlaceholder(field) {
    const placeholders = {
      title: 'イベントタイトルを入力',
      subtitle: 'サブタイトルを入力',
      date: '2024年12月15日',
      venue: '東京国際フォーラム',
      speakers: '田中太郎, 佐藤花子',
      theme: 'AI・テクノロジー',
      handle: '@lightningtalk',
      author: '山田一郎',
      cta: '今すぐ参加',
      name: '会社名・サービス名',
      tagline: 'キャッチフレーズ',
      industry: 'テクノロジー'
    };
    return placeholders[field] || `${field}を入力してください`;
  }

  /**
   * Handle generation form submit
   */
  async handleGenerateSubmit(formData) {
    try {
      // Check usage limit
      if (this.usageStats && this.usageStats.daily.remaining <= 0) {
        this.showNotification('今日の生成回数上限に達しました', 'error');
        return;
      }

      const generateBtn = document.querySelector('.generate-btn');
      const btnText = generateBtn.querySelector('.btn-text');
      const btnSpinner = generateBtn.querySelector('.btn-spinner');

      // Show loading state
      generateBtn.disabled = true;
      btnText.textContent = '生成中...';
      btnSpinner.style.display = 'inline-block';

      // Prepare request data
      const requestData = {
        prompt: formData.get('prompt'),
        template: this.selectedTemplate.id,
        style: formData.get('style'),
        size: formData.get('size'),
        quality: formData.get('quality'),
        customizations: {}
      };

      // Add customizations
      this.selectedTemplate.customFields?.forEach(field => {
        const value = formData.get(`customizations[${field}]`);
        if (value) {
          requestData.customizations[field] = value;
        }
      });

      // Make API request
      const response = await fetch(`${this.apiEndpoint}/ai-images/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const result = await response.json();
      this.currentGeneration = result.data;

      // Close modal
      document.querySelector('.ai-generation-modal').remove();

      // Show generation in progress
      this.showGenerationProgress(result.data);

      // Update usage stats
      await this.loadUsageStats();

      this.showNotification(
        'AI画像生成を開始しました。完了まで30-60秒ほどお待ちください。',
        'success'
      );

      console.log('AI image generation started:', result.data);
    } catch (error) {
      console.error('Error generating AI image:', error);
      this.showNotification(error.message || 'AI画像生成に失敗しました', 'error');

      // Reset button state
      const generateBtn = document.querySelector('.generate-btn');
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.querySelector('.btn-text').textContent = '画像を生成';
        generateBtn.querySelector('.btn-spinner').style.display = 'none';
      }
    }
  }

  /**
   * Show generation progress
   */
  showGenerationProgress(generation) {
    // Add to generations list at the top
    this.generations.unshift({
      ...generation,
      prompt: this.selectedTemplate
        ? document.getElementById('promptInput')?.value || generation.prompt
        : generation.prompt
    });

    // Re-render generations
    this.renderGenerations();

    // Scroll to new generation
    const firstCard = document.querySelector('.generation-card');
    if (firstCard) {
      firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Handle generation complete via WebSocket
   */
  handleGenerationComplete(data) {
    const { generationId, status, imageUrl } = data;

    // Find and update generation
    const generation = this.generations.find(g => g.id === generationId);
    if (generation) {
      generation.status = status;
      generation.imageUrl = imageUrl;
      generation.completedAt = new Date().toISOString();

      // Re-render generations
      this.renderGenerations();

      // Show notification
      if (status === 'completed') {
        this.showNotification('AI画像生成が完了しました！', 'success');

        // Play success sound if available
        this.playNotificationSound('success');
      } else if (status === 'failed') {
        this.showNotification('AI画像生成に失敗しました', 'error');
        this.playNotificationSound('error');
      }
    }

    // Update usage stats
    this.loadUsageStats();
  }

  /**
   * Download generation
   */
  async downloadGeneration(generationId) {
    try {
      const generation = this.generations.find(g => g.id === generationId);
      if (!generation || !generation.imageUrl) {
        throw new Error('Image not available for download');
      }

      // Create download link
      const link = document.createElement('a');
      link.href = generation.imageUrl;
      link.download = `ai-generated-${generationId}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showNotification('画像のダウンロードを開始しました', 'success');
    } catch (error) {
      console.error('Error downloading generation:', error);
      this.showNotification('ダウンロードに失敗しました', 'error');
    }
  }

  /**
   * Generate variations
   */
  async generateVariations(generationId) {
    try {
      // Check usage limit
      if (this.usageStats && this.usageStats.daily.remaining < 2) {
        this.showNotification('バリエーション生成には最低2回分の残り回数が必要です', 'error');
        return;
      }

      const response = await fetch(`${this.apiEndpoint}/ai-images/variations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          generationId,
          variations: 2,
          style: 'vivid'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Variation generation failed');
      }

      const result = await response.json();
      this.showNotification('バリエーション生成を開始しました', 'success');

      // Reload generations to show new variations
      setTimeout(() => {
        this.loadUserGenerations().then(() => {
          this.renderGenerations();
        });
      }, 1000);
    } catch (error) {
      console.error('Error generating variations:', error);
      this.showNotification(error.message || 'バリエーション生成に失敗しました', 'error');
    }
  }

  /**
   * Share generation
   */
  shareGeneration(generationId) {
    const generation = this.generations.find(g => g.id === generationId);
    if (!generation) {
      return;
    }

    if (navigator.share) {
      navigator
        .share({
          title: 'AI生成画像',
          text: generation.prompt,
          url: generation.imageUrl
        })
        .catch(console.error);
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard
        .writeText(generation.imageUrl)
        .then(() => {
          this.showNotification('画像URLをクリップボードにコピーしました', 'success');
        })
        .catch(() => {
          this.showNotification('共有に失敗しました', 'error');
        });
    }
  }

  /**
   * View generation details
   */
  viewGenerationDetails(generationId) {
    const generation = this.generations.find(g => g.id === generationId);
    if (!generation) {
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal generation-details-modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>生成詳細</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="generation-detail-content">
            <div class="detail-image">
              ${
                generation.imageUrl
                  ? `<img src="${generation.imageUrl}" alt="Generated image">`
                  : '<div class="placeholder">画像なし</div>'
              }
            </div>
            <div class="detail-info">
              <div class="detail-section">
                <h3>基本情報</h3>
                <div class="detail-row">
                  <span class="label">ステータス:</span>
                  <span class="value status-${generation.status}">${this.getStatusText(generation.status)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">テンプレート:</span>
                  <span class="value">${this.getTemplateName(generation.template)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">サイズ:</span>
                  <span class="value">${generation.size}</span>
                </div>
                <div class="detail-row">
                  <span class="label">品質:</span>
                  <span class="value">${generation.quality}</span>
                </div>
                <div class="detail-row">
                  <span class="label">スタイル:</span>
                  <span class="value">${generation.style}</span>
                </div>
                <div class="detail-row">
                  <span class="label">作成日時:</span>
                  <span class="value">${this.formatDate(generation.createdAt)}</span>
                </div>
                ${
                  generation.completedAt
                    ? `
                  <div class="detail-row">
                    <span class="label">完了日時:</span>
                    <span class="value">${this.formatDate(generation.completedAt)}</span>
                  </div>
                `
                    : ''
                }
              </div>
              
              <div class="detail-section">
                <h3>プロンプト</h3>
                <div class="prompt-text">${generation.prompt}</div>
                ${
                  generation.revisedPrompt
                    ? `
                  <h4>DALL-E修正プロンプト</h4>
                  <div class="revised-prompt-text">${generation.revisedPrompt}</div>
                `
                    : ''
                }
              </div>

              ${
                generation.customizations && Object.keys(generation.customizations).length > 0
                  ? `
                <div class="detail-section">
                  <h3>カスタマイズ</h3>
                  ${Object.entries(generation.customizations)
                    .map(
                      ([key, value]) => `
                    <div class="detail-row">
                      <span class="label">${this.getFieldLabel(key)}:</span>
                      <span class="value">${value}</span>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              `
                  : ''
              }

              ${
                generation.metadata
                  ? `
                <div class="detail-section">
                  <h3>メタデータ</h3>
                  ${
                    generation.metadata.generation_time
                      ? `
                    <div class="detail-row">
                      <span class="label">生成時間:</span>
                      <span class="value">${generation.metadata.generation_time}ms</span>
                    </div>
                  `
                      : ''
                  }
                  ${
                    generation.metadata.cost
                      ? `
                    <div class="detail-row">
                      <span class="label">コスト:</span>
                      <span class="value">$${generation.metadata.cost}</span>
                    </div>
                  `
                      : ''
                  }
                </div>
              `
                  : ''
              }
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary close-modal">閉じる</button>
          ${
            generation.status === 'completed' && generation.imageUrl
              ? `
            <button type="button" class="btn btn-primary" onclick="aiImageGenerator.downloadGeneration('${generation.id}')">
              ダウンロード
            </button>
          `
              : ''
          }
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup modal events
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modal.remove();
      });
    });

    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Play notification sound
   */
  playNotificationSound(type) {
    try {
      const audio = new Audio(`/sounds/notification-${type}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors
      });
    } catch (error) {
      // Ignore audio errors
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Truncate text with ellipsis
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.substring(0, maxLength)}...`;
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span class="notification-message">${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
}

// Initialize when DOM is ready
window.aiImageGenerator = null;

document.addEventListener('DOMContentLoaded', () => {
  window.aiImageGenerator = new AIImageGenerator();
});

export default AIImageGenerator;
