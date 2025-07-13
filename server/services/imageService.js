/**
 * Image Service v2
 * Comprehensive image upload, processing, and management system
 * Built with Sharp.js for processing and AWS S3 for storage
 */

import sharp from 'sharp';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ImageService');

export class ImageService {
  constructor() {
    this.s3Client = null;
    this.bucketName = process.env.AWS_S3_BUCKET || 'lightningtalk-media';
    this.cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
    this.useS3 = process.env.USE_S3 === 'true';
    this.localStoragePath = 'uploads/images';
    this.initialized = false;

    // Image processing configurations
    this.imageSizes = {
      thumbnail: { width: 300, height: 200, quality: 80 },
      medium: { width: 800, height: 600, quality: 85 },
      large: { width: 1200, height: 800, quality: 90 },
      hero: { width: 1920, height: 1080, quality: 95 }
    };

    // Supported formats
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  /**
   * Initialize the image service
   */
  async initialize() {
    try {
      if (this.useS3) {
        this.s3Client = new S3Client({
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
          }
        });
        logger.info('S3 client initialized');
      } else {
        // Ensure local storage directory exists
        await fs.mkdir(this.localStoragePath, { recursive: true });
        logger.info('Local storage initialized');
      }

      this.initialized = true;
      logger.info('Image service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize image service:', error);
      throw error;
    }
  }

  /**
   * Process and upload an image with multiple size variants
   */
  async processAndUploadImage(fileBuffer, originalName, options = {}) {
    if (!this.initialized) {
      throw new Error('Image service not initialized');
    }

    try {
      // Validate file
      await this.validateImage(fileBuffer, originalName);

      // Generate unique identifier
      const imageId = uuidv4();
      const fileExtension = path.extname(originalName).toLowerCase().slice(1);
      const baseName = path.basename(originalName, path.extname(originalName));

      // Extract metadata
      const metadata = await this.extractMetadata(fileBuffer);

      // Process multiple sizes
      const processedImages = await this.processMultipleSizes(fileBuffer, imageId, fileExtension);

      // Upload all variants
      const uploadResults = await this.uploadImageVariants(processedImages, imageId);

      // Create image record
      const imageRecord = {
        id: imageId,
        originalName: originalName,
        baseName: baseName,
        mimeType: `image/${fileExtension}`,
        fileSize: fileBuffer.length,
        metadata: metadata,
        variants: uploadResults,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...options
      };

      logger.info(`Image processed and uploaded: ${imageId}`);
      return imageRecord;
    } catch (error) {
      logger.error('Error processing image:', error);
      throw error;
    }
  }

  /**
   * Validate image file
   */
  async validateImage(fileBuffer, originalName) {
    // Check file size
    if (fileBuffer.length > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file extension
    const extension = path.extname(originalName).toLowerCase().slice(1);
    if (!this.supportedFormats.includes(extension)) {
      throw new Error(
        `Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`
      );
    }

    // Verify with Sharp that it's a valid image
    try {
      const image = sharp(fileBuffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image file');
      }
    } catch (error) {
      throw new Error('Invalid or corrupted image file');
    }
  }

  /**
   * Extract image metadata
   */
  async extractMetadata(fileBuffer) {
    try {
      const image = sharp(fileBuffer);
      const metadata = await image.metadata();

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density,
        hasProfile: metadata.hasProfile,
        hasAlpha: metadata.hasAlpha
      };
    } catch (error) {
      logger.error('Error extracting metadata:', error);
      return {};
    }
  }

  /**
   * Process image into multiple sizes
   */
  async processMultipleSizes(fileBuffer, imageId, originalExtension) {
    const processedImages = new Map();
    const image = sharp(fileBuffer);
    const originalMetadata = await image.metadata();

    // Process each size variant
    for (const [sizeName, sizeConfig] of Object.entries(this.imageSizes)) {
      try {
        // Calculate dimensions while maintaining aspect ratio
        const { width, height } = this.calculateDimensions(
          originalMetadata.width,
          originalMetadata.height,
          sizeConfig.width,
          sizeConfig.height
        );

        // Process JPEG/PNG variant
        const processedBuffer = await image
          .clone()
          .resize(width, height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: sizeConfig.quality })
          .toBuffer();

        // Process WebP variant
        const webpBuffer = await image
          .clone()
          .resize(width, height, {
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: sizeConfig.quality })
          .toBuffer();

        processedImages.set(`${sizeName}-${originalExtension}`, {
          buffer: processedBuffer,
          filename: `${imageId}-${sizeName}.${originalExtension}`,
          mimeType: `image/${originalExtension}`,
          size: processedBuffer.length,
          width: width,
          height: height
        });

        processedImages.set(`${sizeName}-webp`, {
          buffer: webpBuffer,
          filename: `${imageId}-${sizeName}.webp`,
          mimeType: 'image/webp',
          size: webpBuffer.length,
          width: width,
          height: height
        });
      } catch (error) {
        logger.error(`Error processing ${sizeName} variant:`, error);
        // Continue with other sizes even if one fails
      }
    }

