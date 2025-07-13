# 🖼️ Lightning Talk Circle - イベントメインイメージシステム仕様書

## 🎯 概要

Lightning Talk
Circleのイベントにメインイメージ機能を実装し、視覚的な魅力とブランド統一性を向上させる。効率的な画像管理、自動最適化、レスポンシブ配信システムを構築する。

---

## 📸 **1. メインイメージシステム設計**

### **1.1 画像管理アーキテクチャ**

#### **メインイメージの定義**

```javascript
const mainImageSystem = {
  // イメージタイプ定義
  imageTypes: {
    hero: {
      purpose: 'イベントのメインビジュアル',
      aspectRatio: '16:9',
      sizes: ['1920x1080', '1280x720', '800x450', '400x225'],
      usage: ['header', 'card_large', 'social_sharing']
    },
    card: {
      purpose: 'カード表示用',
      aspectRatio: '4:3',
      sizes: ['800x600', '400x300', '200x150'],
      usage: ['event_cards', 'listing', 'preview']
    },
    square: {
      purpose: 'SNS・アイコン用',
      aspectRatio: '1:1',
      sizes: ['600x600', '300x300', '150x150'],
      usage: ['social_media', 'avatar', 'thumbnail']
    },
    banner: {
      purpose: 'バナー・告知用',
      aspectRatio: '3:1',
      sizes: ['1200x400', '900x300', '600x200'],
      usage: ['page_header', 'announcement', 'promotion']
    }
  },

  // 自動生成設定
  autoGeneration: {
    defaultTemplate: 'event_template_v1',
    brandElements: ['logo', 'colors', 'typography'],
    dynamicContent: ['title', 'date', 'speakers', 'venue'],
    fallbackImages: ['generic_tech', 'generic_lightning', 'brand_only']
  },

  // 品質管理
  qualityControl: {
    minResolution: { width: 800, height: 450 },
    maxFileSize: '10MB',
    allowedFormats: ['JPEG', 'PNG', 'WebP'],
    compressionQuality: { jpeg: 85, webp: 80 },
    contentModeration: true
  }
};
```

#### **データベーススキーマ**

```javascript
// EventMainImage Schema
const eventMainImageSchema = {
  id: String,
  eventId: String, // 関連イベントID
  status: 'active' | 'draft' | 'archived',
  source: {
    type: 'upload' | 'generated' | 'template' | 'ai_created',
    originalId: String, // 元画像ID
    templateId: String, // テンプレートID（生成の場合）
    generationParams: Object, // 生成パラメータ
    uploadedBy: String, // アップロードユーザー
    uploadedAt: Date
  },
  images: {
    original: {
      filename: String,
      url: String,
      path: String,
      size: Number, // バイト
      dimensions: { width: Number, height: Number },
      format: String, // 'JPEG', 'PNG', 'WebP'
      colorProfile: String,
      hash: String // ファイルハッシュ
    },
    processed: {
      hero: {
        '1920x1080': { url: String, path: String, size: Number },
        '1280x720': { url: String, path: String, size: Number },
        '800x450': { url: String, path: String, size: Number },
        '400x225': { url: String, path: String, size: Number }
      },
      card: {
        '800x600': { url: String, path: String, size: Number },
        '400x300': { url: String, path: String, size: Number },
        '200x150': { url: String, path: String, size: Number }
      },
      square: {
        '600x600': { url: String, path: String, size: Number },
        '300x300': { url: String, path: String, size: Number },
        '150x150': { url: String, path: String, size: Number }
      },
      banner: {
        '1200x400': { url: String, path: String, size: Number },
        '900x300': { url: String, path: String, size: Number },
        '600x200': { url: String, path: String, size: Number }
      },
      webp: {
        hero: Object, // WebP versions of hero sizes
        card: Object, // WebP versions of card sizes
        square: Object, // WebP versions of square sizes
        banner: Object // WebP versions of banner sizes
      }
    }
  },
  metadata: {
    title: String, // 画像タイトル
    description: String, // 説明
    alt: String, // 代替テキスト
    tags: [String], // タグ
    photographer: String, // 撮影者
    copyright: String, // 著作権情報
    license: String, // ライセンス
    location: String, // 撮影場所
    takenAt: Date // 撮影日時
  },
  display: {
    primary: Boolean, // メイン画像フラグ
    featured: Boolean, // 注目画像
    displayOrder: Number, // 表示順序
    visibleFrom: Date, // 表示開始日時
    visibleUntil: Date, // 表示終了日時
    regions: [String] // 表示地域制限
  },
  analytics: {
    views: Number, // 表示回数
    downloads: Number, // ダウンロード回数
    shares: Number, // 共有回数
    averageViewDuration: Number, // 平均表示時間(ms)
    clickThroughRate: Number, // クリック率
    conversionRate: Number // コンバージョン率
  },
  optimization: {
    loadingPriority: 'high' | 'normal' | 'low',
    lazyLoading: Boolean,
    preloading: Boolean,
    cachingStrategy: 'aggressive' | 'normal' | 'minimal',
    cdnDistribution: Boolean
  },
  createdAt: Date,
  updatedAt: Date,
  version: Number // バージョン管理
};

// Event Schema Extension
const eventSchemaImageExtension = {
  // 既存のEventスキーマに追加
  mainImage: {
    id: String, // EventMainImage ID
    url: String, // 表示用URL（最適サイズ）
    alt: String, // 代替テキスト
    aspectRatio: String, // アスペクト比
    dominantColors: [String], // 主要色
    brightness: Number, // 明度 (0-100)
    contrast: Number, // コントラスト (0-100)
    theme: 'light' | 'dark' | 'auto' // テーマ適合性
  },
  imageGallery: [
    {
      id: String,
      url: String,
      alt: String,
      type: 'hero' | 'card' | 'square' | 'banner',
      order: Number
    }
  ],
  imageSettings: {
    allowUserUploads: Boolean, // ユーザーアップロード許可
    moderationRequired: Boolean, // モデレーション必要
    autoGeneration: Boolean, // 自動生成有効
    templateId: String, // デフォルトテンプレート
    brandingLevel: 'minimal' | 'standard' | 'full'
  }
};
```

