#!/bin/bash

# Lightning Talk Circle - Staging Security Audit Script
# Comprehensive security validation and penetration testing for staging environment

set -e

# Configuration
ENVIRONMENT=${ENVIRONMENT:-"staging"}
AWS_REGION=${AWS_REGION:-"ap-northeast-1"}
API_ENDPOINT=${API_ENDPOINT:-""}
STATIC_SITE_URL=${STATIC_SITE_URL:-""}
SKIP_ACTIVE_TESTS=${SKIP_ACTIVE_TESTS:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Lightning Talk Circle Staging Security Audit ===${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Region: ${YELLOW}${AWS_REGION}${NC}"
echo -e "Skip Active Tests: ${YELLOW}${SKIP_ACTIVE_TESTS}${NC}"
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
    print_step "Checking security audit prerequisites..."
    
    local errors=0
    
    # Check required tools
    for tool in aws curl jq nmap; do
        if ! command -v $tool &> /dev/null; then
            if [ "$tool" = "nmap" ]; then
                print_warning "$tool is not installed (optional for network scanning)"
            else
                print_error "$tool is not installed or not in PATH"
                ((errors++))
            fi
        fi
    done
    
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
        fi
    fi
}

# Function to audit AWS infrastructure security
audit_aws_infrastructure() {
    print_step "Auditing AWS infrastructure security configuration..."
    
    local audit_file="./aws-security-audit-$(date +%Y%m%d_%H%M%S).json"
    local issues=0
    
    # Initialize audit results
    echo '{"security_audit": {"timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'", "environment": "'$ENVIRONMENT'", "findings": []}}' > "$audit_file"
    
    # Check VPC configuration
    print_status "Auditing VPC security configuration..."
    local vpc_id=$(aws ec2 describe-vpcs \
        --filters "Name=tag:Environment,Values=${ENVIRONMENT}" \
        --query 'Vpcs[0].VpcId' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$vpc_id" ] && [ "$vpc_id" != "None" ]; then
        # Check for default security group rules
        local default_sg=$(aws ec2 describe-security-groups \
            --filters "Name=vpc-id,Values=${vpc_id}" "Name=group-name,Values=default" \
            --query 'SecurityGroups[0].GroupId' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$default_sg" ] && [ "$default_sg" != "None" ]; then
            local open_rules=$(aws ec2 describe-security-groups \
                --group-ids "$default_sg" \
                --query 'SecurityGroups[0].IpPermissions[?IpRanges[?CidrIp==`0.0.0.0/0`]]' \
                --output json 2>/dev/null || echo "[]")
            
            if [ "$open_rules" != "[]" ]; then
                print_warning "Default security group has open rules"
                jq '.security_audit.findings += [{"severity": "MEDIUM", "type": "VPC_SECURITY", "description": "Default security group has open ingress rules", "resource": "'$default_sg'"}]' "$audit_file" > "$audit_file.tmp" && mv "$audit_file.tmp" "$audit_file"
                ((issues++))
            fi
        fi
        
        # Check for flow logs
        local flow_logs=$(aws ec2 describe-flow-logs \
            --filter "Name=resource-id,Values=${vpc_id}" \
            --query 'FlowLogs' \
            --output json 2>/dev/null || echo "[]")
        
        if [ "$flow_logs" = "[]" ]; then
            print_warning "VPC Flow Logs not enabled"
            jq '.security_audit.findings += [{"severity": "LOW", "type": "VPC_SECURITY", "description": "VPC Flow Logs not enabled", "resource": "'$vpc_id'"}]' "$audit_file" > "$audit_file.tmp" && mv "$audit_file.tmp" "$audit_file"
            ((issues++))
        fi
    fi
    
    # Check RDS security
    print_status "Auditing RDS security configuration..."
    local rds_instances=$(aws rds describe-db-instances \
        --query 'DBInstances[?contains(DBInstanceIdentifier, `'${ENVIRONMENT}'`)]' \
        --output json 2>/dev/null || echo "[]")
    
    if [ "$rds_instances" != "[]" ]; then
        local public_access=$(echo "$rds_instances" | jq -r '.[0].PubliclyAccessible // false')
        if [ "$public_access" = "true" ]; then
            print_error "RDS instance is publicly accessible"
            jq '.security_audit.findings += [{"severity": "HIGH", "type": "RDS_SECURITY", "description": "RDS instance is publicly accessible", "resource": "RDS"}]' "$audit_file" > "$audit_file.tmp" && mv "$audit_file.tmp" "$audit_file"
            ((issues++))
        fi
        
        local encryption=$(echo "$rds_instances" | jq -r '.[0].StorageEncrypted // false')
        if [ "$encryption" = "false" ]; then
            print_warning "RDS storage encryption not enabled"
            jq '.security_audit.findings += [{"severity": "MEDIUM", "type": "RDS_SECURITY", "description": "RDS storage encryption not enabled", "resource": "RDS"}]' "$audit_file" > "$audit_file.tmp" && mv "$audit_file.tmp" "$audit_file"
            ((issues++))
        fi
    fi
    
    # Check S3 bucket security
    print_status "Auditing S3 bucket security configuration..."
    local buckets=$(aws s3api list-buckets --query 'Buckets[?contains(Name, `lightningtalk`) && contains(Name, `'${ENVIRONMENT}'`)].Name' --output json 2>/dev/null || echo "[]")
    
    if [ "$buckets" != "[]" ]; then
        echo "$buckets" | jq -r '.[]' | while read -r bucket; do
            if [ -n "$bucket" ]; then
                # Check public access block
                local public_block=$(aws s3api get-public-access-block --bucket "$bucket" 2>/dev/null || echo "")
                if [ -z "$public_block" ]; then
                    print_warning "S3 bucket $bucket does not have public access block configured"
                    jq '.security_audit.findings += [{"severity": "MEDIUM", "type": "S3_SECURITY", "description": "S3 bucket public access block not configured", "resource": "'$bucket'"}]' "$audit_file" > "$audit_file.tmp" && mv "$audit_file.tmp" "$audit_file"
                    ((issues++))
                fi
                
                # Check encryption
                local encryption=$(aws s3api get-bucket-encryption --bucket "$bucket" 2>/dev/null || echo "")
                if [ -z "$encryption" ]; then
                    print_warning "S3 bucket $bucket does not have encryption enabled"
                    jq '.security_audit.findings += [{"severity": "MEDIUM", "type": "S3_SECURITY", "description": "S3 bucket encryption not enabled", "resource": "'$bucket'"}]' "$audit_file" > "$audit_file.tmp" && mv "$audit_file.tmp" "$audit_file"
                    ((issues++))
                fi
            fi
        done
    fi
    
    # Check CloudTrail
    print_status "Auditing CloudTrail configuration..."
    local trails=$(aws cloudtrail describe-trails \
        --query 'trailList[?contains(Name, `'${ENVIRONMENT}'`)]' \
        --output json 2>/dev/null || echo "[]")
    
    if [ "$trails" = "[]" ]; then
        print_warning "No CloudTrail found for environment"
        jq '.security_audit.findings += [{"severity": "MEDIUM", "type": "LOGGING", "description": "CloudTrail not configured for environment", "resource": "CloudTrail"}]' "$audit_file" > "$audit_file.tmp" && mv "$audit_file.tmp" "$audit_file"
        ((issues++))
    fi
    
    # Check GuardDuty
    print_status "Auditing GuardDuty configuration..."
    local guardduty=$(aws guardduty list-detectors --output json 2>/dev/null || echo '{"DetectorIds": []}')
    local detector_count=$(echo "$guardduty" | jq '.DetectorIds | length')
    
    if [ "$detector_count" -eq 0 ]; then
        print_warning "GuardDuty not enabled"
        jq '.security_audit.findings += [{"severity": "MEDIUM", "type": "THREAT_DETECTION", "description": "GuardDuty not enabled", "resource": "GuardDuty"}]' "$audit_file" > "$audit_file.tmp" && mv "$audit_file.tmp" "$audit_file"
        ((issues++))
    fi
    
    print_status "AWS infrastructure audit completed with $issues issues found"
    echo "$audit_file"
}

# Function to test application security
test_application_security() {
    print_step "Testing application security..."
    
    local security_report="./app-security-test-$(date +%Y%m%d_%H%M%S).json"
    local issues=0
    
    echo '{"app_security_test": {"timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'", "endpoint": "'$API_ENDPOINT'", "tests": []}}' > "$security_report"
    
    if [ -z "$API_ENDPOINT" ]; then
        print_warning "No API endpoint available for security testing"
        return 0
    fi
    
    # Test 1: Check HTTPS enforcement
    print_status "Testing HTTPS enforcement..."
    if [[ "$API_ENDPOINT" == http://* ]]; then
        print_warning "API endpoint is using HTTP instead of HTTPS"
        jq '.app_security_test.tests += [{"test": "HTTPS_ENFORCEMENT", "status": "FAIL", "description": "API endpoint not using HTTPS"}]' "$security_report" > "$security_report.tmp" && mv "$security_report.tmp" "$security_report"
        ((issues++))
    else
        jq '.app_security_test.tests += [{"test": "HTTPS_ENFORCEMENT", "status": "PASS", "description": "API endpoint using HTTPS"}]' "$security_report" > "$security_report.tmp" && mv "$security_report.tmp" "$security_report"
    fi
    
    # Test 2: Check security headers
    print_status "Testing security headers..."
    local headers_response="/tmp/security_headers_response.txt"
    
    if curl -I -s -o "$headers_response" "$API_ENDPOINT" 2>/dev/null; then
        # Check for important security headers
        local security_headers=("x-frame-options" "x-content-type-options" "x-xss-protection" "strict-transport-security")
        local missing_headers=()
        
        for header in "${security_headers[@]}"; do
            if ! grep -qi "$header" "$headers_response"; then
                missing_headers+=("$header")
            fi
        done
        
        if [ ${#missing_headers[@]} -gt 0 ]; then
            print_warning "Missing security headers: ${missing_headers[*]}"
            jq '.app_security_test.tests += [{"test": "SECURITY_HEADERS", "status": "PARTIAL", "description": "Missing headers: '$(IFS=,; echo "${missing_headers[*]}")'"}]' "$security_report" > "$security_report.tmp" && mv "$security_report.tmp" "$security_report"
            ((issues++))
        else
            jq '.app_security_test.tests += [{"test": "SECURITY_HEADERS", "status": "PASS", "description": "All security headers present"}]' "$security_report" > "$security_report.tmp" && mv "$security_report.tmp" "$security_report"
        fi
    else
        print_warning "Could not retrieve headers from API endpoint"
        jq '.app_security_test.tests += [{"test": "SECURITY_HEADERS", "status": "ERROR", "description": "Could not retrieve headers"}]' "$security_report" > "$security_report.tmp" && mv "$security_report.tmp" "$security_report"
        ((issues++))
    fi
    
    # Test 3: Check for information disclosure
    print_status "Testing for information disclosure..."
    local common_paths=("/admin" "/config" "/.env" "/phpinfo" "/server-info" "/server-status")
    local disclosed_paths=()
    
    for path in "${common_paths[@]}"; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "${API_ENDPOINT}${path}" 2>/dev/null || echo "000")
        if [ "$status_code" = "200" ]; then
            disclosed_paths+=("$path")
        fi
    done
    
    if [ ${#disclosed_paths[@]} -gt 0 ]; then
        print_warning "Potentially sensitive paths accessible: ${disclosed_paths[*]}"
        jq '.app_security_test.tests += [{"test": "INFORMATION_DISCLOSURE", "status": "FAIL", "description": "Sensitive paths accessible: '$(IFS=,; echo "${disclosed_paths[*]}")'"}]' "$security_report" > "$security_report.tmp" && mv "$security_report.tmp" "$security_report"
        ((issues++))
    else
        jq '.app_security_test.tests += [{"test": "INFORMATION_DISCLOSURE", "status": "PASS", "description": "No sensitive paths accessible"}]' "$security_report" > "$security_report.tmp" && mv "$security_report.tmp" "$security_report"
    fi
    
    # Test 4: Check for SQL injection vulnerabilities (basic)
    if [ "$SKIP_ACTIVE_TESTS" = "false" ]; then
        print_status "Testing for basic SQL injection vulnerabilities..."
        local sql_payloads=("'" "1' OR '1'='1" "'; DROP TABLE users; --")
        local vulnerable_endpoints=()
        
        for payload in "${sql_payloads[@]}"; do
            local encoded_payload=$(echo "$payload" | sed 's/ /%20/g' | sed "s/'/%27/g")
            local test_url="${API_ENDPOINT}/api/events?id=${encoded_payload}"
            local response=$(curl -s "$test_url" 2>/dev/null || echo "")
            
            if [[ "$response" == *"SQL"* ]] || [[ "$response" == *"syntax error"* ]] || [[ "$response" == *"mysql"* ]]; then
                vulnerable_endpoints+=("$test_url")
            fi
        done
        
        if [ ${#vulnerable_endpoints[@]} -gt 0 ]; then
            print_error "Potential SQL injection vulnerabilities found"
            jq '.app_security_test.tests += [{"test": "SQL_INJECTION", "status": "FAIL", "description": "Potential SQL injection vulnerabilities detected"}]' "$security_report" > "$security_report.tmp" && mv "$security_report.tmp" "$security_report"
            ((issues++))
        else
            jq '.app_security_test.tests += [{"test": "SQL_INJECTION", "status": "PASS", "description": "No obvious SQL injection vulnerabilities detected"}]' "$security_report" > "$security_report.tmp" && mv "$security_report.tmp" "$security_report"
        fi
    else
        print_status "Skipping active SQL injection tests (SKIP_ACTIVE_TESTS=true)"
    fi
    
    # Test 5: Check rate limiting
    print_status "Testing rate limiting..."
    local rate_limit_test=false
    
    # Send rapid requests to test rate limiting
    for i in {1..20}; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "${API_ENDPOINT}/health" 2>/dev/null || echo "000")
        if [ "$status_code" = "429" ]; then
            rate_limit_test=true
            break
        fi
        sleep 0.1
    done
    
    if [ "$rate_limit_test" = "true" ]; then
        jq '.app_security_test.tests += [{"test": "RATE_LIMITING", "status": "PASS", "description": "Rate limiting is working"}]' "$security_report" > "$security_report.tmp" && mv "$security_report.tmp" "$security_report"
    else
        print_warning "Rate limiting may not be configured"
        jq '.app_security_test.tests += [{"test": "RATE_LIMITING", "status": "FAIL", "description": "Rate limiting not detected"}]' "$security_report" > "$security_report.tmp" && mv "$security_report.tmp" "$security_report"
        ((issues++))
    fi
    
    print_status "Application security testing completed with $issues issues found"
    echo "$security_report"
}

# Function to check WAF configuration
check_waf_configuration() {
    print_step "Checking WAF configuration and rules..."
    
    local waf_report="./waf-audit-$(date +%Y%m%d_%H%M%S).json"
    local issues=0
    
    echo '{"waf_audit": {"timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'", "environment": "'$ENVIRONMENT'", "findings": []}}' > "$waf_report"
    
    # List WAF WebACLs
    local webacls=$(aws wafv2 list-web-acls --scope CLOUDFRONT --region us-east-1 2>/dev/null || echo '{"WebACLs": []}')
    local staging_waf=$(echo "$webacls" | jq -r --arg env "$ENVIRONMENT" '.WebACLs[] | select(.Name | contains($env)) | .Id' | head -1)
    
    if [ -z "$staging_waf" ] || [ "$staging_waf" = "null" ]; then
        print_warning "No WAF WebACL found for staging environment"
        jq '.waf_audit.findings += [{"severity": "MEDIUM", "type": "WAF_CONFIG", "description": "No WAF WebACL configured for environment", "resource": "WAF"}]' "$waf_report" > "$waf_report.tmp" && mv "$waf_report.tmp" "$waf_report"
        ((issues++))
    else
        print_status "Found WAF WebACL: $staging_waf"
        
        # Get WAF rules
        local waf_details=$(aws wafv2 get-web-acl --id "$staging_waf" --name "lightningtalk-webacl-${ENVIRONMENT}" --scope CLOUDFRONT --region us-east-1 2>/dev/null || echo '{}')
        local rule_count=$(echo "$waf_details" | jq '.WebACL.Rules | length' 2>/dev/null || echo "0")
        
        if [ "$rule_count" -eq 0 ]; then
            print_warning "WAF WebACL has no rules configured"
            jq '.waf_audit.findings += [{"severity": "HIGH", "type": "WAF_CONFIG", "description": "WAF WebACL has no rules", "resource": "'$staging_waf'"}]' "$waf_report" > "$waf_report.tmp" && mv "$waf_report.tmp" "$waf_report"
            ((issues++))
        else
            print_status "WAF WebACL has $rule_count rules configured"
            
            # Check for common rule types
            local has_rate_limit=$(echo "$waf_details" | jq '.WebACL.Rules[] | select(.Statement.RateBasedStatement)' 2>/dev/null | wc -l)
            local has_managed_rules=$(echo "$waf_details" | jq '.WebACL.Rules[] | select(.Statement.ManagedRuleGroupStatement)' 2>/dev/null | wc -l)
            
            if [ "$has_rate_limit" -eq 0 ]; then
                print_warning "WAF does not have rate limiting rules"
                jq '.waf_audit.findings += [{"severity": "MEDIUM", "type": "WAF_CONFIG", "description": "No rate limiting rules configured", "resource": "'$staging_waf'"}]' "$waf_report" > "$waf_report.tmp" && mv "$waf_report.tmp" "$waf_report"
                ((issues++))
            fi
            
            if [ "$has_managed_rules" -eq 0 ]; then
                print_warning "WAF does not use AWS managed rules"
                jq '.waf_audit.findings += [{"severity": "LOW", "type": "WAF_CONFIG", "description": "No AWS managed rules configured", "resource": "'$staging_waf'"}]' "$waf_report" > "$waf_report.tmp" && mv "$waf_report.tmp" "$waf_report"
                ((issues++))
            fi
        fi
    fi
    
    print_status "WAF audit completed with $issues issues found"
    echo "$waf_report"
}

# Function to test WAF effectiveness
test_waf_effectiveness() {
    print_step "Testing WAF effectiveness with simulated attacks..."
    
    local waf_test_report="./waf-effectiveness-test-$(date +%Y%m%d_%H%M%S).json"
    local blocked_tests=0
    local total_tests=0
    
    echo '{"waf_effectiveness": {"timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'", "target": "'$STATIC_SITE_URL'", "tests": []}}' > "$waf_test_report"
    
    if [ -z "$STATIC_SITE_URL" ]; then
        print_warning "No static site URL available for WAF testing"
        return 0
    fi
    
    if [ "$SKIP_ACTIVE_TESTS" = "true" ]; then
        print_status "Skipping active WAF tests (SKIP_ACTIVE_TESTS=true)"
        return 0
    fi
    
    # Test payloads (safe, non-destructive)
    declare -A test_payloads=(
        ["XSS_BASIC"]="<script>alert('test')</script>"
        ["XSS_EVENT"]="<img src=x onerror=alert('test')>"
        ["SQL_BASIC"]="' OR 1=1 --"
        ["SQL_UNION"]="' UNION SELECT 1,2,3 --"
        ["PATH_TRAVERSAL"]="../../../etc/passwd"
        ["COMMAND_INJECTION"]="; cat /etc/passwd"
    )
    
    for test_name in "${!test_payloads[@]}"; do
        local payload="${test_payloads[$test_name]}"
        local encoded_payload=$(echo "$payload" | sed 's/ /%20/g' | sed 's/</%3C/g' | sed 's/>/%3E/g' | sed "s/'/%27/g")
        local test_url="${STATIC_SITE_URL}/?test=${encoded_payload}"
        
        print_status "Testing $test_name payload..."
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$test_url" 2>/dev/null || echo "000")
        
        ((total_tests++))
        
        if [ "$status_code" = "403" ] || [ "$status_code" = "406" ]; then
            print_status "✅ $test_name blocked by WAF (HTTP $status_code)"
            jq '.waf_effectiveness.tests += [{"test": "'$test_name'", "status": "BLOCKED", "http_code": "'$status_code'", "description": "Request blocked by WAF"}]' "$waf_test_report" > "$waf_test_report.tmp" && mv "$waf_test_report.tmp" "$waf_test_report"
            ((blocked_tests++))
        elif [ "$status_code" = "000" ]; then
            print_warning "⚠️  $test_name - Connection failed"
            jq '.waf_effectiveness.tests += [{"test": "'$test_name'", "status": "ERROR", "http_code": "'$status_code'", "description": "Connection failed"}]' "$waf_test_report" > "$waf_test_report.tmp" && mv "$waf_test_report.tmp" "$waf_test_report"
        else
            print_warning "❌ $test_name not blocked (HTTP $status_code)"
            jq '.waf_effectiveness.tests += [{"test": "'$test_name'", "status": "ALLOWED", "http_code": "'$status_code'", "description": "Request not blocked by WAF"}]' "$waf_test_report" > "$waf_test_report.tmp" && mv "$waf_test_report.tmp" "$waf_test_report"
        fi
        
        # Brief pause between tests
        sleep 1
    done
    
    local effectiveness_percentage=0
    if [ $total_tests -gt 0 ]; then
        effectiveness_percentage=$((blocked_tests * 100 / total_tests))
    fi
    
    print_status "WAF effectiveness: $blocked_tests/$total_tests tests blocked ($effectiveness_percentage%)"
    
    jq '.waf_effectiveness.summary = {"total_tests": '$total_tests', "blocked_tests": '$blocked_tests', "effectiveness_percentage": '$effectiveness_percentage'}' "$waf_test_report" > "$waf_test_report.tmp" && mv "$waf_test_report.tmp" "$waf_test_report"
    
    echo "$waf_test_report"
}

# Function to generate comprehensive security report
generate_security_report() {
    print_step "Generating comprehensive security audit report..."
    
    local aws_audit_file="$1"
    local app_security_file="$2"
    local waf_audit_file="$3"
    local waf_test_file="$4"
    local report_file="./security-audit-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# Lightning Talk Circle - Staging Security Audit Report

## Executive Summary

- **Environment**: $ENVIRONMENT
- **Region**: $AWS_REGION
- **Audit Date**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- **Endpoints Tested**: $API_ENDPOINT, $STATIC_SITE_URL

## Infrastructure Security Audit

EOF

    if [ -f "$aws_audit_file" ]; then
        local aws_findings_count=$(jq '.security_audit.findings | length' "$aws_audit_file" 2>/dev/null || echo "0")
        local high_severity=$(jq '.security_audit.findings[] | select(.severity == "HIGH")' "$aws_audit_file" 2>/dev/null | wc -l)
        local medium_severity=$(jq '.security_audit.findings[] | select(.severity == "MEDIUM")' "$aws_audit_file" 2>/dev/null | wc -l)
        local low_severity=$(jq '.security_audit.findings[] | select(.severity == "LOW")' "$aws_audit_file" 2>/dev/null | wc -l)
        
        cat >> "$report_file" << EOF
### AWS Infrastructure Findings

- **Total Findings**: $aws_findings_count
- **High Severity**: $high_severity
- **Medium Severity**: $medium_severity
- **Low Severity**: $low_severity

#### Critical Issues
EOF

        if [ "$high_severity" -gt 0 ]; then
            jq -r '.security_audit.findings[] | select(.severity == "HIGH") | "- **" + .type + "**: " + .description' "$aws_audit_file" >> "$report_file" 2>/dev/null || echo "- No high severity issues" >> "$report_file"
        else
            echo "- No high severity issues found" >> "$report_file"
        fi
        
        cat >> "$report_file" << EOF

#### Medium Priority Issues
EOF

        if [ "$medium_severity" -gt 0 ]; then
            jq -r '.security_audit.findings[] | select(.severity == "MEDIUM") | "- **" + .type + "**: " + .description' "$aws_audit_file" >> "$report_file" 2>/dev/null || echo "- No medium severity issues" >> "$report_file"
        else
            echo "- No medium severity issues found" >> "$report_file"
        fi
    fi

    cat >> "$report_file" << EOF

## Application Security Testing

EOF

    if [ -f "$app_security_file" ]; then
        local total_tests=$(jq '.app_security_test.tests | length' "$app_security_file" 2>/dev/null || echo "0")
        local passed_tests=$(jq '.app_security_test.tests[] | select(.status == "PASS")' "$app_security_file" 2>/dev/null | wc -l)
        local failed_tests=$(jq '.app_security_test.tests[] | select(.status == "FAIL")' "$app_security_file" 2>/dev/null | wc -l)
        
        cat >> "$report_file" << EOF
### Security Test Results

- **Total Tests**: $total_tests
- **Passed**: $passed_tests
- **Failed**: $failed_tests
- **Success Rate**: $([ $total_tests -gt 0 ] && echo "$((passed_tests * 100 / total_tests))%" || echo "N/A")

#### Test Details

| Test | Status | Description |
|------|--------|-------------|
EOF

        jq -r '.app_security_test.tests[] | "| " + .test + " | " + .status + " | " + .description + " |"' "$app_security_file" >> "$report_file" 2>/dev/null || echo "| No tests | N/A | N/A |" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

## WAF Configuration Audit

EOF

    if [ -f "$waf_audit_file" ]; then
        local waf_findings=$(jq '.waf_audit.findings | length' "$waf_audit_file" 2>/dev/null || echo "0")
        
        cat >> "$report_file" << EOF
### WAF Configuration Issues

- **Total Findings**: $waf_findings

EOF

        if [ "$waf_findings" -gt 0 ]; then
            jq -r '.waf_audit.findings[] | "- **" + .severity + "**: " + .description' "$waf_audit_file" >> "$report_file" 2>/dev/null || echo "- No WAF issues found" >> "$report_file"
        else
            echo "- No WAF configuration issues found" >> "$report_file"
        fi
    fi

    cat >> "$report_file" << EOF

## WAF Effectiveness Testing

EOF

    if [ -f "$waf_test_file" ]; then
        local total_waf_tests=$(jq '.waf_effectiveness.summary.total_tests // 0' "$waf_test_file" 2>/dev/null || echo "0")
        local blocked_tests=$(jq '.waf_effectiveness.summary.blocked_tests // 0' "$waf_test_file" 2>/dev/null || echo "0")
        local effectiveness=$(jq '.waf_effectiveness.summary.effectiveness_percentage // 0' "$waf_test_file" 2>/dev/null || echo "0")
        
        cat >> "$report_file" << EOF
### WAF Protection Effectiveness

- **Total Attack Simulations**: $total_waf_tests
- **Blocked Attacks**: $blocked_tests
- **Effectiveness Rate**: ${effectiveness}%

#### Attack Test Results

| Attack Type | Status | HTTP Code | Description |
|-------------|--------|-----------|-------------|
EOF

        jq -r '.waf_effectiveness.tests[] | "| " + .test + " | " + .status + " | " + .http_code + " | " + .description + " |"' "$waf_test_file" >> "$report_file" 2>/dev/null || echo "| No tests | N/A | N/A | N/A |" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

## Recommendations

### Immediate Actions Required
1. **Address High Severity Issues**: Prioritize fixing any high severity infrastructure issues
2. **Review Failed Security Tests**: Investigate and remediate failed application security tests
3. **Enhance WAF Rules**: Improve WAF configuration if effectiveness is below 80%

### Security Improvements
1. **Enable Missing Security Features**: Implement recommended AWS security services
2. **Strengthen Application Security**: Add missing security headers and implement rate limiting
3. **Regular Security Testing**: Establish automated security testing in CI/CD pipeline

### Monitoring and Alerting
1. **Security Monitoring**: Set up real-time security event monitoring
2. **Threat Detection**: Ensure GuardDuty and CloudTrail are properly configured
3. **Incident Response**: Develop security incident response procedures

## Compliance Status

### Security Best Practices
- [ ] Encryption at rest and in transit
- [ ] Network isolation and segmentation
- [ ] Least privilege access control
- [ ] Comprehensive audit logging
- [ ] Threat detection and monitoring
- [ ] Regular security testing
- [ ] Incident response procedures

### OWASP Top 10 Protection
- [ ] Injection attacks prevention
- [ ] Broken authentication protection
- [ ] Sensitive data exposure prevention
- [ ] XML external entities (XXE) protection
- [ ] Broken access control prevention
- [ ] Security misconfiguration protection
- [ ] Cross-site scripting (XSS) prevention
- [ ] Insecure deserialization protection
- [ ] Using components with known vulnerabilities
- [ ] Insufficient logging and monitoring

## Next Steps

1. **Priority 1**: Fix all high severity findings
2. **Priority 2**: Address medium severity issues
3. **Priority 3**: Implement recommended security enhancements
4. **Priority 4**: Establish ongoing security monitoring

## Appendix

### Test Files
- AWS Audit: $aws_audit_file
- Application Security: $app_security_file
- WAF Audit: $waf_audit_file
- WAF Testing: $waf_test_file

---
Generated by Staging Security Audit Script
Audit ID: security-audit-$(date +%s)
EOF

    print_status "Security audit report generated: $report_file"
    echo "$report_file"
}

# Main execution function
main() {
    local start_time=$(date +%s)
    
    print_status "Starting comprehensive staging security audit..."
    
    check_prerequisites
    discover_endpoints
    
    local aws_audit_file=$(audit_aws_infrastructure)
    local app_security_file=$(test_application_security)
    local waf_audit_file=$(check_waf_configuration)
    local waf_test_file=$(test_waf_effectiveness)
    
    local report_file=$(generate_security_report "$aws_audit_file" "$app_security_file" "$waf_audit_file" "$waf_test_file")
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    local total_minutes=$((total_time / 60))
    
    print_status "🔒 Security audit completed!"
    print_status "Environment: $ENVIRONMENT"
    print_status "Total audit time: ${total_minutes}m ${total_time}s"
    print_status "Security report: $report_file"
    
    echo ""
    print_step "Next Steps:"
    echo "1. Review the security audit report"
    echo "2. Address all high and medium severity findings"
    echo "3. Implement recommended security improvements"
    echo "4. Re-run security tests after fixes"
    echo "5. Proceed with production deployment only after security validation"
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
    echo "  --api-endpoint URL      API endpoint URL"
    echo "  --static-site URL       Static site URL"
    echo "  --skip-active-tests     Skip potentially intrusive tests"
    echo "  --help                 Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  ENVIRONMENT            Environment name"
    echo "  AWS_REGION             AWS region"
    echo "  API_ENDPOINT           API endpoint URL"
    echo "  STATIC_SITE_URL        Static site URL"
    echo "  SKIP_ACTIVE_TESTS      Skip active security tests (true/false)"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 --environment staging --skip-active-tests"
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
        --api-endpoint)
            API_ENDPOINT="$2"
            shift 2
            ;;
        --static-site)
            STATIC_SITE_URL="$2"
            shift 2
            ;;
        --skip-active-tests)
            SKIP_ACTIVE_TESTS=true
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