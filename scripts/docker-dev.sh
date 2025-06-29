#!/bin/bash

# Lightning Talk Circle - Docker Development Helper Script
# Quick commands for Docker development workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
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

# Show usage
show_help() {
    echo "Lightning Talk Circle - Docker Development Helper"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start           Start the development environment"
    echo "  stop            Stop the development environment"
    echo "  restart         Restart the development environment"
    echo "  build           Build the development image"
    echo "  logs            Show application logs"
    echo "  logs-follow     Follow application logs"
    echo "  shell           Open shell in the application container"
    echo "  health          Check application health"
    echo "  status          Show service status"
    echo "  clean           Clean up containers and images"
    echo "  verify          Run verification tests"
    echo "  full            Start with WordPress and Modern theme"
    echo "  wordpress       Start with WordPress only"
    echo "  modern          Start with Modern theme only"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start        # Start basic development environment"
    echo "  $0 full         # Start with all services (WordPress + Modern theme)"
    echo "  $0 logs-follow  # Watch logs in real-time"
    echo "  $0 shell        # Open shell for debugging"
}

# Start development environment
start_dev() {
    local profile=""
    case "$1" in
        "full")
            profile="--profile full --profile modern"
            print_status "Starting full development environment (with WordPress and Modern theme)..."
            ;;
        "wordpress")
            profile=""
            print_status "Starting development environment with WordPress..."
            ;;
        "modern")
            profile="--profile modern"
            print_status "Starting development environment with Modern theme..."
            ;;
        *)
            print_status "Starting basic development environment..."
            ;;
    esac
    
    docker-compose -f docker-compose.local.yml up -d $profile
    
    # Wait for health check
    print_status "Waiting for application to be ready..."
    sleep 10
    
    if docker-compose -f docker-compose.local.yml exec -T app curl -f http://localhost:3000/api/health &> /dev/null; then
        print_success "Development environment is ready!"
        echo ""
        print_status "Available services:"
        print_status "  • Main Application: http://localhost:3010"
        print_status "  • Health Check: http://localhost:3010/api/health"
        
        if [[ "$profile" == *"full"* ]]; then
            print_status "  • WordPress: http://localhost:8888"
            print_status "  • Nginx Proxy: http://localhost:80"
        fi
        
        if [[ "$profile" == *"modern"* ]]; then
            print_status "  • Modern Theme Dev: http://localhost:3002"
            print_status "  • Storybook: http://localhost:6006"
        fi
    else
        print_warning "Application may still be starting up. Check logs with: $0 logs"
    fi
}

# Stop development environment
stop_dev() {
    print_status "Stopping development environment..."
    docker-compose -f docker-compose.local.yml down
    print_success "Development environment stopped"
}

# Restart development environment
restart_dev() {
    print_status "Restarting development environment..."
    docker-compose -f docker-compose.local.yml restart
    print_success "Development environment restarted"
}

# Build development image
build_dev() {
    print_status "Building development image..."
    docker-compose -f docker-compose.local.yml build --no-cache
    print_success "Development image built"
}

# Show logs
show_logs() {
    local follow="$1"
    if [[ "$follow" == "follow" ]]; then
        print_status "Following application logs (Ctrl+C to stop)..."
        docker-compose -f docker-compose.local.yml logs -f app
    else
        print_status "Showing recent application logs..."
        docker-compose -f docker-compose.local.yml logs --tail=50 app
    fi
}

# Open shell in container
open_shell() {
    print_status "Opening shell in application container..."
    if docker-compose -f docker-compose.local.yml exec app sh -c 'command -v bash' &> /dev/null; then
        docker-compose -f docker-compose.local.yml exec app bash
    else
        docker-compose -f docker-compose.local.yml exec app sh
    fi
}

# Check health
check_health() {
    print_status "Checking application health..."
    
    if docker-compose -f docker-compose.local.yml exec -T app curl -f http://localhost:3000/api/health &> /dev/null; then
        print_success "Application is healthy"
        
        # Show detailed health info
        echo ""
        print_status "Health details:"
        docker-compose -f docker-compose.local.yml exec -T app curl -s http://localhost:3000/api/health | jq . 2>/dev/null || \
        docker-compose -f docker-compose.local.yml exec -T app curl -s http://localhost:3000/api/health
    else
        print_error "Application is not healthy"
        echo ""
        print_status "Recent logs:"
        docker-compose -f docker-compose.local.yml logs --tail=20 app
    fi
}

# Show service status
show_status() {
    print_status "Service status:"
    docker-compose -f docker-compose.local.yml ps
    
    echo ""
    print_status "Docker images:"
    docker images | grep -E "(lightningtalk|none)" || echo "No Lightning Talk images found"
    
    echo ""
    print_status "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -1
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep lightningtalk || echo "No Lightning Talk containers running"
}

# Clean up
clean_up() {
    print_status "Cleaning up Docker environment..."
    
    # Stop all services
    docker-compose -f docker-compose.local.yml down
    
    # Remove images
    print_status "Removing Lightning Talk images..."
    docker images | grep lightningtalk | awk '{print $3}' | xargs -r docker rmi -f
    
    # Clean up build cache
    print_status "Cleaning up Docker build cache..."
    docker builder prune -f
    
    # Clean up volumes (optional)
    read -p "Do you want to remove persistent data volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f docker-compose.local.yml down -v
        print_warning "Persistent data has been removed"
    fi
    
    print_success "Cleanup completed"
}

# Run verification
run_verification() {
    if [[ -f "scripts/docker-verify.sh" ]]; then
        print_status "Running verification script..."
        ./scripts/docker-verify.sh
    else
        print_error "Verification script not found at scripts/docker-verify.sh"
        exit 1
    fi
}

# Main command handler
main() {
    case "$1" in
        "start")
            start_dev
            ;;
        "stop")
            stop_dev
            ;;
        "restart")
            restart_dev
            ;;
        "build")
            build_dev
            ;;
        "logs")
            show_logs
            ;;
        "logs-follow")
            show_logs "follow"
            ;;
        "shell")
            open_shell
            ;;
        "health")
            check_health
            ;;
        "status")
            show_status
            ;;
        "clean")
            clean_up
            ;;
        "verify")
            run_verification
            ;;
        "full")
            start_dev "full"
            ;;
        "wordpress")
            start_dev "wordpress"
            ;;
        "modern")
            start_dev "modern"
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi