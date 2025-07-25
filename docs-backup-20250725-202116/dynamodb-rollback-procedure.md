# DynamoDB Rollback Procedure

This document outlines the rollback procedure for reverting from DynamoDB to the
file-based database system.

## Prerequisites

- Access to AWS Console or AWS CLI
- Migration backup created during the initial migration
- Application deployment permissions

## Rollback Scenarios

### Scenario 1: Application Issues After Migration

If the application experiences issues after migrating to DynamoDB:

1. **Immediate Rollback (< 24 hours)**

   ```bash
   # Stop the application
   npm run stop

   # Run the rollback command
   npm run migrate-to-dynamodb rollback

   # Update environment variables
   export DATABASE_TYPE=file

   # Restart the application
   npm run start
   ```

2. **Rollback with Data Preservation** If new data was added after migration:

   ```bash
   # Export current DynamoDB data
   npm run export-dynamodb-data

   # Run rollback
   npm run migrate-to-dynamodb rollback

   # Merge new data (manual process)
   npm run merge-data-manual
   ```

### Scenario 2: Performance Issues

If DynamoDB performance doesn't meet expectations:

1. **Check CloudWatch Metrics**
   - Review consumed capacity metrics
   - Check throttling alerts
   - Analyze request latency

2. **Temporary Mitigation**

   ```bash
   # Switch to on-demand billing if using provisioned
   aws dynamodb update-table \
     --table-name lightningtalk-circle-events \
     --billing-mode PAY_PER_REQUEST
   ```

3. **Full Rollback** Follow Scenario 1 procedures

### Scenario 3: Cost Issues

If DynamoDB costs exceed budget:

1. **Review Usage Patterns**
   - Check CloudWatch for hot partition keys
   - Review application query patterns
   - Optimize GSI usage

2. **Cost Optimization**
   - Switch to provisioned capacity with auto-scaling
   - Remove unnecessary GSIs
   - Implement caching layer

3. **Rollback if Necessary** Follow Scenario 1 procedures

## Step-by-Step Rollback Procedure

### 1. Pre-Rollback Checks

```bash
# Check current database status
npm run database-health-check

# Verify backup exists
ls -la migration-backups/

# Check application status
npm run status
```

### 2. Application Preparation

```bash
# Enable maintenance mode
npm run maintenance:enable

# Stop background jobs
npm run jobs:stop

# Create final DynamoDB backup
npm run backup-dynamodb
```

### 3. Execute Rollback

```bash
# Run the automated rollback
npm run migrate-to-dynamodb rollback

# Verify rollback success
npm run migrate-to-dynamodb status
```

### 4. Configuration Update

```bash
# Update .env file
sed -i 's/DATABASE_TYPE=dynamodb/DATABASE_TYPE=file/' .env

# Update CDK configuration if needed
cd cdk
npm run config:update-database-type file
```

### 5. Application Restart

```bash
# Start the application with file database
npm run start

# Verify functionality
npm run health-check

# Run integration tests
npm run test:integration

# Disable maintenance mode
npm run maintenance:disable
```

### 6. Post-Rollback Validation

```bash
# Check application logs
npm run logs:tail

# Monitor error rates
npm run monitor:errors

# Verify data integrity
npm run data:verify
```

## Rollback Verification Checklist

- [ ] All data is accessible in file-based system
- [ ] No data loss occurred during rollback
- [ ] Application functions normally
- [ ] Background jobs are running
- [ ] No errors in logs
- [ ] Performance metrics are acceptable
- [ ] Users can access the system

## Emergency Contacts

- **DevOps Team**: devops@lightningtalk.example.com
- **Database Admin**: dba@lightningtalk.example.com
- **On-Call Engineer**: +81-80-XXXX-XXXX

## Automation Scripts

### Quick Rollback Script

```bash
#!/bin/bash
# quick-rollback.sh

echo "Starting emergency rollback..."

# Enable maintenance mode
npm run maintenance:enable

# Stop services
npm run stop

# Execute rollback
npm run migrate-to-dynamodb rollback

# Update configuration
sed -i 's/DATABASE_TYPE=dynamodb/DATABASE_TYPE=file/' .env

# Start services
npm run start

# Verify health
npm run health-check

# Disable maintenance mode
npm run maintenance:disable

echo "Rollback completed!"
```

### Data Export Script

```bash
#!/bin/bash
# export-dynamodb-data.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_DIR="dynamodb-exports/${TIMESTAMP}"

mkdir -p ${EXPORT_DIR}

# Export each table
for TABLE in events participants users talks; do
  aws dynamodb scan \
    --table-name lightningtalk-circle-${TABLE} \
    --output json > ${EXPORT_DIR}/${TABLE}.json
done

echo "Data exported to ${EXPORT_DIR}"
```

## Rollback Time Estimates

- **Immediate Rollback**: 5-10 minutes
- **Rollback with Data Export**: 15-30 minutes
- **Full System Validation**: 30-60 minutes

## Important Notes

1. **Data Consistency**: Ensure no writes occur during rollback
2. **Backup Retention**: Keep migration backups for at least 30 days
3. **Testing**: Always test rollback procedure in staging first
4. **Communication**: Notify stakeholders before and after rollback
5. **Documentation**: Document the reason for rollback and any issues
   encountered

## Rollback Decision Matrix

| Issue Type  | Severity | Recommended Action | Rollback? |
| ----------- | -------- | ------------------ | --------- |
| Data Loss   | Critical | Immediate rollback | Yes       |
| Performance | High     | Optimize first     | Maybe     |
| Cost        | Medium   | Review usage       | Maybe     |
| Minor Bugs  | Low      | Fix in place       | No        |

## Post-Rollback Actions

1. **Root Cause Analysis**
   - Document what went wrong
   - Identify preventive measures
   - Update migration procedures

2. **Stakeholder Communication**
   - Notify management of rollback
   - Provide timeline for resolution
   - Document lessons learned

3. **Future Migration Planning**
   - Address identified issues
   - Plan remediation steps
   - Schedule re-migration if appropriate
