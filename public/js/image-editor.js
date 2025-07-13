/**
 * Image Editor v1
 * Canvas-based in-browser image editing system
 * Integrates with Image System v2
 */

class ImageEditor {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }

    this.options = {
      maxWidth: 1920,
      maxHeight: 1080,
      backgroundColor: '#ffffff',
      allowUndo: true,
      maxUndoSteps: 20,
      showGrid: false,
      gridSize: 20,
      ...options
    };

    // Editor state
    this.canvas = null;
    this.ctx = null;
    this.originalImage = null;
    this.currentImage = null;
    this.undoStack = [];
    this.redoStack = [];
    this.isLoading = false;
    this.tool = 'select';
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.cropArea = null;

    // Transform state
    this.scale = 1;
    this.rotation = 0;
    this.flipX = false;
    this.flipY = false;
    this.brightness = 0;
    this.contrast = 0;
    this.saturation = 0;

    this.init();
  }

  /**
   * Initialize the image editor
   */
  init() {
    this.createHTML();
    this.setupCanvas();
    this.attachEventListeners();

    console.log('Image editor initialized');
  }

  /**
   * Create the editor HTML structure
   */
  createHTML() {
    this.container.innerHTML = `
      <div class="image-editor">
        <div class="editor-toolbar">
          <div class="toolbar-section">
            <button class="tool-btn" data-tool="select" title="選択ツール">
              <span class="icon">⚡</span>
            </button>
            <button class="tool-btn" data-tool="crop" title="クロップ">
              <span class="icon">✂️</span>
            </button>
            <button class="tool-btn" data-tool="rotate" title="回転">
              <span class="icon">🔄</span>
            </button>
          </div>
          
          <div class="toolbar-section">
            <button class="action-btn" id="undoBtn" title="元に戻す" disabled>
              <span class="icon">↶</span>
            </button>
            <button class="action-btn" id="redoBtn" title="やり直し" disabled>
              <span class="icon">↷</span>
            </button>
          </div>

          <div class="toolbar-section">
            <button class="action-btn" id="resetBtn" title="リセット">
              <span class="icon">🔄</span>
            </button>
            <button class="action-btn primary" id="saveBtn" title="保存">
              <span class="icon">💾</span>
            </button>
          </div>
        </div>

        <div class="editor-workspace">
          <div class="editor-sidebar">
            <div class="panel" id="adjustmentsPanel">
              <h3>調整</h3>
              
              <div class="control-group">
                <label for="brightnessSlider">明度</label>
                <input type="range" id="brightnessSlider" 
                       min="-100" max="100" value="0" step="1">
                <span class="value-display" id="brightnessValue">0</span>
              </div>

              <div class="control-group">
                <label for="contrastSlider">コントラスト</label>
                <input type="range" id="contrastSlider" 
                       min="-100" max="100" value="0" step="1">
                <span class="value-display" id="contrastValue">0</span>
              </div>

              <div class="control-group">
                <label for="saturationSlider">彩度</label>
                <input type="range" id="saturationSlider" 
                       min="-100" max="100" value="0" step="1">
                <span class="value-display" id="saturationValue">0</span>
              </div>
            </div>

            <div class="panel" id="transformPanel">
              <h3>変形</h3>
              
              <div class="control-group">
                <label for="rotationSlider">回転</label>
                <input type="range" id="rotationSlider" 
                       min="-180" max="180" value="0" step="1">
                <span class="value-display" id="rotationValue">0°</span>
              </div>

              <div class="control-group">
                <button class="transform-btn" id="flipHorizontalBtn">水平反転</button>
                <button class="transform-btn" id="flipVerticalBtn">垂直反転</button>
              </div>
            </div>

            <div class="panel" id="cropPanel" style="display: none;">
              <h3>クロップ</h3>
              
              <div class="control-group">
                <label>アスペクト比</label>
                <select id="aspectRatioSelect">
                  <option value="free">自由</option>
                  <option value="1:1">正方形 (1:1)</option>
                  <option value="4:3">4:3</option>
                  <option value="16:9">16:9</option>
                  <option value="3:2">3:2</option>
                </select>
              </div>

              <div class="control-group">
                <button class="action-btn primary" id="applyCropBtn">適用</button>
                <button class="action-btn" id="cancelCropBtn">キャンセル</button>
              </div>
            </div>
          </div>

          <div class="editor-canvas-container">
            <div class="canvas-wrapper">
              <canvas id="editorCanvas"></canvas>
              <div class="crop-overlay" id="cropOverlay" style="display: none;"></div>
            </div>
            
            <div class="canvas-info">
              <span id="imageInfo">画像を読み込んでください</span>
              <span id="zoomInfo">100%</span>
            </div>
          </div>
        </div>

        <div class="editor-footer">
          <div class="zoom-controls">
            <button class="zoom-btn" id="zoomOutBtn">−</button>
            <span id="zoomLevel">100%</span>
            <button class="zoom-btn" id="zoomInBtn">＋</button>
            <button class="zoom-btn" id="fitToScreenBtn">画面に合わせる</button>
          </div>
        </div>
      </div>
    `;

    // Get references to key elements
    this.canvas = this.container.querySelector('#editorCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.cropOverlay = this.container.querySelector('#cropOverlay');
  }

  /**
   * Setup canvas configuration
   */
  setupCanvas() {
    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;

    // Configure context
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Set background
    this.clearCanvas();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Tool selection
    this.container.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        this.selectTool(e.currentTarget.dataset.tool);
      });
    });

    // Action buttons
    this.container.querySelector('#undoBtn').addEventListener('click', () => this.undo());
    this.container.querySelector('#redoBtn').addEventListener('click', () => this.redo());
    this.container.querySelector('#resetBtn').addEventListener('click', () => this.reset());
    this.container.querySelector('#saveBtn').addEventListener('click', () => this.save());

    // Adjustment sliders
    const sliders = ['brightness', 'contrast', 'saturation', 'rotation'];
    sliders.forEach(slider => {
      const element = this.container.querySelector(`#${slider}Slider`);
      const display = this.container.querySelector(`#${slider}Value`);

      element.addEventListener('input', e => {
        const value = parseInt(e.target.value);
        display.textContent = slider === 'rotation' ? `${value}°` : value;
        this.updateAdjustment(slider, value);
      });
    });

    // Transform buttons
    this.container
      .querySelector('#flipHorizontalBtn')
      .addEventListener('click', () => this.flipHorizontal());
    this.container
      .querySelector('#flipVerticalBtn')
      .addEventListener('click', () => this.flipVertical());

    // Crop controls
    this.container.querySelector('#applyCropBtn').addEventListener('click', () => this.applyCrop());
    this.container
      .querySelector('#cancelCropBtn')
      .addEventListener('click', () => this.cancelCrop());

    // Zoom controls
    this.container.querySelector('#zoomInBtn').addEventListener('click', () => this.zoomIn());
    this.container.querySelector('#zoomOutBtn').addEventListener('click', () => this.zoomOut());
    this.container
      .querySelector('#fitToScreenBtn')
      .addEventListener('click', () => this.fitToScreen());

    // Canvas interactions
    this.canvas.addEventListener('mousedown', e => this.onCanvasMouseDown(e));
    this.canvas.addEventListener('mousemove', e => this.onCanvasMouseMove(e));
    this.canvas.addEventListener('mouseup', e => this.onCanvasMouseUp(e));
    this.canvas.addEventListener('wheel', e => this.onCanvasWheel(e));

    // Prevent context menu
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  /**
   * Load image into editor
   */
  async loadImage(imageSource) {
    this.isLoading = true;
    this.showLoading();

    try {
      const image = new Image();
      image.crossOrigin = 'anonymous';

      return new Promise((resolve, reject) => {
        image.onload = () => {
          this.originalImage = image;
          this.currentImage = image;
          this.resetTransforms();
          this.saveState();
          this.drawImage();
          this.updateImageInfo();
          this.fitToScreen();
          this.isLoading = false;
          this.hideLoading();
          resolve();
        };

        image.onerror = () => {
          this.isLoading = false;
          this.hideLoading();
          reject(new Error('画像の読み込みに失敗しました'));
        };

        if (typeof imageSource === 'string') {
          image.src = imageSource;
        } else if (imageSource instanceof File) {
          const reader = new FileReader();
          reader.onload = e => {
            image.src = e.target.result;
          };
          reader.readAsDataURL(imageSource);
        } else {
          reject(new Error('無効な画像ソース'));
        }
      });
    } catch (error) {
      this.isLoading = false;
      this.hideLoading();
      throw error;
    }
  }

  /**
   * Select editing tool
   */
  selectTool(toolName) {
    // Update tool state
    this.tool = toolName;

    // Update UI
    this.container.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    this.container.querySelector(`[data-tool="${toolName}"]`).classList.add('active');

    // Show/hide relevant panels
    this.showToolPanel(toolName);

    // Reset crop if switching away from crop tool
    if (toolName !== 'crop') {
      this.cancelCrop();
    }
  }

  /**
   * Show tool-specific panel
   */
  showToolPanel(toolName) {
    // Hide all panels
    this.container.querySelectorAll('.panel').forEach(panel => {
      panel.style.display = 'block';
    });

    // Show crop panel for crop tool
    const cropPanel = this.container.querySelector('#cropPanel');
    if (toolName === 'crop') {
      cropPanel.style.display = 'block';
    } else {
      cropPanel.style.display = 'none';
    }
  }

  /**
   * Draw image on canvas with current transformations
   */
  drawImage() {
    if (!this.currentImage) return;

    this.clearCanvas();

    const canvas = this.canvas;
    const ctx = this.ctx;

    // Calculate display size
    const imageAspect = this.currentImage.width / this.currentImage.height;
    const canvasAspect = canvas.width / canvas.height;

    let drawWidth, drawHeight;
    if (imageAspect > canvasAspect) {
      drawWidth = canvas.width * this.scale;
      drawHeight = (canvas.width / imageAspect) * this.scale;
    } else {
      drawWidth = canvas.height * imageAspect * this.scale;
      drawHeight = canvas.height * this.scale;
    }

    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;

    // Save context state
    ctx.save();

    // Apply transforms
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Apply filters
    ctx.filter = this.getCanvasFilter();

    // Draw image
    ctx.drawImage(this.currentImage, x, y, drawWidth, drawHeight);

    // Restore context state
    ctx.restore();

    // Draw crop overlay if in crop mode
    if (this.tool === 'crop') {
      this.drawCropOverlay();
    }
  }

  /**
   * Get CSS filter string for canvas
   */
  getCanvasFilter() {
    const filters = [];

    if (this.brightness !== 0) {
      filters.push(`brightness(${100 + this.brightness}%)`);
    }
    if (this.contrast !== 0) {
      filters.push(`contrast(${100 + this.contrast}%)`);
    }
    if (this.saturation !== 0) {
      filters.push(`saturate(${100 + this.saturation}%)`);
    }

    return filters.length > 0 ? filters.join(' ') : 'none';
  }

  /**
   * Clear canvas with background
   */
  clearCanvas() {
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Update adjustment value
   */
  updateAdjustment(type, value) {
    switch (type) {
      case 'brightness':
        this.brightness = value;
        break;
      case 'contrast':
        this.contrast = value;
        break;
      case 'saturation':
        this.saturation = value;
        break;
      case 'rotation':
        this.rotation = value;
        break;
    }

    this.drawImage();
  }

  /**
   * Flip image horizontally
   */
  flipHorizontal() {
    this.flipX = !this.flipX;
    this.drawImage();
    this.saveState();
  }

  /**
   * Flip image vertically
   */
  flipVertical() {
    this.flipY = !this.flipY;
    this.drawImage();
    this.saveState();
  }

  /**
   * Canvas mouse event handlers
   */
  onCanvasMouseDown(e) {
    if (this.tool === 'crop') {
      const rect = this.canvas.getBoundingClientRect();
      this.isDragging = true;
      this.dragStart = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }

  onCanvasMouseMove(e) {
    if (this.tool === 'crop' && this.isDragging) {
      const rect = this.canvas.getBoundingClientRect();
      const currentPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      this.updateCropArea(this.dragStart, currentPos);
    }
  }

  onCanvasMouseUp(e) {
    this.isDragging = false;
  }

  onCanvasWheel(e) {
    e.preventDefault();

    if (e.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  /**
   * Zoom controls
   */
  zoomIn() {
    this.scale = Math.min(this.scale * 1.2, 5);
    this.drawImage();
    this.updateZoomDisplay();
  }

  zoomOut() {
    this.scale = Math.max(this.scale / 1.2, 0.1);
    this.drawImage();
    this.updateZoomDisplay();
  }

  fitToScreen() {
    this.scale = 1;
    this.drawImage();
    this.updateZoomDisplay();
  }

  updateZoomDisplay() {
    const percentage = Math.round(this.scale * 100);
    this.container.querySelector('#zoomLevel').textContent = `${percentage}%`;
    this.container.querySelector('#zoomInfo').textContent = `${percentage}%`;
  }

  /**
   * Crop functionality
   */
  updateCropArea(start, end) {
    this.cropArea = {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y)
    };

    this.drawCropOverlay();
  }

  drawCropOverlay() {
    if (!this.cropArea) return;

    // Clear previous overlay
    this.cropOverlay.innerHTML = '';

    // Create crop selection box
    const cropBox = document.createElement('div');
    cropBox.className = 'crop-selection';
    cropBox.style.left = `${this.cropArea.x}px`;
    cropBox.style.top = `${this.cropArea.y}px`;
    cropBox.style.width = `${this.cropArea.width}px`;
    cropBox.style.height = `${this.cropArea.height}px`;

    this.cropOverlay.appendChild(cropBox);
    this.cropOverlay.style.display = 'block';
  }

  applyCrop() {
    if (!this.cropArea || !this.currentImage) return;

    // Create temporary canvas for cropping
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Calculate crop coordinates in image space
    const scaleX = this.currentImage.width / this.canvas.width;
    const scaleY = this.currentImage.height / this.canvas.height;

    const cropX = this.cropArea.x * scaleX;
    const cropY = this.cropArea.y * scaleY;
    const cropWidth = this.cropArea.width * scaleX;
    const cropHeight = this.cropArea.height * scaleY;

    // Set canvas size to crop area
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;

    // Draw cropped image
    tempCtx.drawImage(
      this.currentImage,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // Convert to new image
    tempCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        this.currentImage = img;
        this.cancelCrop();
        this.drawImage();
        this.saveState();
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }

  cancelCrop() {
    this.cropArea = null;
    this.cropOverlay.style.display = 'none';
    this.cropOverlay.innerHTML = '';
  }

  /**
   * State management
   */
  saveState() {
    if (!this.options.allowUndo) return;

    // Create state snapshot
    const state = {
      imageData: this.canvas.toDataURL(),
      brightness: this.brightness,
      contrast: this.contrast,
      saturation: this.saturation,
      rotation: this.rotation,
      flipX: this.flipX,
      flipY: this.flipY,
      scale: this.scale
    };

    this.undoStack.push(state);

    // Limit undo stack size
    if (this.undoStack.length > this.options.maxUndoSteps) {
      this.undoStack.shift();
    }

    // Clear redo stack
    this.redoStack = [];

    this.updateUndoRedoButtons();
  }

  undo() {
    if (this.undoStack.length === 0) return;

    // Save current state to redo stack
    this.redoStack.push(this.getCurrentState());

    // Restore previous state
    const state = this.undoStack.pop();
    this.restoreState(state);

    this.updateUndoRedoButtons();
  }

  redo() {
    if (this.redoStack.length === 0) return;

    // Save current state to undo stack
    this.undoStack.push(this.getCurrentState());

    // Restore next state
    const state = this.redoStack.pop();
    this.restoreState(state);

    this.updateUndoRedoButtons();
  }

  getCurrentState() {
    return {
      imageData: this.canvas.toDataURL(),
      brightness: this.brightness,
      contrast: this.contrast,
      saturation: this.saturation,
      rotation: this.rotation,
      flipX: this.flipX,
      flipY: this.flipY,
      scale: this.scale
    };
  }

  restoreState(state) {
    this.brightness = state.brightness;
    this.contrast = state.contrast;
    this.saturation = state.saturation;
    this.rotation = state.rotation;
    this.flipX = state.flipX;
    this.flipY = state.flipY;
    this.scale = state.scale;

    // Update UI controls
    this.updateControlValues();

    // Restore image
    const img = new Image();
    img.onload = () => {
      this.currentImage = img;
      this.drawImage();
    };
    img.src = state.imageData;
  }

  updateControlValues() {
    this.container.querySelector('#brightnessSlider').value = this.brightness;
    this.container.querySelector('#brightnessValue').textContent = this.brightness;
    this.container.querySelector('#contrastSlider').value = this.contrast;
    this.container.querySelector('#contrastValue').textContent = this.contrast;
    this.container.querySelector('#saturationSlider').value = this.saturation;
    this.container.querySelector('#saturationValue').textContent = this.saturation;
    this.container.querySelector('#rotationSlider').value = this.rotation;
    this.container.querySelector('#rotationValue').textContent = `${this.rotation}°`;
  }

  updateUndoRedoButtons() {
    this.container.querySelector('#undoBtn').disabled = this.undoStack.length === 0;
    this.container.querySelector('#redoBtn').disabled = this.redoStack.length === 0;
  }

  /**
   * Reset all transformations
   */
  reset() {
    if (!this.originalImage) return;

    this.currentImage = this.originalImage;
    this.resetTransforms();
    this.updateControlValues();
    this.drawImage();
    this.saveState();
  }

  resetTransforms() {
    this.scale = 1;
    this.rotation = 0;
    this.flipX = false;
    this.flipY = false;
    this.brightness = 0;
    this.contrast = 0;
    this.saturation = 0;
  }

  /**
   * Save edited image
   */
  async save() {
    if (!this.currentImage) {
      throw new Error('保存する画像がありません');
    }

    // Create final canvas with original dimensions
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d');

    finalCanvas.width = this.currentImage.width;
    finalCanvas.height = this.currentImage.height;

    // Apply all transformations
    finalCtx.save();
    finalCtx.translate(finalCanvas.width / 2, finalCanvas.height / 2);
    finalCtx.rotate((this.rotation * Math.PI) / 180);
    finalCtx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
    finalCtx.translate(-finalCanvas.width / 2, -finalCanvas.height / 2);
    finalCtx.filter = this.getCanvasFilter();
    finalCtx.drawImage(this.currentImage, 0, 0);
    finalCtx.restore();

    // Convert to blob
    return new Promise(resolve => {
      finalCanvas.toBlob(blob => {
        // Trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        resolve(blob);
      }, 'image/png');
    });
  }

  /**
   * Update image info display
   */
  updateImageInfo() {
    if (!this.currentImage) return;

    const info = `${this.currentImage.width} × ${this.currentImage.height}px`;
    this.container.querySelector('#imageInfo').textContent = info;
  }

  /**
   * Loading state management
   */
  showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'editor-loading';
    overlay.innerHTML = '<div class="loading-spinner"></div><p>画像を処理中...</p>';
    this.container.appendChild(overlay);
  }

  hideLoading() {
    const overlay = this.container.querySelector('.editor-loading');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Public API
   */

  /**
   * Get current edited image as blob
   */
  async getEditedImage(format = 'image/png', quality = 0.9) {
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d');

    finalCanvas.width = this.currentImage.width;
    finalCanvas.height = this.currentImage.height;

    // Apply transformations
    finalCtx.save();
    finalCtx.translate(finalCanvas.width / 2, finalCanvas.height / 2);
    finalCtx.rotate((this.rotation * Math.PI) / 180);
    finalCtx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
    finalCtx.translate(-finalCanvas.width / 2, -finalCanvas.height / 2);
    finalCtx.filter = this.getCanvasFilter();
    finalCtx.drawImage(this.currentImage, 0, 0);
    finalCtx.restore();

    return new Promise(resolve => {
      finalCanvas.toBlob(resolve, format, quality);
    });
  }

  /**
   * Check if image has been modified
   */
  isModified() {
    return (
      this.rotation !== 0 ||
      this.flipX ||
      this.flipY ||
      this.brightness !== 0 ||
      this.contrast !== 0 ||
      this.saturation !== 0
    );
  }

  /**
   * Destroy the editor
   */
  destroy() {
    // Clear canvases
    if (this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Clear references
    this.originalImage = null;
    this.currentImage = null;
    this.undoStack = [];
    this.redoStack = [];

    // Remove event listeners and DOM
    this.container.innerHTML = '';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageEditor;
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  // Auto-initialize editors with data attributes
  document.querySelectorAll('[data-image-editor]').forEach(element => {
    const options = JSON.parse(element.dataset.imageEditor || '{}');
    element.imageEditor = new ImageEditor(element, options);
  });
});
