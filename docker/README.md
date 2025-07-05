# Lightning Talk Circle - Docker Development Environment

This directory contains Docker configuration files for local development of the
Lightning Talk Circle application.

## Quick Start

1. **Start basic development environment:**

   ```bash
   ./scripts/docker-dev.sh start
   ```

2. **Access the application:**
   - Main Application: http://localhost:3000
   - Health Check: http://localhost:3000/api/health

3. **Stop the environment:**
   ```bash
   ./scripts/docker-dev.sh stop
   ```

## Available Services

### Basic Development (`./scripts/docker-dev.sh start`)

- **Lightning Talk App**: Main Node.js application
- **File-based storage**: No external database required

### Full Development (`./scripts/docker-dev.sh full`)

- **Lightning Talk App**: Main Node.js application
- **WordPress**: Traditional WordPress theme development
- **MySQL**: Database for WordPress
- **Modern Theme**: Next-generation WordPress theme with Vite
- **Nginx**: Reverse proxy for unified development

### Profile-based Services

#### WordPress Only (`./scripts/docker-dev.sh wordpress`)

- Includes WordPress and MySQL services
- Access at: http://localhost:8888

#### Modern Theme Only (`./scripts/docker-dev.sh modern`)

- Includes modern WordPress theme with Vite
- Dev server at: http://localhost:3001
- Storybook at: http://localhost:6006

## Development Scripts

### `scripts/docker-dev.sh`

Main development helper script with the following commands:

```bash
./scripts/docker-dev.sh start        # Start basic environment
./scripts/docker-dev.sh full         # Start with all services
./scripts/docker-dev.sh wordpress    # Start with WordPress
./scripts/docker-dev.sh modern       # Start with Modern theme
./scripts/docker-dev.sh stop         # Stop all services
./scripts/docker-dev.sh restart      # Restart services
./scripts/docker-dev.sh build        # Build development image
./scripts/docker-dev.sh logs         # Show recent logs
./scripts/docker-dev.sh logs-follow  # Follow logs in real-time
./scripts/docker-dev.sh shell        # Open shell in container
./scripts/docker-dev.sh health       # Check application health
./scripts/docker-dev.sh status       # Show service status
./scripts/docker-dev.sh clean        # Clean up containers/images
./scripts/docker-dev.sh verify       # Run verification tests
```

### `scripts/docker-verify.sh`

Comprehensive verification script that:

- Checks Docker installation
- Builds and starts services
- Tests health endpoints
- Tests API functionality
- Tests static file serving
- Tests data persistence
- Shows service status

## Environment Configuration

### `.env.docker`

Template environment file for Docker development. Copy to `.env`:

```bash
cp .env.docker .env
```

Key configuration options:

- `NODE_ENV=development`: Development mode
- `EMAIL_ENABLED=false`: Disable email for local development
- `DEBUG=true`: Enable debug logging
- `DATABASE_TYPE=file`: Use file-based storage

### Environment Variables

| Variable         | Default                         | Description                   |
| ---------------- | ------------------------------- | ----------------------------- |
| `NODE_ENV`       | `development`                   | Application environment       |
| `PORT`           | `3000`                          | Application port              |
| `EMAIL_ENABLED`  | `false`                         | Enable/disable email features |
| `DEBUG`          | `true`                          | Enable debug logging          |
| `GITHUB_TOKEN`   | -                               | GitHub API token (optional)   |
| `JWT_SECRET`     | `development-jwt-secret...`     | JWT signing secret            |
| `SESSION_SECRET` | `development-session-secret...` | Session signing secret        |

## File Structure

```
docker/
├── nginx/
│   └── nginx.conf          # Nginx reverse proxy configuration
├── README.md              # This file
└── .dockerignore          # Docker ignore patterns

docker-compose.local.yml    # Docker Compose configuration
Dockerfile.dev             # Development container image
.env.docker               # Environment template
```

## Networking

All services run in the `lightningtalk-local-network` bridge network:

- **app**: Main application container
- **wordpress**: WordPress container (profile: default)
- **wp-db**: MySQL database for WordPress
- **modern-theme**: Modern WordPress theme (profile: modern)
- **nginx**: Reverse proxy (profile: full)
- **tools**: Utility container (profile: tools)

## Data Persistence

### Application Data

- `./data` → `/app/data`: Application data files
- `./logs` → `/app/logs`: Application log files

### WordPress Data

- `wp_data`: WordPress files volume
- `wp_db_data`: MySQL database volume

### Development Files

- `.:/app`: Source code (bind mount for hot reload)
- `/app/node_modules`: Isolated node_modules

## Health Checks

The application includes comprehensive health checks:

- **Basic Health**: `/api/health`
- **Detailed Health**: `/api/health/detailed`
- **Readiness Probe**: `/api/health/ready`
- **Liveness Probe**: `/api/health/live`
- **Performance Metrics**: `/api/health/metrics`

## Debugging

### View Logs

```bash
# Recent logs
./scripts/docker-dev.sh logs

# Follow logs in real-time
./scripts/docker-dev.sh logs-follow

# Specific service logs
docker-compose -f docker-compose.local.yml logs app
```

### Shell Access

```bash
# Open shell in main container
./scripts/docker-dev.sh shell

# Direct docker exec
docker-compose -f docker-compose.local.yml exec app sh
```

### Debug Mode

The development container exposes port 9229 for Node.js debugging:

```bash
# Start with debug
docker-compose -f docker-compose.local.yml up -d
# Attach debugger to localhost:9229
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `docker-compose.local.yml`
2. **Permission issues**: Check file ownership and Docker user
3. **Build failures**: Run `./scripts/docker-dev.sh clean` and rebuild
4. **Health check failures**: Check logs with `./scripts/docker-dev.sh logs`

### Reset Environment

```bash
# Clean everything and start fresh
./scripts/docker-dev.sh clean
./scripts/docker-dev.sh build
./scripts/docker-dev.sh verify
```

### Performance Issues

- Use Docker Desktop with adequate resource allocation
- Enable BuildKit for faster builds: `DOCKER_BUILDKIT=1`
- Use `.dockerignore` to exclude unnecessary files

## Production Differences

This Docker setup is optimized for development:

- Source code is bind-mounted for hot reload
- Development dependencies are included
- Debug ports are exposed
- Email is disabled
- Security settings are relaxed

For production deployment, use the main `Dockerfile` with proper:

- Multi-stage builds
- Production dependencies only
- Security hardening
- External database/email services

## Integration with CI/CD

The Docker environment is compatible with GitHub Actions workflows:

- Uses the same base configuration
- Environment variables can be overridden
- Health checks ensure reliable testing
- Supports both unit and integration testing
