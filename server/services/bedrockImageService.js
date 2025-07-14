/**
 * AWS Bedrock Image Generation Service
 * Implements AI image generation using AWS Bedrock Claude 3 and Stable Diffusion
 */

import { createLogger } from '../utils/logger.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const logger = createLogger('BedrockImageService');

// AWS SDK imports (conditional loading)
let BedrockRuntime = null;
let InvokeModelCommand = null;
let S3Client = null;
let PutObjectCommand = null;

try {
  const awsClientBedrock = await import('@aws-sdk/client-bedrock-runtime');
  BedrockRuntime = awsClientBedrock.BedrockRuntimeClient;
  InvokeModelCommand = awsClientBedrock.InvokeModelCommand;

  const awsClientS3 = await import('@aws-sdk/client-s3');
  S3Client = awsClientS3.S3Client;
  PutObjectCommand = awsClientS3.PutObjectCommand;
} catch (error) {
  logger.warn('AWS SDK not available - Bedrock features will be disabled', error.message);
}

class BedrockImageService {
  constructor() {
    this.isEnabled = false;
    this.bedrockClient = null;
    this.s3Client = null;
    this.modelConfig = {
      // Stable Diffusion XL on Bedrock
      imageModel: 'stability.stable-diffusion-xl-v1',
      // Claude 3 for prompt enhancement
      textModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
      region: process.env.AWS_REGION || 'us-east-1'
    };
    this.s3Config = {
      bucketName: process.env.S3_BUCKET_AI_IMAGES || 'lightningtalk-ai-images',
      prefix: 'generated-images/'
    };
    this.init();
  }

