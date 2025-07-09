/**
 * DynamoDB Retry Utility
 * Implements exponential backoff for DynamoDB operations
 */

import { logger } from '../services/logger.js';

/**
 * Execute DynamoDB operation with retry logic
 * @param {Function} operation - The DynamoDB operation to execute
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in milliseconds (default: 100)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 5000)
 * @returns {Promise<any>} - Result of the operation
 */
export async function dynamoDbWithRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 100,
    maxDelay = 5000
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Execute the operation
      const result = await operation();
      
      // Log successful retry if it wasn't the first attempt
      if (attempt > 0) {
        logger.info(`DynamoDB operation succeeded after ${attempt} retries`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = calculateDelay(attempt, baseDelay, maxDelay);
      
      logger.warn(`DynamoDB operation failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}. Retrying in ${delay}ms...`);
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Check if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is retryable
 */
function isRetryableError(error) {
  const retryableErrors = [
    'ProvisionedThroughputExceededException',
    'ThrottlingException',
    'RequestLimitExceeded',
    'ServiceUnavailable',
    'InternalServerError',
    'ItemCollectionSizeLimitExceededException'
  ];
  
  // Check error code
  if (error.code && retryableErrors.includes(error.code)) {
    return true;
  }
  
  // Check status code for service unavailable or too many requests
  if (error.statusCode && (error.statusCode === 503 || error.statusCode === 429)) {
    return true;
  }
  
  // Check for timeout errors
  if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
    return true;
  }
  
  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 * @param {number} attempt - Current attempt number (0-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @returns {number} - Calculated delay in milliseconds
 */
function calculateDelay(attempt, baseDelay, maxDelay) {
  // Exponential backoff: delay = baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Add jitter (random value between 0-25% of the delay)
  const jitter = Math.random() * 0.25 * exponentialDelay;
  
  // Calculate final delay with jitter
  const delayWithJitter = exponentialDelay + jitter;
  
  // Cap at maximum delay
  return Math.min(delayWithJitter, maxDelay);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a retry wrapper for a DynamoDB client
 * @param {Object} dynamoDbClient - AWS DynamoDB DocumentClient instance
 * @returns {Object} - Wrapped client with retry logic
 */
export function wrapDynamoDbClient(dynamoDbClient) {
  const wrappedClient = {};
  
  // Wrap common DynamoDB operations
  const operations = ['get', 'put', 'update', 'delete', 'query', 'scan', 'batchGet', 'batchWrite', 'transactWrite'];
  
  operations.forEach(operation => {
    if (typeof dynamoDbClient[operation] === 'function') {
      wrappedClient[operation] = (params) => {
        return dynamoDbWithRetry(() => dynamoDbClient[operation](params).promise());
      };
    }
  });
  
  // Add original client as a property for direct access if needed
  wrappedClient._originalClient = dynamoDbClient;
  
  return wrappedClient;
}

/**
 * Batch write with automatic retry and chunking
 * @param {Object} dynamoDbClient - AWS DynamoDB DocumentClient instance
 * @param {string} tableName - Table name
 * @param {Array} items - Items to write
 * @param {Object} options - Options for batch write
 * @returns {Promise<void>}
 */
export async function batchWriteWithRetry(dynamoDbClient, tableName, items, options = {}) {
  const { chunkSize = 25 } = options; // DynamoDB limit is 25 items per batch
  
  // Process items in chunks
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    
    const params = {
      RequestItems: {
        [tableName]: chunk.map(item => ({
          PutRequest: { Item: item }
        }))
      }
    };
    
    await dynamoDbWithRetry(() => dynamoDbClient.batchWrite(params).promise());
    
    logger.info(`Batch wrote ${chunk.length} items to ${tableName} (${i + chunk.length}/${items.length} total)`);
  }
}

export default {
  dynamoDbWithRetry,
  wrapDynamoDbClient,
  batchWriteWithRetry
};