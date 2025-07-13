/**
 * Image Uploader v2
 * Advanced drag & drop image uploader with real-time preview and processing
 */

class ImageUploader {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }

    this.options = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      multiple: false,
      category: 'general',
      endpoint: '/api/media/upload',
      previewSizes: ['thumbnail', 'medium'],
      showProgress: true,
      allowDelete: true,
      ...options
    };

    this.files = new Map();
    this.uploads = new Map();
    this.authToken = this.getAuthToken();

    this.init();
  }

  /**
   * Initialize the uploader
   */
  init() {
    this.createHTML();
    this.attachEventListeners();
    this.setupDropZone();

    console.log('Image uploader initialized');
  }

  /**
   * Create the uploader HTML structure
   */
  createHTML() {
    this.container.innerHTML = `
      <div class="image-uploader">
        <div class="upload-zone" data-state="idle">
          <div class="upload-zone-content">
            <div class="upload-icon">
              📸
            </div>
            <div class="upload-text">
              <h3>画像をアップロード</h3>
              <p>ファイルをドラッグ&ドロップするか、クリックして選択してください</p>
              <span class="upload-constraints">
                JPEG, PNG, WebP対応 • 最大${this.formatFileSize(this.options.maxFileSize)}
              </span>
            </div>
            <button type="button" class="upload-button">
              ファイルを選択
            </button>
          </div>
          <div class="upload-overlay">
            <div class="upload-overlay-text">ファイルをドロップしてください</div>
          </div>
        </div>

        <input type="file" class="file-input" 
               accept="${this.options.acceptedTypes.join(',')}"
               ${this.options.multiple ? 'multiple' : ''}
               style="display: none;">

        <div class="upload-queue" style="display: none;">
          <h4>アップロード中</h4>
          <div class="queue-items"></div>
        </div>

        <div class="uploaded-images" style="display: none;">
          <h4>アップロード済み画像</h4>
          <div class="image-grid"></div>
        </div>
      </div>
    `;

    this.uploadZone = this.container.querySelector('.upload-zone');
    this.fileInput = this.container.querySelector('.file-input');
    this.uploadButton = this.container.querySelector('.upload-button');
    this.uploadQueue = this.container.querySelector('.upload-queue');
    this.queueItems = this.container.querySelector('.queue-items');
    this.uploadedImages = this.container.querySelector('.uploaded-images');
    this.imageGrid = this.container.querySelector('.image-grid');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // File input change
    this.fileInput.addEventListener('change', e => {
      this.handleFiles(Array.from(e.target.files));
    });

    // Upload button click
    this.uploadButton.addEventListener('click', () => {
      this.fileInput.click();
    });

    // Upload zone click
    this.uploadZone.addEventListener('click', e => {
      if (e.target === this.uploadZone || e.target.closest('.upload-zone-content')) {
        this.fileInput.click();
      }
    });
  }

  /**
   * Setup drag and drop functionality
   */
  setupDropZone() {
    let dragCounter = 0;

    this.uploadZone.addEventListener('dragenter', e => {
      e.preventDefault();
      dragCounter++;
      this.uploadZone.dataset.state = 'dragover';
    });

    this.uploadZone.addEventListener('dragover', e => {
      e.preventDefault();
    });

    this.uploadZone.addEventListener('dragleave', e => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        this.uploadZone.dataset.state = 'idle';
      }
    });

    this.uploadZone.addEventListener('drop', e => {
      e.preventDefault();
      dragCounter = 0;
      this.uploadZone.dataset.state = 'idle';

      const files = Array.from(e.dataTransfer.files).filter(file =>
        this.options.acceptedTypes.includes(file.type)
      );

      if (files.length > 0) {
        this.handleFiles(files);
      }
    });
  }

  /**
   * Handle selected files
   */
  async handleFiles(files) {
    if (!this.options.multiple) {
      files = files.slice(0, 1);
    }

    for (const file of files) {
      try {
        await this.validateFile(file);
        await this.addFileToQueue(file);
        await this.uploadFile(file);
      } catch (error) {
        this.showError(error.message, file.name);
      }
    }
  }

  /**
   * Validate file before upload
   */
  async validateFile(file) {
    // Check file type
    if (!this.options.acceptedTypes.includes(file.type)) {
      throw new Error(`サポートされていないファイル形式: ${file.type}`);
    }

    // Check file size
    if (file.size > this.options.maxFileSize) {
      throw new Error(`ファイルサイズが大きすぎます: ${this.formatFileSize(file.size)}`);
    }

    // Validate image by creating an Image object
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('有効な画像ファイルではありません'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Add file to upload queue with preview
   */
  async addFileToQueue(file) {
    const fileId = this.generateFileId();
    const preview = await this.createPreview(file);

    const queueItem = document.createElement('div');
    queueItem.className = 'queue-item';
    queueItem.dataset.fileId = fileId;
    queueItem.innerHTML = `
      <div class="queue-item-preview">
        <img src="${preview}" alt="プレビュー">
      </div>
      <div class="queue-item-info">
        <div class="queue-item-name">${file.name}</div>
        <div class="queue-item-size">${this.formatFileSize(file.size)}</div>
        <div class="queue-item-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-text">0%</div>
        </div>
      </div>
      <button type="button" class="queue-item-cancel" title="キャンセル">
        ✕
      </button>
    `;

    this.queueItems.appendChild(queueItem);
    this.uploadQueue.style.display = 'block';

    // Add cancel functionality
    const cancelButton = queueItem.querySelector('.queue-item-cancel');
    cancelButton.addEventListener('click', () => {
      this.cancelUpload(fileId);
    });

    this.files.set(fileId, file);
    return fileId;
  }

  /**
   * Create image preview
   */
  async createPreview(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(file) {
    const fileId = Array.from(this.files.entries()).find(([id, f]) => f === file)?.[0];

    if (!fileId) return;

    const queueItem = this.container.querySelector(`[data-file-id="${fileId}"]`);
    const progressFill = queueItem.querySelector('.progress-fill');
    const progressText = queueItem.querySelector('.progress-text');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', this.options.category);

      if (this.options.alt) {
        formData.append('alt', this.options.alt);
      }

      if (this.options.caption) {
        formData.append('caption', this.options.caption);
      }

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          progressFill.style.width = `${percentComplete}%`;
          progressText.textContent = `${percentComplete}%`;
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          this.onUploadSuccess(fileId, response.data);
        } else {
          const error = JSON.parse(xhr.responseText);
          throw new Error(error.error || 'アップロードに失敗しました');
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        throw new Error('ネットワークエラーが発生しました');
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        this.onUploadCancel(fileId);
      });

      // Start upload
      xhr.open('POST', this.options.endpoint);

      if (this.authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.authToken}`);
      }

      this.uploads.set(fileId, xhr);
      xhr.send(formData);
    } catch (error) {
      this.onUploadError(fileId, error.message);
    }
  }

  /**
   * Handle successful upload
   */
  onUploadSuccess(fileId, imageData) {
    const queueItem = this.container.querySelector(`[data-file-id="${fileId}"]`);
    if (queueItem) {
      queueItem.remove();
    }

    this.addToImageGrid(imageData);
    this.cleanup(fileId);

    // Hide queue if empty
    if (this.queueItems.children.length === 0) {
      this.uploadQueue.style.display = 'none';
    }

    // Trigger success callback
    if (this.options.onSuccess) {
      this.options.onSuccess(imageData);
    }

    // Dispatch custom event
    this.container.dispatchEvent(
      new CustomEvent('imageUploaded', {
        detail: { imageData }
      })
    );
  }

  /**
   * Handle upload error
   */
  onUploadError(fileId, errorMessage) {
    const queueItem = this.container.querySelector(`[data-file-id="${fileId}"]`);
    if (queueItem) {
      queueItem.classList.add('error');
      const progressText = queueItem.querySelector('.progress-text');
      progressText.textContent = 'エラー';
    }

    this.showError(errorMessage);
    this.cleanup(fileId);

    // Trigger error callback
    if (this.options.onError) {
      this.options.onError(errorMessage);
    }
  }

  /**
   * Handle upload cancellation
   */
  onUploadCancel(fileId) {
    const queueItem = this.container.querySelector(`[data-file-id="${fileId}"]`);
    if (queueItem) {
      queueItem.remove();
    }

    this.cleanup(fileId);

    // Hide queue if empty
    if (this.queueItems.children.length === 0) {
      this.uploadQueue.style.display = 'none';
    }
  }

  /**
   * Cancel upload
   */
  cancelUpload(fileId) {
    const xhr = this.uploads.get(fileId);
    if (xhr) {
      xhr.abort();
    }
    this.onUploadCancel(fileId);
  }

  /**
   * Add uploaded image to grid
   */
  addToImageGrid(imageData) {
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    imageItem.dataset.imageId = imageData.id;

    const thumbnailUrl = this.getOptimizedUrl(imageData, 'thumbnail');
    const mediumUrl = this.getOptimizedUrl(imageData, 'medium');

    imageItem.innerHTML = `
      <div class="image-item-preview">
        <img src="${thumbnailUrl}" alt="${imageData.alt || imageData.originalName}">
        <div class="image-item-overlay">
          <button type="button" class="image-action-btn image-view-btn" title="プレビュー">
            👁️
          </button>
          ${
            this.options.allowDelete
              ? `
            <button type="button" class="image-action-btn image-delete-btn" title="削除">
              🗑️
            </button>
          `
              : ''
          }
        </div>
      </div>
      <div class="image-item-info">
        <div class="image-item-name">${imageData.originalName}</div>
        <div class="image-item-size">${this.formatFileSize(imageData.fileSize)}</div>
        <div class="image-item-dimensions">${imageData.metadata.width} × ${imageData.metadata.height}</div>
      </div>
    `;

    // Add event listeners
    const viewBtn = imageItem.querySelector('.image-view-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        this.showImagePreview(imageData, mediumUrl);
      });
    }

    const deleteBtn = imageItem.querySelector('.image-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.deleteImage(imageData.id, imageItem);
      });
    }

    this.imageGrid.appendChild(imageItem);
    this.uploadedImages.style.display = 'block';
  }

  /**
   * Show image preview modal
   */
  showImagePreview(imageData, imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content">
          <div class="modal-header">
            <h3>${imageData.originalName}</h3>
            <button type="button" class="modal-close">✕</button>
          </div>
          <div class="modal-body">
            <img src="${imageUrl}" alt="${imageData.alt || imageData.originalName}">
            <div class="image-details">
              <p><strong>サイズ:</strong> ${this.formatFileSize(imageData.fileSize)}</p>
              <p><strong>解像度:</strong> ${imageData.metadata.width} × ${imageData.metadata.height}</p>
              <p><strong>形式:</strong> ${imageData.metadata.format}</p>
              <p><strong>アップロード日:</strong> ${new Date(imageData.createdAt).toLocaleString('ja-JP')}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal functionality
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-backdrop').addEventListener('click', e => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    });

    // ESC key support
    const handleEscape = e => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Delete image
   */
  async deleteImage(imageId, imageItem) {
    if (!confirm('この画像を削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/media/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        imageItem.remove();

        // Hide grid if empty
        if (this.imageGrid.children.length === 0) {
          this.uploadedImages.style.display = 'none';
        }

        this.showSuccess('画像を削除しました');
      } else {
        const error = await response.json();
        throw new Error(error.error || '削除に失敗しました');
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  /**
   * Get optimized image URL
   */
  getOptimizedUrl(imageData, size = 'medium') {
    if (imageData.variants) {
      // Try WebP first, then fall back to original format
      const webpVariant = imageData.variants[`${size}-webp`];
      if (webpVariant) return webpVariant.url;

      // Try other formats
      for (const format of ['jpeg', 'jpg', 'png']) {
        const variant = imageData.variants[`${size}-${format}`];
        if (variant) return variant.url;
      }
    }

    return imageData.url || '';
  }

  /**
   * Show error message
   */
  showError(message, fileName = '') {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'upload-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">${message}${fileName ? ` (${fileName})` : ''}</span>
        <button type="button" class="error-close">✕</button>
      </div>
    `;

    this.container.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);

    // Manual close
    errorDiv.querySelector('.error-close').addEventListener('click', () => {
      errorDiv.remove();
    });
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'upload-success';
    successDiv.innerHTML = `
      <div class="success-content">
        <span class="success-icon">✅</span>
        <span class="success-message">${message}</span>
      </div>
    `;

    this.container.appendChild(successDiv);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove();
      }
    }, 3000);
  }

  /**
   * Utility functions
   */
  generateFileId() {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getAuthToken() {
    return localStorage.getItem('authToken') || null;
  }

  cleanup(fileId) {
    this.files.delete(fileId);
    this.uploads.delete(fileId);
  }

  /**
   * Public API
   */

  /**
   * Load existing images
   */
  async loadExistingImages(filter = {}) {
    try {
      const params = new URLSearchParams(filter);
      const response = await fetch(`/api/media/images?${params}`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        result.data.forEach(imageData => {
          this.addToImageGrid(imageData);
        });
      }
    } catch (error) {
      console.error('Error loading existing images:', error);
    }
  }

  /**
   * Clear all uploaded images from display
   */
  clearImages() {
    this.imageGrid.innerHTML = '';
    this.uploadedImages.style.display = 'none';
  }

  /**
   * Get all uploaded images
   */
  getUploadedImages() {
    const imageItems = this.imageGrid.querySelectorAll('.image-item');
    return Array.from(imageItems).map(item => ({
      id: item.dataset.imageId,
      element: item
    }));
  }

  /**
   * Destroy the uploader
   */
  destroy() {
    // Cancel any ongoing uploads
    for (const xhr of this.uploads.values()) {
      xhr.abort();
    }

    // Remove event listeners and DOM elements
    this.container.innerHTML = '';
    this.files.clear();
    this.uploads.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageUploader;
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  // Auto-initialize uploaders with data attributes
  document.querySelectorAll('[data-image-uploader]').forEach(element => {
    const options = JSON.parse(element.dataset.imageUploader || '{}');
    element.imageUploader = new ImageUploader(element, options);
  });
});
