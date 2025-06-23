# API Security & Input Validation Guide

## 🔒 Security Implementation Overview

Lightning Talk CircleのAPIには、包括的なセキュリティ対策と入力検証が実装されています。

### Security Architecture
```
Request Flow
├── Rate Limiting           # IP-based request limiting
├── CORS Validation        # Cross-origin request security
├── Security Headers       # Security-focused HTTP headers
├── Input Sanitization     # XSS/injection prevention
├── Content Validation     # Comprehensive input validation
├── Authentication         # API key validation (admin)
└── Response Security      # Safe response formatting
```

## 🛡️ Input Validation Rules

### Event Validation
```javascript
// Event Creation/Update
{
  title: "5-100 characters, alphanumeric + Japanese + punctuation",
  description: "10-2000 characters, escaped HTML",
  eventDate: "ISO 8601, future date, max 2 years ahead",
  endDate: "Optional, after start date, max 24h duration",
  venue: {
    name: "2-100 characters, escaped",
    address: "5-200 characters, escaped", 
    capacity: "1-10000 integer",
    onlineUrl: "Valid HTTP/HTTPS URL (if online=true)"
  },
  maxTalks: "1-50 integer (capped for security)",
  talkDuration: "1-60 minutes",
  tags: "Array max 10 items, each 1-30 chars"
}
```

### Participant Validation
```javascript
// Registration
{
  name: "2-100 chars, letters/Japanese/spaces only",
  email: "Valid email, normalized, max 320 chars",
  phone: "Optional, 10-15 digits, international format",
  participationType: "Enum: online|offline|hybrid",
  company: "Optional, max 100 chars, escaped",
  privacyConsent: "Required boolean, must be true",
  emergencyContact: {
    name: "2-100 chars (if provided)",
    phone: "Valid phone format"
  },
  surveys: "Array max 10, question 5-200 chars, answer max 1000"
}
```

### Talk Submission Validation
```javascript
// Talk Proposals
{
  title: "5-100 chars, alphanumeric + Japanese + punctuation",
  description: "20-2000 chars, escaped HTML",
  category: "Enum: technology|business|design|lifestyle|science|education|entertainment|other",
  duration: "1-60 minutes",
  targetAudience: "Enum: beginner|intermediate|advanced|all",
  speakerName: "2-100 chars, same as participant name rules",
  speakerEmail: "Valid email, normalized",
  slides: "Optional, valid HTTP/HTTPS URL",
  materials: "Array max 5, each with name+URL validation"
}
```

## 🚦 Rate Limiting Configuration

### Endpoint-Specific Limits
```javascript
// API Rate Limits
General API:       100 requests / 15 minutes
Registration:      5 attempts / hour
Email Operations:  10 requests / hour  
Admin Operations:  50 requests / 10 minutes

// WordPress Integration
Theme Upload:      3 attempts / hour
Config Updates:    10 requests / hour
```

### Implementation
```javascript
// Rate limiter with security logging
export const rateLimiters = {
  api: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    handler: (req, res) => {
      console.warn('Rate limit exceeded:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      });
      res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter: 900
      });
    }
  })
};
```

## 🔐 CORS Security Configuration

### Environment-Specific Origins
```javascript
// Production CORS
origin: [
  'https://xn--6wym69a.com',
  'https://www.xn--6wym69a.com', 
  'https://発表.com',
  'https://www.発表.com'
],
credentials: true,
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']

// Development CORS
origin: [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8080'
],
credentials: true

// Admin Panel (Stricter)
origin: [
  'https://admin.xn--6wym69a.com',
  'https://dashboard.xn--6wym69a.com'
]
```

### Dynamic CORS Validation
```javascript
// Origin validation with logging
origin: (origin, callback) => {
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    console.warn('CORS: Blocked request from:', origin);
    callback(new Error('Not allowed by CORS policy'));
  }
}
```

## 🛡️ Security Headers

### Comprehensive Header Protection
```javascript
// Security headers applied to all responses
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN', 
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': 'default-src self; ...'
}
```

### Content Security Policy
```javascript
// CSP Configuration
{
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"]
  }
}
```

## 🧹 Input Sanitization

### XSS Prevention
```javascript
// Null byte removal
const removeNullBytes = (obj) => {
  if (typeof obj === 'string') {
    return obj.replace(/\0/g, '');
  }
  // Recursive object cleaning
  return obj;
};

// HTML escaping for user content
body('description').trim().escape()
body('notes').trim().isLength({max: 1000}).escape()
```

### SQL Injection Prevention
```javascript
// Parameter validation patterns
param('id').matches(/^[a-zA-Z0-9\-_]{3,50}$/)
query('q').trim().isLength({min: 1, max: 100}).escape()

// Suspicious pattern detection
const suspiciousPatterns = [
  /\.\.\//, // Path traversal
  /<script/i, // XSS attempts  
  /union.*select/i, // SQL injection
  /javascript:/i, // Javascript protocol
];
```

## 📁 File Upload Security

### File Validation Rules
```javascript
// File constraints
maxSize: 10MB
allowedTypes: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx']

// Security checks
suspiciousPatterns: [
  /\.php$/i, /\.asp$/i, /\.jsp$/i, /\.exe$/i,
  /\.sh$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i
]

// Validation process
1. File size check (max 10MB)
2. Extension whitelist validation  
3. MIME type verification
4. Malicious pattern detection
5. Virus scanning (future enhancement)
```

## 🔑 API Authentication

### API Key Validation
```javascript
// Protected endpoints
/api/admin/*     - Requires X-API-Key header
/api/protected/* - Requires X-API-Key header

// Validation process
const apiKey = req.get('X-API-Key') || req.query.apiKey;
const validKeys = process.env.API_KEYS.split(',');

if (!validKeys.includes(apiKey)) {
  // Log attempt with partial key for security
  console.warn('Invalid API key:', {
    ip: req.ip,
    path: req.path,
    keyPreview: apiKey?.substring(0, 8) + '...'
  });
  return res.status(403).json({message: 'Invalid API key'});
}
```

### Key Management
```bash
# Environment variables
API_KEYS="key1,key2,key3"
JWT_SECRET="64-byte-secure-random-string"
SESSION_SECRET="64-byte-secure-random-string"

# Key rotation schedule
- API Keys: Every 90 days
- JWT/Session Secrets: Every 6 months
- Database passwords: Every 3 months
```

## 📊 Security Monitoring

### Request Logging
```javascript
// Suspicious activity detection
const isSuspicious = suspiciousPatterns.some(pattern => 
  pattern.test(`${req.method} ${req.url} ${JSON.stringify(req.body)}`)
);

if (isSuspicious) {
  console.warn('Suspicious request:', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    timestamp: new Date().toISOString()
  });
}
```

### Performance Monitoring
```javascript
// Slow request detection
res.on('finish', () => {
  const duration = Date.now() - startTime;
  if (duration > 5000) {
    console.warn('Slow request:', {
      method: req.method,
      url: req.originalUrl,
      duration,
      timestamp: new Date().toISOString()
    });
  }
});
```

## 🚨 Error Handling

### Secure Error Responses
```javascript
// Production error handler
if (process.env.NODE_ENV === 'production') {
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
} else {
  // Development: Include stack trace
  res.status(500).json({
    success: false,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
}
```

### Validation Error Format
```javascript
// Consistent validation error structure
{
  success: false,
  message: 'Validation failed',
  errors: [
    {
      field: 'email',
      message: 'Must be a valid email address',
      value: 'invalid-email',
      location: 'body'
    }
  ],
  timestamp: '2025-06-22T10:30:00.000Z',
  requestId: 'req_123456789'
}
```

## 🔍 Testing Security

### Validation Testing
```javascript
// Jest test examples
describe('Input Validation', () => {
  test('should reject XSS attempts in title', async () => {
    const response = await request(app)
      .post('/api/events')
      .send({
        title: '<script>alert("xss")</script>',
        description: 'Test event'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        field: 'title',
        message: expect.stringContaining('invalid characters')
      })
    );
  });

  test('should enforce rate limiting', async () => {
    // Make 6 registration attempts (limit is 5)
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/participants/register')
        .send(validRegistrationData);
    }
    
    const response = await request(app)
      .post('/api/participants/register')
      .send(validRegistrationData);
    
    expect(response.status).toBe(429);
  });
});
```

### Security Scan Integration
```bash
# npm audit integration
npm run security:audit    # Run security audit
npm run security:fix      # Fix known vulnerabilities
npm run security:check    # Check for new issues

# Snyk integration (CI/CD)
snyk test                 # Test for vulnerabilities
snyk monitor              # Monitor for new issues
```

## 📋 Security Checklist

### Pre-Deployment Security Audit
- [ ] All inputs validated and sanitized
- [ ] Rate limiting configured for all endpoints
- [ ] CORS properly configured for environment
- [ ] Security headers implemented
- [ ] API keys properly secured in environment variables
- [ ] File upload restrictions enforced
- [ ] Error handling doesn't leak sensitive information
- [ ] Logging captures security events
- [ ] SQL injection prevention verified
- [ ] XSS protection tested
- [ ] CSRF protection implemented
- [ ] Dependencies updated and audited

### Runtime Security Monitoring
- [ ] Request rate monitoring
- [ ] Failed authentication attempts tracking
- [ ] Suspicious pattern detection
- [ ] Performance anomaly detection
- [ ] Error rate monitoring
- [ ] File upload scanning
- [ ] API key usage monitoring

### Regular Security Maintenance
- [ ] Weekly dependency updates
- [ ] Monthly security audits
- [ ] Quarterly penetration testing
- [ ] Biannual key rotation
- [ ] Annual security architecture review

---

**Security Contact**: admin@xn--6wym69a.com  
**Last Updated**: June 2025  
**Security Policy Version**: 1.0