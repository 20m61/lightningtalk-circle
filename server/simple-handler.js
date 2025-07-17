exports.handler = async (event, context) => {
  console.log('Lambda event:', JSON.stringify(event, null, 2));
  
  // Return simple success response for testing
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.3',
      message: 'Simple handler working'
    })
  };
};