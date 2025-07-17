#!/bin/bash
# Docker Environment Management Script
# Helps manage different Docker environments for Lightning Talk Circle

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Environment files
ENV_LOCAL="$PROJECT_ROOT/.env.local"
ENV_DEV="$PROJECT_ROOT/.env.development"
ENV_PROD="$PROJECT_ROOT/.env.production"

# Docker compose files
COMPOSE_BASE="docker-compose.yml"
COMPOSE_LOCAL="docker-compose.local.yml"
COMPOSE_DEV="docker-compose.dev.yml"

# Function to print colored output
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

# Function to check Docker installation
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
}

# Function to setup environment
setup_env() {
    local env_type=$1
    
    print_info "Setting up $env_type environment..."
    
    case $env_type in
        "local")
            if [ -f "$ENV_LOCAL" ]; then
                cp "$ENV_LOCAL" "$PROJECT_ROOT/.env"
                print_success "Local environment configured"
            else
                print_error ".env.local file not found"
                exit 1
            fi
            ;;
        "development")
            if [ -f "$ENV_DEV" ]; then
                cp "$ENV_DEV" "$PROJECT_ROOT/.env"
                print_success "Development environment configured"
            else
                print_error ".env.development file not found"
                exit 1
            fi
            ;;
        "production")
            print_warning "Production environment should not be run locally!"
            print_info "Use CDK for production deployment"
            exit 1
            ;;
        *)
            print_error "Unknown environment: $env_type"
            exit 1
            ;;
    esac
}

# Function to start Docker environment
start_docker() {
    local env_type=$1
    local profile=$2
    
    print_info "Starting $env_type Docker environment..."
    
    case $env_type in
        "local")
            # Basic local development
            if [ -n "$profile" ]; then
                docker-compose -f "$COMPOSE_BASE" -f "$COMPOSE_LOCAL" --profile "$profile" up -d
            else
                docker-compose -f "$COMPOSE_BASE" -f "$COMPOSE_LOCAL" up -d
            fi
            ;;
        "dev")
            # Development with multiple services
            docker-compose -f "$COMPOSE_DEV" up -d
            ;;
        "full")
            # Full local environment with all services
            docker-compose -f "$COMPOSE_BASE" -f "$COMPOSE_LOCAL" --profile wordpress --profile monitoring --profile docs up -d
            ;;
        *)
            print_error "Unknown environment type: $env_type"
            exit 1
            ;;
    esac
    
    print_success "Docker environment started"
}

# Function to stop Docker environment
stop_docker() {
    print_info "Stopping Docker containers..."
    
    # Stop all project containers
    docker-compose -f "$COMPOSE_BASE" -f "$COMPOSE_LOCAL" -f "$COMPOSE_DEV" down
    
    print_success "Docker environment stopped"
}

# Function to view logs
view_logs() {
    local service=$1
    
    if [ -n "$service" ]; then
        docker-compose logs -f "$service"
    else
        docker-compose logs -f
    fi
}

# Function to execute commands in container
exec_in_container() {
    local service=$1
    shift
    local command="$@"
    
    docker-compose exec "$service" $command
}

# Function to initialize local development
init_local() {
    print_info "Initializing local development environment..."
    
    # Create necessary directories
    mkdir -p "$PROJECT_ROOT/data" "$PROJECT_ROOT/logs" "$PROJECT_ROOT/uploads" "$PROJECT_ROOT/server/data"
    
    # Set proper permissions
    if [ -n "$DOCKER_UID" ] && [ -n "$DOCKER_GID" ]; then
        docker-compose -f "$COMPOSE_LOCAL" --profile init run --rm init-permissions
    fi
    
    # Copy environment file
    setup_env "local"
    
    # Install dependencies
    print_info "Installing dependencies..."
    npm install
    
    print_success "Local development environment initialized"
}

# Function to create LocalStack resources
init_localstack() {
    print_info "Initializing LocalStack resources..."
    
    # Wait for LocalStack to be ready
    sleep 10
    
    # Create DynamoDB tables
    docker-compose exec localstack awslocal dynamodb create-table \
        --table-name lightningtalk-local-events \
        --attribute-definitions AttributeName=id,AttributeType=S \
        --key-schema AttributeName=id,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST
    
    # Create S3 buckets
    docker-compose exec localstack awslocal s3 mb s3://lightningtalk-local
    docker-compose exec localstack awslocal s3 mb s3://lightningtalk-uploads
    
    print_success "LocalStack resources created"
}

# Function to show status
show_status() {
    print_info "Docker container status:"
    docker-compose ps
    
    print_info "\nService URLs:"
    echo "  - Main App: http://localhost:3001"
    echo "  - pgAdmin: http://localhost:8080"
    echo "  - MailHog: http://localhost:8025"
    echo "  - MinIO Console: http://localhost:9001"
    echo "  - Redis Commander: http://localhost:8082"
    echo "  - Adminer: http://localhost:8081"
    echo "  - WordPress (if enabled): http://localhost:8888"
    echo "  - Docs (if enabled): http://localhost:8083"
}

# Function to clean up
cleanup() {
    print_warning "This will remove all containers, volumes, and data!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f "$COMPOSE_BASE" -f "$COMPOSE_LOCAL" -f "$COMPOSE_DEV" down -v
        rm -rf "$PROJECT_ROOT/data" "$PROJECT_ROOT/logs" "$PROJECT_ROOT/uploads"
        print_success "Cleanup completed"
    else
        print_info "Cleanup cancelled"
    fi
}

# Main script logic
case "${1}" in
    "init")
        check_docker
        init_local
        ;;
    "start")
        check_docker
        setup_env "${2:-local}"
        start_docker "${2:-local}" "${3}"
        ;;
    "stop")
        stop_docker
        ;;
    "restart")
        stop_docker
        setup_env "${2:-local}"
        start_docker "${2:-local}" "${3}"
        ;;
    "logs")
        view_logs "${2}"
        ;;
    "exec")
        shift
        exec_in_container "$@"
        ;;
    "status")
        show_status
        ;;
    "init-localstack")
        init_localstack
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"--help"|"-h")
        echo "Lightning Talk Circle - Docker Environment Manager"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  init                Initialize local development environment"
        echo "  start [env] [prof]  Start Docker environment (local/dev/full)"
        echo "  stop                Stop all Docker containers"
        echo "  restart [env]       Restart Docker environment"
        echo "  logs [service]      View container logs"
        echo "  exec <svc> <cmd>    Execute command in container"
        echo "  status              Show container status and URLs"
        echo "  init-localstack     Initialize LocalStack AWS resources"
        echo "  cleanup             Remove all containers and data"
        echo ""
        echo "Examples:"
        echo "  $0 init                    # Initialize local development"
        echo "  $0 start local             # Start basic local environment"
        echo "  $0 start full              # Start with all services"
        echo "  $0 logs app                # View app container logs"
        echo "  $0 exec app npm test       # Run tests in app container"
        ;;
    *)
        print_error "Unknown command: ${1}"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac