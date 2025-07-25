# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Lightning Talk Circle is a multi-platform web application for managing Lightning
Talk events (5-minute presentations). The project includes:

- **Static Frontend**: Basic HTML/CSS/JS in `public/` folder
- **WordPress Theme**: Custom child theme based on Cocoon in `wordpress/`
- **Node.js Backend**: Express.js API server in `server/`

## Essential Commands

### Development

```bash
# Start development server
npm run dev                    # Node.js server with nodemon
npm run wp:dev                 # WordPress theme development with Gulp

# Run tests
npm test                       # Run all tests
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests only
npm run test:e2e              # E2E tests with Playwright
npm run test:watch            # Watch mode for TDD

# Code quality
npm run lint                   # Run ESLint (if configured)
npm run format:check          # Check Prettier formatting
npm run quality               # Run quality gates script

# WordPress specific
npm run wp:build              # Production build for WordPress
npm run wp:sync               # Sync between Storybook and WordPress
npm run wp:lint-php           # Lint PHP files
```

### Workflow Automation

```bash
npm run workflow              # Interactive workflow CLI
npm run auto-workflow         # Automated development workflow
npm run worktree             # Set up git worktree for parallel development
npm run analyze              # Analyze instructions for implementation
```

### Docker Development

```bash
# Start main development environment
docker-compose -f docker-compose.dev.yml up app-main

# Run with specific profiles
docker-compose -f docker-compose.dev.yml --profile test up    # Include test runner
docker-compose -f docker-compose.dev.yml --profile e2e up     # Include Selenium
```

## Architecture & Key Patterns

### Directory Structure

- `public/` - Static frontend with event landing page (index.html, main.js)
- `server/` - Express.js backend with modular services
  - `routes/` - API endpoints
  - `services/` - Business logic (email, GitHub integration)
  - `middleware/` - Express middleware
- `wordpress/` - WordPress theme files
- `src/` - Source files for build process
- `scripts/` - Automation and workflow tools
- `docs/` - Comprehensive project documentation

### Current Implementation Status

The `public/` folder contains a functioning event landing page with:

- Event information display
- Online/offline participation survey with counters (localStorage)
- Registration modals
- Emergency contact phone button
- Simple chat widget with auto-responses
- Google Maps integration

### Key Services

1. **EmailService** (`server/services/email.js`): Email templates and sending
   logic
2. **GitHub Integration**: Issue creation and management via Octokit
3. **Chat System**: Client-side chat with localStorage persistence

### Environment Configuration

Create `.env` from `.env.example`. Key variables:

- `PORT` - Server port (default: 3000)
- `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` - For issue automation
- `EMAIL_*` - Email service configuration
- `FEEDBACK_URL` - Google Forms URL for feedback

### Testing Strategy

Tests follow a pyramid structure (70% unit, 25% integration, 5% E2E):

- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e/` (Playwright)

### Git Workflow

The project uses git worktrees for parallel development:

- Main branch: Primary development
- Feature branches: New features via worktrees
- Hotfix branches: Emergency fixes

### Security Considerations

- Helmet.js for security headers
- Rate limiting on API endpoints
- Input validation with express-validator
- CORS configuration for cross-origin requests

### WordPress Integration

When working with WordPress:

1. Use Gulp tasks for asset compilation
2. Follow Cocoon child theme structure
3. Sync Storybook components with `npm run wp:sync`
4. Build production assets with `npm run wp:build`

### Development Principles

- **Automated workflows**: Use provided scripts for repetitive tasks
- **Issue-driven development**: All work tracked via GitHub issues
- **Accessibility**: WCAG 2.1 AA compliance required
- **Test coverage**: Maintain 80% coverage threshold
