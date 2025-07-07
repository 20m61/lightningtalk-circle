# API Documentation Setup

Lightning Talk Circle includes comprehensive API documentation using OpenAPI/Swagger specification.

## Features

- **Interactive Documentation**: Swagger UI for testing API endpoints
- **OpenAPI 3.0.3 Specification**: Complete API definition in YAML format
- **Multiple Output Formats**: JSON, YAML, and interactive UI
- **Authentication Support**: JWT token authentication in Swagger UI
- **Environment-Aware**: Automatic server configuration based on environment

## Accessing Documentation

### Development Environment

- **Interactive Docs**: http://localhost:3000/api/docs
- **API Overview**: http://localhost:3000/api
- **OpenAPI JSON**: http://localhost:3000/api/docs/openapi.json
- **OpenAPI YAML**: http://localhost:3000/api/docs/openapi.yaml

### Production Environment

- **Interactive Docs**: https://your-domain.com/api/docs
- **API Overview**: https://your-domain.com/api
- **OpenAPI JSON**: https://your-domain.com/api/docs/openapi.json
- **OpenAPI YAML**: https://your-domain.com/api/docs/openapi.yaml

## Documentation Structure

### Authentication

The API uses JWT bearer tokens for authentication. In Swagger UI:

1. Click the "Authorize" button
2. Enter your JWT token in the format: `Bearer your-token-here`
3. All authenticated endpoints will include the token automatically

### Endpoint Categories

- **System**: Health checks and API information
- **Authentication**: Login, registration, user management
- **Events**: Event creation and management
- **Participants**: Registration and participant management
- **Talks**: Talk submission and management
- **Admin**: Administrative operations (requires admin role)

### Rate Limiting Information

Documentation includes rate limiting details:
- General endpoints: 100 requests per 15 minutes per IP
- Registration endpoints: 5 requests per hour per IP

## Development

### Adding New Endpoints

1. **Update YAML**: Edit `docs/api-documentation.yaml`
2. **Add JSDoc Comments**: Include OpenAPI annotations in route files
3. **Update Schemas**: Define new data models in the components section

Example JSDoc annotation:

```javascript
/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Filter by event status
 *         schema:
 *           type: string
 *           enum: [upcoming, live, completed]
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
```

### Validation

The documentation includes validation rules:
- Required fields
- Data types and formats
- Minimum/maximum values
- Enum constraints

### Error Responses

Consistent error response format:

```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "details": ["Specific error details"],
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## Deployment

### Environment Variables

Set the following for proper documentation URLs:

```env
API_BASE_URL=https://api.your-domain.com/api
NODE_ENV=production
```

### Custom Styling

The Swagger UI includes custom CSS for better branding:
- Hidden top bar
- Custom color scheme
- Lightning Talk branding
- Responsive design

### Security Considerations

- Documentation is publicly accessible
- Authentication is required for testing protected endpoints
- No sensitive information exposed in examples
- Rate limiting applies to documentation endpoints

## Testing with Swagger UI

1. **Open Documentation**: Navigate to `/api/docs`
2. **Authenticate**: Use the Authorize button with a valid JWT token
3. **Test Endpoints**: Use "Try it out" to test API calls
4. **View Responses**: See real API responses and status codes

### Getting a Test Token

1. Use the `/api/auth/login` endpoint in Swagger UI
2. Copy the returned token
3. Use it in the Authorize dialog

## Maintenance

### Keeping Documentation Updated

- Update YAML file when adding new endpoints
- Include validation rules and examples
- Test documentation with real API responses
- Update version numbers for API changes

### Dependencies

- `swagger-ui-express`: Swagger UI middleware
- `swagger-jsdoc`: JSDoc to OpenAPI conversion
- `js-yaml`: YAML parsing support

### Troubleshooting

**Documentation not loading**:
- Check if YAML file is valid
- Verify route setup in app.js
- Check console for errors

**Authentication not working**:
- Ensure JWT token is valid
- Check token format (must include "Bearer ")
- Verify API endpoints require authentication

**Missing endpoints**:
- Check if routes are included in swagger options
- Verify JSDoc annotations
- Update external YAML file

## Integration

### API Client Generation

The OpenAPI specification can be used to generate API clients:

```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api/docs/openapi.json \
  -g typescript-axios \
  -o ./generated-client

# Generate Python client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api/docs/openapi.json \
  -g python \
  -o ./python-client
```

### CI/CD Integration

Include documentation validation in CI/CD pipeline:

```yaml
- name: Validate OpenAPI Spec
  run: |
    npm install -g swagger-jsdoc
    node -e "require('./server/routes/swagger.js')"
```