/**
 * Media API Routes
 * HTTP endpoints for image upload, processing, and management
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import { createLogger } from '../utils/logger.js';
import imageService from '../services/imageService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const logger = createLogger('MediaRoutes');

// Rate limiting for media API
const mediaRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 media requests per windowMs
  message: 'Too many media requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
  }
});

// Apply rate limiting to all media routes
router.use(mediaRateLimit);

// Apply authentication to all routes except health check
router.use('/health', (req, res, next) => next());
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     ImageRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique image identifier
 *         originalName:
 *           type: string
 *           description: Original filename
 *         mimeType:
 *           type: string
 *           description: MIME type of the image
 *         fileSize:
 *           type: number
 *           description: File size in bytes
 *         metadata:
 *           type: object
 *           properties:
 *             width:
 *               type: number
 *             height:
 *               type: number
 *             format:
 *               type: string
 *         variants:
 *           type: object
 *           description: Different size variants of the image
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ImageUploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           $ref: '#/components/schemas/ImageRecord'
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /api/media/upload:
 *   post:
 *     summary: Upload and process an image
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, max 10MB)
 *               category:
 *                 type: string
 *                 description: Image category (event, profile, etc.)
 *               alt:
 *                 type: string
 *                 description: Alt text for accessibility
 *               caption:
 *                 type: string
 *                 description: Image caption
 *     responses:
 *       201:
 *         description: Image uploaded and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageUploadResponse'
 *       400:
 *         description: Invalid file or validation error
 *       413:
 *         description: File too large
 *       429:
 *         description: Too many requests
 */
router.post(
  '/upload',
  upload.single('image'),
  [
    body('category')
      .optional()
      .isString()
      .isIn(['event', 'profile', 'speaker', 'general'])
      .withMessage('Category must be one of: event, profile, speaker, general'),
    body('alt')
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage('Alt text must be 200 characters or less'),
    body('caption')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Caption must be 500 characters or less')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      const { category = 'general', alt, caption } = req.body;
      const userId = req.user.id;

      // Process and upload image
      const imageRecord = await imageService.processAndUploadImage(
        req.file.buffer,
        req.file.originalname,
        {
          category,
          alt,
          caption,
          uploadedBy: userId
        }
      );

      res.status(201).json({
        success: true,
        data: imageRecord,
        message: 'Image uploaded and processed successfully'
      });

      logger.info(`Image uploaded by user ${userId}: ${imageRecord.id}`);
    } catch (error) {
      logger.error('Error uploading image:', error);

      if (
        error.message.includes('File size exceeds') ||
        error.message.includes('Unsupported file format')
      ) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to upload image'
      });
    }
  }
);

/**
 * @swagger
 * /api/media/images/{imageId}:
 *   get:
 *     summary: Get image details
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [thumbnail, medium, large, hero]
 *           default: medium
 *         description: Preferred image size
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [webp, jpeg, png]
 *           default: webp
 *         description: Preferred image format
 *     responses:
 *       200:
 *         description: Image details retrieved successfully
 *       404:
 *         description: Image not found
 */
router.get(
  '/images/:imageId',
  [
    param('imageId').isString().notEmpty().withMessage('Image ID is required'),
    query('size')
      .optional()
      .isIn(['thumbnail', 'medium', 'large', 'hero'])
      .withMessage('Size must be one of: thumbnail, medium, large, hero'),
    query('format')
      .optional()
      .isIn(['webp', 'jpeg', 'png'])
      .withMessage('Format must be one of: webp, jpeg, png')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { imageId } = req.params;
      const { size = 'medium', format = 'webp' } = req.query;

      // Get image record from database
      const imageRecord = await req.app.locals.database.read('images', imageId);

      if (!imageRecord) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }

      // Get optimized URL
      const optimizedUrl = imageService.getOptimizedImageUrl(imageRecord, size, format === 'webp');

      // Generate srcset for responsive images
      const srcSet = imageService.getImageSrcSet(imageRecord, format);

      res.json({
        success: true,
        data: {
          ...imageRecord,
          optimizedUrl,
          srcSet,
          requestedSize: size,
          requestedFormat: format
        }
      });
    } catch (error) {
      logger.error('Error getting image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get image'
      });
    }
  }
);

/**
 * @swagger
 * /api/media/images/{imageId}:
 *   delete:
 *     summary: Delete an image
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Image not found
 *       403:
 *         description: Permission denied
 */
router.delete(
  '/images/:imageId',
  [param('imageId').isString().notEmpty().withMessage('Image ID is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { imageId } = req.params;
      const userId = req.user.id;

      // Get image record
      const imageRecord = await req.app.locals.database.read('images', imageId);

      if (!imageRecord) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }

      // Check permissions (user owns the image or is admin)
      if (imageRecord.uploadedBy !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      // Delete from storage
      await imageService.deleteImage(imageRecord);

      // Delete from database
      await req.app.locals.database.delete('images', imageId);

      res.json({
        success: true,
        message: 'Image deleted successfully'
      });

      logger.info(`Image deleted by user ${userId}: ${imageId}`);
    } catch (error) {
      logger.error('Error deleting image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete image'
      });
    }
  }
);

