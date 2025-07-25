# 🎨 Lightning Talk Circle - ブランド&メディアシステム仕様書

## 🎯 概要

Lightning Talk
Circleのブランドアイデンティティ統一とメディア管理システムの包括的設計。ロゴ最適化、アイコンシステム、イベントメインイメージ機能を統合的に実装する。

---

## 🏷️ **1. ブランドアイデンティティシステム**

### **1.1 ロゴシステム設計**

#### **現状分析**

```
既存ファイル: public/icons/logo.jpeg (ソースファイル確認済み)
既存アイコン: 多数のサイズバリエーション生成済み
PWA対応: manifest.json設定済み
```

#### **ロゴ最適化戦略**

```javascript
const logoOptimizationPlan = {
  // ソースファイル処理
  sourceAnalysis: {
    currentFile: 'public/icons/logo.jpeg',
    requiredFormats: ['svg', 'png', 'webp', 'ico'],
    colorExtraction: 'automatic', // ロゴから自動カラーパレット抽出
    vectorization: 'ai-assisted' // ベクター化対応
  },

  // 出力仕様
  outputFormats: {
    svg: {
      primary: 'logo-primary.svg', // メインロゴ
      monochrome: 'logo-mono.svg', // 単色版
      simplified: 'logo-simple.svg', // 簡素化版
      icon: 'logo-icon.svg' // アイコン版
    },
    png: {
      sizes: [16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 1024],
      retina: 'x2, x3 variants',
      transparent: true
    },
    webp: {
      sizes: [64, 128, 256, 512],
      quality: 85,
      lossless: false
    },
    ico: {
      multiSize: [16, 24, 32, 48],
      format: 'favicon.ico'
    }
  }
};
```

### **1.2 カラーパレット統一**

#### **ロゴベースカラーシステム**

```css
/* ロゴから抽出されるカラーパレット */
:root {
  /* Lightning Talk Primary Colors (ロゴベース) */
  --brand-primary: #2ecc71; /* 現在のメインカラー */
  --brand-primary-light: #58d68d; /* ライト版 */
  --brand-primary-dark: #229954; /* ダーク版 */

  /* 抽出予定の追加カラー */
  --brand-secondary: #extracted; /* ロゴから自動抽出 */
  --brand-accent: #extracted; /* アクセントカラー */
  --brand-neutral: #extracted; /* ニュートラル */

  /* Usage in components */
  --logo-filter-primary: brightness(0) saturate(100%) invert(47%) sepia(79%)
    saturate(2434%) hue-rotate(136deg) brightness(95%) contrast(80%);
  --logo-filter-white: brightness(0) saturate(100%) invert(100%);
  --logo-filter-dark: brightness(0) saturate(100%) invert(20%);
}
```

### **1.3 アイコンシステム標準化**

#### **アイコンライブラリ構成**

```javascript
const iconSystem = {
  // ブランドアイコン
  brand: {
    'logo-full': 'フルロゴ',
    'logo-icon': 'アイコンのみ',
    'logo-text': 'テキストのみ',
    'logo-mono': '単色版'
  },

  // 機能アイコン
  functional: {
    event: 'イベント',
    chat: 'チャット',
    user: 'ユーザー',
    notification: '通知',
    settings: '設定',
    search: '検索',
    upload: 'アップロード',
    download: 'ダウンロード',
    edit: '編集',
    delete: '削除',
    share: '共有'
  },

  // ステータスアイコン
  status: {
    online: 'オンライン',
    offline: 'オフライン',
    busy: '取り込み中',
    away: '離席中'
  },

  // ソーシャルアイコン
  social: {
    twitter: 'Twitter',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    youtube: 'YouTube'
  }
};
```

---

## 📸 **2. イベントメインイメージシステム**

### **2.1 画像管理アーキテクチャ**

#### **データベーススキーマ**