### **1.2 画像生成システム**

#### **自動画像生成**

```javascript
const imageGenerationSystem = {
  // テンプレートエンジン
  templates: {
    event_template_v1: {
      layout: 'center_content',
      background: {
        type: 'gradient',
        colors: ['primary', 'secondary'],
        pattern: 'diagonal_fade'
      },
      content: {
        logo: { position: 'top_right', size: 'medium' },
        title: { position: 'center', font: 'heading_bold', maxLines: 2 },
        date: { position: 'bottom_left', font: 'body_medium' },
        speakers: { position: 'bottom_center', font: 'body_small' },
        venue: { position: 'bottom_right', font: 'caption' }
      },
      effects: {
        shadow: 'subtle',
        blur: 'none',
        overlay: 'brand_pattern'
      }
    },
    speaker_focused: {
      layout: 'split_content',
      background: {
        type: 'image',
        source: 'speaker_photo',
        treatment: 'blur_background'
      },
      content: {
        speaker_photo: { position: 'left', size: 'large', style: 'circle' },
        title: { position: 'right_top', font: 'heading_bold' },
        speaker_name: { position: 'right_center', font: 'subheading' },
        event_info: { position: 'right_bottom', font: 'body_small' }
      }
    },
    tech_focused: {
      layout: 'tech_pattern',
      background: {
        type: 'pattern',
        pattern: 'circuit_board',
        colors: ['neutral_dark', 'primary_accent']
      },
      content: {
        tech_icons: { position: 'background', opacity: 0.1 },
        title: { position: 'center', font: 'tech_mono', style: 'bold' },
        subtitle: { position: 'below_title', font: 'tech_regular' }
      }
    }
  },

  // AI生成設定
  aiGeneration: {
    provider: 'dall_e_3', // DALL-E 3, Midjourney, Stable Diffusion
    prompts: {
      base: 'lightning talk event poster, professional, clean design',
      style_modifiers: ['modern', 'tech', 'minimalist', 'corporate'],
      content_injection: 'dynamic', // イベント情報の動的挿入
      brand_consistency: 'strict' // ブランド一貫性
    },
    quality: {
      resolution: '1792x1024', // DALL-E 3推奨解像度
      style: 'natural',
      quality: 'standard'
    },
    fallback: 'template_generation' // AI失敗時のフォールバック
  },

  // 動的コンテンツ挿入
  contentInjection: {
    textOverlay: {
      engine: 'canvas_api',
      fonts: ['Noto Sans JP', 'Roboto', 'Arial'],
      positioning: 'automatic',
      responsive: true,
      accessibility: 'wcag_aa'
    },
    logoOverlay: {
      source: 'brand_assets',
      positioning: 'rule_based',
      opacity: 'adaptive',
      scaling: 'proportional'
    },
    colorHarmony: {
      extraction: 'dominant_colors',
      palette_generation: 'complementary',
      brand_compliance: true
    }
  }
};
```

