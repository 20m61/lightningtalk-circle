# Development Workflow

## Overview

This document outlines the development workflow and CI/CD pipeline for the
Lightning Talk Circle website. It establishes structured processes for code
development, testing, quality assurance, and deployment to ensure consistent,
high-quality deliverables.

## Development Environment

### Local Development Setup

#### Docker/Lando Configuration

- **Tools:**
  - Docker Desktop or Docker Engine
  - Lando for local WordPress development

- **Implementation:**
  - Custom `docker-compose.yml` or `.lando.yml` configuration
  - Container setup:
    - Web server (Nginx/Apache)
    - PHP-FPM (specified version)
    - MySQL/MariaDB
    - PhpMyAdmin (optional)
    - MailHog for email testing

- **Local Domain:**
  - `lightning-talk.local` via hosts file

- **Environment Variables:**
  - Development-specific configurations
  - Sample `.env.example` file for reference
  - `.env` file for local configuration (gitignored)

### Setup Process

```bash
# Clone repository
git clone https://github.com/[organization]/lightningtalk-circle.git
cd lightningtalk-circle

# Start development environment
lando start
# OR
docker-compose up -d

# Install dependencies
lando composer install
# OR
docker-compose exec app composer install

# Build frontend assets
lando npm install
lando npm run dev
# OR
docker-compose exec app npm install
docker-compose exec app npm run dev
```

### Development Data

- **Seed Data:**
  - Sample content for development
  - WP-CLI scripts for content generation
  - Sanitized copy of production database (personal data removed)

- **Database Sync:**
  - Scripts for pulling production/staging data to local
  - Data sanitization during sync
  - Reversible transformations for local development

## Code Management

### Git Workflow

- **Branch Strategy:**
  - `main` - Production-ready code
  - `develop` - Integration branch for features
  - `feature/*` - Individual feature branches
  - `bugfix/*` - Bug fix branches
  - `hotfix/*` - Critical production fixes

- **Commit Guidelines:**
  - Conventional Commits format (`feat:`, `fix:`, `docs:`, etc.)
  - Reference issue numbers in commit messages
  - Keep commits focused and atomic

- **Pull Request Process:**
  - Template with checklist and description
  - Required reviewer approvals (minimum 1)
  - Must pass automated checks
  - Squash and merge policy

### Version Control Best Practices

- **Gitignore Configuration:**
  - Exclude development artifacts
  - Exclude environment-specific config
  - Exclude dependencies and build outputs

- **Git Hooks:**
  - Pre-commit hooks for linting and formatting
  - Pre-push hooks for testing
  - Implemented via Husky

## Code Quality Tools

### Linters and Formatters

- **PHP:**
  - PHP_CodeSniffer for PSR-12 compliance
  - Configuration in `phpcs.xml`

- **JavaScript:**
  - ESLint with appropriate configuration
  - Configuration in `.eslintrc.js`
  - Integration with Next.js/React standards

- **CSS/SCSS:**
  - Stylelint for style validation
  - Configuration in `.stylelintrc.js`
  - BEM methodology validation

- **Markdown:**
  - Markdownlint for documentation consistency
  - Configuration in `.markdownlint.json`

### Automation with Husky and lint-staged

- **Pre-commit Configuration:**

  ```json
  // package.json excerpt
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  },
  "lint-staged": {
    "*.php": ["php -l", "phpcs"],
    "*.js": ["eslint --fix", "prettier --write"],
    "*.scss": ["stylelint --fix", "prettier --write"],
    "*.md": ["markdownlint"]
  }
  ```

- **Editor Integration:**
  - VSCode settings and extensions
  - PhpStorm configurations
  - EditorConfig support

## Testing Framework

### Unit Testing

- **PHP Testing:**
  - PHPUnit for WordPress functions and classes
  - Mock objects for WordPress core functions
  - Test isolation and fixture management

- **JavaScript Testing:**
  - Jest for utility functions
  - React Testing Library for components
  - Snapshot testing for UI components

### Integration Testing

- **WordPress Integration:**
  - WP Browser (Codeception extension)
  - Database integration testing
  - WordPress action/filter testing

- **API Testing:**
  - REST API endpoint testing
  - Authentication and permission validation
  - Request/response validation

### End-to-End Testing

- **Tool:** Cypress or Playwright
- **Implementation:**
  - Critical user journeys
  - Form submissions and workflows
  - Cross-browser compatibility testing

### Visual Regression Testing

- **Tool:** Chromatic (Storybook integration)
- **Process:**
  - Automated comparison of UI components
  - Visual snapshots for reference
  - Review and approval workflow

## CI/CD Pipeline

### GitHub Actions Workflows

#### Primary Workflows

1. **Code Quality Checks (`quality.yml`):**
   - Triggered on pull requests to `develop` and `main`
   - Steps:
     - PHP linting and PHPCS
     - ESLint for JavaScript
     - Stylelint for SCSS
     - Markdown linting

2. **Testing (`test.yml`):**
   - Triggered on pull requests and pushes to `develop` and `main`
   - Steps:
     - Set up test environment
     - Install dependencies
     - Run PHPUnit tests
     - Run Jest tests
     - Run integration tests

