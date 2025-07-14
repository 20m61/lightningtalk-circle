/**
 * AI-powered Image Generation API Routes v1
 * DALL-E 3 integration with template system for Lightning Talk Circle
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { AIImageService } from '../services/aiImageService.js';
import { getDatabase } from '../services/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const logger = createLogger('AIImages');
const database = getDatabase();

// Rate limiting for AI image generation (more restrictive due to API costs)
const aiImageRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 AI image generations per hour
  message: 'Too many AI image generation requests',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    // Rate limit per authenticated user
    return req.user?.id || req.ip;
  }
});

// Apply rate limiting and authentication
router.use(aiImageRateLimit);
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     AIImageGeneration:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique generation ID
 *         userId:
 *           type: string
 *           description: User who requested generation
 *         eventId:
 *           type: string
 *           description: Associated event ID (optional)
 *         prompt:
 *           type: string
 *           description: AI generation prompt
 *         template:
 *           type: string
 *           description: Template used for generation
 *         style:
 *           type: string
 *           description: Visual style preference
 *         size:
 *           type: string
 *           enum: [1024x1024, 1792x1024, 1024x1792]
 *         quality:
 *           type: string
 *           enum: [standard, hd]
 *         status:
 *           type: string
 *           enum: [pending, generating, completed, failed]
 *         imageUrl:
 *           type: string
 *           description: Generated image URL
 *         revisedPrompt:
 *           type: string
 *           description: DALL-E revised prompt
 *         metadata:
 *           type: object
 *           description: Generation metadata
 *         createdAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/ai-images/templates:
 *   get:
 *     summary: Get available AI image templates
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [event-poster, social-media, presentation, banner, logo]
 *         description: Filter templates by category
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 */
router.get(
  '/templates',
  [
    query('category')
      .optional()
      .isIn(['event-poster', 'social-media', 'presentation', 'banner', 'logo'])
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

      const { category } = req.query;
      const templates = await AIImageService.getTemplates(category);

      res.json({
        success: true,
        data: templates
      });

      logger.info(`AI image templates retrieved by user ${req.user.id}`);
    } catch (error) {
      logger.error('Error retrieving AI image templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve templates'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai-images/generate:
 *   post:
 *     summary: Generate AI image using DALL-E 3
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *               - template
 *             properties:
 *               prompt:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               template:
 *                 type: string
 *               eventId:
 *                 type: string
 *               style:
 *                 type: string
 *                 enum: [natural, vivid]
 *               size:
 *                 type: string
 *                 enum: [1024x1024, 1792x1024, 1024x1792]
 *               quality:
 *                 type: string
 *                 enum: [standard, hd]
 *               customizations:
 *                 type: object
 */
router.post(
  '/generate',
  [
    body('prompt')
      .isString()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Prompt must be 10-1000 characters'),
    body('template').isString().notEmpty().withMessage('Template is required'),
    body('eventId').optional().isString(),
    body('style')
      .optional()
      .isIn(['natural', 'vivid'])
      .withMessage('Style must be natural or vivid'),
    body('size')
      .optional()
      .isIn(['1024x1024', '1792x1024', '1024x1792'])
      .withMessage('Invalid image size'),
    body('quality')
      .optional()
      .isIn(['standard', 'hd'])
      .withMessage('Quality must be standard or hd'),
    body('customizations').optional().isObject()
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

      const userId = req.user.id;
      const {
        prompt,
        template,
        eventId,
        style = 'vivid',
        size = '1024x1024',
        quality = 'standard',
        customizations = {}
      } = req.body;

      // Verify template exists
      const templateData = await AIImageService.getTemplate(template);
      if (!templateData) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Verify event if provided
      if (eventId) {
        const event = await req.app.locals.database.read('events', eventId);
        if (!event) {
          return res.status(404).json({
            success: false,
            error: 'Event not found'
          });
        }
      }

      // Check user's daily generation limit
      const dailyLimit = await AIImageService.checkDailyLimit(userId);
      if (!dailyLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: `Daily generation limit exceeded. Limit: ${dailyLimit.limit}, used: ${dailyLimit.used}`
        });
      }

      // Create generation request
      const generationId = `ai_img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const generation = {
        id: generationId,
        userId,
        eventId: eventId || null,
        prompt: prompt.trim(),
        template,
        style,
        size,
        quality,
        customizations,
        status: 'pending',
        imageUrl: null,
        revisedPrompt: null,
        metadata: {
          templateData,
          apiVersion: 'dall-e-3'
        },
        createdAt: new Date(),
        completedAt: null
      };

      // Save generation request to database
      await database.create('aiImageGenerations', generation);

      // Start async generation process
      AIImageService.generateImage(generation)
        .then(async result => {
          // Update generation with result
          generation.status = result.success ? 'completed' : 'failed';
          generation.imageUrl = result.imageUrl;
          generation.revisedPrompt = result.revisedPrompt;
          generation.completedAt = new Date();
          generation.metadata.generation_time = result.generationTime;
          generation.metadata.cost = result.cost;

          await database.update('aiImageGenerations', generationId, generation);

          // Broadcast completion via WebSocket
          if (req.app.locals.websocketService) {
            req.app.locals.websocketService.sendToSocket(req.user.socketId, 'aiImageGenerated', {
              generationId,
              status: generation.status,
              imageUrl: generation.imageUrl,
              timestamp: new Date().toISOString()
            });
          }

          logger.info(`AI image generation completed: ${generationId}`);
        })
        .catch(async error => {
          // Update generation with error
          generation.status = 'failed';
          generation.metadata.error = error.message;
          generation.completedAt = new Date();

          await database.update('aiImageGenerations', generationId, generation);

          logger.error(`AI image generation failed: ${generationId}`, error);
        });

      res.status(202).json({
        success: true,
        data: {
          generationId,
          status: 'pending',
          estimatedTime: '30-60 seconds'
        },
        message: 'AI image generation started'
      });

      logger.info(`AI image generation started: ${generationId} by user ${userId}`);
    } catch (error) {
      logger.error('Error starting AI image generation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start image generation'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai-images/generations/{generationId}:
 *   get:
 *     summary: Get AI image generation status
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: generationId
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  '/generations/:generationId',
  [param('generationId').isString().notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { generationId } = req.params;
      const userId = req.user.id;

      const generation = await req.app.locals.database.read('aiImageGenerations', generationId);
      if (!generation) {
        return res.status(404).json({
          success: false,
          error: 'Generation not found'
        });
      }

      // Check ownership
      if (generation.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      res.json({
        success: true,
        data: generation
      });

      logger.info(`AI image generation status retrieved: ${generationId}`);
    } catch (error) {
      logger.error('Error retrieving generation status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve generation status'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai-images/generations:
 *   get:
 *     summary: Get user's AI image generations
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, generating, completed, failed]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *           minimum: 0
 */
router.get(
  '/generations',
  [
    query('status').optional().isIn(['pending', 'generating', 'completed', 'failed']),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
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

      const userId = req.user.id;
      const { status, limit = 20, offset = 0 } = req.query;

      // Build query
      const queryParams = { userId };
      if (status) {
        queryParams.status = status;
      }

      // Get generations from database
      let generations = await database.query('aiImageGenerations', queryParams);

      // Sort by creation date (newest first)
      generations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply pagination
      const total = generations.length;
      generations = generations.slice(offset, offset + limit);

      res.json({
        success: true,
        data: generations,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });

      logger.info(`AI image generations retrieved for user ${userId}: ${generations.length} items`);
    } catch (error) {
      logger.error('Error retrieving AI image generations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve generations'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai-images/variations:
 *   post:
 *     summary: Generate variations of existing image
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - generationId
 *             properties:
 *               generationId:
 *                 type: string
 *               variations:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 4
 *               style:
 *                 type: string
 *                 enum: [natural, vivid]
 */
router.post(
  '/variations',
  [
    body('generationId').isString().notEmpty().withMessage('Generation ID is required'),
    body('variations').optional().isInt({ min: 1, max: 4 }).withMessage('Variations must be 1-4'),
    body('style').optional().isIn(['natural', 'vivid'])
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

      const userId = req.user.id;
      const { generationId, variations = 2, style = 'vivid' } = req.body;

      // Get original generation
      const originalGeneration = await req.app.locals.database.read(
        'aiImageGenerations',
        generationId
      );
      if (!originalGeneration) {
        return res.status(404).json({
          success: false,
          error: 'Original generation not found'
        });
      }

      // Check ownership
      if (originalGeneration.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      // Check if original generation is completed
      if (originalGeneration.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Original generation must be completed'
        });
      }

      // Check daily limit
      const dailyLimit = await AIImageService.checkDailyLimit(userId);
      if (dailyLimit.remaining < variations) {
        return res.status(429).json({
          success: false,
          error: `Insufficient daily limit. Need: ${variations}, available: ${dailyLimit.remaining}`
        });
      }

      // Generate variations
      const variationPromises = [];
      for (let i = 0; i < variations; i++) {
        const variationId = `ai_var_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        const variation = {
          id: variationId,
          userId,
          eventId: originalGeneration.eventId,
          prompt: originalGeneration.prompt,
          template: originalGeneration.template,
          style,
          size: originalGeneration.size,
          quality: originalGeneration.quality,
          customizations: originalGeneration.customizations,
          status: 'pending',
          imageUrl: null,
          revisedPrompt: null,
          metadata: {
            ...originalGeneration.metadata,
            isVariation: true,
            originalGenerationId: generationId,
            variationIndex: i + 1
          },
          createdAt: new Date(),
          completedAt: null
        };

        await req.app.locals.database.create('aiImageGenerations', variation);
        variationPromises.push(AIImageService.generateImage(variation));
      }

      // Start async variation generation
      Promise.allSettled(variationPromises).then(async results => {
        // Process each variation result
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const variationId = `ai_var_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;

          // Update variation with result
          const variation = await req.app.locals.database.read('aiImageGenerations', variationId);
          if (variation) {
            variation.status =
              result.status === 'fulfilled' && result.value.success ? 'completed' : 'failed';
            variation.imageUrl = result.status === 'fulfilled' ? result.value.imageUrl : null;
            variation.revisedPrompt =
              result.status === 'fulfilled' ? result.value.revisedPrompt : null;
            variation.completedAt = new Date();

            await req.app.locals.database.update('aiImageGenerations', variationId, variation);
          }
        }

        logger.info(`AI image variations completed for generation ${generationId}`);
      });

      res.status(202).json({
        success: true,
        data: {
          originalGenerationId: generationId,
          variationCount: variations,
          status: 'generating'
        },
        message: 'AI image variations generation started'
      });

      logger.info(`AI image variations started for generation ${generationId} by user ${userId}`);
    } catch (error) {
      logger.error('Error generating AI image variations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate variations'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai-images/status:
 *   get:
 *     summary: Get AI image generation service status
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 */
router.get('/status', async (req, res) => {
  try {
    // Check if AI image service is enabled
    const serviceEnabled = AIImageService.isEnabled;

    // Check Bedrock status if available
    let bedrockStatus = null;
    if (AIImageService.bedrockService) {
      bedrockStatus = AIImageService.bedrockService.getStatus();
    }

    const status = {
      enabled: serviceEnabled,
      service: 'AWS Bedrock',
      bedrock: bedrockStatus,
      features: {
        templates: true,
        customization: true,
        variations: false, // Variations not supported in Bedrock mode
        history: true,
        rateLimit: true
      },
      limits: AIImageService.dailyLimits,
      models: bedrockStatus?.models || {},
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: status
    });

    logger.info('AI image service status checked');
  } catch (error) {
    logger.error('Error checking AI image service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check service status'
    });
  }
});

/**
 * @swagger
 * /api/ai-images/usage:
 *   get:
 *     summary: Get user's AI image generation usage statistics
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 */
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user.id;
    const usage = await AIImageService.getUserUsage(userId);

    res.json({
      success: true,
      data: usage
    });

    logger.info(`AI image usage retrieved for user ${userId}`);
  } catch (error) {
    logger.error('Error retrieving AI image usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve usage statistics'
    });
  }
});

export default router;
