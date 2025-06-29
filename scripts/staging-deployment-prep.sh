#!/bin/bash

# Lightning Talk Circle - Staging Deployment Preparation Script
# Comprehensive preparation for staging environment deployment

set -e

# Configuration
ENVIRONMENT=${ENVIRONMENT:-"staging"}
AWS_REGION=${AWS_REGION:-"ap-northeast-1"}
STACK_PREFIX="LightningTalk"
DRY_RUN=${DRY_RUN:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Lightning Talk Circle Staging Deployment Preparation ===${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Region: ${YELLOW}${AWS_REGION}${NC}"
echo -e "Dry Run: ${YELLOW}${DRY_RUN}${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking staging deployment prerequisites..."
    
    local errors=0
    
    # Check required tools
    for tool in cdk aws node npm; do
        if ! command -v $tool &> /dev/null; then
            print_error "$tool is not installed or not in PATH"
            ((errors++))
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured or invalid"
        ((errors++))
    fi
    
    # Check if we're in the right directory
    if [ ! -f "cdk/cdk.json" ]; then
        print_error "CDK configuration not found. Run from project root."
        ((errors++))
    fi
    
    # Check environment variables
    if [ -z "$AWS_ACCOUNT_ID_STAGING" ] && [ -z "$CDK_DEFAULT_ACCOUNT" ]; then
        print_warning "AWS_ACCOUNT_ID_STAGING not set, will use default account"
    fi
    
    if [ $errors -gt 0 ]; then
        print_error "Prerequisites check failed with $errors errors"
        exit 1
    fi
    
    print_status "Prerequisites check completed"
}

# Function to validate CDK bootstrap
check_cdk_bootstrap() {
    print_step "Checking CDK bootstrap status..."
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local bootstrap_stack="CDKToolkit"
    
    print_status "Checking bootstrap for account: $account_id, region: $AWS_REGION"
    
    if aws cloudformation describe-stacks --stack-name "$bootstrap_stack" --region "$AWS_REGION" &> /dev/null; then
        print_status "✅ CDK bootstrap already exists"
    else
        print_warning "⚠️  CDK bootstrap not found"
        
        if [ "$DRY_RUN" = "false" ]; then
            print_status "Running CDK bootstrap..."
            cd cdk && npx cdk bootstrap --region "$AWS_REGION"
            cd ..
            print_status "✅ CDK bootstrap completed"
        else
            print_warning "Would run: cdk bootstrap --region $AWS_REGION"
        fi
    fi
}

# Function to validate infrastructure templates
validate_infrastructure() {
    print_step "Validating CDK infrastructure templates..."
    
    # Validate all stacks can synthesize
    if (cd cdk && npx cdk synth --context env="$ENVIRONMENT" --all > /dev/null 2>&1); then
        print_status "✅ All stacks synthesize successfully"
    else
        print_error "❌ CDK synthesis failed"
        return 1
    fi
    
    # Validate individual stacks
    local stacks=(
        "${STACK_PREFIX}-Database-${ENVIRONMENT}"
        "${STACK_PREFIX}-Security-${ENVIRONMENT}"
        "${STACK_PREFIX}-Api-${ENVIRONMENT}"
        "${STACK_PREFIX}-StaticSite-${ENVIRONMENT}"
        "${STACK_PREFIX}-Monitoring-${ENVIRONMENT}"
        "${STACK_PREFIX}-Observability-${ENVIRONMENT}"
        "${STACK_PREFIX}-DisasterRecovery-${ENVIRONMENT}"
    )
    
    for stack in "${stacks[@]}"; do
        print_status "Validating stack: $stack"
        if (cd cdk && npx cdk synth --context env="$ENVIRONMENT" "$stack" > /dev/null 2>&1); then
            print_status "✅ $stack validation successful"
        else
            print_error "❌ $stack validation failed"
            return 1
        fi
    done
    
    print_status "Infrastructure validation completed"
}

# Function to check resource quotas
check_resource_quotas() {
    print_step "Checking AWS service quotas..."
    
    # Check VPC quotas
    local vpc_limit=$(aws ec2 describe-account-attributes --attribute-names max-vpcs --query 'AccountAttributes[0].AttributeValues[0].AttributeValue' --output text)
    local vpc_count=$(aws ec2 describe-vpcs --query 'length(Vpcs)')
    print_status "VPC usage: ${vpc_count}/${vpc_limit}"
    
    # Check EIP quotas
    local eip_limit=$(aws ec2 describe-account-attributes --attribute-names max-elastic-ips --query 'AccountAttributes[0].AttributeValues[0].AttributeValue' --output text)
    local eip_count=$(aws ec2 describe-addresses --query 'length(Addresses)')
    print_status "Elastic IP usage: ${eip_count}/${eip_limit}"
    
    # Check RDS quotas
    local rds_limit=40  # Default limit, would need Service Quotas API for exact value
    local rds_count=$(aws rds describe-db-instances --query 'length(DBInstances)')
    print_status "RDS instance usage: ${rds_count}/${rds_limit}"
    
    # Check if we have enough resources for staging
    if [ $((vpc_count + 1)) -gt $vpc_limit ]; then
        print_error "Insufficient VPC quota for deployment"
        return 1
    fi
    
    if [ $((eip_count + 2)) -gt $eip_limit ]; then
        print_error "Insufficient Elastic IP quota for deployment"
        return 1
    fi
    
    print_status "Resource quota check completed"
}

# Function to prepare secrets
prepare_secrets() {
    print_step "Preparing secrets for staging environment..."
    
    local secrets=(
        "lightningtalk/staging/database/password"
        "lightningtalk/staging/api/jwt-secret"
        "lightningtalk/staging/api/session-secret"
    )
    
    for secret in "${secrets[@]}"; do
        print_status "Checking secret: $secret"
        
        if aws secretsmanager describe-secret --secret-id "$secret" --region "$AWS_REGION" &> /dev/null; then
            print_status "✅ Secret exists: $secret"
        else
            print_warning "⚠️  Secret not found: $secret"
            
            if [ "$DRY_RUN" = "false" ]; then
                # Generate secure random values
                local secret_value
                case "$secret" in
                    *database/password*)
                        secret_value=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
                        ;;
                    *jwt-secret*|*session-secret*)
                        secret_value=$(openssl rand -hex 32)
                        ;;
                    *)
                        secret_value=$(openssl rand -base64 32)
                        ;;
                esac
                
                aws secretsmanager create-secret \
                    --name "$secret" \
                    --description "Lightning Talk Circle staging secret" \
                    --secret-string "$secret_value" \
                    --region "$AWS_REGION" > /dev/null
                
                print_status "✅ Created secret: $secret"
            else
                print_warning "Would create secret: $secret"
            fi
        fi
    done
    
    print_status "Secrets preparation completed"
}

