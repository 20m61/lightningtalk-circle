/**
 * Lightning Talk Circle - Screenshot Attachment System
 * PR用スクリーンショット添付機能
 */

class ScreenshotAttachment {
  constructor(options = {}) {
    this.apiEndpoint = options.apiEndpoint || '/api/screenshots';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.allowedTypes = options.allowedTypes || [
      'image/png',
      'image/jpg',
      'image/jpeg',
      'image/gif',
      'image/webp'
    ];
    this.prNumber = options.prNumber || null;
    this.userId = options.userId || 'anonymous';
    this.uploads = new Map(); // Track ongoing uploads
    this.screenshots = []; // Store uploaded screenshots

    this.init();
  }

  /**
   * Initialize the screenshot attachment system
   */
  init() {
    this.createUI();
    this.bindEvents();
    console.log('Screenshot attachment system initialized');
  }

  /**
   * Create the UI elements for screenshot attachment
   */
  createUI() {
    // Create main container if it doesn't exist
    if (!document.getElementById('screenshot-attachment-container')) {
      const container = document.createElement('div');
      container.id = 'screenshot-attachment-container';
      container.className = 'screenshot-attachment-container';
      container.innerHTML = `
        <div class="screenshot-upload-area">
          <input type="file" id="screenshot-file-input" accept="image/*" multiple style="display: none;">
          <div class="upload-dropzone" id="screenshot-dropzone">
            <div class="upload-icon">📷</div>
            <div class="upload-text">
              <p>スクリーンショットをドラッグ&ドロップ</p>
              <p>または <button type="button" class="upload-button">ファイルを選択</button></p>
            </div>
            <div class="upload-info">
              <small>PNG, JPG, GIF, WebP対応 (最大 ${this.formatFileSize(this.maxFileSize)})</small>
            </div>
          </div>
        </div>
        <div class="screenshot-list" id="screenshot-list"></div>
        <div class="screenshot-markdown" id="screenshot-markdown"></div>
      `;

      // Append to appropriate location (look for existing form or create standalone)
      const targetElement =
        document.querySelector('form') || document.querySelector('.content') || document.body;
      targetElement.appendChild(container);
    }

    this.addStyles();
  }

