/**
 * Lightning Talk Circle - Presigned URL Generator
 * PR スクリーンショット用の署名付きURL生成Lambda関数
 */

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

// Environment variables
const BUCKET_NAME = process.env.BUCKET_NAME;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
const EXPIRY_SECONDS = parseInt(process.env.EXPIRY_SECONDS || '3600'); // 1 hour default
const ALLOWED_EXTENSIONS = (process.env.ALLOWED_EXTENSIONS || 'png,jpg,jpeg,gif,webp').split(',');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

/**
 * Validate file extension
 */
function validateFileExtension(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ALLOWED_EXTENSIONS.includes(extension);
}

/**
 * Generate unique file key
 */
function generateFileKey(fileName, prNumber, userId) {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Format: pr-{prNumber}/{userId}/{timestamp}-{randomId}.{extension}
  return `pr-${prNumber}/${userId}/${timestamp}-${randomId}.${extension}`;
}

/**
 * Generate presigned URL for upload
 */
async function generateUploadUrl(fileName, contentType, prNumber, userId) {
  try {
    // Validate file extension
    if (!validateFileExtension(fileName)) {
      throw new Error(`File extension not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // Generate unique file key
    const fileKey = generateFileKey(fileName, prNumber, userId);

    // Create PutObject command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
      ContentLengthRange: [1, MAX_FILE_SIZE], // File size constraints
      Metadata: {
        'pr-number': prNumber.toString(),
        'user-id': userId,
        'upload-timestamp': Date.now().toString(),
      },
      // Add cache control for optimization
      CacheControl: 'max-age=31536000', // 1 year
    });

    // Generate presigned URL
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: EXPIRY_SECONDS,
    });

    return {
      uploadUrl,
      fileKey,
      downloadUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`,
      expiresAt: new Date(Date.now() + EXPIRY_SECONDS * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw error;
  }
}

/**
 * Generate presigned URL for download/viewing
 */
async function generateDownloadUrl(fileKey) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: EXPIRY_SECONDS,
    });

    return {
      downloadUrl,
      expiresAt: new Date(Date.now() + EXPIRY_SECONDS * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw error;
  }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const { httpMethod, path, queryStringParameters, body } = event;
    let parsedBody = {};

    if (body) {
      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid JSON in request body',
            details: e.message,
          }),
        };
      }
    }

    // Route based on HTTP method and path
    if (httpMethod === 'POST' && path === '/upload-url') {
      const { fileName, contentType, prNumber, userId } = parsedBody;

      // Validate required parameters
      if (!fileName || !contentType || !prNumber || !userId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Missing required parameters: fileName, contentType, prNumber, userId',
          }),
        };
      }

      const result = await generateUploadUrl(fileName, contentType, prNumber, userId);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: result,
        }),
      };
    }

    if (httpMethod === 'GET' && path === '/download-url') {
      const { fileKey } = queryStringParameters || {};

      if (!fileKey) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Missing required parameter: fileKey',
          }),
        };
      }

      const result = await generateDownloadUrl(fileKey);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: result,
        }),
      };
    }

    // Health check endpoint
    if (httpMethod === 'GET' && path === '/health') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          bucketName: BUCKET_NAME,
          maxFileSize: MAX_FILE_SIZE,
          allowedExtensions: ALLOWED_EXTENSIONS,
        }),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Route not found',
        availableRoutes: [
          'POST /upload-url',
          'GET /download-url',
          'GET /health',
        ],
      }),
    };
  } catch (error) {
    console.error('Lambda execution error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};