#!/bin/bash

# Lightning Talk Circle - Staging Performance Validation Script
# Comprehensive performance testing and validation for staging environment

set -e

# Configuration
ENVIRONMENT=${ENVIRONMENT:-"staging"}
AWS_REGION=${AWS_REGION:-"ap-northeast-1"}
TEST_DURATION=${TEST_DURATION:-300}  # 5 minutes
CONCURRENT_USERS=${CONCURRENT_USERS:-50}
RAMP_UP_DURATION=${RAMP_UP_DURATION:-60}  # 1 minute
API_ENDPOINT=${API_ENDPOINT:-""}
STATIC_SITE_URL=${STATIC_SITE_URL:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Lightning Talk Circle Staging Performance Validation ===${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Region: ${YELLOW}${AWS_REGION}${NC}"
echo -e "Test Duration: ${YELLOW}${TEST_DURATION}s${NC}"
echo -e "Concurrent Users: ${YELLOW}${CONCURRENT_USERS}${NC}"
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
    print_step "Checking performance testing prerequisites..."
    
    local errors=0
    
    # Check required tools
    for tool in aws node npm curl jq; do
        if ! command -v $tool &> /dev/null; then
            print_error "$tool is not installed or not in PATH"
            ((errors++))
        fi
    done
    
    # Check if Artillery is installed
    if ! command -v artillery &> /dev/null; then
        print_warning "Artillery not found globally, installing locally..."
        npm install artillery --save-dev || {
            print_error "Failed to install Artillery"
            ((errors++))
        }
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured or invalid"
        ((errors++))
    fi
    
    if [ $errors -gt 0 ]; then
        print_error "Prerequisites check failed with $errors errors"
        exit 1
    fi
    
    print_status "Prerequisites check completed"
}

# Function to discover endpoints
discover_endpoints() {
    print_step "Discovering staging environment endpoints..."
    
    local stack_prefix="LightningTalk"
    
    # Get API endpoint from CloudFormation stack outputs
    if [ -z "$API_ENDPOINT" ]; then
        API_ENDPOINT=$(aws cloudformation describe-stacks \
            --stack-name "${stack_prefix}-Api-${ENVIRONMENT}" \
            --region "$AWS_REGION" \
            --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$API_ENDPOINT" ]; then
            API_ENDPOINT="http://${API_ENDPOINT}"
            print_status "Discovered API endpoint: $API_ENDPOINT"
        else
            print_warning "Could not discover API endpoint from CloudFormation"
        fi
    fi
    
    # Get static site URL from CloudFormation stack outputs
    if [ -z "$STATIC_SITE_URL" ]; then
        STATIC_SITE_URL=$(aws cloudformation describe-stacks \
            --stack-name "${stack_prefix}-StaticSite-${ENVIRONMENT}" \
            --region "$AWS_REGION" \
            --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$STATIC_SITE_URL" ]; then
            STATIC_SITE_URL="https://${STATIC_SITE_URL}"
            print_status "Discovered static site URL: $STATIC_SITE_URL"
        else
            print_warning "Could not discover static site URL from CloudFormation"
        fi
    fi
    
    # Validate endpoints are accessible
    if [ -n "$API_ENDPOINT" ]; then
        if curl -f -s -o /dev/null --max-time 10 "${API_ENDPOINT}/health" || curl -f -s -o /dev/null --max-time 10 "${API_ENDPOINT}/"; then
            print_status "✅ API endpoint is accessible"
        else
            print_warning "⚠️  API endpoint may not be accessible"
        fi
    fi
    
    if [ -n "$STATIC_SITE_URL" ]; then
        if curl -f -s -o /dev/null --max-time 10 "$STATIC_SITE_URL"; then
            print_status "✅ Static site is accessible"
        else
            print_warning "⚠️  Static site may not be accessible"
        fi
    fi
}

# Function to create Artillery test configuration
create_artillery_config() {
    print_step "Creating Artillery load test configuration..."
    
    local config_file="./artillery-staging-test.yml"
    
    cat > "$config_file" << EOF
config:
  target: '$API_ENDPOINT'
  phases:
    - duration: $RAMP_UP_DURATION
      arrivalRate: 1
      rampTo: $((CONCURRENT_USERS / 2))
      name: "Ramp up phase"
    - duration: $TEST_DURATION
      arrivalRate: $((CONCURRENT_USERS / 2))
      rampTo: $CONCURRENT_USERS
      name: "Load test phase"
    - duration: 60
      arrivalRate: $CONCURRENT_USERS
      rampTo: 1
      name: "Ramp down phase"
  defaults:
    headers:
      User-Agent: 'Artillery Load Test'
      Accept: 'application/json'
  plugins:
    metrics-by-endpoint:
      useOnlyRequestNames: true
    
scenarios:
  - name: "Health Check and Basic API"
    weight: 40
    flow:
      - get:
          url: "/health"
          name: "Health Check"
      - think: 1
      - get:
          url: "/"
          name: "Root Endpoint"
      - think: 2
      
  - name: "Event Management"
    weight: 30
    flow:
      - get:
          url: "/api/events"
          name: "List Events"
      - think: 1
      - get:
          url: "/api/events/1"
          name: "Get Event Details"
      - think: 2
      - post:
          url: "/api/events/1/register"
          name: "Event Registration"
          json:
            name: "Test User"
            email: "test@example.com"
            participation_type: "online"
      
  - name: "Static Content"
    weight: 20
    flow:
      - get:
          url: "/static/css/style.css"
          name: "CSS Resource"
      - get:
          url: "/static/js/app.js"
          name: "JS Resource"
      - think: 1
      
  - name: "Stress Test"
    weight: 10
    flow:
      - loop:
        - get:
            url: "/api/events"
        - get:
            url: "/health"
        count: 5
EOF

    print_status "Artillery configuration created: $config_file"
    echo "$config_file"
}

# Function to run CloudWatch metrics collection
setup_metrics_collection() {
    print_step "Setting up CloudWatch metrics collection..."
    
    # Create custom dashboard for performance testing
    local dashboard_name="LightningTalk-PerformanceTest-${ENVIRONMENT}"
    
    cat > /tmp/dashboard-config.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "app/lightningtalk-alb-${ENVIRONMENT}" ],
                    [ ".", "RequestCount", ".", "." ],
                    [ ".", "HTTPCode_Target_2XX_Count", ".", "." ],
                    [ ".", "HTTPCode_Target_4XX_Count", ".", "." ],
                    [ ".", "HTTPCode_Target_5XX_Count", ".", "." ]
                ],
                "period": 60,
                "stat": "Average",
                "region": "$AWS_REGION",
                "title": "Load Balancer Metrics"
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "CPUUtilization", "ServiceName", "lightningtalk-service-${ENVIRONMENT}" ],
                    [ ".", "MemoryUtilization", ".", "." ]
                ],
                "period": 60,
                "stat": "Average",
                "region": "$AWS_REGION",
                "title": "ECS Service Metrics"
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "lightningtalk-database-${ENVIRONMENT}" ],
                    [ ".", "DatabaseConnections", ".", "." ],
                    [ ".", "ReadLatency", ".", "." ],
                    [ ".", "WriteLatency", ".", "." ]
                ],
                "period": 60,
                "stat": "Average",
                "region": "$AWS_REGION",
                "title": "Database Metrics"
            }
        }
    ]
}
EOF

    aws cloudwatch put-dashboard \
        --dashboard-name "$dashboard_name" \
        --dashboard-body file:///tmp/dashboard-config.json \
        --region "$AWS_REGION" > /dev/null
    
    print_status "Performance testing dashboard created: $dashboard_name"
}

