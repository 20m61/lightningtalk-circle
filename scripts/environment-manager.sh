#!/bin/bash

# Lightning Talk Circle - Environment Manager
# Manages environment configuration switching between development (Docker) and deployment (AWS)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Show usage
show_usage() {
    cat << 'EOF'
Environment Manager for Lightning Talk Circle

USAGE:
    ./scripts/environment-manager.sh <command> [options]

COMMANDS:
    switch <env>        Switch to specified environment
    status              Show current environment status
    validate            Validate current environment configuration
    docker              Setup Docker development environment
    aws                 Setup AWS deployment environment
    backup              Backup current .env file
    restore             Restore .env from backup
    list                List available environments

ENVIRONMENTS:
    local               Local Docker development environment
    development         dev.発表.com (AWS development environment)
    staging             AWS staging environment  
    production          発表.com (AWS production environment)

EXAMPLES:
    ./scripts/environment-manager.sh switch development
    ./scripts/environment-manager.sh docker
    ./scripts/environment-manager.sh aws production
    ./scripts/environment-manager.sh status
    ./scripts/environment-manager.sh validate

NOTES:
    - development: Use for local Docker-based development
    - staging/production: Use for AWS Lambda/serverless deployment
    - Always backup before switching environments
    - Validate configuration after switching

EOF
}

# Backup current .env file
backup_env() {
    if [[ -f "$ENV_FILE" ]]; then
        local backup_file="$ENV_FILE.backup.$(date +%Y%m%d-%H%M%S)"
        cp "$ENV_FILE" "$backup_file"
        log "Backed up current .env to: $backup_file"
        echo "$backup_file"
    else
        warning "No .env file found to backup"
        return 1
    fi
}

# Restore .env from backup
restore_env() {
    local backup_pattern="$ENV_FILE.backup.*"
    local latest_backup=$(ls -t $backup_pattern 2>/dev/null | head -1 || echo "")
    
    if [[ -n "$latest_backup" && -f "$latest_backup" ]]; then
        cp "$latest_backup" "$ENV_FILE"
        log "Restored .env from: $latest_backup"
    else
        error "No backup file found"
        return 1
    fi
}

# Switch to specified environment
switch_environment() {
    local target_env="$1"
    local source_file="$PROJECT_ROOT/.env.$target_env"
    
    # Validate target environment
    if [[ ! -f "$source_file" ]]; then
        error "Environment file not found: $source_file"
        error "Available environments: local, development, staging, production"
        return 1
    fi
    
    # Backup current environment
    if [[ -f "$ENV_FILE" ]]; then
        backup_env
    fi
    
    # Copy new environment file
    cp "$source_file" "$ENV_FILE"
    log "Switched to environment: $target_env"
    log "Environment file: $source_file -> $ENV_FILE"
    
    # Show summary
    show_environment_status
}

# Show current environment status
show_environment_status() {
    if [[ ! -f "$ENV_FILE" ]]; then
        warning "No .env file found"
        return 1
    fi
    
    local node_env=$(grep "^NODE_ENV=" "$ENV_FILE" | cut -d'=' -f2 || echo "unknown")
    local db_type=$(grep "^DATABASE_TYPE=" "$ENV_FILE" | cut -d'=' -f2 || echo "unknown")
    local email_enabled=$(grep "^EMAIL_ENABLED=" "$ENV_FILE" | cut -d'=' -f2 || echo "unknown")
    local debug=$(grep "^DEBUG=" "$ENV_FILE" | cut -d'=' -f2 || echo "unknown")
    
    echo ""
    log "Current Environment Status:"
    echo "  NODE_ENV: $node_env"
    echo "  Database: $db_type"
    echo "  Email: $email_enabled"
    echo "  Debug: $debug"
    echo ""
    
    # Detect environment type
    if [[ "$node_env" == "local" ]]; then
        info "🐳 Local Docker Development Environment"
        echo "  - Use: docker-compose up -d"
        echo "  - Database: File-based storage"
        echo "  - Email: Console/mock output"
        echo "  - Hot reload: Enabled"
        echo "  - URL: http://localhost:3000"
    elif [[ "$node_env" == "development" ]]; then
        info "🌐 AWS Development Environment (dev.発表.com)"
        echo "  - Use: npm run deploy:dev"
        echo "  - Database: DynamoDB (dev tables)"
        echo "  - Email: SES (sandbox mode)"
        echo "  - Monitoring: CloudWatch"
        echo "  - URL: https://dev.発表.com"
    elif [[ "$node_env" == "staging" ]]; then
        info "☁️  AWS Staging Environment"
        echo "  - Use: npx cdk deploy --context env=staging"
        echo "  - Database: DynamoDB"
        echo "  - Email: SES"
        echo "  - Monitoring: CloudWatch"
    elif [[ "$node_env" == "production" ]]; then
        info "🚀 AWS Production Environment (発表.com)"
        echo "  - Use: npm run deploy:production"
        echo "  - Database: DynamoDB (prod tables)"
        echo "  - Email: SES (production)"
        echo "  - Monitoring: CloudWatch + Alarms"
        echo "  - URL: https://発表.com"
    else
        warning "Unknown environment type: $node_env"
    fi
    echo ""
}

