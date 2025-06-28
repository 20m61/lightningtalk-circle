#!/bin/bash

# Lightning Talk Circle - Load Testing and Performance Optimization Script
# Comprehensive load testing using multiple tools and scenarios

set -e

# Configuration
TEST_TARGET=${TEST_TARGET:-"http://localhost:3000"}
TEST_DURATION=${TEST_DURATION:-300}  # 5 minutes
CONCURRENT_USERS=${CONCURRENT_USERS:-50}
RAMP_UP_TIME=${RAMP_UP_TIME:-60}  # 1 minute ramp up
TEST_TYPE=${TEST_TYPE:-"comprehensive"}  # spike, stress, volume, comprehensive

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Lightning Talk Circle Load Testing Suite ===${NC}"
echo -e "Target: ${YELLOW}${TEST_TARGET}${NC}"
echo -e "Test Type: ${YELLOW}${TEST_TYPE}${NC}"
echo -e "Duration: ${YELLOW}${TEST_DURATION}s${NC}"
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
    print_step "Checking load testing prerequisites..."
    
    local errors=0
    
    # Check for required tools
    if ! command -v curl &> /dev/null; then
        print_error "curl is not installed"
        ((errors++))
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed"
        ((errors++))
    fi
    
    # Check if target is reachable
    if ! curl -f -s --max-time 10 "$TEST_TARGET/health" > /dev/null; then
        print_warning "Target application may not be running or reachable"
        print_status "Target: $TEST_TARGET/health"
    fi
    
    # Install/check for artillery if available
    if command -v npm &> /dev/null; then
        if ! command -v artillery &> /dev/null; then
            print_status "Installing Artillery.js for advanced load testing..."
            npm install -g artillery || print_warning "Failed to install Artillery.js"
        fi
    fi
    
    if [ $errors -gt 0 ]; then
        print_error "Prerequisites check failed with $errors errors"
        exit 1
    fi
    
    print_status "Prerequisites check completed"
}

# Function to create test data
create_test_data() {
    print_step "Creating test data files..."
    
    local test_dir="./load-test-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$test_dir"
    echo "$test_dir" > .load-test-dir
    
    # Create sample participant data
    cat > "$test_dir/participants.json" << 'EOF'
[
  {"name": "Alice Johnson", "email": "alice@example.com", "participation_type": "online"},
  {"name": "Bob Smith", "email": "bob@example.com", "participation_type": "offline"},
  {"name": "Carol Brown", "email": "carol@example.com", "participation_type": "online"},
  {"name": "David Wilson", "email": "david@example.com", "participation_type": "offline"},
  {"name": "Eva Davis", "email": "eva@example.com", "participation_type": "online"}
]
EOF
    
    # Create sample talk data
    cat > "$test_dir/talks.json" << 'EOF'
[
  {"title": "Introduction to Microservices", "description": "A beginner's guide to microservices architecture", "duration_minutes": 5},
  {"title": "Docker Best Practices", "description": "Essential Docker practices for production", "duration_minutes": 7},
  {"title": "Kubernetes Networking", "description": "Understanding pod-to-pod communication", "duration_minutes": 8},
  {"title": "CI/CD Pipeline Optimization", "description": "Making your deployments faster and safer", "duration_minutes": 6},
  {"title": "Monitoring with Prometheus", "description": "Setting up effective monitoring", "duration_minutes": 5}
]
EOF
    
    # Create Artillery configuration
    cat > "$test_dir/artillery-config.yml" << EOF
config:
  target: '$TEST_TARGET'
  phases:
    - duration: $RAMP_UP_TIME
      arrivalRate: 1
      rampTo: $(( CONCURRENT_USERS / 10 ))
      name: "Ramp up phase"
    - duration: $TEST_DURATION
      arrivalRate: $(( CONCURRENT_USERS / 10 ))
      name: "Sustained load phase"
    - duration: 30
      arrivalRate: $(( CONCURRENT_USERS / 10 ))
      rampTo: 1
      name: "Ramp down phase"
  payload:
    path: "participants.json"
    fields:
      - "name"
      - "email"
      - "participation_type"
  defaults:
    headers:
      Content-Type: "application/json"
      User-Agent: "LoadTest/1.0"

scenarios:
  - name: "API Load Test"
    weight: 100
    flow:
      # Health check
      - get:
          url: "/health"
          expect:
            - statusCode: 200
      
      # Get events
      - get:
          url: "/api/events"
          expect:
            - statusCode: [200, 404]
      
      # Create participant (with some probability)
      - think: 1
      - post:
          url: "/api/participants"
          json:
            name: "{{ name }}"
            email: "{{ email }}_{{ \$randomInt(1000, 9999) }}"
            participation_type: "{{ participation_type }}"
          expect:
            - statusCode: [200, 201, 400, 409]
      
      # Get participants
      - get:
          url: "/api/participants"
          expect:
            - statusCode: [200, 404]
      
      # Get talks
      - get:
          url: "/api/talks"
          expect:
            - statusCode: [200, 404]
      
      # Random delay to simulate user behavior
      - think: "{{ \$randomInt(1, 5) }}"
EOF
    
    print_status "Test data created in: $test_dir"
}

