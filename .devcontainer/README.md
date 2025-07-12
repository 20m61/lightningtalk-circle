# Dev Container Configuration

This directory contains the Dev Container configuration for the Lightning Talk Circle project.

## Overview

The Dev Container setup reuses the existing Docker configuration from the project:
- Uses the main `docker-compose.yml` for services (PostgreSQL, Redis, pgAdmin)
- Extends it with `docker-compose.extend.yml` for VS Code specific settings
- Leverages the existing `Dockerfile.dev` for the development environment

## How It Works

1. **Base Services**: The main `docker-compose.yml` provides:
   - PostgreSQL database on port 5432
   - Redis cache on port 6379
   - pgAdmin on port 8080
   - Application container with development settings

2. **Dev Container Extensions**: The `docker-compose.extend.yml` adds:
   - VS Code specific volume mounts
   - Command override to keep container running
   - Additional environment variables for development

3. **Integration**: The `devcontainer.json` ties everything together:
   - Points to both docker-compose files
   - Specifies the "app" service as the development container
   - Configures VS Code extensions and settings
   - Sets up port forwarding

## Benefits

- **Reuses Existing Configuration**: No duplication of Docker settings
- **Consistent Environment**: Same containers for both regular Docker and Dev Container development
- **Easy Maintenance**: Changes to the main Docker setup automatically apply to Dev Container
- **Flexibility**: Can still use `docker-compose up` directly or VS Code Dev Container

## Usage

1. Open the project in VS Code
2. When prompted, click "Reopen in Container"
3. VS Code will use the existing Docker configuration with Dev Container enhancements
4. All services (PostgreSQL, Redis, pgAdmin) will be available

## Ports

- **3001**: Application (mapped from container's 3000)
- **5432**: PostgreSQL
- **6379**: Redis
- **8080**: pgAdmin

## Customization

To modify the Dev Container without affecting the main Docker setup:
1. Edit `docker-compose.extend.yml` for container-specific changes
2. Edit `devcontainer.json` for VS Code-specific settings

To modify the base Docker configuration:
1. Edit the main `docker-compose.yml` or `Dockerfile.dev`
2. Changes will automatically apply to Dev Container