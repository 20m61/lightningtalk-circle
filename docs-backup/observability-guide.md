# Lightning Talk Circle - Observability and Monitoring Guide

## Overview

This guide covers the comprehensive observability infrastructure for Lightning
Talk Circle, including log aggregation, metrics collection, alerting, and
monitoring dashboards.

## Architecture

### Log Aggregation Pipeline

```
Application Logs → Kinesis Stream → Lambda Processor → CloudWatch Logs
                                ↓
                              S3 (Long-term Storage)
                                ↓
                            OpenSearch (Analytics)
```

### Metrics Collection

```
Custom Metrics → CloudWatch → Dashboards
              ↓
            Alarms → SNS → Notifications
```

## Components

### 1. Log Aggregation Stack

**Kinesis Stream**

- Stream Name: `lightningtalk-{env}-log-aggregation`
- Retention: 1-7 days (environment dependent)
- Encryption: KMS encrypted

**Log Processing Lambda**

- Function: `lightningtalk-{env}-log-processor`
- Runtime: Node.js 18.x
- Processes structured logs and extracts metrics

**S3 Storage**

- Bucket: `lightningtalk-{env}-logs-{account}`
- Lifecycle: IA (30d) → Glacier (90d) → Deep Archive (365d)
- Retention: 1-7 years (environment dependent)

### 2. Metrics Collection

**Custom Metrics Namespace**

- Namespace: `lightningtalk/{environment}`
- Collection Frequency: Every 5 minutes
- Metrics Categories:
  - Application Performance
  - Business Metrics
  - Infrastructure Health

**Key Metrics**

- `ResponseTime`: API response latency
- `ErrorCount`: Application error count
- `ActiveRegistrations`: Current event registrations
- `ScheduledTalks`: Number of scheduled talks
- `CapacityUtilization`: Event capacity percentage

### 3. Alerting Infrastructure

**SNS Topic**

- Topic: `lightningtalk-{env}-alerts`
- Email subscriptions configured via environment config

**CloudWatch Alarms**

- Error rate threshold alarms
- Response time threshold alarms
- Composite application health alarms
- Anomaly detection for business metrics

### 4. Monitoring Dashboards

**Main Dashboard Components**

- Application Performance (Response time, errors)
- Infrastructure Health (ECS, RDS metrics)
- Business Metrics (Registrations, talks, capacity)
- Recent Error Logs

## Configuration

### Environment Variables

```bash
# Observability configuration
METRICS_NAMESPACE=lightningtalk/dev
CENTRAL_LOG_GROUP=/aws/lightningtalk/dev/central
ENVIRONMENT=dev
APP_NAME=lightningtalk

# AWS resources
DATABASE_IDENTIFIER=lightningtalk-dev-database
CLUSTER_NAME=lightningtalk-dev-cluster
```

### Log Format

**Structured Log Format**

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO|WARN|ERROR",
  "message": "Descriptive message",
  "source": "api|database|frontend",
  "metadata": {
    "responseTime": 150,
    "statusCode": 200,
    "userId": "user123",
    "requestId": "req-abc-123"
  },
  "environment": "dev",
  "appName": "lightningtalk"
}
```

### CloudWatch Agent Configuration

```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/lightningtalk/*.log",
            "log_group_name": "/aws/lightningtalk/dev/application",
            "log_stream_name": "{instance_id}/application.log"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "lightningtalk/dev",
    "metrics_collected": {
      "cpu": { "measurement": ["cpu_usage_idle", "cpu_usage_user"] },
      "disk": { "measurement": ["used_percent"] },
      "mem": { "measurement": ["mem_used_percent"] }
    }
  }
}
```

## Deployment

### 1. Deploy Observability Stack

```bash
# Deploy the observability infrastructure
cdk deploy lightningtalk-Observability-dev --context env=dev

# Or use the setup script
./scripts/observability-setup.sh --environment dev
```

### 2. Configure Application Logging

**Node.js Application**

```javascript
const winston = require('winston');
const { Kinesis } = require('aws-sdk');

const kinesis = new Kinesis({ region: 'us-east-1' });

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.Stream({
      stream: {
        write: message => {
          kinesis
            .putRecord({
              StreamName: 'lightningtalk-dev-log-aggregation',
              Data: message,
              PartitionKey: 'application'
            })
            .promise();
        }
      }
    })
  ]
});

// Usage
logger.info('User registered for event', {
  source: 'api',
  metadata: {
    userId: 'user123',
    eventId: 'event456',
    responseTime: 150
  }
});
```

**Docker Container Logging**

```dockerfile
# Use structured logging format
ENV LOG_FORMAT=json
ENV LOG_LEVEL=info

# Configure log driver
LABEL logging.driver="awslogs"
LABEL logging.options.awslogs-group="/aws/lightningtalk/dev/containers"
```

### 3. ECS Service Configuration

```json
{
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/aws/lightningtalk/dev/ecs",
      "awslogs-region": "us-east-1",
      "awslogs-stream-prefix": "ecs"
    }
  },
  "firelensConfiguration": {
    "type": "fluentbit",
    "options": {
      "enable-ecs-log-metadata": "true"
    }
  }
}
```

## Monitoring Strategies

### 1. Application Performance Monitoring (APM)

**Key Metrics to Monitor**

- Response time percentiles (P50, P90, P99)
- Error rates by endpoint
- Throughput (requests per second)
- Database query performance

**Alert Thresholds**

- Response time > 2s (prod), 5s (dev)
- Error rate > 5% (prod), 10% (dev)
- Database connections > 80% of limit

### 2. Infrastructure Monitoring

**ECS Cluster Health**

- CPU utilization < 80%
- Memory utilization < 80%
- Task running count matches desired count

**Database Monitoring**

- CPU utilization < 80%
- Free memory > 1GB
- Connection count < limit

**Load Balancer Health**

- Target health check success rate > 95%
- Response time < 1s
- HTTP 5xx errors < 1%

### 3. Business Metrics Monitoring

**Event Management**

- Registration conversion rate
- Talk submission rate
- Capacity utilization trends
- User engagement metrics

**Anomaly Detection**

- Unusual registration patterns
- Sudden spikes in talk submissions
- Unexpected capacity utilization

## Alerting Runbooks

### High Error Rate Alert

1. **Immediate Actions**
   - Check application logs for error details
   - Verify service health in ECS console
   - Check database connectivity

2. **Investigation Steps**
   - Review recent deployments
   - Check infrastructure changes
   - Analyze error patterns in logs

3. **Escalation**
   - Page on-call engineer if errors persist > 15 minutes
   - Create incident ticket for tracking

### High Response Time Alert

1. **Immediate Actions**
   - Check current load and traffic patterns
   - Verify auto-scaling is functioning
   - Review database performance metrics

2. **Investigation Steps**
   - Analyze slow query logs
   - Check for resource contention
   - Review application performance profiling

3. **Mitigation**
   - Scale up resources if needed
   - Enable caching if applicable
   - Consider database optimization

### Database Connection Alert

1. **Immediate Actions**
   - Check current connection count
   - Verify application connection pooling
   - Look for connection leaks in logs

2. **Investigation Steps**
   - Review database parameter groups
   - Check for long-running transactions
   - Analyze application connection patterns

3. **Resolution**
   - Restart application instances if needed
   - Optimize connection pool settings
   - Consider database instance scaling

## Log Analysis

### CloudWatch Insights Queries

**Recent Errors**

```sql
fields @timestamp, level, message, source
| filter level = "ERROR"
| sort @timestamp desc
| limit 100
```

**Response Time Analysis**

```sql
fields @timestamp, metadata.responseTime, metadata.statusCode
| filter ispresent(metadata.responseTime)
| stats avg(metadata.responseTime), max(metadata.responseTime), min(metadata.responseTime) by bin(5m)
```

**Error Rate by Source**

```sql
fields @timestamp, level, source
| filter level = "ERROR"
| stats count() by source
| sort count desc
```

**User Activity Patterns**

```sql
fields @timestamp, metadata.userId, message
| filter ispresent(metadata.userId)
| stats count() by metadata.userId
| sort count desc
| limit 20
```

### OpenSearch Queries (if enabled)

**Full-text search across logs**

```json
{
  "query": {
    "bool": {
      "must": [
        { "range": { "@timestamp": { "gte": "now-1h" } } },
        { "match": { "message": "registration failed" } }
      ]
    }
  }
}
```

**Aggregation for error analysis**

```json
{
  "aggs": {
    "errors_by_hour": {
      "date_histogram": {
        "field": "@timestamp",
        "interval": "1h"
      },
      "aggs": {
        "error_types": {
          "terms": { "field": "metadata.errorType.keyword" }
        }
      }
    }
  }
}
```

## Cost Optimization

### Log Retention Strategy

**Development Environment**

- CloudWatch Logs: 30 days
- S3 Storage: 1 year
- Kinesis retention: 24 hours

**Production Environment**

- CloudWatch Logs: 6 months
- S3 Storage: 7 years with lifecycle policies
- Kinesis retention: 7 days

### Metrics Optimization

**High-frequency metrics** (1-minute intervals)

- Critical application metrics
- Infrastructure health metrics

**Medium-frequency metrics** (5-minute intervals)

- Business metrics
- Detailed performance metrics

**Low-frequency metrics** (1-hour intervals)

- Trend analysis metrics
- Capacity planning metrics

### Storage Costs

**S3 Lifecycle Rules**

```
Current → IA (30 days) → Glacier (90 days) → Deep Archive (365 days)
```

**Log Compression**

- Use GZIP compression for Kinesis Firehose
- Enable log compression in CloudWatch agent

## Troubleshooting

### Common Issues

**Missing Logs**

- Check CloudWatch agent configuration
- Verify IAM permissions for log shipping
- Check network connectivity to CloudWatch

**High Costs**

- Review log retention policies
- Optimize metric collection frequency
- Implement log filtering to reduce volume

**Alert Fatigue**

- Review and tune alert thresholds
- Implement alert suppression during maintenance
- Use composite alarms for related metrics

### Debug Commands

**Check log stream status**

```bash
aws logs describe-log-streams \
  --log-group-name "/aws/lightningtalk/dev/central" \
  --max-items 10
```

**View recent log events**

```bash
aws logs tail "/aws/lightningtalk/dev/central" \
  --since "1h ago" \
  --follow
```

**Check metric statistics**

```bash
aws cloudwatch get-metric-statistics \
  --namespace "lightningtalk/dev" \
  --metric-name "ErrorCount" \
  --start-time "$(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --period 300 \
  --statistics Sum
```

**Test alerting**

```bash
aws sns publish \
  --topic-arn "arn:aws:sns:us-east-1:123456789012:lightningtalk-dev-alerts" \
  --message "Test alert from observability guide"
```

## Best Practices

### Logging

1. **Use structured logging** with consistent fields
2. **Include correlation IDs** for request tracing
3. **Log at appropriate levels** (avoid debug in production)
4. **Include context** in error messages
5. **Use log sampling** for high-volume applications

### Metrics

1. **Define SLIs and SLOs** for key user journeys
2. **Use consistent naming conventions** for metrics
3. **Include relevant dimensions** for filtering
4. **Monitor both technical and business metrics**
5. **Set up anomaly detection** for trends

### Alerting

1. **Alert on user-impacting issues** not symptoms
2. **Define clear escalation procedures**
3. **Use runbooks** for common alert scenarios
4. **Review and tune alerts** regularly
5. **Implement alert fatigue prevention**

### Dashboards

1. **Create role-specific dashboards** (ops, dev, business)
2. **Use consistent time ranges** and refresh intervals
3. **Include both current state and trends**
4. **Add annotations** for deployments and incidents
5. **Keep dashboards** simple and focused

## Security Considerations

### Data Protection

1. **Encrypt logs** at rest and in transit
2. **Redact sensitive information** from logs
3. **Implement access controls** for log data
4. **Audit log access** and modifications
5. **Comply with data retention** requirements

### Access Control

1. **Use least privilege** for log access
2. **Implement role-based access** to dashboards
3. **Audit monitoring system** access
4. **Secure API keys** and credentials
5. **Monitor for unauthorized** access attempts

---

This guide provides comprehensive coverage of the observability infrastructure
for Lightning Talk Circle. For specific implementation details, refer to the CDK
stacks and deployment scripts in the repository.
