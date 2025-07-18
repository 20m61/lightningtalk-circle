const serverless = require('serverless-http');
const app = require('./app.js');

// Configure serverless-http options
const serverlessHandler = serverless(app, {
  request: (request, event, context) => {
    // Add Lambda context to request
    request.lambdaEvent = event;
    request.lambdaContext = context;
  }
});

// Export handler for Lambda
exports.handler = async(event, context) => {
  // Warm up Lambda container
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!');
    return 'Lambda is warm!';
  }

  // Handle API Gateway requests
  return serverlessHandler(event, context);
};