```javascript
// EventMedia Schema
const eventMediaSchema = {
  id: String,
  eventId: String, // 関連イベントID
  type: 'main' | 'gallery' | 'thumbnail' | 'banner',
  original: {
    filename: String, // 元ファイル名
    size: Number, // ファイルサイズ(bytes)
    mimeType: String, // MIME type
    dimensions: {
      width: Number,
      height: Number
    },
    url: String, // オリジナルURL
    path: String // サーバー内パス
  },
  processed: {
    thumbnail: {
      // 300x200
      url: String,
      path: String,
      size: Number
    },
    medium: {
      // 800x600
      url: String,
      path: String,
      size: Number
    },
    large: {
      // 1200x800
      url: String,
      path: String,
      size: Number
    },
    webp: {
      // WebP variants
      thumbnail: String,
      medium: String,
      large: String
    }
  },
  metadata: {
    alt: String, // 代替テキスト
    caption: String, // キャプション
    photographer: String, // 撮影者
    tags: [String], // タグ
    featured: Boolean, // 注目画像
    displayOrder: Number // 表示順序
  },
  analytics: {
    views: Number, // 表示回数
    downloads: Number, // ダウンロード回数
    shares: Number // 共有回数
  },
  uploadedBy: String, // アップロードユーザーID
  createdAt: Date,
  updatedAt: Date
};

// Event Schema Extension
const eventSchemaExtension = {
  // 既存のEventスキーマに追加
  media: {
    mainImage: {
      id: String, // EventMedia ID
      url: String, // 表示用URL
      alt: String, // 代替テキスト
      aspectRatio: String // '16:9', '4:3', 'square'
    },
    gallery: [
      {
        id: String,
        url: String,
        alt: String,
        order: Number
      }
    ],
    banner: {
      id: String,
      url: String,
      alt: String
    }
  }
};
```

### **2.2 画像処理システム**

#### **アップロード＆処理フロー**

```javascript
const imageProcessingPipeline = {
  // Step 1: バリデーション
  validation: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    minDimensions: { width: 400, height: 300 },
    maxDimensions: { width: 4000, height: 3000 },
    aspectRatioCheck: true
  },

  // Step 2: 前処理
  preprocessing: {
    exifStrip: true, // EXIF情報除去
    colorProfileNormalization: true, // カラープロファイル正規化
    qualityOptimization: 85 // 品質最適化
  },

  // Step 3: リサイズ処理
  resizing: {
    thumbnail: {
      width: 300,
      height: 200,
      fit: 'cover',
      quality: 80
    },
    medium: {
      width: 800,
      height: 600,
      fit: 'inside',
      quality: 85
    },
    large: {
      width: 1200,
      height: 800,
      fit: 'inside',
      quality: 90
    }
  },

  // Step 4: 形式変換
  conversion: {
    webp: {
      quality: 85,
      lossless: false,
      effort: 4
    },
    progressive: true, // Progressive JPEG
    optimization: true // 最適化
  }
};
```

### **2.3 ストレージ戦略**

#### **マルチティア ストレージ**

```javascript
const storageStrategy = {
  // Tier 1: Local Storage (開発・軽量運用)
  local: {
    basePath: 'public/uploads/events/',
    structure: {
      original: 'original/{eventId}/',
      processed: 'processed/{eventId}/{size}/',
      temp: 'temp/{uploadId}/'
    },
    backup: {
      enabled: true,
      frequency: 'daily',
      retention: '30 days'
    }
  },

  // Tier 2: AWS S3 (本格運用)
  s3: {
    bucket: 'lightningtalk-media',
    regions: ['ap-northeast-1'],
    structure: {
      original: 'events/{eventId}/original/',
      processed: 'events/{eventId}/processed/{size}/',
      cache: 'cache/{hash}/'
    },
    lifecycle: {
      ia: '30 days', // Infrequent Access
      glacier: '90 days', // Archive
      deletion: '7 years' // 削除
    }
  },

  // Tier 3: CDN (配信最適化)
  cdn: {
    provider: 'CloudFront',
    caching: {
      images: '7 days',
      thumbnails: '30 days',
      static: '1 year'
    },
    compression: {
      gzip: true,
      brotli: true
    }
  }
};
```

---

## 🖼️ **3. UI/UX コンポーネント設計**

### **3.1 画像アップローダー**

```css
/* Image Upload Component */
.image-uploader {
  width: 100%;
  min-height: 200px;
  border: 2px dashed var(--color-neutral-300);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-50);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-colors);
  position: relative;
  overflow: hidden;
}

.image-uploader:hover {
  border-color: var(--color-primary-400);
  background: var(--color-primary-50);
}

.image-uploader.dragover {
  border-color: var(--color-primary-500);
  background: var(--color-primary-100);
}

.image-uploader.uploading {
  pointer-events: none;
}

.upload-icon {
  width: var(--size-12);
  height: var(--size-12);
  color: var(--color-neutral-500);
  margin-bottom: var(--space-3);
}

.upload-text {
  text-align: center;
  color: var(--color-neutral-700);
}

.upload-hint {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
  margin-top: var(--space-2);
}

/* Progress Bar */
.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-neutral-200);
  overflow: hidden;
}

.upload-progress-bar {
  height: 100%;
  background: var(--color-primary-500);
  width: 0%;
  transition: width 0.3s ease;
}
```

