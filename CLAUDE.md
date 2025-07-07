# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lightning Talk Circle is a comprehensive web application for managing Lightning Talk events. The project supports multiple deployment modes:

1. **Static Frontend**: Basic HTML/CSS/JS in `public/` (functioning event landing page)
2. **Node.js Backend**: Express.js API server in `server/` with GitHub integration
3. **WordPress Theme**: Custom child theme based on Cocoon in `wordpress/`
4. **Modern WordPress Theme**: Next-generation theme in `lightningtalk-modern/` (monorepo structure)

## Essential Commands

### Main Development
```bash
# Start development server
npm run dev                    # Node.js server with nodemon
npm run dev:seed              # Development server with sample data

# Testing
npm test                      # Run all tests (Jest)
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests only  
npm run test:e2e             # E2E tests with Playwright
npm run test:coverage        # Test coverage report
npm run test:watch           # Watch mode for TDD

# Code quality
npm run lint                 # ESLint (if configured)
npm run format:check         # Prettier formatting check

# Issue management
npm run create-issues        # Create GitHub issues from data
npm run verify-issues        # Verify existing issues
npm run workflow             # Interactive workflow CLI
npm run auto-workflow        # Automated development workflow
```

### Docker Development
```bash
# Docker development with proper permissions
./scripts/docker-dev.sh init # Initialize permissions (first time only)
./scripts/docker-dev.sh up    # Start development environment
./scripts/docker-dev.sh down  # Stop all containers
./scripts/docker-dev.sh shell # Open shell in app container
./scripts/docker-dev.sh logs  # Show application logs

# Alternative Docker commands
./scripts/docker-dev.sh full   # Full environment with WordPress
./scripts/docker-dev.sh modern # Modern theme development
./scripts/docker-dev.sh clean  # Clean up containers and volumes
```

### WordPress Development
```bash
# WordPress theme development
npm run wp:dev               # Gulp development with BrowserSync
npm run wp:build             # Production build for WordPress
npm run wp:package           # Build and package theme for deployment
npm run wp:assets            # Process images and generate WebP

# Theme building
npm run build:theme          # Build WordPress theme
npm run build:theme:clean    # Clean dist directory
npm run build:theme:analyze  # Analyze build output
```

### Modern WordPress (lightningtalk-modern/)
```bash
# Monorepo development
cd lightningtalk-modern && npm run dev           # All services concurrently
cd lightningtalk-modern && npm run build         # Build all packages
cd lightningtalk-modern && npm run test          # Full test suite
cd lightningtalk-modern && npm run lint          # TypeScript/ESLint
cd lightningtalk-modern && npm run type-check    # TypeScript checking

# WordPress Docker environment
cd lightningtalk-modern && npm run wp:up         # Start WordPress/MySQL
cd lightningtalk-modern && npm run wp:down       # Stop containers
cd lightningtalk-modern && npm run wp:reset      # Reset database
```

### Workflow Automation
```bash
npm run worktree             # Set up git worktree for parallel development
npm run analyze              # Analyze instructions for implementation
npm run quality              # Run quality gates script
```

## Architecture & Key Components

### Root Level Structure
- `public/` - Static frontend with functioning event landing page
  - Event information display with online/offline participation survey
  - Registration modals and emergency contact features
  - Chat widget with localStorage persistence
  - Google Maps integration
- `server/` - Express.js backend with modular architecture
- `wordpress/` - Traditional WordPress child theme (Cocoon-based)
- `lightningtalk-modern/` - Modern WordPress theme with TypeScript/monorepo
- `scripts/` - Comprehensive automation and workflow tools
- `docs/` - Extensive project documentation

### Backend Services (server/)
- **EmailService**: Email templates and sending logic
- **GitHub Integration**: Issue creation and management via Octokit
- **Event Management**: Event CRUD operations
- **Participant Management**: Registration and survey handling

### Modern WordPress Architecture (lightningtalk-modern/)
- **Monorepo Structure**: Workspaces-based organization
- **packages/theme/**: Main WordPress theme with Vite
- **packages/admin-panel/**: React-based admin interface  
- **packages/components/**: Shared UI components with Storybook
- **TypeScript**: Full type safety across packages

### Build Systems
- **Gulp**: WordPress asset processing, SASS compilation, image optimization
- **Vite**: Modern build system for lightningtalk-modern
- **Webpack**: Legacy build support
- **Storybook**: Component library development

## Environment Configuration

### Root Project (.env)
```env
PORT=3000                           # Server port
GITHUB_TOKEN=your_github_token      # For issue automation
GITHUB_OWNER=your_username          # GitHub repository owner
GITHUB_REPO=your_repo               # GitHub repository name
EMAIL_SERVICE=gmail                 # Email service provider
EMAIL_USER=your_email               # Email credentials
EMAIL_PASS=your_password           # Email password
FEEDBACK_URL=https://forms.google.com/...  # Google Forms URL
```

### WordPress Development
- Gulp configured for Cocoon child theme development
- BrowserSync proxy: `http://localhost:8888` (configurable)
- Asset optimization for production deployment

## Testing Strategy

### Test Coverage Requirements
- Maintain 80% coverage threshold
- Unit tests: 70% of test suite
- Integration tests: 25% of test suite  
- E2E tests: 5% of test suite

### Test Locations
- `tests/unit/` - Jest unit tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - Playwright E2E tests
- `lightningtalk-modern/tests/` - Modern theme tests

## Development Workflow

### Git Workflow
- Uses git worktrees for parallel development
- Main branch: Primary development
- Feature branches: Created via worktrees
- All work tracked via GitHub issues

### Issue Management
- Automated issue creation from `docs/project/issues-data.json`
- Standardized labels and templates
- Issue verification and quality gates
- Comprehensive documentation in `docs/project/`

### Security & Performance
- Helmet.js security headers
- Rate limiting on API endpoints  
- Input validation with express-validator
- CORS configuration
- Image optimization and WebP generation
- WCAG 2.1 AA accessibility compliance

## WordPress Integration Patterns

### Traditional Theme (wordpress/)
1. Use Gulp tasks for asset compilation: `npm run wp:dev`
2. Follow Cocoon child theme structure
3. Build for production: `npm run wp:build`
4. Package for deployment: `npm run wp:package`

### Modern Theme (lightningtalk-modern/)
1. TypeScript-first development
2. Component-driven architecture with Storybook
3. Vite for fast development and optimized builds
4. Docker WordPress environment for testing

## Key Development Principles

- **Automation-First**: Extensive scripts for repetitive tasks
- **Issue-Driven Development**: All work tracked via GitHub issues  
- **Multi-Platform Support**: Static, Node.js, and WordPress deployments
- **Type Safety**: TypeScript in modern components
- **Accessibility**: WCAG 2.1 AA compliance required
- **Performance**: Image optimization, asset minification, WebP support
- **Security**: Input validation, rate limiting, security headers