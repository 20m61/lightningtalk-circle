#!/bin/bash

# Lightning Talk Circle - Docker Environment Verification Script
# This script verifies that the Docker local development environment is working correctly

set -e

echo "🚀 Lightning Talk Circle - Docker Environment Verification"
echo "============================================================"

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

# Check if Docker is running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    print_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available"
        exit 1
    fi
    
    print_success "Docker Compose is available"
}

# Check required files
check_required_files() {
    print_status "Checking required Docker files..."
    
    local required_files=(
        "docker-compose.local.yml"
        "Dockerfile.dev"
        "docker/nginx/nginx.conf"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            print_error "Required file missing: $file"
            exit 1
        fi
    done
    
    print_success "All required Docker files are present"
}

# Build and start services
start_services() {
    print_status "Building and starting Docker services..."
    
    # Build the development image
    print_status "Building development image..."
    docker-compose -f docker-compose.local.yml build app
    
    # Start the main application
    print_status "Starting main application..."
    docker-compose -f docker-compose.local.yml up -d app
    
    # Wait for application to be ready
    print_status "Waiting for application to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker-compose -f docker-compose.local.yml exec -T app curl -f http://localhost:3000/api/health &> /dev/null; then
            break
        fi
        
        sleep 2
        ((attempt++))
        
        if [[ $attempt -eq $max_attempts ]]; then
            print_error "Application failed to start within expected time"
            docker-compose -f docker-compose.local.yml logs app
            exit 1
        fi
    done
    
    print_success "Application is running and healthy"
}

# Test health endpoints
test_health_endpoints() {
    print_status "Testing health endpoints..."
    
    local endpoints=(
        "/api/health"
        "/api/health/live"
        "/api/health/ready"
    )
    
    for endpoint in "${endpoints[@]}"; do
        print_status "Testing $endpoint..."
        
        local response=$(docker-compose -f docker-compose.local.yml exec -T app curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$endpoint)
        
        if [[ "$response" == "200" ]]; then
            print_success "$endpoint responded with 200"
        else
            print_warning "$endpoint responded with $response"
        fi
    done
}

# Test API endpoints
test_api_endpoints() {
    print_status "Testing API endpoints..."
    
    # Test events endpoint
    local events_response=$(docker-compose -f docker-compose.local.yml exec -T app curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/events)
    
    if [[ "$events_response" == "200" ]]; then
        print_success "Events API is working"
    else
        print_warning "Events API responded with $events_response"
    fi
    
    # Test participants endpoint
    local participants_response=$(docker-compose -f docker-compose.local.yml exec -T app curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/participants)
    
    if [[ "$participants_response" == "200" ]]; then
        print_success "Participants API is working"
    else
        print_warning "Participants API responded with $participants_response"
    fi
}

# Test static files
test_static_files() {
    print_status "Testing static file serving..."
    
    local static_response=$(docker-compose -f docker-compose.local.yml exec -T app curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
    
    if [[ "$static_response" == "200" ]]; then
        print_success "Static files are being served"
    else
        print_warning "Static files responded with $static_response"
    fi
}

# Test file persistence
test_file_persistence() {
    print_status "Testing file persistence..."
    
    # Create a test file in the data directory
    docker-compose -f docker-compose.local.yml exec -T app sh -c 'echo "test data" > /app/data/test-persistence.txt'
    
    # Restart the container
    docker-compose -f docker-compose.local.yml restart app
    
    # Wait for restart
    sleep 5
    
    # Check if file still exists
    if docker-compose -f docker-compose.local.yml exec -T app test -f /app/data/test-persistence.txt; then
        print_success "File persistence is working"
        # Clean up test file
        docker-compose -f docker-compose.local.yml exec -T app rm -f /app/data/test-persistence.txt
    else
        print_error "File persistence is not working"
    fi
}

# Show service status
show_service_status() {
    print_status "Service Status:"
    docker-compose -f docker-compose.local.yml ps
    
    echo ""
    print_status "Application Logs (last 20 lines):"
    docker-compose -f docker-compose.local.yml logs --tail=20 app
}

# Cleanup function
cleanup() {
    print_status "Cleaning up test environment..."
    docker-compose -f docker-compose.local.yml down
    print_success "Cleanup completed"
}

# Main verification flow
main() {
    echo ""
    print_status "Starting Docker environment verification..."
    echo ""
    
    # Pre-checks
    check_docker
    check_docker_compose
    check_required_files
    
    echo ""
    print_status "Environment setup looks good. Starting verification tests..."
    echo ""
    
    # Setup signal handler for cleanup
    trap cleanup EXIT
    
    # Start services and run tests
    start_services
    test_health_endpoints
    test_api_endpoints
    test_static_files
    test_file_persistence
    
    echo ""
    show_service_status
    
    echo ""
    print_success "🎉 Docker environment verification completed successfully!"
    echo ""
    print_status "Your Lightning Talk Circle application is running at:"
    print_status "  • Main Application: http://localhost:3000"
    print_status "  • Health Check: http://localhost:3000/api/health"
    print_status "  • API Docs: http://localhost:3000/api"
    echo ""
    print_status "To stop the environment, run:"
    print_status "  docker-compose -f docker-compose.local.yml down"
    echo ""
}

# Run verification if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi