# CI/CD Pipeline & Production Deployment Guide

## 🚀 CI/CD Architecture Overview

Lightning Talk Circleの本番デプロイメントパイプラインは、GitHub Actionsを使用してフルオートメーション化されています。

### Pipeline Structure
```
GitHub Actions Workflow
├── Test Stage           # 単体・統合テスト + セキュリティ監査
├── Security Stage       # 脆弱性スキャン + コード品質
├── Build Stage          # Docker イメージビルド + アセット構築
├── Deploy Staging       # ステージング環境デプロイ
├── Deploy Production    # 本番環境デプロイ
└── WordPress Deploy     # WordPressテーマデプロイ
```

## 🔧 Required GitHub Secrets

### Production Environment
```bash
# Database & Infrastructure
DATABASE_URL="postgresql://user:pass@host:5432/lightningtalk"
REDIS_URL="redis://user:pass@host:6379"
POSTGRES_PASSWORD="secure_password_here"
REDIS_PASSWORD="secure_redis_password"

# Security
JWT_SECRET="64-byte-hex-string"
SESSION_SECRET="64-byte-hex-string"

# Email Service (SendGrid recommended)
EMAIL_ENABLED="true"
EMAIL_PROVIDER="sendgrid"
EMAIL_FROM="noreply@発表.com"
SENDGRID_API_KEY="SG.your_sendgrid_api_key"

# Alternative: AWS SES
AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
AWS_REGION="us-east-1"

# GitHub Integration
GITHUB_TOKEN="ghp_your_github_token_with_repo_access"

# WordPress Integration
WP_SITE_URL="https://xn--6wym69a.com"
WP_USERNAME="wordpress_admin_user"
WP_APP_PASSWORD="wordpress_application_password"

# Deployment Infrastructure
PRODUCTION_HOST="your.production.server.com"
PRODUCTION_USER="deploy"
PRODUCTION_SSH_KEY="-----BEGIN OPENSSH PRIVATE KEY-----..."
STAGING_HOST="staging.your-domain.com"
STAGING_USER="deploy"
STAGING_SSH_KEY="-----BEGIN OPENSSH PRIVATE KEY-----..."

# Monitoring & Notifications
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
SENTRY_DSN="https://sentry.io/dsn/..."
SNYK_TOKEN="your_snyk_security_token"
GRAFANA_PASSWORD="secure_grafana_password"
```

### Staging Environment
```bash
# Similar to production but with staging-specific values
STAGING_URL="https://staging.your-domain.com"
DATABASE_URL="postgresql://staging_user:pass@staging_host:5432/lightningtalk_staging"
# ... other staging-specific variables
```

## 📋 Deployment Workflow

### 1. Automated Testing (Every Push/PR)
```yaml
# Triggered on: push to main/develop, PR to main
Jobs:
- Unit Tests (Jest)
- Integration Tests (with PostgreSQL + Redis)
- Security Audit (npm audit + Snyk)
- Code Quality (ESLint + Prettier)
- Coverage Report (80% threshold)
```

### 2. Build & Package (Main Branch)
```yaml
# Triggered on: push to main
Jobs:
- Build WordPress Theme
- Build Application Assets
- Create Docker Image
- Push to GitHub Container Registry
- Multi-architecture Support (amd64, arm64)
```

### 3. Staging Deployment (Develop Branch)
```yaml
# Triggered on: push to develop
Jobs:
- Deploy to Staging Environment
- Run Health Checks
- Integration Testing
- Performance Testing
```

### 4. Production Deployment (Main Branch)
```yaml
# Triggered on: push to main (after manual approval)
Jobs:
- Database Backup
- Blue-Green Deployment
- Health Checks
- Rollback on Failure
- Slack Notification
```

### 5. WordPress Theme Deployment
```yaml
# Triggered on: push to main (WordPress changes)
Jobs:
- Build Theme Package
- Deploy to WordPress Site
- Theme Activation
- Health Check
```

## 🏗️ Infrastructure Setup

### Docker Production Stack
```yaml
Services:
- App: Node.js Application (lightningtalk-circle)
- Database: PostgreSQL 15 (persistent data)
- Cache: Redis 7 (sessions + email queue)
- Reverse Proxy: Nginx (SSL termination + load balancing)
- Monitoring: Prometheus + Grafana + Loki
- Log Aggregation: Promtail
```

### Server Requirements
```yaml
Minimum Specifications:
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- Network: 1Gbps

Recommended Production:
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- Backup: 100GB additional storage
```

### SSL Certificate Setup
```bash
# Using Let's Encrypt (Certbot)
sudo certbot certonly --webroot \
  -w /var/www/html \
  -d xn--6wym69a.com \
  -d www.xn--6wym69a.com

# Certificate renewal (automated)
sudo crontab -e
0 3 * * * certbot renew --quiet --post-hook "docker-compose restart nginx"
```

## 🚀 Deployment Commands

### Manual Deployment
```bash
# Production deployment
./scripts/deploy.sh production

# Staging deployment
./scripts/deploy.sh staging

# Development setup
./scripts/deploy.sh development
```

### Docker Operations
```bash
# Start production stack
docker-compose -f docker/docker-compose.production.yml up -d

# View logs
docker-compose -f docker/docker-compose.production.yml logs -f app

# Health check
curl -f https://your-domain.com/api/health

# Database backup
docker-compose exec postgres pg_dump -U postgres lightningtalk > backup.sql

# Emergency rollback
docker-compose -f docker/docker-compose.production.yml down
docker-compose -f docker/docker-compose.production.yml up -d --force-recreate
```

### Monitoring Commands
```bash
# Application metrics
curl https://your-domain.com/api/health/metrics

# Queue status (email)
curl https://your-domain.com/api/admin/email/queue/stats

# System resource usage
docker stats

# Log aggregation
docker-compose logs --tail=100 app postgres redis
```

## 📊 Monitoring & Observability

### Health Check Endpoints
```javascript
GET /api/health           # Basic health check
GET /api/health/detailed  # Comprehensive system info
GET /api/health/ready     # Kubernetes readiness probe
GET /api/health/live      # Kubernetes liveness probe
GET /api/health/metrics   # Performance metrics
```

### Monitoring Dashboard (Grafana)
```yaml
Dashboards:
- Application Performance: Response time, throughput, errors
- Infrastructure: CPU, Memory, Disk, Network
- Database: Connections, queries, locks, performance
- Email Queue: Queue depth, processing rate, failures
- Business Metrics: Events, participants, registrations
```

### Alerting Thresholds
```yaml
Critical Alerts:
- Application down (health check failure)
- Database connection failure
- High error rate (>5% in 5 minutes)
- High memory usage (>90%)

Warning Alerts:
- High response time (>2 seconds)
- Email queue backlog (>100 emails)
- Low disk space (<20%)
- Certificate expiration (30 days)
```

### Log Management
```yaml
Log Sources:
- Application: Express.js access/error logs
- Database: PostgreSQL slow queries, errors
- Nginx: Access logs, security events
- System: Docker container logs, system metrics

Log Retention:
- Application logs: 30 days
- Access logs: 90 days
- Error logs: 1 year
- Audit logs: 2 years
```

## 🔒 Security Configuration

### Environment Security
```bash
# Firewall configuration (ufw)
sudo ufw allow 22        # SSH
sudo ufw allow 80        # HTTP
sudo ufw allow 443       # HTTPS
sudo ufw enable

# Fail2ban configuration
sudo fail2ban-client status
sudo fail2ban-client status sshd

# Docker security
docker run --security-opt=no-new-privileges \
  --cap-drop=ALL \
  --cap-add=NET_BIND_SERVICE \
  your-app:latest
```