---

## 🎨 **2. 画像エディター設計**

### **2.1 インライン画像エディター**

#### **エディター機能仕様**

```javascript
const imageEditorFeatures = {
  // 基本編集機能
  basicEditing: {
    crop: {
      presets: ['16:9', '4:3', '1:1', '3:1', 'custom'],
      freeform: true,
      guides: 'rule_of_thirds',
      preview: 'real_time'
    },
    resize: {
      presets: ['sm', 'md', 'lg', 'xl'],
      custom_dimensions: true,
      maintain_aspect_ratio: true,
      quality_optimization: 'automatic'
    },
    rotate: {
      angles: [0, 90, 180, 270],
      freeform: true,
      auto_straighten: true
    },
    flip: {
      horizontal: true,
      vertical: true
    }
  },

  // 高度な編集機能
  advancedEditing: {
    filters: {
      preset_filters: ['vintage', 'bw', 'sepia', 'vibrant', 'cool', 'warm'],
      custom_adjustments: true,
      real_time_preview: true
    },
    adjustments: {
      brightness: { range: [-100, 100], default: 0 },
      contrast: { range: [-100, 100], default: 0 },
      saturation: { range: [-100, 100], default: 0 },
      hue: { range: [-180, 180], default: 0 },
      exposure: { range: [-2, 2], default: 0 },
      highlights: { range: [-100, 100], default: 0 },
      shadows: { range: [-100, 100], default: 0 }
    },
    effects: {
      blur: { gaussian: true, motion: true },
      sharpen: { amount: 'adjustable' },
      noise_reduction: true,
      vignette: { strength: 'adjustable', color: 'customizable' }
    }
  },

  // テキストオーバーレイ
  textOverlay: {
    fonts: {
      japanese: ['Noto Sans JP', 'Yu Gothic', 'Hiragino Sans'],
      english: ['Roboto', 'Open Sans', 'Lato'],
      monospace: ['Fira Code', 'Monaco', 'Consolas']
    },
    styles: {
      weight: ['100', '300', '400', '500', '600', '700', '800', '900'],
      style: ['normal', 'italic'],
      decoration: ['none', 'underline', 'line-through']
    },
    effects: {
      shadow: {
        color: 'customizable',
        blur: 'adjustable',
        offset: 'adjustable'
      },
      outline: { width: 'adjustable', color: 'customizable' },
      background: {
        color: 'customizable',
        opacity: 'adjustable',
        padding: 'adjustable'
      }
    },
    positioning: {
      presets: [
        'top_left',
        'top_center',
        'top_right',
        'center_left',
        'center',
        'center_right',
        'bottom_left',
        'bottom_center',
        'bottom_right'
      ],
      freeform: true,
      guides: true,
      snapping: true
    }
  },

  // ブランディング要素
  branding: {
    logo_placement: {
      automatic: true,
      manual_override: true,
      size_options: ['xs', 'sm', 'md', 'lg'],
      opacity: 'adjustable',
      positioning: 'flexible'
    },
    color_overlay: {
      brand_colors: 'automatic',
      custom_colors: true,
      opacity: 'adjustable',
      blend_modes: ['normal', 'multiply', 'screen', 'overlay', 'soft_light']
    },
    pattern_overlay: {
      brand_patterns: ['dots', 'lines', 'circuit', 'geometric'],
      opacity: 'adjustable',
      scale: 'adjustable'
    }
  }
};
```

#### **エディターUI設計**

