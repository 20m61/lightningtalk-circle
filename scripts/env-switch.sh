#!/bin/bash
# Environment Switching Script for Lightning Talk Circle
# Manages switching between local, development, and production environments

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Environment files
ENV_LOCAL="$PROJECT_ROOT/.env.local"
ENV_DEV="$PROJECT_ROOT/.env.development"
ENV_PROD="$PROJECT_ROOT/.env.production"
ENV_CURRENT="$PROJECT_ROOT/.env"

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check current environment
check_current_env() {
    if [ ! -f "$ENV_CURRENT" ]; then
        echo "none"
        return
    fi
    
    # Check NODE_ENV value
    local node_env=$(grep "^NODE_ENV=" "$ENV_CURRENT" | cut -d'=' -f2)
    
    # Check SITE_URL to determine environment
    local site_url=$(grep "^SITE_URL=" "$ENV_CURRENT" | cut -d'=' -f2 | tr -d '"')
    
    if [[ "$site_url" == *"localhost"* ]]; then
        echo "local"
    elif [[ "$site_url" == *"dev.xn--6wym69a.com"* ]] || [[ "$site_url" == *"dev.発表.com"* ]]; then
        echo "development"
    elif [[ "$site_url" == *"xn--6wym69a.com"* ]] || [[ "$site_url" == *"発表.com"* ]]; then
        echo "production"
    else
        echo "unknown"
    fi
}

# Display environment details
show_env_details() {
    local env_file=$1
    local env_name=$2
    
    if [ ! -f "$env_file" ]; then
        print_error "$env_name environment file not found: $env_file"
        return
    fi
    
    echo -e "\n${GREEN}=== $env_name Environment ===${NC}"
    
    # Extract key information
    local site_url=$(grep "^SITE_URL=" "$env_file" | cut -d'=' -f2 | tr -d '"')
    local db_type=$(grep "^DATABASE_TYPE=" "$env_file" | cut -d'=' -f2)
    local api_endpoint=$(grep "^API_ENDPOINT=" "$env_file" | cut -d'=' -f2)
    local email_service=$(grep "^EMAIL_SERVICE=" "$env_file" | cut -d'=' -f2)
    
    echo "  Site URL: $site_url"
    echo "  Database: $db_type"
    echo "  API Endpoint: $api_endpoint"
    echo "  Email Service: $email_service"
    
    # Environment-specific details
    case $env_name in
        "Local")
            echo "  Docker Services: PostgreSQL, Redis, MailHog, MinIO"
            echo "  Features: Hot reload, Debug mode, Mock services"
            ;;
        "Development")
            echo "  AWS Services: DynamoDB, CloudFront, Lambda"
            echo "  Domain: dev.発表.com"
            ;;
        "Production")
            echo "  AWS Services: Full production stack"
            echo "  Domain: 発表.com"
            echo "  Security: WAF, Cognito, HTTPS enforced"
            ;;
    esac
}

# Switch environment
switch_env() {
    local target_env=$1
    
    case $target_env in
        "local")
            if [ ! -f "$ENV_LOCAL" ]; then
                print_error "Local environment file not found: $ENV_LOCAL"
                exit 1
            fi
            cp "$ENV_LOCAL" "$ENV_CURRENT"
            cp "$ENV_LOCAL" "$PROJECT_ROOT/server/.env"
            print_success "Switched to LOCAL environment"
            echo "  Run: npm run dev (or ./scripts/docker-env.sh start local)"
            ;;
        "development"|"dev")
            if [ ! -f "$ENV_DEV" ]; then
                print_error "Development environment file not found: $ENV_DEV"
                exit 1
            fi
            cp "$ENV_DEV" "$ENV_CURRENT"
            cp "$ENV_DEV" "$PROJECT_ROOT/server/.env"
            print_success "Switched to DEVELOPMENT environment"
            echo "  Deploy with: npm run cdk:deploy:dev"
            ;;
        "production"|"prod")
            if [ ! -f "$ENV_PROD" ]; then
                print_error "Production environment file not found: $ENV_PROD"
                exit 1
            fi
            print_warning "Switching to PRODUCTION environment!"
            read -p "Are you sure you want to use production settings? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cp "$ENV_PROD" "$ENV_CURRENT"
                cp "$ENV_PROD" "$PROJECT_ROOT/server/.env"
                print_success "Switched to PRODUCTION environment"
                echo "  Deploy with: npm run cdk:deploy:prod"
                print_warning "Remember: Production deployments should go through CI/CD!"
            else
                print_info "Environment switch cancelled"
            fi
            ;;
        *)
            print_error "Unknown environment: $target_env"
            echo "Valid environments: local, development (dev), production (prod)"
            exit 1
            ;;
    esac
}

