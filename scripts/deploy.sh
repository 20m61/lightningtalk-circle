#!/bin/bash

# Lightning Talk Circle Deployment Script
# Supports multiple deployment modes: development, staging, production

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_MODE="${1:-development}"
DOCKER_COMPOSE_FILE=""
LOG_FILE="/tmp/lightningtalk-deploy-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${2:-$GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    log "$1" "$RED" >&2
}

warning() {
    log "$1" "$YELLOW"
}

info() {
    log "$1" "$BLUE"
}

# Cleanup function
cleanup() {
    if [[ $? -ne 0 ]]; then
        error "Deployment failed! Check log file: $LOG_FILE"
    fi
}
trap cleanup EXIT

# Validate deployment mode
validate_mode() {
    case "$DEPLOY_MODE" in
        development|dev)
            DEPLOY_MODE="development"
            DOCKER_COMPOSE_FILE="docker-compose.yml"
            ;;
        staging)
            DOCKER_COMPOSE_FILE="docker/docker-compose.production.yml"
            ;;
        production|prod)
            DEPLOY_MODE="production"
            DOCKER_COMPOSE_FILE="docker/docker-compose.production.yml"
            ;;
        *)
            error "Invalid deployment mode: $DEPLOY_MODE"
            error "Available modes: development, staging, production"
            exit 1
            ;;
    esac
    
    info "Deployment mode: $DEPLOY_MODE"
    info "Docker Compose file: $DOCKER_COMPOSE_FILE"
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Node.js (for build steps)
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        error "Not in Lightning Talk Circle project directory"
        exit 1
    fi
    
    log "Prerequisites check passed"
}

# Environment validation
check_environment() {
    info "Checking environment configuration..."
    
    local env_file="$PROJECT_ROOT/.env"
    if [[ ! -f "$env_file" ]]; then
        error "Environment file not found: $env_file"
        exit 1
    fi
    
    # Check required environment variables for production
    if [[ "$DEPLOY_MODE" == "production" ]]; then
        local required_vars=(
            "DATABASE_URL"
            "REDIS_URL"
            "JWT_SECRET"
            "SESSION_SECRET"
            "EMAIL_FROM"
        )
        
        for var in "${required_vars[@]}"; do
            if ! grep -q "^${var}=" "$env_file" || grep -q "^${var}=$" "$env_file"; then
                error "Required environment variable not set: $var"
                exit 1
            fi
        done
    fi
    
    log "Environment configuration valid"
}

# Build application
build_application() {
    info "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci
    
    # Run tests
    if [[ "$DEPLOY_MODE" != "development" ]]; then
        log "Running tests..."
        npm run test:unit || {
            error "Unit tests failed"
            exit 1
        }
    fi
    
    # Build WordPress theme
    log "Building WordPress theme..."
    npm run wp:build
    
    # Build theme package
    log "Building theme package..."
    npm run build:theme
    
    log "Application build completed"
}

# Database operations
setup_database() {
    info "Setting up database..."
    
    cd "$PROJECT_ROOT"
    
    # Start database services first
    if [[ "$DEPLOY_MODE" != "development" ]]; then
        log "Starting database services..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres redis
        
        # Wait for database to be ready
        log "Waiting for database to be ready..."
        for i in {1..30}; do
            if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U postgres; then
                break
            fi
            sleep 2
        done
    else
        npm run db:setup
    fi
    
    # Run database migration
    log "Running database migration..."
    npm run db:migrate || warning "Database migration failed (may be normal for first run)"
    
    log "Database setup completed"
}

# Deploy application
deploy_application() {
    info "Deploying application..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images (for production/staging)
    if [[ "$DEPLOY_MODE" != "development" ]]; then
        log "Pulling latest Docker images..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    fi
    
    # Start all services
    log "Starting application services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --remove-orphans
    
    # Wait for application to be ready
    log "Waiting for application to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f "http://localhost:3000/api/health" &> /dev/null; then
            log "Application is ready"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Application failed to start after $max_attempts attempts"
            docker-compose -f "$DOCKER_COMPOSE_FILE" logs app
            exit 1
        fi
        
        sleep 5
        ((attempt++))
    done
    
    log "Application deployment completed"
}