```css
/* Image Editor Container */
.image-editor {
  display: grid;
  grid-template-columns: 250px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  height: 80vh;
  background: var(--color-neutral-100);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.editor-header {
  grid-column: 1 / -1;
  padding: var(--space-4);
  background: var(--color-neutral-0);
  border-bottom: 1px solid var(--color-neutral-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.editor-actions {
  display: flex;
  gap: var(--space-2);
}

/* Toolbar */
.editor-toolbar {
  grid-column: 1;
  padding: var(--space-4);
  background: var(--color-neutral-50);
  border-right: 1px solid var(--color-neutral-200);
  overflow-y: auto;
}

.toolbar-section {
  margin-bottom: var(--space-6);
}

.toolbar-section:last-child {
  margin-bottom: 0;
}

.toolbar-section-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-700);
  margin: 0 0 var(--space-3) 0;
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.toolbar-tools {
  display: grid;
  gap: var(--space-2);
}

.tool-button {
  padding: var(--space-3);
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-colors);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.tool-button:hover {
  background: var(--color-neutral-100);
  border-color: var(--color-primary-300);
}

.tool-button.active {
  background: var(--color-primary-100);
  border-color: var(--color-primary-500);
  color: var(--color-primary-700);
}

.tool-icon {
  width: var(--size-4);
  height: var(--size-4);
  flex-shrink: 0;
}

/* Canvas Area */
.editor-canvas {
  grid-column: 2;
  position: relative;
  background:
    radial-gradient(circle at 25% 25%, #ffffff 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, #ffffff 2px, transparent 2px);
  background-size: 20px 20px;
  background-position:
    0 0,
    10px 10px;
  background-color: var(--color-neutral-200);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.canvas-container {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.canvas-image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Overlay Elements */
.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.crop-overlay {
  position: absolute;
  border: 2px solid var(--color-primary-500);
  background: rgba(34, 197, 94, 0.1);
  pointer-events: auto;
  cursor: move;
}

.crop-handle {
  position: absolute;
  width: var(--size-3);
  height: var(--size-3);
  background: var(--color-primary-500);
  border: 2px solid var(--color-neutral-0);
  border-radius: 50%;
  cursor: nw-resize;
}

.crop-handle.nw {
  top: -6px;
  left: -6px;
}
.crop-handle.ne {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}
.crop-handle.sw {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}
.crop-handle.se {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}

/* Text Overlay */
.text-overlay {
  position: absolute;
  pointer-events: auto;
  cursor: move;
  border: 2px dashed transparent;
  transition: var(--transition-colors);
  min-width: 50px;
  min-height: 20px;
}

.text-overlay:hover,
.text-overlay.active {
  border-color: var(--color-primary-500);
}

.text-content {
  display: inline-block;
  outline: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.text-content[contenteditable='true'] {
  white-space: pre-wrap;
}

/* Properties Panel */
.editor-properties {
  grid-column: 3;
  padding: var(--space-4);
  background: var(--color-neutral-50);
  border-left: 1px solid var(--color-neutral-200);
  overflow-y: auto;
}

.property-group {
  margin-bottom: var(--space-6);
}

.property-group:last-child {
  margin-bottom: 0;
}

.property-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-700);
  margin-bottom: var(--space-2);
}

.property-input {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  transition: var(--transition-colors);
}

.property-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: var(--shadow-focus);
}

.property-slider {
  width: 100%;
  margin: var(--space-2) 0;
}

.property-color {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);
  align-items: center;
}

.color-picker {
  width: var(--size-8);
  height: var(--size-8);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

/* Footer */
.editor-footer {
  grid-column: 1 / -1;
  padding: var(--space-4);
  background: var(--color-neutral-0);
  border-top: 1px solid var(--color-neutral-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-zoom {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.zoom-control {
  padding: var(--space-1) var(--space-2);
  background: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-colors);
}

.zoom-control:hover {
  background: var(--color-neutral-200);
}

/* Responsive Design */
@media (max-width: 1023px) {
  .image-editor {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto auto;
    height: 100vh;
  }

  .editor-toolbar,
  .editor-properties {
    grid-column: 1;
    max-height: 150px;
    overflow-y: auto;
  }

  .editor-toolbar {
    order: 2;
  }

  .editor-canvas {
    order: 3;
    grid-column: 1;
  }

  .editor-properties {
    order: 4;
  }

  .toolbar-tools {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}

@media (max-width: 767px) {
  .image-editor {
    border-radius: 0;
    height: 100vh;
  }

  .editor-header {
    padding: var(--space-3);
  }

  .editor-title {
    font-size: var(--font-size-base);
  }

  .editor-actions .btn {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-sm);
  }

  .toolbar-tools {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: var(--space-1);
  }

  .tool-button {
    padding: var(--space-2);
    font-size: var(--font-size-xs);
  }

  .property-group {
    margin-bottom: var(--space-4);
  }
}
```

---

## 🚀 **3. パフォーマンス最適化**

### **3.1 画像配信最適化**

#### **最適化戦略**

```javascript
const imageOptimization = {
  // 動的サイズ調整
  responsiveImages: {
    srcset_generation: 'automatic',
    sizes_attribute: 'viewport_based',
    density_descriptors: ['1x', '2x', '3x'],
    format_negotiation: 'content_type_detection',
    lazy_loading: 'intersection_observer'
  },

  // CDN配信
  cdnDistribution: {
    provider: 'cloudfront',
    edge_locations: 'global',
    cache_headers: {
      immutable: '1_year',
      revalidate: '5_minutes',
      stale_while_revalidate: '1_day'
    },
    compression: {
      gzip: true,
      brotli: true,
      webp_auto: true,
      avif_progressive: true
    }
  },

  // キャッシュ戦略
  caching: {
    browser_cache: {
      max_age: '2592000', // 30 days
      etag: 'strong',
      last_modified: true
    },
    service_worker: {
      strategy: 'cache_first',
      expiration: '7_days',
      max_entries: 50
    },
    memory_cache: {
      max_size: '100MB',
      lru_eviction: true
    }
  },

  // 前処理最適化
  preprocessing: {
    lossless_compression: true,
    metadata_stripping: true,
    color_profile_optimization: true,
    progressive_jpeg: true,
    webp_conversion: 'automatic',
    avif_conversion: 'future_support'
  }
};
```

### **3.2 読み込み最適化**

#### **遅延読み込み実装**

```javascript
// Intersection Observer for image lazy loading
class OptimizedImageLoader {
  constructor() {
    this.imageObserver = new IntersectionObserver(
      this.handleImageIntersection.bind(this),
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    this.init();
  }

  init() {
    // Find all lazy images
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      this.imageObserver.observe(img);
      this.addPlaceholder(img);
    });
  }

  addPlaceholder(img) {
    // Create low-quality placeholder
    const placeholder = this.generatePlaceholder(img);
    img.src = placeholder;
    img.classList.add('lazy-loading');
  }

  generatePlaceholder(img) {
    // Generate a tiny, blurred version or solid color
    const width = img.dataset.width || 400;
    const height = img.dataset.height || 300;
    const color = img.dataset.bgColor || '#f0f0f0';

    // SVG placeholder with dominant color
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="${color}"/>
      </svg>
    `)}`;
  }

  handleImageIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        this.imageObserver.unobserve(img);
      }
    });
  }

  async loadImage(img) {
    try {
      // Create new image to preload
      const imageLoader = new Image();

      // Set up responsive srcset
      const srcset = this.buildSrcset(img);
      const sizes = this.buildSizes(img);

      imageLoader.srcset = srcset;
      imageLoader.sizes = sizes;
      imageLoader.src = img.dataset.src;

      // Wait for load
      await new Promise((resolve, reject) => {
        imageLoader.onload = resolve;
        imageLoader.onerror = reject;
      });

      // Apply loaded image
      img.srcset = srcset;
      img.sizes = sizes;
      img.src = imageLoader.src;

      // Update classes
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');

      // Trigger fade-in animation
      requestAnimationFrame(() => {
        img.classList.add('loaded');
      });
    } catch (error) {
      console.error('Failed to load image:', error);
      this.handleImageError(img);
    }
  }

  buildSrcset(img) {
    const basePath = img.dataset.src;
    const sizes = ['400', '800', '1200', '1600'];

    return sizes
      .map(size => {
        const webpUrl = basePath.replace(
          /\.(jpg|jpeg|png)$/i,
          `-${size}w.webp`
        );
        const fallbackUrl = basePath.replace(
          /\.(jpg|jpeg|png)$/i,
          `-${size}w.jpg`
        );
        return `${webpUrl} ${size}w`;
      })
      .join(', ');
  }

  buildSizes(img) {
    // Responsive sizes based on viewport and container
    const container = img.closest('.event-card')
      ? '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw'
      : img.closest('.hero-section')
        ? '100vw'
        : '(max-width: 767px) 100vw, 800px';

    return img.dataset.sizes || container;
  }

  handleImageError(img) {
    // Fallback to error placeholder
    img.src = '/images/placeholder-error.svg';
    img.classList.add('load-error');
  }
}

// Initialize loader
new OptimizedImageLoader();
```

