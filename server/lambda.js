const serverless = require('serverless-http');
const app = require('./app');

// Configure serverless-http options
const handler = serverless(app, {
  request: (request, event, context) => {
    // Add Lambda context to request
    request.lambdaEvent = event;
    request.lambdaContext = context;
  }
});

// Export handler for Lambda
module.exports.handler = async (event, context) => {
  // Warm up Lambda container
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!');
    return 'Lambda is warm!';
  }

  // Handle API Gateway requests
  return handler(event, context);
};
