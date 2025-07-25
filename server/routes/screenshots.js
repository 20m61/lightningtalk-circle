/**
 * Lightning Talk Circle - Screenshot API Routes
 * PR用スクリーンショット管理API
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { Octokit } from '@octokit/rest';

const router = express.Router();

// Rate limiting for screenshot uploads
const screenshotUploadLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes
  message: {
    error: 'Too many screenshot uploads, please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for PR comments
const prCommentLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 comments per 5 minutes
  message: {
    error: 'Too many PR comments, please try again later',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Initialize AWS Lambda client
const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'ap-northeast-1'
});

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

/**
 * Get presigned URL for screenshot upload
 * POST /api/screenshots/upload-url
 */
router.post(
  '/upload-url',
  screenshotUploadLimit,
  [
    body('fileName')
      .isString()
      .isLength({ min: 1, max: 255 })
      .matches(/^[a-zA-Z0-9._-]+$/)
      .withMessage('Invalid file name format'),
    body('contentType')
      .isString()
      .isIn(['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'])
      .withMessage('Invalid content type'),
    body('prNumber').isInt({ min: 1 }).withMessage('Valid PR number is required'),
    body('userId').isString().isLength({ min: 1, max: 100 }).withMessage('User ID is required')
  ],
  async(req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { fileName, contentType, prNumber, userId } = req.body;

      // Get Lambda function ARN from environment or SSM
      const functionName =
        process.env.PRESIGNED_URL_FUNCTION_NAME ||
        `lightningtalk-circle-${process.env.NODE_ENV || 'dev'}-presigned-url`;

      // Invoke Lambda function
      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/upload-url',
          body: JSON.stringify({
            fileName,
            contentType,
            prNumber,
            userId
          })
        })
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      if (payload.statusCode !== 200) {
        const errorData = JSON.parse(payload.body);
        return res.status(payload.statusCode).json(errorData);
      }

      const result = JSON.parse(payload.body);

      console.log('Presigned URL generated successfully', {
        fileName,
        prNumber,
        userId,
        fileKey: result.data.fileKey
      });

      res.json(result);
    } catch (error) {
      console.error('Failed to generate presigned URL', error);
      res.status(500).json({
        error: 'Failed to generate presigned URL',
        message: error.message
      });
    }
  }
);

/**
 * Get presigned URL for screenshot download
 * GET /api/screenshots/download-url?fileKey=xxx
 */
router.get(
  '/download-url',
  [
    query('fileKey')
      .isString()
      .isLength({ min: 1, max: 500 })
      .withMessage('Valid file key is required')
  ],
  async(req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { fileKey } = req.query;

      // Get Lambda function ARN from environment
      const functionName =
        process.env.PRESIGNED_URL_FUNCTION_NAME ||
        `lightningtalk-circle-${process.env.NODE_ENV || 'dev'}-presigned-url`;

      // Invoke Lambda function
      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: '/download-url',
          queryStringParameters: { fileKey }
        })
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      if (payload.statusCode !== 200) {
        const errorData = JSON.parse(payload.body);
        return res.status(payload.statusCode).json(errorData);
      }

      const result = JSON.parse(payload.body);

      console.log('Download URL generated successfully', {
        fileKey
      });

      res.json(result);
    } catch (error) {
      console.error('Failed to generate download URL', error);
      res.status(500).json({
        error: 'Failed to generate download URL',
        message: error.message
      });
    }
  }
);

/**
 * Post screenshot to PR as comment
 * POST /api/screenshots/post-to-pr
 */