# Function to run performance baseline test
run_baseline_test() {
    print_step "Running performance baseline test..."
    
    local baseline_file="./baseline-test-$(date +%Y%m%d_%H%M%S).json"
    
    print_status "Running baseline performance test..."
    
    # Simple baseline test with single user
    cat > /tmp/baseline-config.yml << EOF
config:
  target: '$API_ENDPOINT'
  phases:
    - duration: 30
      arrivalRate: 1
scenarios:
  - flow:
      - get:
          url: "/health"
      - get:
          url: "/"
      - get:
          url: "/api/events"
EOF

    if command -v artillery &> /dev/null; then
        artillery run /tmp/baseline-config.yml --output "$baseline_file" || {
            print_warning "Baseline test failed, continuing..."
        }
        
        if [ -f "$baseline_file" ]; then
            artillery report "$baseline_file" --output "./baseline-report-$(date +%Y%m%d_%H%M%S).html"
            print_status "Baseline test completed: $baseline_file"
        fi
    else
        print_warning "Artillery not available, skipping baseline test"
    fi
}

# Function to run main load test
run_load_test() {
    print_step "Running main load test..."
    
    local config_file=$(create_artillery_config)
    local results_file="./load-test-results-$(date +%Y%m%d_%H%M%S).json"
    local report_file="./load-test-report-$(date +%Y%m%d_%H%M%S).html"
    
    print_status "Starting load test with $CONCURRENT_USERS concurrent users for ${TEST_DURATION}s..."
    print_status "Monitor progress at: https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=LightningTalk-PerformanceTest-${ENVIRONMENT}"
    
    if command -v artillery &> /dev/null; then
        artillery run "$config_file" --output "$results_file" || {
            print_error "Load test failed"
            return 1
        }
        
        # Generate HTML report
        artillery report "$results_file" --output "$report_file"
        
        print_status "Load test completed successfully"
        print_status "Results: $results_file"
        print_status "Report: $report_file"
        
        # Extract key metrics
        if [ -f "$results_file" ]; then
            local avg_response_time=$(jq -r '.aggregate.latency.mean' "$results_file" 2>/dev/null || echo "N/A")
            local p95_response_time=$(jq -r '.aggregate.latency.p95' "$results_file" 2>/dev/null || echo "N/A")
            local total_requests=$(jq -r '.aggregate.counters["http.requests"]' "$results_file" 2>/dev/null || echo "N/A")
            local error_rate=$(jq -r '.aggregate.counters["http.response_codes.500"] // 0' "$results_file" 2>/dev/null || echo "0")
            
            print_status "Performance Summary:"
            echo "  Average Response Time: ${avg_response_time}ms"
            echo "  P95 Response Time: ${p95_response_time}ms"
            echo "  Total Requests: $total_requests"
            echo "  Error Count: $error_rate"
        fi
    else
        print_error "Artillery not available for load testing"
        return 1
    fi
    
    echo "$results_file"
}