# Health checks
run_health_checks() {
    info "Running health checks..."
    
    # Application health check
    log "Checking application health..."
    local health_response
    health_response=$(curl -s "http://localhost:3000/api/health" | jq -r '.status' 2>/dev/null || echo "unknown")
    
    if [[ "$health_response" == "healthy" ]]; then
        log "Application health check: PASSED"
    else
        error "Application health check: FAILED"
        exit 1
    fi
    
    # Database health check
    if [[ "$DEPLOY_MODE" != "development" ]]; then
        log "Checking database health..."
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U postgres; then
            log "Database health check: PASSED"
        else
            error "Database health check: FAILED"
            exit 1
        fi
        
        # Redis health check
        log "Checking Redis health..."
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping | grep -q "PONG"; then
            log "Redis health check: PASSED"
        else
            error "Redis health check: FAILED"
            exit 1
        fi
    fi
    
    log "All health checks passed"
}

# Backup (for production)
create_backup() {
    if [[ "$DEPLOY_MODE" == "production" ]]; then
        info "Creating backup before deployment..."
        
        local backup_dir="$PROJECT_ROOT/backups"
        local backup_timestamp=$(date +%Y%m%d-%H%M%S)
        
        mkdir -p "$backup_dir"
        
        # Database backup
        log "Creating database backup..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres \
            pg_dump -U postgres lightningtalk > "$backup_dir/db-backup-$backup_timestamp.sql"
        
        # Application data backup
        log "Creating application data backup..."
        tar -czf "$backup_dir/data-backup-$backup_timestamp.tar.gz" \
            -C "$PROJECT_ROOT" data/ || warning "Data backup failed (may not exist)"
        
        log "Backup created successfully"
    fi
}

# Cleanup old containers and images
cleanup_docker() {
    info "Cleaning up Docker resources..."
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused images (only for production to save space)
    if [[ "$DEPLOY_MODE" == "production" ]]; then
        docker image prune -f
    fi
    
    log "Docker cleanup completed"
}

# Show deployment summary
show_summary() {
    log "🚀 Deployment Summary"
    log "===================="
    log "Mode: $DEPLOY_MODE"
    log "Time: $(date)"
    log "Log file: $LOG_FILE"
    log ""
    log "Service URLs:"
    log "- Application: http://localhost:3000"
    log "- Health Check: http://localhost:3000/api/health"
    
    if [[ "$DEPLOY_MODE" != "development" ]]; then
        log "- Monitoring: http://localhost:3001 (Grafana)"
        log "- Metrics: http://localhost:9090 (Prometheus)"
    fi
    
    log ""
    log "Useful Commands:"
    log "- View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    log "- Stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
    log "- Restart app: docker-compose -f $DOCKER_COMPOSE_FILE restart app"
}

# Main deployment function
main() {
    log "🚀 Starting Lightning Talk Circle deployment..."
    
    validate_mode
    check_prerequisites
    check_environment
    
    if [[ "$DEPLOY_MODE" == "production" ]]; then
        create_backup
    fi
    
    build_application
    setup_database
    deploy_application
    run_health_checks
    cleanup_docker
    
    show_summary
    
    log "✅ Deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    -h|--help)
        echo "Lightning Talk Circle Deployment Script"
        echo ""
        echo "Usage: $0 [MODE]"
        echo ""
        echo "Modes:"
        echo "  development, dev  - Local development deployment"
        echo "  staging          - Staging environment deployment"
        echo "  production, prod - Production deployment"
        echo ""
        echo "Examples:"
        echo "  $0 development"
        echo "  $0 staging"
        echo "  $0 production"
        exit 0
        ;;
    *)
        main
        ;;
esac