# Function to run health check before testing
run_health_check() {
    print_step "Running pre-test health check..."
    
    local health_response=$(curl -s -w "\n%{http_code}" "$TEST_TARGET/health" || echo "000")
    local http_code=$(echo "$health_response" | tail -n1)
    local response_body=$(echo "$health_response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        print_status "✅ Application is healthy"
        echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    else
        print_warning "⚠️  Application health check returned status: $http_code"
        echo "$response_body"
    fi
    
    # Test API endpoints
    print_status "Testing API endpoints availability..."
    
    local endpoints=("/api/events" "/api/participants" "/api/talks")
    for endpoint in "${endpoints[@]}"; do
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_TARGET$endpoint" || echo "000")
        if [ "$status" = "200" ] || [ "$status" = "404" ]; then
            print_status "✅ $endpoint: $status"
        else
            print_warning "⚠️  $endpoint: $status"
        fi
    done
}

# Function to run basic load test with curl
run_basic_load_test() {
    print_step "Running basic load test with curl..."
    
    local test_dir=$(cat .load-test-dir)
    local results_file="$test_dir/basic-load-test-results.txt"
    
    print_status "Testing with $CONCURRENT_USERS concurrent requests..."
    
    # Create background processes for concurrent testing
    local pids=()
    local start_time=$(date +%s)
    
    for ((i=1; i<=CONCURRENT_USERS; i++)); do
        {
            local request_start=$(date +%s%N | cut -b1-13)  # milliseconds
            local response=$(curl -s -w "\n%{http_code}\n%{time_total}" "$TEST_TARGET/health")
            local request_end=$(date +%s%N | cut -b1-13)
            
            local http_code=$(echo "$response" | tail -n2 | head -n1)
            local time_total=$(echo "$response" | tail -n1)
            local response_time=$((request_end - request_start))
            
            echo "$i,$http_code,$time_total,$response_time" >> "$results_file"
        } &
        pids+=($!)
        
        # Add small delay to spread out requests
        sleep 0.1
    done
    
    # Wait for all requests to complete
    print_status "Waiting for requests to complete..."
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    # Analyze results
    if [ -f "$results_file" ]; then
        local total_requests=$(wc -l < "$results_file")
        local successful_requests=$(grep ",200," "$results_file" | wc -l)
        local success_rate=$(( (successful_requests * 100) / total_requests ))
        
        local avg_response_time=$(awk -F',' '{sum+=$4; count++} END {printf "%.2f", sum/count}' "$results_file")
        local max_response_time=$(awk -F',' 'BEGIN{max=0} {if($4>max) max=$4} END{print max}' "$results_file")
        
        print_status "Basic Load Test Results:"
        echo "  Total Requests: $total_requests"
        echo "  Successful Requests: $successful_requests"
        echo "  Success Rate: $success_rate%"
        echo "  Average Response Time: ${avg_response_time}ms"
        echo "  Max Response Time: ${max_response_time}ms"
        echo "  Total Test Time: ${total_time}s"
    fi
}

# Function to run Artillery load test
run_artillery_load_test() {
    if ! command -v artillery &> /dev/null; then
        print_warning "Artillery.js not available, skipping advanced load test"
        return
    fi
    
    print_step "Running advanced load test with Artillery.js..."
    
    local test_dir=$(cat .load-test-dir)
    local config_file="$test_dir/artillery-config.yml"
    local results_file="$test_dir/artillery-results.json"
    
    cd "$test_dir"
    
    print_status "Starting Artillery load test..."
    artillery run artillery-config.yml --output "$results_file" || {
        print_error "Artillery load test failed"
        cd - > /dev/null
        return 1
    }
    
    cd - > /dev/null
    
    # Generate HTML report if possible
    if [ -f "$results_file" ]; then
        cd "$test_dir"
        artillery report "$results_file" --output "artillery-report.html" 2>/dev/null || true
        cd - > /dev/null
        
        print_status "Artillery load test completed"
        print_status "Results: $results_file"
        print_status "Report: $test_dir/artillery-report.html"
    fi
}

# Function to run stress test
run_stress_test() {
    print_step "Running stress test with increased load..."
    
    local stress_users=$((CONCURRENT_USERS * 3))
    local test_dir=$(cat .load-test-dir)
    
    print_status "Stress testing with $stress_users concurrent users..."
    
    # Create a simple stress test script
    cat > "$test_dir/stress-test.sh" << EOF
#!/bin/bash
for ((i=1; i<=\$1; i++)); do
    {
        for ((j=1; j<=5; j++)); do
            curl -s "$TEST_TARGET/health" > /dev/null
            curl -s "$TEST_TARGET/api/events" > /dev/null
            sleep 0.1
        done
    } &
done
wait
EOF
    
    chmod +x "$test_dir/stress-test.sh"
    
    local start_time=$(date +%s)
    "$test_dir/stress-test.sh" $stress_users
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_status "Stress test completed in ${duration}s with $stress_users users"
}

# Function to monitor system resources during test
monitor_system_resources() {
    print_step "Monitoring system resources during load test..."
    
    local test_dir=$(cat .load-test-dir)
    local monitor_file="$test_dir/system-resources.log"
    
    # Start monitoring in background
    {
        echo "timestamp,cpu_usage,memory_usage,disk_usage,network_rx,network_tx" > "$monitor_file"
        
        while [ -f "$test_dir/.monitoring" ]; do
            local timestamp=$(date +%s)
            
            # Get CPU usage
            local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 || echo "0")
            
            # Get memory usage
            local memory_usage=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}' || echo "0")
            
            # Get disk usage
            local disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1 || echo "0")
            
            # Get network stats (simplified)
            local network_rx="0"
            local network_tx="0"
            
            echo "$timestamp,$cpu_usage,$memory_usage,$disk_usage,$network_rx,$network_tx" >> "$monitor_file"
            sleep 5
        done
    } &
    
    local monitor_pid=$!
    echo "$monitor_pid" > "$test_dir/.monitor-pid"
    touch "$test_dir/.monitoring"
    
    print_status "System monitoring started (PID: $monitor_pid)"
}