# Function to validate performance thresholds
validate_performance_thresholds() {
    print_step "Validating performance against staging thresholds..."
    
    local results_file="$1"
    local errors=0
    
    if [ ! -f "$results_file" ]; then
        print_error "Results file not found: $results_file"
        return 1
    fi
    
    # Define staging performance thresholds
    local max_avg_response_time=500  # 500ms
    local max_p95_response_time=1000  # 1000ms
    local max_error_rate=5  # 5%
    
    # Extract metrics
    local avg_response_time=$(jq -r '.aggregate.latency.mean' "$results_file" 2>/dev/null || echo "0")
    local p95_response_time=$(jq -r '.aggregate.latency.p95' "$results_file" 2>/dev/null || echo "0")
    local total_requests=$(jq -r '.aggregate.counters["http.requests"]' "$results_file" 2>/dev/null || echo "1")
    local error_count=$(jq -r '.aggregate.counters["http.response_codes.500"] // 0' "$results_file" 2>/dev/null || echo "0")
    
    # Calculate error rate
    local error_rate=0
    if [ "$total_requests" -gt 0 ]; then
        error_rate=$((error_count * 100 / total_requests))
    fi
    
    # Validate thresholds
    print_status "Threshold Validation:"
    
    # Average response time
    if [ "$(echo "$avg_response_time > $max_avg_response_time" | bc 2>/dev/null || echo "0")" -eq 1 ]; then
        print_error "❌ Average response time exceeded: ${avg_response_time}ms > ${max_avg_response_time}ms"
        ((errors++))
    else
        print_status "✅ Average response time: ${avg_response_time}ms (< ${max_avg_response_time}ms)"
    fi
    
    # P95 response time
    if [ "$(echo "$p95_response_time > $max_p95_response_time" | bc 2>/dev/null || echo "0")" -eq 1 ]; then
        print_error "❌ P95 response time exceeded: ${p95_response_time}ms > ${max_p95_response_time}ms"
        ((errors++))
    else
        print_status "✅ P95 response time: ${p95_response_time}ms (< ${max_p95_response_time}ms)"
    fi
    
    # Error rate
    if [ "$error_rate" -gt "$max_error_rate" ]; then
        print_error "❌ Error rate exceeded: ${error_rate}% > ${max_error_rate}%"
        ((errors++))
    else
        print_status "✅ Error rate: ${error_rate}% (< ${max_error_rate}%)"
    fi
    
    if [ $errors -gt 0 ]; then
        print_error "Performance validation failed with $errors threshold violations"
        return 1
    else
        print_status "✅ All performance thresholds met"
        return 0
    fi
}

