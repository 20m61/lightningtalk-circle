/**
 * Lambda handler using CommonJS for compatibility
 * This is a wrapper around the main Express app
 */

const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Create Express app
const app = express();

// Trust proxy for Lambda/API Gateway
app.set('trust proxy', true);

// Basic middleware
app.use(
  helmet({
    contentSecurityPolicy: false // Allow for development
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting - Lambda-compatible configuration
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: req => {
      // Use CloudFront viewer IP or fallback to connection remote address
      return (
        req.headers['cloudfront-viewer-address'] ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        'unknown'
      );
    },
    skip: req => {
      // Skip rate limiting for health checks and if we can't determine IP
      return req.path === '/api/health' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    }
  })
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Simple events endpoint for testing
app.get('/api/events', (req, res) => {
  res.json({
    events: [
      {
        id: '2025-06-14',
        title: '第1回 なんでもライトニングトーク',
        date: '2025-07-15T19:00:00+09:00',
        status: 'upcoming'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

// Specific voting participation endpoint
app.get('/api/voting/participation/:eventId', (req, res) => {
  const eventId = req.params.eventId;
  console.log('Voting participation endpoint accessed:', eventId);

  res.json({
    eventId,
    online: 0,
    onsite: 0,
    timestamp: new Date().toISOString()
  });
});

// Voting base endpoint
app.get('/api/voting', (req, res) => {
  console.log('Voting base endpoint accessed');
  res.json({
    message: 'Voting base endpoint',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/voting', (req, res) => {
  console.log('Voting POST endpoint accessed:', req.body);
  res.json({
    message: 'Vote submitted successfully',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// General voting endpoints
app.get('/api/voting/*', (req, res) => {
  const path = req.path;
  console.log('Voting wildcard endpoint accessed:', path);

  if (path.includes('/participation/')) {
    const eventId = path.split('/participation/')[1];
    res.json({
      eventId,
      online: 0,
      onsite: 0,
      timestamp: new Date().toISOString()
    });
  } else {
    res.json({
      message: 'Voting endpoint',
      path: path,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/voting/*', (req, res) => {
  res.json({
    message: 'Vote submitted',
    timestamp: new Date().toISOString()
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email });

  // Simple demo authentication - replace with Cognito
  if (email === 'admin@example.com' && password === 'admin123') {
    res.json({
      success: true,
      token: 'demo-admin-token',
      user: { email, role: 'admin' },
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// Catch-all handler for API paths
app.use('/api/*', (req, res) => {
  console.log('Catch-all API handler:', req.method, req.path);

  if (req.path.startsWith('/api/voting/participation/')) {
    const eventId = req.path.split('/api/voting/participation/')[1];
    res.json({
      eventId,
      online: 0,
      onsite: 0,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Export handler for Lambda
const handler = serverless(app);

exports.handler = async (event, context) => {
  // Add debugging
  console.log('Lambda event:', JSON.stringify(event, null, 2));

  // Warm up Lambda container
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!');
    return 'Lambda is warm!';
  }

  try {
    // Handle proxy path for all routes
    if (event.pathParameters && event.pathParameters.proxy) {
      // For root proxy, the full path is in the proxy parameter
      if (event.resource === '/{proxy+}') {
        event.path = '/' + event.pathParameters.proxy;
      } else {
        // For nested proxy, reconstruct the path
        const basePath = event.resource.replace('/{proxy+}', '');
        const fullPath = basePath + '/' + event.pathParameters.proxy;
        event.path = fullPath;
      }

      console.log('Proxy path reconstruction:', {
        resource: event.resource,
        proxy: event.pathParameters.proxy,
        reconstructedPath: event.path
      });
    }

    // Handle API Gateway requests
    const result = await handler(event, context);
    console.log('Lambda result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Lambda handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