# Function to stop system monitoring
stop_system_monitoring() {
    local test_dir=$(cat .load-test-dir)
    
    if [ -f "$test_dir/.monitoring" ]; then
        rm -f "$test_dir/.monitoring"
        
        if [ -f "$test_dir/.monitor-pid" ]; then
            local monitor_pid=$(cat "$test_dir/.monitor-pid")
            kill $monitor_pid 2>/dev/null || true
            rm -f "$test_dir/.monitor-pid"
        fi
        
        print_status "System monitoring stopped"
    fi
}

# Function to analyze performance results
analyze_performance_results() {
    print_step "Analyzing performance test results..."
    
    local test_dir=$(cat .load-test-dir)
    local analysis_file="$test_dir/performance-analysis.md"
    
    # Create performance analysis report
    cat > "$analysis_file" << EOF
# Load Test Performance Analysis

## Test Configuration

- **Target**: $TEST_TARGET
- **Test Type**: $TEST_TYPE
- **Duration**: ${TEST_DURATION}s
- **Concurrent Users**: $CONCURRENT_USERS
- **Test Date**: $(date)

## Results Summary

EOF
    
    # Analyze basic load test results
    if [ -f "$test_dir/basic-load-test-results.txt" ]; then
        local total_requests=$(wc -l < "$test_dir/basic-load-test-results.txt")
        local successful_requests=$(grep ",200," "$test_dir/basic-load-test-results.txt" | wc -l || echo "0")
        local success_rate=$(( (successful_requests * 100) / total_requests )) 2>/dev/null || echo "0"
        
        cat >> "$analysis_file" << EOF
### Basic Load Test Results

- **Total Requests**: $total_requests
- **Successful Requests**: $successful_requests
- **Success Rate**: $success_rate%

EOF
    fi
    
    # Add system resource analysis
    if [ -f "$test_dir/system-resources.log" ]; then
        local max_cpu=$(tail -n +2 "$test_dir/system-resources.log" | cut -d',' -f2 | sort -n | tail -1 || echo "N/A")
        local max_memory=$(tail -n +2 "$test_dir/system-resources.log" | cut -d',' -f3 | sort -n | tail -1 || echo "N/A")
        
        cat >> "$analysis_file" << EOF
### System Resource Usage

- **Peak CPU Usage**: $max_cpu%
- **Peak Memory Usage**: $max_memory%

EOF
    fi
    
    # Add recommendations
    cat >> "$analysis_file" << EOF
## Recommendations

### Performance Optimizations
1. **Response Time**: $([ -f "$test_dir/basic-load-test-results.txt" ] && echo "Review endpoints with high response times" || echo "Enable detailed response time monitoring")
2. **Caching**: Implement caching for frequently accessed endpoints
3. **Database**: Optimize database queries and consider connection pooling
4. **Auto-scaling**: Configure auto-scaling based on load patterns

### Infrastructure Scaling
1. **Horizontal Scaling**: Add more application instances during peak loads
2. **Load Balancing**: Ensure proper load distribution across instances
3. **Database Scaling**: Consider read replicas for read-heavy workloads
4. **CDN**: Use CDN for static assets and API responses where appropriate

### Monitoring Enhancements
1. **Real-time Metrics**: Implement real-time performance monitoring
2. **Alerting**: Set up alerts for performance thresholds
3. **Capacity Planning**: Regular load testing to plan for growth
4. **Error Tracking**: Enhanced error tracking and analysis

---
Generated by Load Testing Suite
Test ID: load-test-$(date +%s)
EOF
    
    print_status "Performance analysis saved to: $analysis_file"
    echo "$analysis_file"
}