---

## 📊 **4. 分析・管理機能**

### **4.1 画像分析ダッシュボード**

#### **分析メトリクス**

```javascript
const imageAnalytics = {
  // パフォーマンス指標
  performance: {
    loadTimes: {
      average: 'ms',
      p95: 'ms',
      by_size: 'breakdown',
      by_format: 'comparison'
    },
    bandwidth: {
      total_consumed: 'GB',
      saved_by_optimization: 'percentage',
      webp_adoption: 'percentage',
      cache_hit_rate: 'percentage'
    },
    user_experience: {
      cumulative_layout_shift: 'cls_score',
      largest_contentful_paint: 'lcp_time',
      first_contentful_paint: 'fcp_time'
    }
  },

  // 利用状況
  usage: {
    view_statistics: {
      total_views: 'count',
      unique_views: 'count',
      view_duration: 'average_seconds',
      bounce_rate: 'percentage'
    },
    engagement: {
      click_through_rate: 'percentage',
      download_rate: 'percentage',
      share_rate: 'percentage',
      conversion_impact: 'correlation'
    },
    device_breakdown: {
      desktop: 'percentage',
      tablet: 'percentage',
      mobile: 'percentage',
      retina_displays: 'percentage'
    }
  },

  // 品質指標
  quality: {
    technical: {
      compression_efficiency: 'ratio',
      format_distribution: 'breakdown',
      resolution_adequacy: 'score',
      color_accuracy: 'delta_e'
    },
    content: {
      accessibility_score: 'wcag_rating',
      brand_compliance: 'percentage',
      content_appropriateness: 'moderation_score'
    }
  }
};
```

#### **管理インターフェース**

```css
/* Image Management Dashboard */
.image-dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: calc(100vh - var(--header-height));
  background: var(--color-neutral-50);
}

.dashboard-sidebar {
  background: var(--color-neutral-0);
  border-right: 1px solid var(--color-neutral-200);
  padding: var(--space-6);
}

.sidebar-section {
  margin-bottom: var(--space-8);
}

.sidebar-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-700);
  margin: 0 0 var(--space-4) 0;
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.sidebar-filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-option {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-colors);
  font-size: var(--font-size-sm);
}

.filter-option:hover {
  background: var(--color-neutral-100);
}

.filter-option.active {
  background: var(--color-primary-100);
  color: var(--color-primary-700);
}

/* Main Content */
.dashboard-main {
  padding: var(--space-6);
  overflow-y: auto;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.dashboard-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.dashboard-actions {
  display: flex;
  gap: var(--space-3);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.stat-card {
  background: var(--color-neutral-0);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-neutral-200);
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-600);
  margin: 0 0 var(--space-2) 0;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  margin: 0;
}

.stat-change {
  font-size: var(--font-size-xs);
  margin-top: var(--space-2);
}

.stat-change.positive {
  color: var(--color-success-600);
}

.stat-change.negative {
  color: var(--color-error-600);
}

/* Image Grid */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.image-card {
  background: var(--color-neutral-0);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-neutral-200);
  overflow: hidden;
  transition: var(--transition-transform), var(--transition-shadow);
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.image-preview {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.7) 100%
  );
  display: flex;
  align-items: flex-end;
  padding: var(--space-4);
  opacity: 0;
  transition: var(--transition-opacity);
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.image-actions {
  display: flex;
  gap: var(--space-2);
}

.action-btn {
  padding: var(--space-2);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-md);
  color: var(--color-neutral-0);
  cursor: pointer;
  transition: var(--transition-colors);
  backdrop-filter: blur(10px);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.image-info {
  padding: var(--space-4);
}

.image-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  margin: 0 0 var(--space-2) 0;
  color: var(--color-neutral-900);
}

.image-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.image-stats {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-neutral-200);
  font-size: var(--font-size-xs);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-900);
}

.stat-text {
  color: var(--color-neutral-600);
  margin-top: var(--space-1);
}
```

---

この包括的なイベントメインイメージシステム仕様により、Lightning Talk
Circleの視覚的魅力と管理効率が大幅に向上します。次は追加機能提案と仕様統合に進みましょうか？