  /**
   * Add CSS styles for the screenshot attachment UI
   */
  addStyles() {
    if (document.getElementById('screenshot-attachment-styles')) {
      return;
    }

    const styles = document.createElement('style');
    styles.id = 'screenshot-attachment-styles';
    styles.textContent = `
      .screenshot-attachment-container {
        margin: 20px 0;
        padding: 20px;
        border: 2px dashed #ddd;
        border-radius: 8px;
        background-color: #fafafa;
      }

      .upload-dropzone {
        text-align: center;
        padding: 40px 20px;
        border: 2px dashed #ccc;
        border-radius: 8px;
        background-color: white;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .upload-dropzone:hover,
      .upload-dropzone.dragover {
        border-color: #007cba;
        background-color: #f0f8ff;
      }

      .upload-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .upload-text p {
        margin: 8px 0;
        color: #666;
      }

      .upload-button {
        background: #007cba;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        text-decoration: underline;
      }

      .upload-button:hover {
        background: #005a87;
      }

      .upload-info {
        margin-top: 12px;
        color: #999;
      }

      .screenshot-list {
        margin-top: 20px;
      }

      .screenshot-item {
        display: flex;
        align-items: center;
        padding: 12px;
        margin: 8px 0;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
      }

      .screenshot-thumbnail {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
        margin-right: 12px;
      }

      .screenshot-info {
        flex: 1;
      }

      .screenshot-name {
        font-weight: bold;
        margin-bottom: 4px;
      }

      .screenshot-size {
        color: #666;
        font-size: 0.9em;
      }

      .screenshot-status {
        margin-left: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8em;
        font-weight: bold;
      }

      .screenshot-status.uploading {
        background: #fff3cd;
        color: #856404;
      }

      .screenshot-status.uploaded {
        background: #d4edda;
        color: #155724;
      }

      .screenshot-status.error {
        background: #f8d7da;
        color: #721c24;
      }

      .screenshot-actions {
        margin-left: 12px;
      }

      .screenshot-button {
        background: none;
        border: 1px solid #ddd;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        margin: 0 2px;
        font-size: 0.8em;
      }

      .screenshot-button:hover {
        background: #f5f5f5;
      }

      .screenshot-button.delete {
        color: #dc3545;
        border-color: #dc3545;
      }

      .screenshot-button.delete:hover {
        background: #dc3545;
        color: white;
      }

      .screenshot-markdown {
        margin-top: 16px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;
        border: 1px solid #e9ecef;
      }

      .markdown-title {
        font-weight: bold;
        margin-bottom: 8px;
        color: #495057;
      }

      .markdown-content {
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        background: white;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ddd;
        white-space: pre-wrap;
        word-break: break-all;
      }

      .progress-bar {
        width: 100%;
        height: 4px;
        background: #e9ecef;
        border-radius: 2px;
        overflow: hidden;
        margin-top: 4px;
      }

      .progress-fill {
        height: 100%;
        background: #28a745;
        transition: width 0.3s ease;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const fileInput = document.getElementById('screenshot-file-input');
    const dropzone = document.getElementById('screenshot-dropzone');
    const uploadButton = dropzone.querySelector('.upload-button');

    // File input change
    fileInput?.addEventListener('change', e => {
      this.handleFiles(e.target.files);
    });

    // Upload button click
    uploadButton?.addEventListener('click', e => {
      e.preventDefault();
      fileInput?.click();
    });

    // Dropzone click
    dropzone?.addEventListener('click', e => {
      if (e.target === uploadButton) {
        return;
      }
      fileInput?.click();
    });

    // Drag and drop events
    dropzone?.addEventListener('dragover', e => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone?.addEventListener('dragleave', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });

    dropzone?.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      this.handleFiles(e.dataTransfer.files);
    });

    // Paste event for screenshots
    document.addEventListener('paste', e => {
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter(item => item.type.startsWith('image/'));

      if (imageItems.length > 0) {
        const files = imageItems.map(item => item.getAsFile()).filter(Boolean);
        if (files.length > 0) {
          this.handleFiles(files);
          e.preventDefault();
        }
      }
    });
  }

  /**
   * Handle file selection/drop
   */
  handleFiles(files) {
    Array.from(files).forEach(file => {
      if (this.validateFile(file)) {
        this.uploadFile(file);
      }
    });
  }

  /**
   * Validate file before upload
   */
  validateFile(file) {
    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      this.showError(`ファイル形式がサポートされていません: ${file.name}`);
      return false;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      this.showError(
        `ファイルサイズが大きすぎます: ${file.name} (${this.formatFileSize(file.size)})`
      );
      return false;
    }

    return true;
  }

  /**
   * Upload file to S3 via presigned URL
   */
  async uploadFile(file) {
    const uploadId = this.generateUploadId();
    const filename = this.sanitizeFilename(file.name);

    try {
      // Add to UI immediately
      this.addScreenshotToUI(uploadId, file, 'uploading');

      // Get presigned URL
      const presignedData = await this.getPresignedUrl(filename, file.type);

      // Upload to S3
      await this.uploadToS3(presignedData.uploadUrl, file, uploadId);

      // Update UI and store result
      const screenshotData = {
        id: uploadId,
        filename,
        size: file.size,
        url: presignedData.downloadUrl,
        fileKey: presignedData.fileKey,
        uploadedAt: new Date().toISOString()
      };

      this.screenshots.push(screenshotData);
      this.updateScreenshotStatus(uploadId, 'uploaded');
      this.updateMarkdownOutput();
    } catch (error) {
      console.error('Upload failed:', error);
      this.updateScreenshotStatus(uploadId, 'error');
      this.showError(`アップロードに失敗しました: ${filename}`);
    }
  }

  /**
   * Get presigned URL from API
   */
  async getPresignedUrl(filename, contentType) {
    const response = await fetch(`${this.apiEndpoint}/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: filename,
        contentType,
        prNumber: this.prNumber,
        userId: this.userId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get presigned URL');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Upload file to S3 using presigned URL
   */
  async uploadToS3(presignedUrl, file, uploadId) {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  /**
   * Add screenshot to UI
   */
  addScreenshotToUI(uploadId, file, status) {
    const listContainer = document.getElementById('screenshot-list');
    if (!listContainer) {
      return;
    }

    const item = document.createElement('div');
    item.className = 'screenshot-item';
    item.id = `screenshot-${uploadId}`;

    // Create thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.className = 'screenshot-thumbnail';
    thumbnail.src = URL.createObjectURL(file);

    item.innerHTML = `
      ${thumbnail.outerHTML}
      <div class="screenshot-info">
        <div class="screenshot-name">${file.name}</div>
        <div class="screenshot-size">${this.formatFileSize(file.size)}</div>
        <div class="progress-bar" style="display: ${status === 'uploading' ? 'block' : 'none'}">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
      </div>
      <div class="screenshot-status ${status}">
        ${this.getStatusText(status)}
      </div>
      <div class="screenshot-actions">
        <button class="screenshot-button copy" onclick="screenshotAttachment.copyMarkdown('${uploadId}')" style="display: ${status === 'uploaded' ? 'inline-block' : 'none'}">
          コピー
        </button>
        <button class="screenshot-button delete" onclick="screenshotAttachment.removeScreenshot('${uploadId}')">
          削除
        </button>
      </div>
    `;

    listContainer.appendChild(item);
  }

  /**
   * Update screenshot status in UI
   */
  updateScreenshotStatus(uploadId, status) {
    const item = document.getElementById(`screenshot-${uploadId}`);
    if (!item) {
      return;
    }

    const statusElement = item.querySelector('.screenshot-status');
    const progressBar = item.querySelector('.progress-bar');
    const copyButton = item.querySelector('.copy');

    statusElement.className = `screenshot-status ${status}`;
    statusElement.textContent = this.getStatusText(status);

    if (status === 'uploaded') {
      progressBar.style.display = 'none';
      copyButton.style.display = 'inline-block';
    } else if (status === 'error') {
      progressBar.style.display = 'none';
    }
  }

  /**
   * Get status text for display
   */
  getStatusText(status) {
    const statusTexts = {
      uploading: 'アップロード中...',
      uploaded: 'アップロード完了',
      error: 'エラー'
    };
    return statusTexts[status] || status;
  }

  /**
   * Remove screenshot
   */
  removeScreenshot(uploadId) {
    // Remove from UI
    const item = document.getElementById(`screenshot-${uploadId}`);
    if (item) {
      item.remove();
    }

    // Remove from data
    this.screenshots = this.screenshots.filter(s => s.id !== uploadId);
    this.updateMarkdownOutput();
  }

  /**
   * Copy markdown for single screenshot
   */
  copyMarkdown(uploadId) {
    const screenshot = this.screenshots.find(s => s.id === uploadId);
    if (!screenshot) {
      return;
    }

    const markdown = `![${screenshot.filename}](${screenshot.url})`;
    this.copyToClipboard(markdown);
    this.showSuccess('Markdownをクリップボードにコピーしました');
  }

  /**
   * Update markdown output display
   */
  updateMarkdownOutput() {
    const container = document.getElementById('screenshot-markdown');
    if (!container || this.screenshots.length === 0) {
      if (container) {
        container.style.display = 'none';
      }
      return;
    }

    const markdown = this.screenshots.map(s => `![${s.filename}](${s.url})`).join('\n');

    container.style.display = 'block';
    container.innerHTML = `
      <div class="markdown-title">
        Markdown コード 
        <button class="screenshot-button" onclick="screenshotAttachment.copyAllMarkdown()">
          すべてコピー
        </button>
      </div>
      <div class="markdown-content">${markdown}</div>
    `;
  }

  /**
   * Copy all markdown to clipboard
   */
  copyAllMarkdown() {
    const markdown = this.screenshots.map(s => `![${s.filename}](${s.url})`).join('\n');

    this.copyToClipboard(markdown);
    this.showSuccess('すべてのMarkdownをクリップボードにコピーしました');
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  /**
   * Utility functions
   */
  generateUploadId() {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  formatFileSize(bytes) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  showError(message) {
    // Simple alert for now, can be enhanced with better UI
    alert(`エラー: ${message}`);
  }

  showSuccess(message) {
    // Simple alert for now, can be enhanced with better UI
    alert(`成功: ${message}`);
  }

  /**
   * Get all uploaded screenshots
   */
  getScreenshots() {
    return this.screenshots;
  }

  /**
   * Set PR number (useful for dynamic updates)
   */
  setPRNumber(prNumber) {
    this.prNumber = prNumber;
  }

  /**
   * Set user ID
   */
  setUserId(userId) {
    this.userId = userId;
  }
}

// Global instance
let screenshotAttachment = null;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize with default settings
  screenshotAttachment = new ScreenshotAttachment({
    apiEndpoint: '/api/screenshots',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    prNumber: null, // Will be set dynamically
    userId: `user_${Date.now()}` // Generate temporary user ID
  });
});

// Export for module use (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScreenshotAttachment;
}

// Export for ES modules
export default ScreenshotAttachment;