# Function to cleanup test files
cleanup_test_files() {
    local test_dir=$(cat .load-test-dir 2>/dev/null)
    
    if [ -n "$test_dir" ] && [ -d "$test_dir" ]; then
        print_status "Test results available in: $test_dir"
        print_status "To cleanup: rm -rf $test_dir"
    fi
    
    rm -f .load-test-dir
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --target URL          Target URL for load testing [default: http://localhost:3000]"
    echo "  --duration SECONDS    Test duration in seconds [default: 300]"
    echo "  --users COUNT         Number of concurrent users [default: 50]"
    echo "  --type TYPE           Test type: spike, stress, volume, comprehensive [default: comprehensive]"
    echo "  --ramp-up SECONDS     Ramp up time in seconds [default: 60]"
    echo "  --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 --target https://api.example.com --users 100 --duration 600"
    echo "  $0 --type stress --users 200"
}

# Main execution function
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --target)
                TEST_TARGET="$2"
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
            --type)
                TEST_TYPE="$2"
                shift 2
                ;;
            --ramp-up)
                RAMP_UP_TIME="$2"
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
    
    local start_time=$(date +%s)
    
    print_status "Starting load testing suite..."
    
    # Execute test phases
    check_prerequisites
    create_test_data
    run_health_check
    monitor_system_resources
    
    case "$TEST_TYPE" in
        "comprehensive")
            run_basic_load_test
            run_artillery_load_test
            run_stress_test
            ;;
        "basic")
            run_basic_load_test
            ;;
        "artillery")
            run_artillery_load_test
            ;;
        "stress")
            run_stress_test
            ;;
        *)
            print_warning "Unknown test type: $TEST_TYPE, running comprehensive test"
            run_basic_load_test
            run_artillery_load_test
            ;;
    esac
    
    stop_system_monitoring
    local analysis_file=$(analyze_performance_results)
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    local total_minutes=$((total_time / 60))
    
    print_status "🎉 Load testing completed successfully!"
    print_status "Total test time: ${total_minutes}m ${total_time}s"
    print_status "Analysis report: $analysis_file"
    
    cleanup_test_files
}

# Execute main function if script is run directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi