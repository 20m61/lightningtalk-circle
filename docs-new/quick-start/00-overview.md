# Lightning Talk Circle - プロジェクト概要

# Lightning Talk Circle - Modern Web Application

<div align="center">
  <img src="public/icons/logo.jpeg" alt="Lightning Talk Circle Logo" width="200" height="200" />
  <br/>
  <h3>⚡ なんでもライトニングトーク ⚡</h3>
  <p>5分間で世界を変える！あなたの「なんでも」を聞かせて！</p>
</div>

## Project Overview

To revitalize the activities of the Lightning Talk Circle, this project aims to
build a high-performance, scalable, and modern web application. We are
leveraging a serverless architecture on AWS, with infrastructure managed by the
AWS CDK, to maximize development efficiency, site quality, and operational
excellence.

### Primary Objectives

- Streamline the scheduling, announcement, and operation of lightning talk
  events.
- Systematize the archiving and promotion of past presentation content.
- Foster interaction among participants and community building.
- Reduce the burden on operators and ensure sustainable circle operations.
- Provide a highly accessible, secure, and performant website.

### Key Information

- **Site URL:** `https://発表.com` (Custom Domain)
- **Deployment Target:** Amazon Web Services (AWS)

## Architecture Overview

This project adopts a serverless, headless architecture to ensure scalability
and maintainability.

- **Frontend (SPA):** A Next.js single-page application hosted on **AWS Amplify
  Hosting** for global, high-speed content delivery and a seamless CI/CD
  pipeline.
- **Backend (API):** A serverless API built with **Node.js**, running on **AWS
  Lambda** and exposed via **Amazon API Gateway**.
- **Database:** **Amazon Aurora Serverless v2 (MySQL Compatible)** provides a
  flexible, auto-scaling database.
- **Authentication:** User management and authentication are handled by **Amazon
  Cognito**.
- **File Storage:** Presentation materials and other static assets are stored
  securely in **Amazon S3**.
- **Infrastructure as Code (IaC):** All AWS resources are defined and managed
  using the **AWS CDK (TypeScript)**, enabling version-controlled, repeatable
  infrastructure deployments.

## Technology Stack

- **Infrastructure:** AWS CDK (TypeScript)
- **Frontend:** Next.js, React, SASS/SCSS, Storybook
- **Backend:** Node.js, Express.js, AWS Lambda, Amazon API Gateway
- **Database:** Amazon Aurora Serverless v2

## Development Environment

### Dev Container Support

This project includes Dev Container configuration for consistent development
environments. Dev Containers provide:

- Pre-configured development environment with all necessary tools
- Consistent settings across team members
- Enhanced security with network isolation
- Integrated database and cache services

#### Prerequisites

- Visual Studio Code with
  [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
  extension
- Docker Desktop installed and running

#### Getting Started with Dev Container

1. **Clone the repository**:

   ```bash
   git clone https://github.com/20m61/lightningtalk-circle.git
   cd lightningtalk-circle
   ```

2. **Open in VS Code**:

   ```bash
   code .
   ```

3. **Reopen in Container**:
   - VS Code will detect the Dev Container configuration
   - Click "Reopen in Container" when prompted
   - Or use Command Palette: `Remote-Containers: Reopen in Container`

4. **Wait for container setup**:
   - First-time setup will build the container and install dependencies
   - This process may take a few minutes

5. **Start development**:
   ```bash
   npm run dev
   ```

#### Dev Container Features

- **Node.js 20** with TypeScript support
- **PostgreSQL** and **Redis** services included
- **pgAdmin** for database management (http://localhost:5050)
- Pre-installed tools: GitHub CLI, AWS CLI, Docker-in-Docker
- Network security with firewall rules
- Customized terminal with helpful aliases
- VS Code extensions for linting, formatting, and debugging

#### Available Services

| Service     | Port | Description            |
| ----------- | ---- | ---------------------- |
| Application | 3000 | Main application       |
| PostgreSQL  | 5432 | Database               |
| Redis       | 6379 | Cache/Session store    |
| pgAdmin     | 5050 | Database management UI |

#### Security Features

The Dev Container includes security measures based on Claude Code
recommendations:

- Network isolation with whitelist-only access
- Firewall rules for external connections
- Restricted access to approved domains only
- Security validation on container startup

To check firewall status: `check-firewall`

- **Authentication:** Amazon Cognito
- **CI/CD:** GitHub Actions, AWS Amplify Hosting
- **Testing:** Jest, Playwright

## Development Principles

- Infrastructure as Code (IaC) for all cloud resources.
- Automated testing, and deployment pipelines.
- High standard of accessibility (WCAG 2.1 AA level).
- Robust security measures using AWS best practices.
- Clean, maintainable code through linters and formatters.
- Comprehensive testing at all levels (unit, integration, e2e).

## Project Documentation

For more detailed specifications, please refer to the documentation in the
`docs/` directory:

- [Project Details](/docs/project/) - Development principles, project phases
- [Design Specifications](/docs/design/) - Design concepts, frontend technology
- [Feature Specifications](/docs/features/) - Detailed functionality
  specifications
- [Technical Guidelines](/docs/technical/) - Accessibility, security,
  development workflow

## Project Status

Currently in the architecture redesign phase - migrating from a monolithic
WordPress system to a modern, serverless AWS architecture.

## Issue Management

This project follows a structured approach to issue management:

- Standardized issue templates for features, bugs, and general issues
- Comprehensive labeling system for issue categorization
- Prioritized implementation roadmap
- Detailed documentation for issue creation and management

For more information on issue management:

- [Issue Management Guide](/docs/project/issue-management-guide.md) - Complete
  guide for issue management
- [Issue Implementation Steps](/docs/project/issue-implementation-steps.md) -
  Concrete steps for implementing issues
- [Issue Creation Execution Guide](../legacy/project/issue-execution-guide.md) -
  Final steps to execute issue creation
- [Issue Creation Checklist](/docs/project/issue-creation-checklist.md) -
  Verification checklist for issue creation
- [Issue Creation Tutorial](../legacy/project/issue-creation-tutorial.md) -
  Command-line tutorial for issue creation
- [Issue Labels](/docs/project/issue-labels.md) - Standard labeling system
- [Issue Management Workflow](/docs/project/issue-management-workflow.md) -
  Process for managing issues
- [Issue Verification Checklist](/docs/project/issue-verification-checklist.md) -
  Quality checklist for issues
- [Initial Issues](/docs/project/initial-issues.md) - Template issues for
  project components


## 関連ドキュメント

- [ローカル開発環境のセットアップ](01-local-development.md)
- [Docker環境のセットアップ](02-docker-setup.md)
- [初回デプロイメント](03-first-deployment.md)
- [トラブルシューティング](04-troubleshooting.md)