3. **Visual Regression (`visual.yml`):**
   - Triggered on pull requests to `develop` and `main`
   - Steps:
     - Build Storybook
     - Publish to Chromatic
     - Report status back to PR

4. **Deployment (`deploy.yml`):**
   - Separate workflows for staging and production
   - Triggered on push to `develop` (staging) and `main` (production)
   - Steps detailed below

### Deployment Automation

#### Staging Deployment

- **Trigger:** Push to `develop` branch
- **Environment:** Staging server on Lolipop
- **Process:**
  1. Build assets with production settings
  2. Run final tests
  3. Deploy via FTP/SSH to staging environment
  4. Run database migrations using WP-CLI
  5. Clear caches
  6. Run smoke tests
  7. Notify team of deployment

#### Production Deployment

- **Trigger:** Push to `main` branch
- **Environment:** Production server on Lolipop
- **Process:**
  1. Build assets with production settings
  2. Create backup of current production
  3. Deploy via FTP/SSH to production environment
  4. Run database migrations using WP-CLI
  5. Clear caches
  6. Run smoke tests
  7. Monitor for errors
  8. Notify team of deployment status

### Deployment Script Example

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        run: |
          composer install --no-dev --optimize-autoloader
          npm ci

      - name: Build Assets
        run: npm run build

      - name: Deploy to Staging
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./
          server-dir: ${{ secrets.STAGING_PATH }}
          exclude: |
            **/.git*
            **/.git*/**
            **/node_modules/**
            **/tests/**
            docker-compose.yml
            .env.example
            README.md

      - name: Post-Deployment Tasks
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          password: ${{ secrets.SSH_PASSWORD }}
          script: |
            cd ${{ secrets.STAGING_PATH }}
            wp core update-db --path=${{ secrets.STAGING_PATH }} --quiet
            wp cache flush --path=${{ secrets.STAGING_PATH }} --quiet

      - name: Notify Team
        uses: rtCamp/action-slack-notify@v2
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
          SLACK_TITLE: 'Staging Deployment Completed'
          SLACK_MESSAGE: 'The latest changes have been deployed to staging.'
          SLACK_COLOR: good
```

## WordPress Development Guidelines

### Theme Development

- **Child Theme Structure:**

  ```
  themes/lightning-talk-child/
  ├── assets/
  │   ├── css/
  │   ├── js/
  │   └── images/
  ├── inc/
  │   ├── custom-post-types.php
  │   ├── shortcodes.php
  │   ├── widgets.php
  │   └── helpers.php
  ├── template-parts/
  │   ├── content/
  │   ├── header/
  │   └── footer/
  ├── functions.php
  ├── style.css
  └── screenshot.png
  ```

- **Modular Code Structure:**
  - Separate files for different functionality
  - Use of namespaces for organization
  - Class-based approach for complex features

### Custom Post Type Implementation

- **Registration Example:**
  ```php
  // Register Date Candidate Custom Post Type
  function ltc_register_date_candidate_cpt() {
    $labels = [
      'name'               => _x('Date Candidates', 'post type general name', 'lightning-talk'),
      'singular_name'      => _x('Date Candidate', 'post type singular name', 'lightning-talk'),
      // Other labels...
    ];

    $args = [
      'labels'             => $labels,
      'public'             => true,
      'publicly_queryable' => true,
      'show_ui'            => true,
      'show_in_menu'       => true,
      'show_in_rest'       => true,
      'query_var'          => true,
      'rewrite'            => ['slug' => 'date-candidates'],
      'capability_type'    => 'post',
      'has_archive'        => true,
      'hierarchical'       => false,
      'menu_position'      => 5,
      'supports'           => ['title', 'editor', 'custom-fields'],
      'menu_icon'          => 'dashicons-calendar-alt',
    ];

    register_post_type('date_candidate', $args);
  }
  add_action('init', 'ltc_register_date_candidate_cpt');
  ```

### JavaScript Development

- **Module Structure:**
  - ES Modules format
  - Component-based organization
  - Clear separation of concerns

- **Event Handling:**
  - Event delegation where appropriate
  - Custom events for complex interactions
  - Debouncing/throttling for performance

## Documentation Practices

### Code Documentation

- **PHP Docblocks:**
  - Function purpose
  - Parameter descriptions
  - Return value documentation
  - Example usage where helpful

- **JavaScript JSDoc:**
  - Function documentation
  - Type annotations
  - Usage examples

### Project Documentation

- **Repository Documentation:**
  - README.md with project overview
  - CONTRIBUTING.md for contribution guidelines
  - CHANGELOG.md for version history

- **Technical Documentation:**
  - Markdown files in the `docs/` directory
  - Diagrams for complex architectures
  - Setup and deployment instructions

## Continuous Improvement

- **Code Reviews:**
  - Pull request templates
  - Review checklists
  - Pair programming for complex features

- **Retrospectives:**
  - Regular team reviews of development process
  - Action items for improvement
  - Measuring effectiveness of changes

- **Knowledge Sharing:**
  - Internal documentation updates
  - Code walkthroughs
  - Learning sessions
