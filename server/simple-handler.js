/**
 * Simple Lambda Handler for Health Checks
 * Updated: Production-ready logging system integration
 */

const logger = require('./utils/production-logger');

exports.handler = async(event, context) => {
  const startTime = Date.now();

  logger.info('Simple health check handler invoked', {
    requestId: context.awsRequestId,
    httpMethod: event.httpMethod,
    path: event.path
  });

  try {
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.4',
        message: 'Simple handler working with production logging'
      })
    };

    const duration = Date.now() - startTime;
    logger.performance('Health check execution', duration, {
      statusCode: response.statusCode
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Simple handler error', {
      error: error.message,
      stack: error.stack,
      duration,
      requestId: context.awsRequestId
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'error',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      })
    };
  }
};