### **3.2 画像クロッパー**

```css
/* Image Cropper Component */
.image-cropper {
  position: relative;
  max-width: 100%;
  max-height: 400px;
  margin: var(--space-4) 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-neutral-900);
}

.cropper-canvas {
  width: 100%;
  height: auto;
  display: block;
}

.cropper-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-4);
  padding: var(--space-3);
  background: var(--color-neutral-100);
  border-radius: var(--radius-md);
}

.aspect-ratio-buttons {
  display: flex;
  gap: var(--space-2);
}

.aspect-ratio-btn {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-neutral-300);
  background: var(--color-neutral-0);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: var(--transition-colors);
}

.aspect-ratio-btn.active {
  background: var(--color-primary-500);
  color: var(--color-neutral-0);
  border-color: var(--color-primary-500);
}
```

### **3.3 画像ギャラリー**

```css
/* Image Gallery Component */
.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
  margin: var(--space-6) 0;
}

.gallery-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-transform);
}

.gallery-item:hover {
  transform: scale(1.02);
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-transform);
}

.gallery-item:hover .gallery-image {
  transform: scale(1.1);
}

.gallery-overlay {
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
  padding: var(--space-3);
  opacity: 0;
  transition: var(--transition-opacity);
}

.gallery-item:hover .gallery-overlay {
  opacity: 1;
}

.gallery-caption {
  color: var(--color-neutral-0);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}
```

---

## 🔧 **4. 実装詳細**

### **4.1 ロゴ最適化スクリプト**

```javascript
// scripts/optimize-logo.js
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

class LogoOptimizer {
  constructor() {
    this.sourceFile = 'public/icons/logo.jpeg';
    this.outputDir = 'public/icons/optimized/';
    this.sizes = [16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 1024];
  }

  async optimize() {
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    // Load source image
    const sourceBuffer = await fs.readFile(this.sourceFile);
    const image = sharp(sourceBuffer);

    // Extract metadata
    const metadata = await image.metadata();
    console.log('Source image:', metadata);

    // Generate PNG variants
    for (const size of this.sizes) {
      await this.generatePNG(image, size);
      await this.generateWebP(image, size);
    }

    // Generate ICO favicon
    await this.generateFavicon(image);

    // Generate brand colors
    await this.extractBrandColors(image);
  }

  async generatePNG(image, size) {
    const outputPath = path.join(this.outputDir, `logo-${size}.png`);
    await image
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`Generated: logo-${size}.png`);
  }

  async generateWebP(image, size) {
    const outputPath = path.join(this.outputDir, `logo-${size}.webp`);
    await image
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality: 85, effort: 4 })
      .toFile(outputPath);

    console.log(`Generated: logo-${size}.webp`);
  }

  async generateFavicon(image) {
    const sizes = [16, 24, 32, 48];
    const buffers = [];

    for (const size of sizes) {
      const buffer = await image
        .resize(size, size, { fit: 'contain' })
        .png()
        .toBuffer();
      buffers.push(buffer);
    }

    // Use ico-convert library to create multi-size ICO
    const icoBuffer = await this.createICO(buffers, sizes);
    await fs.writeFile(path.join(this.outputDir, 'favicon.ico'), icoBuffer);

    console.log('Generated: favicon.ico');
  }

  async extractBrandColors(image) {
    // Use color-thief or vibrant.js equivalent
    const colors = await this.extractDominantColors(image);

    const brandColors = {
      primary: colors[0],
      secondary: colors[1],
      accent: colors[2],
      neutral: colors[3]
    };

    // Save as CSS custom properties
    const cssContent = `:root {\n${Object.entries(brandColors)
      .map(([name, color]) => `  --brand-${name}: ${color};`)
      .join('\n')}\n}`;

    await fs.writeFile(
      path.join(this.outputDir, 'brand-colors.css'),
      cssContent
    );

    console.log('Generated: brand-colors.css');
    return brandColors;
  }
}
```

### **4.2 画像アップロードAPI**