### SSL/TLS Configuration
```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### Database Security
```sql
-- Create application-specific user
CREATE USER lightningtalk_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE lightningtalk TO lightningtalk_app;
GRANT USAGE ON SCHEMA public TO lightningtalk_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lightningtalk_app;

-- Row-level security (future enhancement)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

## 🚨 Disaster Recovery

### Backup Strategy
```bash
# Automated daily backups
#!/bin/bash
BACKUP_DIR="/opt/backups/lightningtalk"
DATE=$(date +%Y%m%d-%H%M%S)

# Database backup
docker-compose exec postgres pg_dump -U postgres lightningtalk | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"

# Application data backup
tar -czf "$BACKUP_DIR/data-$DATE.tar.gz" /opt/lightningtalk-circle/data/

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 sync "$BACKUP_DIR" s3://your-backup-bucket/lightningtalk/
```

### Recovery Process
```bash
# 1. Stop application
docker-compose down

# 2. Restore database
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U postgres lightningtalk

# 3. Restore application data
tar -xzf data-backup.tar.gz -C /opt/lightningtalk-circle/

# 4. Start application
docker-compose up -d

# 5. Verify functionality
curl -f https://your-domain.com/api/health
```

### Rollback Procedure
```bash
# Quick rollback to previous Docker image
docker-compose pull previous-tag
docker-compose up -d --force-recreate

# Database rollback (if needed)
docker-compose exec postgres psql -U postgres lightningtalk < rollback.sql

# Emergency maintenance mode
echo "maintenance" > /var/www/html/maintenance.flag
```

## 📈 Performance Optimization

### Application Tuning
```javascript
// Node.js optimization
process.env.UV_THREADPOOL_SIZE = '16';  // Increase thread pool
process.env.NODE_OPTIONS = '--max-old-space-size=2048';  // Increase heap size

// Express.js optimization
app.use(compression());  // Gzip compression
app.use(helmet());       // Security headers
app.use(express.static('public', {
    maxAge: '1y',        // Static asset caching
    etag: true
}));
```

### Database Optimization
```sql
-- Indexing strategy
CREATE INDEX CONCURRENTLY idx_events_date ON events(event_date);
CREATE INDEX CONCURRENTLY idx_participants_email ON participants(email);
CREATE INDEX CONCURRENTLY idx_talks_event_id ON talks(event_id);

-- Query optimization
ANALYZE events;
VACUUM ANALYZE participants;

-- Connection pooling
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '256MB';
```

### Nginx Optimization
```nginx
# Worker processes
worker_processes auto;
worker_rlimit_nofile 65535;

# Connection optimization
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

# Caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;
```

## 📋 Production Deployment Checklist

### Pre-Deployment
- [ ] All GitHub Secrets configured
- [ ] SSL certificates installed and valid
- [ ] Database backup completed
- [ ] Health checks passing in staging
- [ ] Performance tests completed
- [ ] Security scan passed
- [ ] Team notification sent

### Deployment
- [ ] CI/CD pipeline executed successfully
- [ ] Docker images built and pushed
- [ ] Database migration completed
- [ ] Application deployed and started
- [ ] Health checks passing
- [ ] Monitoring alerts configured

### Post-Deployment
- [ ] Application functionality verified
- [ ] Performance metrics within SLA
- [ ] Email service operational
- [ ] WordPress integration working
- [ ] Backup verification completed
- [ ] Security headers verified
- [ ] Team notification sent

### Performance Validation
- [ ] Response time < 2 seconds (95th percentile)
- [ ] Error rate < 1%
- [ ] Database queries < 100ms
- [ ] Email queue processing < 30 seconds
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%

---

**Estimated Setup Time**: 4-8 hours  
**Deployment Time**: 15-30 minutes (automated)  
**Rollback Time**: 2-5 minutes  
**Recovery Time Objective (RTO)**: 15 minutes  
**Recovery Point Objective (RPO)**: 1 hour