# Validate environment configuration
validate_environment() {
    if [[ ! -f "$ENV_FILE" ]]; then
        error "No .env file found to validate"
        return 1
    fi
    
    local node_env=$(grep "^NODE_ENV=" "$ENV_FILE" | cut -d'=' -f2 || echo "")
    local errors=0
    
    log "Validating environment configuration..."
    
    # Basic validation
    if [[ -z "$node_env" ]]; then
        error "NODE_ENV is not set"
        ((errors++))
    fi
    
    # Environment-specific validation
    case "$node_env" in
        development)
            validate_development_env
            errors=$((errors + $?))
            ;;
        staging|production)
            validate_aws_env "$node_env"
            errors=$((errors + $?))
            ;;
        *)
            error "Invalid NODE_ENV: $node_env"
            ((errors++))
            ;;
    esac
    
    if [[ $errors -eq 0 ]]; then
        log "✅ Environment configuration is valid"
    else
        error "❌ Found $errors configuration errors"
        return 1
    fi
}

# Validate development environment
validate_development_env() {
    local errors=0
    
    # Check required development settings
    local required_vars=("PORT" "DATABASE_TYPE" "JWT_SECRET" "SESSION_SECRET")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE"; then
            error "Required variable missing: $var"
            ((errors++))
        fi
    done
    
    # Check that secrets are development values
    if grep -q "production" "$ENV_FILE"; then
        warning "Production settings detected in development environment"
    fi
    
    return $errors
}

# Validate AWS environment
validate_aws_env() {
    local env_type="$1"
    local errors=0
    
    # Check AWS-specific settings
    local required_vars=("AWS_REGION" "DATABASE_TYPE")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE"; then
            error "Required AWS variable missing: $var"
            ((errors++))
        fi
    done
    
    # Check that secrets are using ARN references
    if grep -q "development-.*-secret" "$ENV_FILE"; then
        error "Development secrets detected in $env_type environment"
        ((errors++))
    fi
    
    # Check DynamoDB configuration
    if ! grep -q "DATABASE_TYPE=dynamodb" "$ENV_FILE"; then
        error "AWS environment should use DynamoDB"
        ((errors++))
    fi
    
    return $errors
}

# Setup Docker development environment
setup_docker_environment() {
    log "Setting up Docker development environment..."
    
    switch_environment "development"
    
    # Ensure Docker is available
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed"
        return 1
    fi
    
    # Create data directory for file-based storage
    mkdir -p "$PROJECT_ROOT/data"
    mkdir -p "$PROJECT_ROOT/uploads"
    
    log "✅ Docker development environment ready"
    log "Next steps:"
    echo "  1. docker-compose up -d"
    echo "  2. Access application at http://localhost:3000"
    echo "  3. API documentation at http://localhost:3000/api/docs"
}

# Setup AWS deployment environment
setup_aws_environment() {
    local env_type="${1:-staging}"
    
    log "Setting up AWS $env_type environment..."
    
    switch_environment "$env_type"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed or not in PATH"
        return 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured"
        error "Run: aws configure"
        return 1
    fi
    
    # Check CDK
    if ! command -v cdk &> /dev/null; then
        error "AWS CDK is not installed"
        error "Run: npm install -g aws-cdk"
        return 1
    fi
    
    log "✅ AWS $env_type environment ready"
    log "Next steps:"
    echo "  1. cd cdk"
    echo "  2. npx cdk deploy --context env=$env_type"
    echo "  3. Monitor deployment in AWS Console"
}

# List available environments
list_environments() {
    log "Available environments:"
    echo ""
    
    for env_file in "$PROJECT_ROOT"/.env.*; do
        if [[ -f "$env_file" ]]; then
            local env_name=$(basename "$env_file" | sed 's/^\.env\.//')
            local node_env=$(grep "^NODE_ENV=" "$env_file" | cut -d'=' -f2 || echo "unknown")
            local db_type=$(grep "^DATABASE_TYPE=" "$env_file" | cut -d'=' -f2 || echo "unknown")
            
            echo "  $env_name:"
            echo "    NODE_ENV: $node_env"
            echo "    Database: $db_type"
            echo "    File: $env_file"
            echo ""
        fi
    done
}

# Main function
main() {
    case "${1:-}" in
        switch)
            if [[ -z "${2:-}" ]]; then
                error "Environment name required"
                echo "Usage: $0 switch <environment>"
                exit 1
            fi
            switch_environment "$2"
            ;;
        status)
            show_environment_status
            ;;
        validate)
            validate_environment
            ;;
        docker)
            setup_docker_environment
            ;;
        aws)
            setup_aws_environment "${2:-staging}"
            ;;
        backup)
            backup_env
            ;;
        restore)
            restore_env
            ;;
        list)
            list_environments
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            error "Unknown command: ${1:-}"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

main "$@"