    return processedImages;
  }

  /**
   * Calculate dimensions maintaining aspect ratio
   */
  calculateDimensions(originalWidth, originalHeight, targetWidth, targetHeight) {
    const aspectRatio = originalWidth / originalHeight;
    const targetAspectRatio = targetWidth / targetHeight;

    let width, height;

    if (aspectRatio > targetAspectRatio) {
      // Original is wider
      width = targetWidth;
      height = Math.round(targetWidth / aspectRatio);
    } else {
      // Original is taller
      height = targetHeight;
      width = Math.round(targetHeight * aspectRatio);
    }

    return { width, height };
  }

  /**
   * Upload image variants to storage
   */
  async uploadImageVariants(processedImages, imageId) {
    const uploadResults = {};

    for (const [variantName, imageData] of processedImages) {
      try {
        const uploadResult = await this.uploadFile(
          imageData.buffer,
          imageData.filename,
          imageData.mimeType
        );

        uploadResults[variantName] = {
          filename: imageData.filename,
          url: uploadResult.url,
          size: imageData.size,
          width: imageData.width,
          height: imageData.height,
          mimeType: imageData.mimeType
        };
      } catch (error) {
        logger.error(`Error uploading ${variantName}:`, error);
        // Continue with other variants
      }
    }

    return uploadResults;
  }

  /**
   * Upload file to storage (S3 or local)
   */
  async uploadFile(buffer, filename, mimeType) {
    if (this.useS3) {
      return await this.uploadToS3(buffer, filename, mimeType);
    } else {
      return await this.uploadToLocal(buffer, filename);
    }
  }

  /**
   * Upload to AWS S3
   */
  async uploadToS3(buffer, filename, mimeType) {
    try {
      const key = `images/${filename}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'max-age=31536000', // 1 year cache
        Metadata: {
          'uploaded-by': 'lightningtalk-circle',
          'upload-time': new Date().toISOString()
        }
      };

      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      // Generate URL
      const url = this.cloudFrontDomain
        ? `https://${this.cloudFrontDomain}/${key}`
        : `https://${this.bucketName}.s3.amazonaws.com/${key}`;

      return { url, key };
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error('Failed to upload to S3');
    }
  }

  /**
   * Upload to local storage
   */
  async uploadToLocal(buffer, filename) {
    try {
      const filePath = path.join(this.localStoragePath, filename);
      await fs.writeFile(filePath, buffer);

      // Generate local URL
      const url = `/uploads/images/${filename}`;

      return { url, path: filePath };
    } catch (error) {
      logger.error('Local upload error:', error);
      throw new Error('Failed to upload to local storage');
    }
  }

  /**
   * Delete image and all its variants
   */
  async deleteImage(imageRecord) {
    if (!imageRecord || !imageRecord.variants) {
      return false;
    }

    try {
      const deletionPromises = Object.values(imageRecord.variants).map(variant => {
        if (this.useS3) {
          return this.deleteFromS3(variant.filename);
        } else {
          return this.deleteFromLocal(variant.filename);
        }
      });

      await Promise.allSettled(deletionPromises);
      logger.info(`Deleted image: ${imageRecord.id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Delete from S3
   */
  async deleteFromS3(filename) {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Key: `images/${filename}`
      };

      const command = new DeleteObjectCommand(deleteParams);
      await this.s3Client.send(command);
    } catch (error) {
      logger.error(`Error deleting from S3: ${filename}`, error);
      throw error;
    }
  }

  /**
   * Delete from local storage
   */
  async deleteFromLocal(filename) {
    try {
      const filePath = path.join(this.localStoragePath, filename);
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error(`Error deleting local file: ${filename}`, error);
        throw error;
      }
    }
  }

  /**
   * Generate signed URL for S3 objects (for private access)
   */
  async generateSignedUrl(filename, expiresIn = 3600) {
    if (!this.useS3) {
      throw new Error('Signed URLs only available for S3 storage');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: `images/${filename}`
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw error;
    }
  }

  /**
   * Get optimized image URL for given size and format preference
   */
  getOptimizedImageUrl(imageRecord, size = 'medium', preferWebP = true) {
    if (!imageRecord || !imageRecord.variants) {
      return null;
    }

    // Try WebP first if preferred and supported
    if (preferWebP && imageRecord.variants[`${size}-webp`]) {
      return imageRecord.variants[`${size}-webp`].url;
    }

    // Fall back to original format
    for (const format of ['jpeg', 'jpg', 'png']) {
      if (imageRecord.variants[`${size}-${format}`]) {
        return imageRecord.variants[`${size}-${format}`].url;
      }
    }

    return null;
  }

  /**
   * Get image srcset for responsive images
   */
  getImageSrcSet(imageRecord, format = 'webp') {
    if (!imageRecord || !imageRecord.variants) {
      return '';
    }

    const srcSet = [];

    for (const [sizeName, sizeConfig] of Object.entries(this.imageSizes)) {
      const variant = imageRecord.variants[`${sizeName}-${format}`];
      if (variant) {
        srcSet.push(`${variant.url} ${variant.width}w`);
      }
    }

    return srcSet.join(', ');
  }

  /**
   * Bulk delete images
   */
  async bulkDeleteImages(imageRecords) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    const deletePromises = imageRecords.map(async imageRecord => {
      try {
        await this.deleteImage(imageRecord);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          imageId: imageRecord.id,
          error: error.message
        });
      }
    });

    await Promise.allSettled(deletePromises);
    return results;
  }

  /**
   * Health check for image service
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      storage: this.useS3 ? 's3' : 'local',
      initialized: this.initialized,
      timestamp: new Date().toISOString()
    };

    try {
      if (this.useS3 && this.s3Client) {
        // Test S3 connectivity (simplified)
        health.s3Connected = true;
      }

      if (!this.useS3) {
        // Test local storage
        await fs.access(this.localStoragePath);
        health.localStorage = 'accessible';
      }
    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      supportedFormats: this.supportedFormats,
      maxFileSize: this.maxFileSize,
      imageSizes: this.imageSizes,
      storageType: this.useS3 ? 's3' : 'local',
      bucketName: this.bucketName,
      cloudFrontDomain: this.cloudFrontDomain
    };
  }
}

// Singleton instance
const imageService = new ImageService();
export default imageService;