  async init() {
    try {
      if (!BedrockRuntime || !S3Client) {
        logger.warn('AWS SDK not available - Bedrock image generation disabled');
        return;
      }

      // Initialize Bedrock client
      this.bedrockClient = new BedrockRuntime({
        region: this.modelConfig.region
      });

      // Initialize S3 client
      this.s3Client = new S3Client({
        region: this.modelConfig.region
      });

      // Check if Bedrock is accessible
      await this.checkBedrockAvailability();

      this.isEnabled = true;
      logger.info('Bedrock Image Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Bedrock Image Service:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Check if Bedrock is available and accessible
   */
  async checkBedrockAvailability() {
    try {
      // Test with a simple Claude 3 request
      const testPrompt = {
        modelId: this.modelConfig.textModel,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Hello'
            }
          ]
        })
      };

      await this.bedrockClient.send(new InvokeModelCommand(testPrompt));
      logger.info('Bedrock availability check passed');
      return true;
    } catch (error) {
      logger.error('Bedrock availability check failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate image using AWS Bedrock
   */
  async generateImage(generation) {
    const startTime = Date.now();

    try {
      if (!this.isEnabled) {
        throw new Error('Bedrock image generation is not available');
      }

      // Enhance prompt using Claude 3
      const enhancedPrompt = await this.enhancePromptWithClaude(generation);

      // Generate image with Stable Diffusion XL
      const imageData = await this.generateWithStableDiffusion(enhancedPrompt, generation);

      // Process and save image
      const imageUrl = await this.processAndSaveImage(imageData, generation);

      const generationTime = Date.now() - startTime;

      logger.info(`Image generated successfully in ${generationTime}ms`);

      return {
        success: true,
        imageUrl,
        enhancedPrompt,
        generationTime,
        model: this.modelConfig.imageModel
      };
    } catch (error) {
      logger.error('Bedrock image generation failed:', error);
      return {
        success: false,
        error: error.message,
        generationTime: Date.now() - startTime
      };
    }
  }

  /**
   * Enhance prompt using Claude 3
   */
  async enhancePromptWithClaude(generation) {
    try {
      const systemPrompt = `You are an expert at creating detailed image generation prompts for Stable Diffusion XL. 
Your task is to enhance the user's prompt by adding artistic details, style descriptions, and technical parameters 
while maintaining their original intent. Focus on visual elements, composition, lighting, and style.`;

      const userMessage = `Please enhance this image generation prompt for a ${generation.template || 'general'} image:
"${generation.prompt}"

Additional context:
- Size: ${generation.size}
- Quality: ${generation.quality}
- Style preference: ${generation.style || 'modern professional'}`;

      const request = {
        modelId: this.modelConfig.textModel,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 300,
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ]
        })
      };

      const response = await this.bedrockClient.send(new InvokeModelCommand(request));
      const responseData = JSON.parse(new TextDecoder().decode(response.body));

      const enhancedPrompt = responseData.content[0].text;
      logger.info('Prompt enhanced successfully with Claude 3');

      return enhancedPrompt;
    } catch (error) {
      logger.error('Failed to enhance prompt with Claude:', error);
      // Fallback to original prompt
      return generation.prompt;
    }
  }

  /**
   * Generate image using Stable Diffusion XL on Bedrock
   */
  async generateWithStableDiffusion(prompt, generation) {
    try {
      // Parse size dimensions
      const [width, height] = generation.size.split('x').map(Number);

      const request = {
        modelId: this.modelConfig.imageModel,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1.0
            }
          ],
          cfg_scale: generation.quality === 'hd' ? 8 : 7,
          seed: Math.floor(Math.random() * 1000000),
          steps: generation.quality === 'hd' ? 50 : 30,
          width: width,
          height: height,
          style_preset: this.mapStylePreset(generation.style)
        })
      };

      const response = await this.bedrockClient.send(new InvokeModelCommand(request));
      const responseData = JSON.parse(new TextDecoder().decode(response.body));

      if (responseData.artifacts && responseData.artifacts.length > 0) {
        // Return base64 image data
        return responseData.artifacts[0].base64;
      } else {
        throw new Error('No image generated');
      }
    } catch (error) {
      logger.error('Failed to generate image with Stable Diffusion:', error);
      throw error;
    }
  }

  /**
   * Map style to Stable Diffusion style preset
   */
  mapStylePreset(style) {
    const styleMap = {
      modern: 'digital-art',
      vibrant: 'neon-punk',
      corporate: 'photographic',
      creative: 'fantasy-art',
      minimalist: 'low-poly',
      tech: 'isometric',
      professional: 'photographic'
    };

    return styleMap[style] || 'digital-art';
  }

  /**
   * Process and save image to S3
   */
  async processAndSaveImage(base64Data, generation) {
    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Process with Sharp
      const processedBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 90, progressive: true })
        .toBuffer();

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${generation.id}-${timestamp}.jpg`;
      const s3Key = `${this.s3Config.prefix}${filename}`;

      // Upload to S3
      const uploadParams = {
        Bucket: this.s3Config.bucketName,
        Key: s3Key,
        Body: processedBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          userId: generation.userId,
          template: generation.template || 'custom',
          generatedAt: new Date().toISOString()
        }
      };

      await this.s3Client.send(new PutObjectCommand(uploadParams));

      // Return CloudFront URL or S3 URL
      const imageUrl = `https://${this.s3Config.bucketName}.s3.${this.modelConfig.region}.amazonaws.com/${s3Key}`;

      logger.info(`Image saved to S3: ${s3Key}`);

      return imageUrl;
    } catch (error) {
      logger.error('Failed to process and save image:', error);
      throw error;
    }
  }

  /**
   * Estimate cost for generation
   */
  calculateCost(generation) {
    // AWS Bedrock pricing (approximate per 1000 steps)
    // Stable Diffusion XL: $0.036 per image (512x512, 50 steps)
    const baseCost = 0.036;

    // Adjust for size
    const [width, height] = generation.size.split('x').map(Number);
    const pixels = width * height;
    const basePixels = 512 * 512;
    const sizeMultiplier = pixels / basePixels;

    // Adjust for quality (more steps)
    const qualityMultiplier = generation.quality === 'hd' ? 1.5 : 1.0;

    // Claude 3 prompt enhancement cost (minimal)
    const claudeCost = 0.001;

    return baseCost * sizeMultiplier * qualityMultiplier + claudeCost;
  }

  /**
   * List available models
   */
  async getAvailableModels() {
    return {
      imageModels: [
        {
          id: 'stability.stable-diffusion-xl-v1',
          name: 'Stable Diffusion XL',
          provider: 'Stability AI',
          capabilities: ['text-to-image'],
          maxResolution: '1024x1024',
          status: this.isEnabled ? 'available' : 'unavailable'
        }
      ],
      textModels: [
        {
          id: 'anthropic.claude-3-sonnet-20240229-v1:0',
          name: 'Claude 3 Sonnet',
          provider: 'Anthropic',
          capabilities: ['prompt-enhancement'],
          status: this.isEnabled ? 'available' : 'unavailable'
        }
      ]
    };
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      region: this.modelConfig.region,
      models: {
        image: this.modelConfig.imageModel,
        text: this.modelConfig.textModel
      },
      s3: {
        bucket: this.s3Config.bucketName,
        configured: !!this.s3Client
      },
      features: {
        promptEnhancement: this.isEnabled,
        imageGeneration: this.isEnabled,
        s3Storage: !!this.s3Client
      }
    };
  }
}

// Export singleton instance
const bedrockImageService = new BedrockImageService();
export { bedrockImageService };
export default bedrockImageService;