/**
 * @swagger
 * /api/media/images:
 *   get:
 *     summary: List images with filtering and pagination
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [event, profile, speaker, general]
 *         description: Filter by category
 *       - in: query
 *         name: uploadedBy
 *         schema:
 *           type: string
 *         description: Filter by uploader user ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of images to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of images to skip
 *     responses:
 *       200:
 *         description: Images retrieved successfully
 */
router.get(
  '/images',
  [
    query('category')
      .optional()
      .isIn(['event', 'profile', 'speaker', 'general'])
      .withMessage('Category must be one of: event, profile, speaker, general'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
      .withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).toInt().withMessage('Offset must be 0 or greater'),
    query('uploadedBy').optional().isString().withMessage('UploadedBy must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { category, uploadedBy, limit = 20, offset = 0 } = req.query;

      // Build filter
      const filter = {};
      if (category) filter.category = category;
      if (uploadedBy) filter.uploadedBy = uploadedBy;

      // Get images from database
      const images = await req.app.locals.database.find('images', filter);

      // Apply pagination
      const totalCount = images.length;
      const paginatedImages = images
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(offset, offset + limit);

      // Add optimized URLs
      const imagesWithUrls = paginatedImages.map(image => ({
        ...image,
        optimizedUrl: imageService.getOptimizedImageUrl(image),
        thumbnailUrl: imageService.getOptimizedImageUrl(image, 'thumbnail')
      }));

      res.json({
        success: true,
        data: imagesWithUrls,
        pagination: {
          totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error) {
      logger.error('Error listing images:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list images'
      });
    }
  }
);

/**
 * @swagger
 * /api/media/events/{eventId}/image:
 *   post:
 *     summary: Associate an image with an event
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageId
 *             properties:
 *               imageId:
 *                 type: string
 *                 description: Image ID to associate
 *     responses:
 *       200:
 *         description: Image associated with event successfully
 *       404:
 *         description: Event or image not found
 */
router.post(
  '/events/:eventId/image',
  [
    param('eventId').isString().notEmpty().withMessage('Event ID is required'),
    body('imageId').isString().notEmpty().withMessage('Image ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { eventId } = req.params;
      const { imageId } = req.body;
      const userId = req.user.id;

      // Verify event exists
      const event = await req.app.locals.database.read('events', eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // Verify image exists
      const image = await req.app.locals.database.read('images', imageId);
      if (!image) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }

      // Update event with image
      const updatedEvent = await req.app.locals.database.update('events', eventId, {
        mainImage: {
          imageId: imageId,
          url: imageService.getOptimizedImageUrl(image, 'large'),
          thumbnailUrl: imageService.getOptimizedImageUrl(image, 'thumbnail'),
          alt: image.alt || event.title,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          event: updatedEvent,
          image: image
        },
        message: 'Image associated with event successfully'
      });

      logger.info(`Image ${imageId} associated with event ${eventId} by user ${userId}`);
    } catch (error) {
      logger.error('Error associating image with event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to associate image with event'
      });
    }
  }
);

/**
 * @swagger
 * /api/media/bulk/delete:
 *   post:
 *     summary: Bulk delete images
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageIds
 *             properties:
 *               imageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image IDs to delete
 *     responses:
 *       200:
 *         description: Bulk deletion completed
 */
router.post(
  '/bulk/delete',
  [
    body('imageIds')
      .isArray({ min: 1, max: 50 })
      .withMessage('ImageIds must be an array with 1-50 items'),
    body('imageIds.*').isString().notEmpty().withMessage('Each image ID must be a non-empty string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { imageIds } = req.body;
      const userId = req.user.id;

      // Get image records and verify permissions
      const imageRecords = [];
      for (const imageId of imageIds) {
        const image = await req.app.locals.database.read('images', imageId);
        if (image && (image.uploadedBy === userId || req.user.role === 'admin')) {
          imageRecords.push(image);
        }
      }

      // Bulk delete from storage
      const deleteResults = await imageService.bulkDeleteImages(imageRecords);

      // Delete from database
      const dbDeletePromises = imageRecords.map(image =>
        req.app.locals.database.delete('images', image.id)
      );
      await Promise.allSettled(dbDeletePromises);

      res.json({
        success: true,
        data: {
          requested: imageIds.length,
          processed: imageRecords.length,
          ...deleteResults
        },
        message: 'Bulk deletion completed'
      });

      logger.info(
        `Bulk delete by user ${userId}: ${deleteResults.success} success, ${deleteResults.failed} failed`
      );
    } catch (error) {
      logger.error('Error in bulk delete:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform bulk deletion'
      });
    }
  }
);

/**
 * @swagger
 * /api/media/health:
 *   get:
 *     summary: Media service health check
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: Service health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await imageService.healthCheck();
    const stats = imageService.getStats();

    res.json({
      success: true,
      health,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Only one file allowed.'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP files are allowed.'
    });
  }

  logger.error('Media route error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

export default router;
