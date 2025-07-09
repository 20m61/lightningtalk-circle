/**
 * Swagger API Documentation Routes
 * OpenAPI/Swagger documentation setup for Lightning Talk API
 */

import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Lightning Talk Circle API',
      version: '1.0.0',
      description: `
        Lightning Talk Circle is a comprehensive event management system for organizing Lightning Talk events.
        This API provides endpoints for managing events, participants, talks, and administrative functions.
        
        ## Authentication
        Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
        \`\`\`
        Authorization: Bearer <your-jwt-token>
        \`\`\`
        
        ## Rate Limiting
        - General endpoints: 100 requests per 15 minutes per IP
        - Registration endpoints: 5 requests per hour per IP
        
        ## Error Handling
        All endpoints return consistent error responses with appropriate HTTP status codes and error messages.
      `,
      contact: {
        name: 'Lightning Talk Circle',
        url: 'https://github.com/your-org/lightningtalk-circle'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000/api',
        description:
          process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    join(__dirname, '../routes/*.js'), // Include all route files
    join(__dirname, '../models/*.js'), // Include model files for schemas
    join(__dirname, '../../docs/api-documentation.yaml') // Include external YAML file
  ]
};

// Generate Swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Load external YAML documentation if available
async function loadExternalDocs() {
  try {
    const yamlPath = join(__dirname, '../../docs/api-documentation.yaml');
    const yamlContent = await fs.readFile(yamlPath, 'utf8');
    const externalDocs = yaml.load(yamlContent);

    // Merge external documentation with generated spec
    return {
      ...swaggerSpec,
      ...externalDocs,
      info: {
        ...swaggerSpec.info,
        ...externalDocs.info
      },
      paths: {
        ...swaggerSpec.paths,
        ...externalDocs.paths
      },
      components: {
        ...swaggerSpec.components,
        ...externalDocs.components,
        securitySchemes: {
          ...swaggerSpec.components?.securitySchemes,
          ...externalDocs.components?.securitySchemes
        },
        schemas: {
          ...swaggerSpec.components?.schemas,
          ...externalDocs.components?.schemas
        }
      }
    };
  } catch (error) {
    console.warn('Could not load external API documentation:', error.message);
    return swaggerSpec;
  }
}

// Custom CSS for Swagger UI
const customCss = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info .title { color: #1f2937; }
  .swagger-ui .info .description { color: #4b5563; }
  .swagger-ui .scheme-container { background: #f9fafb; padding: 15px; border-radius: 8px; }
  .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #10b981; }
  .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #3b82f6; }
  .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #f59e0b; }
  .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #ef4444; }
  .swagger-ui .btn.authorize { background-color: #3b82f6; border-color: #3b82f6; }
  .swagger-ui .btn.authorize:hover { background-color: #2563eb; border-color: #2563eb; }
`;

// Custom favicon for Swagger UI
const customFavicon = '/lightning-talk-favicon.ico';

// Initialize Swagger documentation
async function initializeSwagger() {
  const finalSpec = await loadExternalDocs();

  // Add server information based on environment
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}/api`;
  finalSpec.servers = [
    {
      url: baseUrl,
      description:
        process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ];

  return finalSpec;
}

// Serve Swagger UI
router.use('/', async (req, res, next) => {
  try {
    const spec = await initializeSwagger();

    const swaggerUiOptions = {
      customCss,
      customfavIcon: customFavicon,
      customSiteTitle: 'Lightning Talk Circle API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
        tryItOutEnabled: true
      }
    };

    swaggerUi.setup(spec, swaggerUiOptions)(req, res, next);
  } catch (error) {
    console.error('Swagger setup error:', error);
    res.status(500).json({
      error: 'Failed to initialize API documentation',
      message: error.message
    });
  }
});

// Serve raw OpenAPI spec as JSON
router.get('/openapi.json', async (req, res) => {
  try {
    const spec = await initializeSwagger();
    res.setHeader('Content-Type', 'application/json');
    res.json(spec);
  } catch (error) {
    console.error('OpenAPI spec generation error:', error);
    res.status(500).json({
      error: 'Failed to generate OpenAPI specification',
      message: error.message
    });
  }
});

// Serve raw OpenAPI spec as YAML
router.get('/openapi.yaml', async (req, res) => {
  try {
    const spec = await initializeSwagger();
    const yamlSpec = yaml.dump(spec, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });

    res.setHeader('Content-Type', 'text/yaml');
    res.send(yamlSpec);
  } catch (error) {
    console.error('OpenAPI YAML generation error:', error);
    res.status(500).json({
      error: 'Failed to generate OpenAPI YAML specification',
      message: error.message
    });
  }
});

// API documentation metadata
router.get('/info', async (req, res) => {
  try {
    const spec = await initializeSwagger();

    const info = {
      title: spec.info.title,
      version: spec.info.version,
      description: spec.info.description,
      endpoints: Object.keys(spec.paths || {}).length,
      schemas: Object.keys(spec.components?.schemas || {}).length,
      security: Object.keys(spec.components?.securitySchemes || {}),
      tags: (spec.tags || []).map(tag => tag.name),
      servers: spec.servers || [],
      lastUpdated: new Date().toISOString()
    };

    res.json(info);
  } catch (error) {
    console.error('API info generation error:', error);
    res.status(500).json({
      error: 'Failed to generate API information',
      message: error.message
    });
  }
});

// Health check for documentation service
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'API Documentation',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
