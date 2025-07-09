#!/bin/bash

# Lightning Talk Circle - Docker Development Environment Helper
# This script sets up proper user permissions for Docker development

set -e

# Get current user's UID and GID
USER_UID=$(id -u)
USER_GID=$(id -g)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Lightning Talk Circle - Docker Development Setup${NC}"
echo "Setting up development environment with UID: $USER_UID, GID: $USER_GID"

# Create necessary directories
echo -e "${YELLOW}Creating data directories...${NC}"
mkdir -p data logs server/data

# Set UID and GID for Docker Compose (use different var names to avoid readonly issues)
export DOCKER_UID=$USER_UID
export DOCKER_GID=$USER_GID

# Function to handle cleanup
cleanup() {
    echo -e "\n${YELLOW}Shutting down containers...${NC}"
    docker-compose -f docker-compose.local.yml down
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Check what command to run
case "${1:-help}" in
    "init")
        echo -e "${YELLOW}Initializing permissions...${NC}"
        docker-compose -f docker-compose.local.yml --profile init up init-permissions
        echo -e "${GREEN}✅ Permissions initialized${NC}"
        ;;
    "up")
        echo -e "${YELLOW}Starting development environment...${NC}"
        # First initialize permissions
        docker-compose -f docker-compose.local.yml --profile init up init-permissions
        # Then start the main app
        docker-compose -f docker-compose.local.yml up --build app
        ;;
    "build")
        echo -e "${YELLOW}Building containers...${NC}"
        docker-compose -f docker-compose.local.yml build --build-arg UID=$USER_UID --build-arg GID=$USER_GID
        ;;
    "full")
        echo -e "${YELLOW}Starting full environment (with WordPress)...${NC}"
        docker-compose -f docker-compose.local.yml --profile full up --build
        ;;
    "modern")
        echo -e "${YELLOW}Starting with modern theme development...${NC}"
        docker-compose -f docker-compose.local.yml --profile modern up --build
        ;;
    "down")
        echo -e "${YELLOW}Stopping all containers...${NC}"
        docker-compose -f docker-compose.local.yml down
        ;;
    "clean")
        echo -e "${YELLOW}Cleaning up containers and volumes...${NC}"
        docker-compose -f docker-compose.local.yml down -v
        docker system prune -f
        ;;
    "logs")
        echo -e "${YELLOW}Showing logs...${NC}"
        docker-compose -f docker-compose.local.yml logs -f ${2:-app}
        ;;
    "shell")
        echo -e "${YELLOW}Opening shell in app container...${NC}"
        docker-compose -f docker-compose.local.yml exec app sh
        ;;
    "help"|*)
        echo -e "${GREEN}Usage: $0 <command>${NC}"
        echo ""
        echo "Commands:"
        echo "  init     - Initialize permissions for data directories"
        echo "  up       - Start development environment (app only)"
        echo "  build    - Build containers with proper UID/GID"
        echo "  full     - Start full environment (with Nginx proxy)"
        echo "  modern   - Start with modern theme development"
        echo "  down     - Stop all containers"
        echo "  clean    - Stop containers and clean up volumes"
        echo "  logs     - Show logs (optionally specify service)"
        echo "  shell    - Open shell in app container"
        echo "  help     - Show this help message"
        echo ""
        echo -e "${YELLOW}Examples:${NC}"
        echo "  $0 init          # Initialize permissions"
        echo "  $0 up            # Start development"
        echo "  $0 logs app      # Show app logs"
        echo "  $0 logs wordpress # Show WordPress logs"
        ;;
esac