# Function to collect AWS metrics during test
collect_aws_metrics() {
    print_step "Collecting AWS infrastructure metrics..."
    
    local metrics_file="./aws-metrics-$(date +%Y%m%d_%H%M%S).json"
    local end_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local start_time=$(date -u -d '10 minutes ago' +"%Y-%m-%dT%H:%M:%SZ")
    
    # Collect ECS metrics
    print_status "Collecting ECS metrics..."
    aws cloudwatch get-metric-statistics \
        --namespace "AWS/ECS" \
        --metric-name "CPUUtilization" \
        --dimensions Name=ServiceName,Value="lightningtalk-service-${ENVIRONMENT}" \
        --start-time "$start_time" \
        --end-time "$end_time" \
        --period 60 \
        --statistics Average,Maximum \
        --region "$AWS_REGION" > /tmp/ecs-cpu-metrics.json
    
    # Collect RDS metrics
    print_status "Collecting RDS metrics..."
    aws cloudwatch get-metric-statistics \
        --namespace "AWS/RDS" \
        --metric-name "CPUUtilization" \
        --dimensions Name=DBInstanceIdentifier,Value="lightningtalk-database-${ENVIRONMENT}" \
        --start-time "$start_time" \
        --end-time "$end_time" \
        --period 60 \
        --statistics Average,Maximum \
        --region "$AWS_REGION" > /tmp/rds-cpu-metrics.json
    
    # Collect ALB metrics
    print_status "Collecting ALB metrics..."
    aws cloudwatch get-metric-statistics \
        --namespace "AWS/ApplicationELB" \
        --metric-name "TargetResponseTime" \
        --dimensions Name=LoadBalancer,Value="app/lightningtalk-alb-${ENVIRONMENT}" \
        --start-time "$start_time" \
        --end-time "$end_time" \
        --period 60 \
        --statistics Average,Maximum \
        --region "$AWS_REGION" > /tmp/alb-response-metrics.json
    
    # Combine metrics
    jq -n --slurpfile ecs /tmp/ecs-cpu-metrics.json \
         --slurpfile rds /tmp/rds-cpu-metrics.json \
         --slurpfile alb /tmp/alb-response-metrics.json \
         '{ecs: $ecs[0], rds: $rds[0], alb: $alb[0]}' > "$metrics_file"
    
    print_status "AWS metrics collected: $metrics_file"
    echo "$metrics_file"
}

# Function to generate performance report
generate_performance_report() {
    print_step "Generating comprehensive performance report..."
    
    local results_file="$1"
    local aws_metrics_file="$2"
    local report_file="./performance-validation-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# Lightning Talk Circle - Staging Performance Validation Report

## Test Summary

- **Environment**: $ENVIRONMENT
- **Region**: $AWS_REGION
- **Test Date**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- **Test Duration**: ${TEST_DURATION}s
- **Concurrent Users**: $CONCURRENT_USERS
- **Ramp Up Duration**: ${RAMP_UP_DURATION}s

## Endpoints Tested

- **API Endpoint**: $API_ENDPOINT
- **Static Site**: $STATIC_SITE_URL

## Performance Results

EOF

    if [ -f "$results_file" ]; then
        local avg_response_time=$(jq -r '.aggregate.latency.mean' "$results_file" 2>/dev/null || echo "N/A")
        local p95_response_time=$(jq -r '.aggregate.latency.p95' "$results_file" 2>/dev/null || echo "N/A")
        local p99_response_time=$(jq -r '.aggregate.latency.p99' "$results_file" 2>/dev/null || echo "N/A")
        local total_requests=$(jq -r '.aggregate.counters["http.requests"]' "$results_file" 2>/dev/null || echo "N/A")
        local successful_requests=$(jq -r '.aggregate.counters["http.response_codes.200"] // 0' "$results_file" 2>/dev/null || echo "0")
        local error_count=$(jq -r '.aggregate.counters["http.response_codes.500"] // 0' "$results_file" 2>/dev/null || echo "0")
        
        cat >> "$report_file" << EOF
### Load Test Metrics

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Average Response Time | ${avg_response_time}ms | < 500ms | $([ "${avg_response_time%.*}" -lt 500 ] 2>/dev/null && echo "✅ PASS" || echo "❌ FAIL") |
| P95 Response Time | ${p95_response_time}ms | < 1000ms | $([ "${p95_response_time%.*}" -lt 1000 ] 2>/dev/null && echo "✅ PASS" || echo "❌ FAIL") |
| P99 Response Time | ${p99_response_time}ms | < 2000ms | $([ "${p99_response_time%.*}" -lt 2000 ] 2>/dev/null && echo "✅ PASS" || echo "❌ FAIL") |
| Total Requests | $total_requests | - | - |
| Successful Requests | $successful_requests | - | - |
| Error Count | $error_count | < 5% | $([ "$error_count" -eq 0 ] && echo "✅ PASS" || echo "⚠️ REVIEW") |

EOF
    fi

    if [ -f "$aws_metrics_file" ]; then
        cat >> "$report_file" << EOF
### AWS Infrastructure Metrics

#### ECS Service Performance
- CPU utilization during test period
- Memory utilization trends
- Task scaling behavior

#### Database Performance  
- RDS CPU utilization
- Connection count trends
- Query latency metrics

#### Load Balancer Performance
- Target response times
- Request distribution
- Health check status

EOF
    fi

    cat >> "$report_file" << EOF
## Recommendations

### Performance Optimizations
1. **Response Time**: $([ "${avg_response_time%.*}" -gt 300 ] 2>/dev/null && echo "Consider optimizing slow endpoints" || echo "Response times are within acceptable range")
2. **Scaling**: Monitor auto-scaling triggers and adjust thresholds if needed
3. **Caching**: Implement additional caching layers for frequently accessed data
4. **Database**: Review database query performance and indexing

### Infrastructure Adjustments
1. **ECS Configuration**: Consider adjusting CPU/memory allocations based on observed utilization
2. **Auto-scaling Policies**: Fine-tune scaling policies based on traffic patterns
3. **Database Sizing**: Monitor database performance and consider upgrading if needed

### Monitoring Enhancements
1. **Custom Metrics**: Implement application-specific performance metrics
2. **Alerting**: Set up proactive alerts for performance degradation
3. **Dashboards**: Create real-time performance monitoring dashboards

## Next Steps

1. **Review Results**: Team review of performance test results
2. **Address Issues**: Fix any identified performance bottlenecks
3. **Retest**: Run additional tests after optimizations
4. **Production Planning**: Use staging results to plan production deployment
5. **Monitoring Setup**: Implement comprehensive monitoring for production

---
Generated by Staging Performance Validation Script
Report ID: perf-validation-$(date +%s)
EOF

    print_status "Performance report generated: $report_file"
    echo "$report_file"
}

# Main execution function
main() {
    local start_time=$(date +%s)
    
    print_status "Starting staging performance validation..."
    
    check_prerequisites
    discover_endpoints
    
    # Ensure we have endpoints to test
    if [ -z "$API_ENDPOINT" ] && [ -z "$STATIC_SITE_URL" ]; then
        print_error "No endpoints discovered for testing"
        exit 1
    fi
    
    setup_metrics_collection
    run_baseline_test
    
    local results_file=$(run_load_test)
    local aws_metrics_file=$(collect_aws_metrics)
    
    if validate_performance_thresholds "$results_file"; then
        print_status "✅ Performance validation PASSED"
    else
        print_error "❌ Performance validation FAILED"
    fi
    
    local report_file=$(generate_performance_report "$results_file" "$aws_metrics_file")
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    local total_minutes=$((total_time / 60))
    
    print_status "🎉 Staging performance validation completed!"
    print_status "Environment: $ENVIRONMENT"
    print_status "Total validation time: ${total_minutes}m ${total_time}s"
    print_status "Performance report: $report_file"
    
    echo ""
    print_step "Next Steps:"
    echo "1. Review the performance report"
    echo "2. Address any performance issues identified"
    echo "3. Run additional targeted tests if needed"
    echo "4. Proceed with production deployment planning"
    echo ""
    
    exit 0
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --environment ENV       Target environment [default: staging]"
    echo "  --region REGION         AWS region [default: ap-northeast-1]"
    echo "  --duration SECONDS      Test duration in seconds [default: 300]"
    echo "  --users COUNT           Concurrent users [default: 50]"
    echo "  --api-endpoint URL      API endpoint URL"
    echo "  --static-site URL       Static site URL"
    echo "  --help                 Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  ENVIRONMENT            Environment name"
    echo "  AWS_REGION             AWS region"
    echo "  TEST_DURATION          Test duration in seconds"
    echo "  CONCURRENT_USERS       Number of concurrent users"
    echo "  API_ENDPOINT           API endpoint URL"
    echo "  STATIC_SITE_URL        Static site URL"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 --environment staging --duration 600 --users 100"
    echo "  $0 --api-endpoint http://api.example.com"
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
        --duration)
            TEST_DURATION="$2"
            shift 2
            ;;
        --users)
            CONCURRENT_USERS="$2"
            shift 2
            ;;
        --api-endpoint)
            API_ENDPOINT="$2"
            shift 2
            ;;
        --static-site)
            STATIC_SITE_URL="$2"
            shift 2
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