router.post(
  '/post-to-pr',
  prCommentLimit,
  [
    body('prNumber').isInt({ min: 1 }).withMessage('Valid PR number is required'),
    body('screenshots')
      .isArray({ min: 1, max: 10 })
      .withMessage('Screenshots array is required (1-10 items)'),
    body('screenshots.*.url').isURL().withMessage('Valid screenshot URL is required'),
    body('screenshots.*.filename')
      .isString()
      .isLength({ min: 1, max: 255 })
      .withMessage('Valid filename is required'),
    body('message')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Message too long (max 1000 characters)'),
    body('userId').isString().isLength({ min: 1, max: 100 }).withMessage('User ID is required')
  ],
  async(req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { prNumber, screenshots, message, userId } = req.body;

      // Check if GitHub token is available
      if (!process.env.GITHUB_TOKEN) {
        return res.status(500).json({
          error: 'GitHub integration not configured'
        });
      }

      // Get repository info from environment
      const owner = process.env.GITHUB_OWNER || '20m61';
      const repo = process.env.GITHUB_REPO || 'lightningtalk-circle';

      // Verify PR exists
      try {
        await octokit.rest.pulls.get({
          owner,
          repo,
          pull_number: prNumber
        });
      } catch (error) {
        if (error.status === 404) {
          return res.status(404).json({
            error: 'Pull request not found'
          });
        }
        throw error;
      }

      // Build comment body
      let commentBody = '';

      if (message) {
        commentBody += `${message}\n\n`;
      }

      commentBody += '## 📷 スクリーンショット\n\n';

      screenshots.forEach((screenshot, index) => {
        commentBody += `### ${screenshot.filename}\n`;
        commentBody += `![${screenshot.filename}](${screenshot.url})\n\n`;
      });

      commentBody += `\n---\n*Posted by ${userId} via Lightning Talk Circle Screenshot System*`;

      // Post comment to PR
      const comment = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: commentBody
      });

      console.log('Screenshot comment posted to PR', {
        prNumber,
        commentId: comment.data.id,
        screenshotCount: screenshots.length,
        userId
      });

      res.json({
        success: true,
        data: {
          commentId: comment.data.id,
          commentUrl: comment.data.html_url,
          prNumber,
          screenshotCount: screenshots.length
        }
      });
    } catch (error) {
      console.error('Failed to post screenshot comment to PR', error);
      res.status(500).json({
        error: 'Failed to post comment to PR',
        message: error.message
      });
    }
  }
);

/**
 * List screenshots for a PR
 * GET /api/screenshots/list?prNumber=123
 */
router.get(
  '/list',
  [query('prNumber').isInt({ min: 1 }).withMessage('Valid PR number is required')],
  async(req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { prNumber } = req.query;

      // Get repository info from environment
      const owner = process.env.GITHUB_OWNER || '20m61';
      const repo = process.env.GITHUB_REPO || 'lightningtalk-circle';

      // Get PR comments
      const comments = await octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: prNumber
      });

      // Extract screenshots from comments
      const screenshots = [];
      const screenshotRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

      comments.data.forEach(comment => {
        if (comment.body.includes('Lightning Talk Circle Screenshot System')) {
          let match;
          while ((match = screenshotRegex.exec(comment.body)) !== null) {
            screenshots.push({
              filename: match[1],
              url: match[2],
              commentId: comment.id,
              createdAt: comment.created_at,
              updatedAt: comment.updated_at
            });
          }
        }
      });

      res.json({
        success: true,
        data: {
          prNumber,
          screenshots,
          totalCount: screenshots.length
        }
      });
    } catch (error) {
      console.error('Failed to list screenshots for PR', error);
      res.status(500).json({
        error: 'Failed to list screenshots',
        message: error.message
      });
    }
  }
);

/**
 * Health check for screenshot service
 * GET /api/screenshots/health
 */
router.get('/health', async(req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        lambda: 'unknown',
        s3: 'unknown',
        github: 'unknown'
      }
    };

    // Check Lambda function
    try {
      const functionName =
        process.env.PRESIGNED_URL_FUNCTION_NAME ||
        `lightningtalk-circle-${process.env.NODE_ENV || 'dev'}-presigned-url`;

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: '/health'
        })
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      health.services.lambda = payload.statusCode === 200 ? 'healthy' : 'unhealthy';
    } catch (error) {
      health.services.lambda = 'unhealthy';
    }

    // Check GitHub API
    try {
      if (process.env.GITHUB_TOKEN) {
        await octokit.rest.users.getAuthenticated();
        health.services.github = 'healthy';
      } else {
        health.services.github = 'not_configured';
      }
    } catch (error) {
      health.services.github = 'unhealthy';
    }

    health.services.s3 = 'assumed_healthy'; // S3 is checked via Lambda

    res.json(health);
  } catch (error) {
    console.error('Health check failed', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