```javascript
// server/routes/media.js
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Upload event main image
router.post(
  '/events/:eventId/upload',
  authenticate,
  authorize(['admin', 'moderator']),
  upload.single('image'),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { alt, caption } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Process image
      const mediaId = uuidv4();
      const processed = await processEventImage(req.file, mediaId, eventId);

      // Save to database
      const eventMedia = await database.create('eventMedia', {
        id: mediaId,
        eventId,
        type: 'main',
        original: {
          filename: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          ...processed.original
        },
        processed: processed.variants,
        metadata: { alt, caption },
        uploadedBy: req.user.id,
        createdAt: new Date()
      });

      // Update event
      await database.update('events', eventId, {
        'media.mainImage': {
          id: mediaId,
          url: processed.variants.medium.url,
          alt,
          aspectRatio: processed.aspectRatio
        }
      });

      res.json({
        success: true,
        media: eventMedia,
        urls: processed.variants
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

async function processEventImage(file, mediaId, eventId) {
  const image = sharp(file.buffer);
  const metadata = await image.metadata();

  const baseDir = `public/uploads/events/${eventId}`;
  await fs.mkdir(baseDir, { recursive: true });

  const variants = {};
  const sizes = ['thumbnail', 'medium', 'large'];
  const dimensions = {
    thumbnail: { width: 300, height: 200 },
    medium: { width: 800, height: 600 },
    large: { width: 1200, height: 800 }
  };

  for (const size of sizes) {
    const { width, height } = dimensions[size];
    const filename = `${mediaId}-${size}.jpg`;
    const webpFilename = `${mediaId}-${size}.webp`;
    const filepath = path.join(baseDir, filename);
    const webpPath = path.join(baseDir, webpFilename);

    // Generate JPEG
    await image
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toFile(filepath);

    // Generate WebP
    await image
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 4 })
      .toFile(webpPath);

    variants[size] = {
      url: `/uploads/events/${eventId}/${filename}`,
      path: filepath,
      size: (await fs.stat(filepath)).size
    };

    variants[size].webp = `/uploads/events/${eventId}/${webpFilename}`;
  }

  return {
    original: {
      dimensions: { width: metadata.width, height: metadata.height },
      url: variants.large.url,
      path: variants.large.path
    },
    variants,
    aspectRatio:
      metadata.width / metadata.height > 1.5
        ? '16:9'
        : metadata.width / metadata.height > 1.2
          ? '4:3'
          : 'square'
  };
}
```

---

## 📱 **5. レスポンシブ画像システム**

### **5.1 Picture要素の活用**

```html
<!-- Event Card with Responsive Images -->
<picture class="event-image">
  <!-- WebP support -->
  <source
    media="(min-width: 768px)"
    srcset="
      /uploads/events/123/abc-large.webp  1200w,
      /uploads/events/123/abc-medium.webp  800w
    "
    type="image/webp"
  />

  <source
    media="(max-width: 767px)"
    srcset="
      /uploads/events/123/abc-medium.webp    800w,
      /uploads/events/123/abc-thumbnail.webp 300w
    "
    type="image/webp"
  />

  <!-- JPEG fallback -->
  <source
    media="(min-width: 768px)"
    srcset="
      /uploads/events/123/abc-large.jpg  1200w,
      /uploads/events/123/abc-medium.jpg  800w
    "
  />

  <source
    media="(max-width: 767px)"
    srcset="
      /uploads/events/123/abc-medium.jpg    800w,
      /uploads/events/123/abc-thumbnail.jpg 300w
    "
  />

  <!-- Default fallback -->
  <img
    src="/uploads/events/123/abc-medium.jpg"
    alt="Lightning Talk Event: JavaScript最新動向"
    class="event-main-image"
    loading="lazy"
  />
</picture>
```

### **5.2 LazyLoading実装**

```javascript
// Intersection Observer for lazy loading
class ImageLazyLoader {
  constructor() {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      { threshold: 0.1, rootMargin: '50px' }
    );

    this.init();
  }

  init() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(img => this.observer.observe(img));
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        this.observer.unobserve(img);
      }
    });
  }

  loadImage(img) {
    // Add loading animation
    img.classList.add('loading');

    // Load actual image
    const actualImg = new Image();
    actualImg.onload = () => {
      img.src = actualImg.src;
      img.classList.remove('loading');
      img.classList.add('loaded');
    };

    actualImg.onerror = () => {
      img.classList.add('error');
      img.src = '/images/placeholder-error.svg';
    };

    actualImg.src = img.dataset.src || img.src;
  }
}

// Initialize lazy loader
new ImageLazyLoader();
```

---

この包括的なブランド&メディアシステム仕様により、Lightning Talk
Circleの視覚的統一性とユーザーエクスペリエンスが大幅に向上します。次は地図・連絡・通知機能の統合設計に進みましょうか？