# Function to generate deployment plan
generate_deployment_plan() {
    print_step "Generating staging deployment plan..."
    
    local plan_file="./staging-deployment-plan-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$plan_file" << EOF
# Lightning Talk Circle - Staging Deployment Plan

## Deployment Summary

- **Environment**: $ENVIRONMENT
- **Region**: $AWS_REGION
- **Date**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- **Stack Prefix**: $STACK_PREFIX

## Pre-Deployment Checklist

### Prerequisites ✅
- [x] AWS credentials configured
- [x] CDK bootstrap completed
- [x] Infrastructure templates validated
- [x] Resource quotas sufficient
- [x] Secrets prepared

### Deployment Phases

#### Phase 1: Foundation Infrastructure (Est. 15-20 min)
1. **Database Stack**: Deploy VPC, RDS PostgreSQL, ElastiCache Redis
   - Command: \`cdk deploy ${STACK_PREFIX}-Database-${ENVIRONMENT}\`
   - Resources: VPC, Subnets, Security Groups, RDS, ElastiCache
   - Dependencies: None

2. **Security Stack**: Deploy security infrastructure
   - Command: \`cdk deploy ${STACK_PREFIX}-Security-${ENVIRONMENT}\`
   - Resources: KMS, CloudTrail, WAF, GuardDuty
   - Dependencies: None

#### Phase 2: Application Infrastructure (Est. 10-15 min)
3. **API Stack**: Deploy application platform
   - Command: \`cdk deploy ${STACK_PREFIX}-Api-${ENVIRONMENT}\`
   - Resources: ECS Fargate, ALB, Auto Scaling
   - Dependencies: Database Stack, Security Stack

4. **Static Site Stack**: Deploy content delivery
   - Command: \`cdk deploy ${STACK_PREFIX}-StaticSite-${ENVIRONMENT}\`
   - Resources: S3, CloudFront, Route 53
   - Dependencies: Security Stack

#### Phase 3: Observability (Est. 5-10 min)
5. **Monitoring Stack**: Deploy monitoring infrastructure
   - Command: \`cdk deploy ${STACK_PREFIX}-Monitoring-${ENVIRONMENT}\`
   - Resources: CloudWatch Dashboards, Alarms
   - Dependencies: API Stack, Database Stack

6. **Observability Stack**: Deploy log aggregation
   - Command: \`cdk deploy ${STACK_PREFIX}-Observability-${ENVIRONMENT}\`
   - Resources: Kinesis, Lambda, SNS
   - Dependencies: None

#### Phase 4: Backup & Recovery (Est. 5 min)
7. **Disaster Recovery Stack**: Deploy backup infrastructure
   - Command: \`cdk deploy ${STACK_PREFIX}-DisasterRecovery-${ENVIRONMENT}\`
   - Resources: AWS Backup, Cross-region replication
   - Dependencies: Database Stack, Static Site Stack

## Deployment Commands

### Individual Stack Deployment
\`\`\`bash
cd cdk

# Phase 1
npx cdk deploy ${STACK_PREFIX}-Database-${ENVIRONMENT} --context env=${ENVIRONMENT}
npx cdk deploy ${STACK_PREFIX}-Security-${ENVIRONMENT} --context env=${ENVIRONMENT}

# Phase 2  
npx cdk deploy ${STACK_PREFIX}-Api-${ENVIRONMENT} --context env=${ENVIRONMENT}
npx cdk deploy ${STACK_PREFIX}-StaticSite-${ENVIRONMENT} --context env=${ENVIRONMENT}

# Phase 3
npx cdk deploy ${STACK_PREFIX}-Monitoring-${ENVIRONMENT} --context env=${ENVIRONMENT}
npx cdk deploy ${STACK_PREFIX}-Observability-${ENVIRONMENT} --context env=${ENVIRONMENT}

# Phase 4
npx cdk deploy ${STACK_PREFIX}-DisasterRecovery-${ENVIRONMENT} --context env=${ENVIRONMENT}
\`\`\`

### All Stacks Deployment
\`\`\`bash
cd cdk
npx cdk deploy --all --context env=${ENVIRONMENT}
\`\`\`

## Post-Deployment Validation

### Health Checks
- [ ] RDS database connectivity
- [ ] ElastiCache Redis connectivity
- [ ] ECS service health
- [ ] Load balancer health checks
- [ ] CloudFront distribution status
- [ ] WAF rules active
- [ ] GuardDuty enabled
- [ ] CloudWatch metrics flowing
- [ ] Log aggregation working

### Performance Testing
- [ ] API response time < 500ms
- [ ] Database query performance
- [ ] Auto-scaling functionality
- [ ] Cache hit rates
- [ ] CDN performance

### Security Validation
- [ ] WAF blocking malicious requests
- [ ] Security groups restricting access
- [ ] Encryption working end-to-end
- [ ] Audit logging operational
- [ ] GuardDuty findings review

## Rollback Plan

### Preparation
- Database backup completed before deployment
- Previous infrastructure state documented
- Rollback scripts prepared

### Execution
1. Disable new traffic routing
2. Roll back to previous ECS task definition
3. Restore database from backup if needed
4. Update DNS records
5. Validate rollback success

## Emergency Contacts

- **DevOps Team**: [Slack Channel]
- **AWS Support**: [Support Case Link]
- **On-call Engineer**: [Phone Number]

## Monitoring & Alerts

### Key Metrics to Watch
- ECS service CPU/Memory utilization
- RDS connection count and performance
- ALB response times and error rates
- CloudFront cache hit rates
- WAF blocked requests

### Alert Thresholds
- CPU utilization > 80%
- Memory utilization > 85%
- API response time > 1000ms
- Database connection > 80% of max
- Error rate > 5%

---
Generated by Staging Deployment Preparation Script
Plan ID: staging-deploy-$(date +%s)
EOF

    print_status "Deployment plan saved to: $plan_file"
    echo "$plan_file"
}

# Function to run pre-deployment checks
run_predeployment_checks() {
    print_step "Running comprehensive pre-deployment checks..."
    
    # Check current stack status
    local stacks=(
        "${STACK_PREFIX}-Database-${ENVIRONMENT}"
        "${STACK_PREFIX}-Security-${ENVIRONMENT}"
        "${STACK_PREFIX}-Api-${ENVIRONMENT}"
        "${STACK_PREFIX}-StaticSite-${ENVIRONMENT}"
        "${STACK_PREFIX}-Monitoring-${ENVIRONMENT}"
        "${STACK_PREFIX}-Observability-${ENVIRONMENT}"
        "${STACK_PREFIX}-DisasterRecovery-${ENVIRONMENT}"
    )
    
    print_status "Checking existing stack status..."
    for stack in "${stacks[@]}"; do
        if aws cloudformation describe-stacks --stack-name "$stack" --region "$AWS_REGION" &> /dev/null; then
            local status=$(aws cloudformation describe-stacks --stack-name "$stack" --region "$AWS_REGION" --query 'Stacks[0].StackStatus' --output text)
            print_warning "⚠️  Stack exists: $stack (Status: $status)"
        else
            print_status "✅ Stack ready for creation: $stack"
        fi
    done
    
    # CDK diff to show what will be deployed
    print_status "Generating CDK diff..."
    if (cd cdk && npx cdk diff --context env="$ENVIRONMENT" --all > /tmp/cdk-diff-${ENVIRONMENT}.txt 2>&1); then
        local diff_lines=$(wc -l < /tmp/cdk-diff-${ENVIRONMENT}.txt)
        print_status "CDK diff generated: $diff_lines lines of changes"
        print_status "Review diff at: /tmp/cdk-diff-${ENVIRONMENT}.txt"
    else
        print_warning "Could not generate CDK diff (expected for new deployment)"
    fi
    
    print_status "Pre-deployment checks completed"
}

# Main execution function
main() {
    local start_time=$(date +%s)
    
    print_status "Starting staging deployment preparation..."
    
    check_prerequisites
    check_cdk_bootstrap
    validate_infrastructure
    check_resource_quotas
    prepare_secrets
    run_predeployment_checks
    local plan_file=$(generate_deployment_plan)
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    local total_minutes=$((total_time / 60))
    
    print_status "🎉 Staging deployment preparation completed successfully!"
    print_status "Environment: $ENVIRONMENT"
    print_status "Total preparation time: ${total_minutes}m ${total_time}s"
    print_status "Deployment plan: $plan_file"
    
    echo ""
    print_step "Next Steps:"
    echo "1. Review the generated deployment plan"
    echo "2. Ensure all team members are notified"
    echo "3. Schedule deployment window"
    echo "4. Execute deployment phases"
    echo "5. Monitor deployment progress"
    echo ""
    
    if [ "$DRY_RUN" = "true" ]; then
        print_warning "This was a dry run. No actual resources were created."
    fi
    
    exit 0
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --environment ENV       Target environment [default: staging]"
    echo "  --region REGION         AWS region [default: ap-northeast-1]"
    echo "  --dry-run              Run in dry-run mode (no actual changes)"
    echo "  --help                 Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  ENVIRONMENT            Environment name"
    echo "  AWS_REGION             AWS region"
    echo "  AWS_ACCOUNT_ID_STAGING Staging AWS account ID"
    echo "  DRY_RUN                Dry run mode (true/false)"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 --environment staging --region ap-northeast-1"
    echo "  $0 --dry-run"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Execute main function if script is run directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi