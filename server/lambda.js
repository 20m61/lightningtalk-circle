import serverless from 'serverless-http';
import app from './app.js';

// Configure serverless-http options
const serverlessHandler = serverless(app, {
  request: (request, event, context) => {
    // Add Lambda context to request
    request.lambdaEvent = event;
    request.lambdaContext = context;
  }
});

// Export handler for Lambda
export const handler = async (event, context) => {
  // Warm up Lambda container
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!');
    return 'Lambda is warm!';
  }

  // Handle API Gateway requests
  return serverlessHandler(event, context);
};