# Validate environment configuration
validate_env() {
    local env_file=$1
    local env_name=$2
    local errors=0
    
    print_info "Validating $env_name environment..."
    
    # Check required variables
    local required_vars=(
        "NODE_ENV"
        "PORT"
        "DATABASE_TYPE"
        "JWT_SECRET"
        "SESSION_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file"; then
            print_error "Missing required variable: $var"
            ((errors++))
        fi
    done
    
    # Environment-specific validation
    case $env_name in
        "local")
            # Check Docker-specific variables
            if grep -q "^DATABASE_TYPE=postgresql" "$env_file"; then
                if ! grep -q "^POSTGRES_HOST=" "$env_file"; then
                    print_warning "PostgreSQL selected but POSTGRES_HOST not set"
                fi
            fi
            ;;
        "development"|"production")
            # Check AWS variables
            if ! grep -q "^AWS_REGION=" "$env_file"; then
                print_error "Missing AWS_REGION for $env_name"
                ((errors++))
            fi
            if grep -q "^DATABASE_TYPE=dynamodb" "$env_file"; then
                if ! grep -q "^DYNAMODB_.*_TABLE=" "$env_file"; then
                    print_warning "DynamoDB selected but table names not configured"
                fi
            fi
            ;;
    esac
    
    if [ $errors -eq 0 ]; then
        print_success "$env_name environment configuration is valid"
    else
        print_error "Found $errors errors in $env_name configuration"
    fi
    
    return $errors
}

# Create backup of current environment
backup_current_env() {
    if [ -f "$ENV_CURRENT" ]; then
        local backup_file="$ENV_CURRENT.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$ENV_CURRENT" "$backup_file"
        print_info "Current environment backed up to: $backup_file"
    fi
}

# Show differences between environments
diff_envs() {
    local env1=$1
    local env2=$2
    local file1=""
    local file2=""
    
    # Map environment names to files
    case $env1 in
        "local") file1=$ENV_LOCAL ;;
        "dev"|"development") file1=$ENV_DEV ;;
        "prod"|"production") file1=$ENV_PROD ;;
        "current") file1=$ENV_CURRENT ;;
    esac
    
    case $env2 in
        "local") file2=$ENV_LOCAL ;;
        "dev"|"development") file2=$ENV_DEV ;;
        "prod"|"production") file2=$ENV_PROD ;;
        "current") file2=$ENV_CURRENT ;;
    esac
    
    if [ -z "$file1" ] || [ -z "$file2" ]; then
        print_error "Invalid environment names"
        exit 1
    fi
    
    if [ ! -f "$file1" ] || [ ! -f "$file2" ]; then
        print_error "Environment file(s) not found"
        exit 1
    fi
    
    print_info "Differences between $env1 and $env2:"
    diff -u "$file1" "$file2" || true
}

# Main menu
show_menu() {
    local current_env=$(check_current_env)
    
    echo -e "\n${GREEN}Lightning Talk Circle - Environment Manager${NC}"
    echo -e "Current Environment: ${YELLOW}$current_env${NC}"
    echo ""
    echo "1) Switch to Local (Docker)"
    echo "2) Switch to Development (dev.発表.com)"
    echo "3) Switch to Production (発表.com)"
    echo "4) Show environment details"
    echo "5) Validate environments"
    echo "6) Compare environments"
    echo "7) Backup current environment"
    echo "8) Exit"
    echo ""
    read -p "Select an option: " choice
    
    case $choice in
        1) switch_env "local" ;;
        2) switch_env "development" ;;
        3) switch_env "production" ;;
        4)
            show_env_details "$ENV_LOCAL" "Local"
            show_env_details "$ENV_DEV" "Development"
            show_env_details "$ENV_PROD" "Production"
            ;;
        5)
            validate_env "$ENV_LOCAL" "local"
            validate_env "$ENV_DEV" "development"
            validate_env "$ENV_PROD" "production"
            ;;
        6)
            read -p "First environment (local/dev/prod/current): " env1
            read -p "Second environment (local/dev/prod/current): " env2
            diff_envs "$env1" "$env2"
            ;;
        7) backup_current_env ;;
        8) exit 0 ;;
        *) print_error "Invalid option" ;;
    esac
}

# Command line interface
if [ $# -eq 0 ]; then
    # Interactive mode
    while true; do
        show_menu
        read -p "Press Enter to continue..."
    done
else
    # Command mode
    case "$1" in
        "switch")
            if [ -z "$2" ]; then
                print_error "Please specify environment: local, dev, or prod"
                exit 1
            fi
            switch_env "$2"
            ;;
        "current")
            current_env=$(check_current_env)
            echo "Current environment: $current_env"
            ;;
        "validate")
            if [ -z "$2" ]; then
                validate_env "$ENV_LOCAL" "local"
                validate_env "$ENV_DEV" "development"
                validate_env "$ENV_PROD" "production"
            else
                case "$2" in
                    "local") validate_env "$ENV_LOCAL" "local" ;;
                    "dev"|"development") validate_env "$ENV_DEV" "development" ;;
                    "prod"|"production") validate_env "$ENV_PROD" "production" ;;
                esac
            fi
            ;;
        "diff")
            if [ -z "$2" ] || [ -z "$3" ]; then
                print_error "Usage: $0 diff <env1> <env2>"
                exit 1
            fi
            diff_envs "$2" "$3"
            ;;
        "backup")
            backup_current_env
            ;;
        "help"|"--help"|"-h")
            echo "Lightning Talk Circle - Environment Switcher"
            echo ""
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  switch <env>      Switch to environment (local/dev/prod)"
            echo "  current           Show current environment"
            echo "  validate [env]    Validate environment configuration"
            echo "  diff <e1> <e2>    Compare two environments"
            echo "  backup            Backup current environment"
            echo "  help              Show this help message"
            echo ""
            echo "Interactive mode: Run without arguments"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Run '$0 help' for usage"
            exit 1
            ;;
    esac
fi