# Email Service Setup & Production Deployment Guide

## 📧 Email Service Architecture

Lightning Talk
Circleのメールサービスは、開発・本番環境に応じて自動的に最適なプロバイダーを選択する設計になっています。

### Service Architecture

```
EmailServiceFactory
├── SimulationEmailService    # 開発環境
├── ProductionEmailService    # 本番環境
│   ├── SendGrid Provider     # 推奨本番環境
│   ├── AWS SES Provider      # 大容量・コスト重視
│   └── Queue System (Redis)  # 高信頼性配信
```

## 🔧 Configuration Options

### Development (Simulation Mode)

```env
EMAIL_ENABLED=false
EMAIL_PROVIDER=simulation
EMAIL_FROM="noreply@lightningtalk.example.com"
```

### Production (SendGrid)

```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
EMAIL_FROM="noreply@発表.com"
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxx"
REDIS_URL="redis://localhost:6379"
```

### Production (AWS SES)

```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=ses
EMAIL_FROM="noreply@発表.com"
AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
AWS_REGION="us-east-1"
REDIS_URL="redis://localhost:6379"
```

## 🚀 SendGrid Setup (Recommended)

### Step 1: SendGrid Account Setup

1. **アカウント作成**: [SendGrid](https://sendgrid.com/)でアカウント作成
2. **API Key生成**: Settings > API Keys > Create API Key
3. **権限設定**: Full Access または Mail Send権限
4. **Domain認証**: Authenticate your domain for better deliverability

### Step 2: Domain Authentication

```bash
# SendGrid Dashboard > Settings > Sender Authentication
# Add your domain: 発表.com (xn--6wym69a.com)
# Add DNS records as instructed by SendGrid
```

### Step 3: Environment Configuration

```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
EMAIL_FROM="noreply@発表.com"
SENDGRID_API_KEY="SG.your_actual_api_key_here"
```

### Step 4: Test Configuration

```bash
# Test email service configuration
npm run test:email-config

# Send test email
npm run test:email-send
```

## ☁️ AWS SES Setup (Alternative)

### Step 1: AWS Setup

1. **IAM User作成**: SES専用のIAMユーザー作成
2. **権限付与**: `AmazonSESFullAccess` policy
3. **Access Key生成**: プログラマティックアクセス用

### Step 2: SES Configuration

```bash
# AWS CLI configuration
aws configure
# Region: us-east-1 (推奨)
# SES verification
aws ses verify-email-identity --email-address noreply@発表.com
```

### Step 3: Production Limits

```bash
# Move out of sandbox mode
# Request production access in AWS Console
# Configure sending quotas and rate limits
```

## 🔄 Queue System Setup

### Redis Configuration

```yml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    restart: unless-stopped
```

### Queue Monitoring

```javascript
// Queue management endpoints
GET  /api/admin/email/queue/stats    # Queue statistics
POST /api/admin/email/queue/pause    # Pause queue
POST /api/admin/email/queue/resume   # Resume queue
POST /api/admin/email/queue/retry    # Retry failed jobs
```

## 📋 Email Templates

### Available Templates

1. **registrationConfirmation** - 参加登録完了
2. **speakerConfirmation** - 発表申込み完了
3. **eventReminder** - イベントリマインダー
4. **eventCancellation** - イベント中止通知
5. **feedbackRequest** - フィードバック依頼

### Template Customization

```javascript
// templates/email/custom-template.html
// Use Handlebars syntax for variables: {{participantName}}
// Include responsive HTML/CSS design
// Test with multiple email clients
```

## 🧪 Testing Strategy

### Unit Tests

```javascript
// tests/unit/email-service.test.js
describe('Production Email Service', () => {
  test('should send registration confirmation');
  test('should queue emails with proper retry logic');
  test('should handle template rendering');
  test('should manage queue operations');
});
```

### Integration Tests

```javascript
// tests/integration/email-integration.test.js
describe('Email Integration', () => {
  test('should send real email via SendGrid');
  test('should process queue jobs');
  test('should handle bulk email operations');
});
```

### Load Testing

```bash
# Test email queue under load
npm run test:email-load
# Simulate 1000 concurrent email sends
# Monitor queue performance and Redis usage
```

## 📊 Monitoring & Analytics

### Key Metrics

- **Queue Metrics**: Waiting, Active, Completed, Failed jobs
- **Delivery Metrics**: Send rate, Bounce rate, Open rate
- **Error Metrics**: Failed deliveries, Retry attempts
- **Performance**: Queue processing time, Template rendering time

### Monitoring Setup

```javascript
// Monitoring endpoints
GET /api/admin/email/health        # Health check
GET /api/admin/email/metrics       # Performance metrics
GET /api/admin/email/analytics     # Delivery analytics
```

### Alerting Thresholds

- Queue backlog > 100 emails
- Failed job rate > 5%
- Queue processing time > 30 seconds
- Redis connection failures

## 🔒 Security Considerations

### API Key Management

```bash
# GitHub Secrets (Production)
SENDGRID_API_KEY="SG.xxxxx"
AWS_ACCESS_KEY_ID="AKIAXXXXX"
AWS_SECRET_ACCESS_KEY="xxxxxxx"

# Rotation schedule: Every 90 days
# Monitor API key usage in provider dashboard
```

### Email Security

```javascript
// SPF, DKIM, DMARC configuration
// Sender authentication
// Rate limiting protection
// Content scanning for security
```

### Data Privacy

```javascript
// PII handling in email content
// Data retention policies
// GDPR compliance considerations
// Unsubscribe mechanism
```

## 📈 Performance Optimization

### Queue Optimization

```javascript
// Queue settings
const queueOptions = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
};
```

### Template Optimization

```javascript
// Pre-compiled templates
// Template caching
// Minimal HTML/CSS for faster rendering
// Image optimization and CDN usage
```

### Bulk Email Strategy

```javascript
// Batch processing for bulk emails
// Rate limiting compliance
// Segmented sending for better deliverability
// Personalization without performance impact
```

## 🚨 Disaster Recovery

### Backup Strategy

```bash
# Queue data backup
redis-cli --rdb backup-$(date +%Y%m%d).rdb

# Template backup
git commit -am "Email template backup $(date)"

# Configuration backup
cp .env .env.backup.$(date +%Y%m%d)
```

### Failover Plan

1. **Provider Failover**: SendGrid → AWS SES
2. **Queue Recovery**: Redis persistence + manual retry
3. **Template Rollback**: Git-based version control
4. **Emergency Contacts**: Direct SMTP fallback

### Recovery Testing

```bash
# Test failover scenarios
npm run test:email-failover

# Test queue recovery
npm run test:queue-recovery

# Test provider switching
npm run test:provider-switch
```

## 📋 Production Deployment Checklist

### Pre-Deployment

- [ ] SendGrid/SES account configured
- [ ] Domain authentication completed
- [ ] API keys secured in GitHub Secrets
- [ ] Redis instance running
- [ ] Email templates tested
- [ ] Queue monitoring configured

### Deployment

- [ ] Environment variables set
- [ ] Database migration completed
- [ ] Email service health check passed
- [ ] Queue processing verified
- [ ] Test email sent successfully

### Post-Deployment

- [ ] Monitor queue metrics for 24h
- [ ] Verify email deliverability
- [ ] Check error logs
- [ ] Confirm template rendering
- [ ] Test bulk email operations

### Performance Validation

- [ ] Queue processing < 30s
- [ ] Email delivery rate > 95%
- [ ] Failed job rate < 5%
- [ ] Template rendering < 100ms

---

**Estimated Setup Time**: 2-4 hours  
**Deployment Impact**: Low (graceful fallback)  
**Monitoring Required**: 24-48 hours post-deployment
