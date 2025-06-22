# 🚀 Lightning Talk Cocoon Theme - Modern Development

**Modern WordPress child theme with Vite + TypeScript + Storybook + Next.js + Playwright**

## 📊 Project Status

### ✅ Phase 1 Completed (基盤構築)
- [x] Monorepo workspace setup
- [x] TypeScript configuration
- [x] Vite WordPress integration
- [x] Docker development environment
- [x] Storybook component system
- [x] CI/CD pipeline

### 🔄 Next Phase
**Phase 2**: Component Library Development (Week 3-4)

---

## 🏗️ Architecture

### Technology Stack
- **Build Tool**: Vite 5.0 (ES modules, HMR)
- **Language**: TypeScript 5.3 (Full type safety)
- **Components**: React 18 + Storybook 7.6
- **Testing**: Vitest + Playwright + Testing Library
- **WordPress**: Custom child theme with REST API
- **Admin Panel**: Next.js 14 (App Router)
- **Deployment**: Docker + GitHub Actions

### Project Structure
```
lightningtalk-modern/
├── 📦 packages/              # Monorepo packages
│   ├── theme/                # WordPress child theme
│   ├── admin-panel/          # Next.js admin interface  
│   ├── components/           # Storybook UI library
│   └── api/                  # WordPress API extensions
├── 🧪 tests/                 # Test suites
├── 🐳 docker/                # Development environment
├── 🔧 tools/                 # Build tools & configs
└── 📚 docs/                  # Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: 18.0.0+
- **npm**: 9.0.0+
- **Docker**: 24.0.0+
- **Docker Compose**: 2.0.0+

### 1. Development Environment Setup

```bash
# Clone and install
git clone <repository>
cd lightningtalk-modern
npm install

# Start all development services
npm run dev
```

This will start:
- 🌐 **WordPress**: http://localhost:8080
- ⚡ **Vite Dev Server**: http://localhost:3000  
- 📱 **Next.js Admin**: http://localhost:3001
- 📚 **Storybook**: http://localhost:6006
- 🗄️ **phpMyAdmin**: http://localhost:8081
- 📧 **Mailhog**: http://localhost:8025

### 2. WordPress Setup

```bash
# Access WordPress
open http://localhost:8080

# Auto-login (development only)
open http://localhost:8080?auto_login=1

# Default credentials
User: developer
Pass: developer123
```

### 3. Theme Activation

```bash
# Via WordPress CLI
npm run wp:cli theme activate lightningtalk-child

# Or manually via wp-admin
# Appearance → Themes → Lightning Talk Child Theme
```

---

## 💻 Development Workflow

### Component Development
```bash
# Start Storybook
cd packages/components
npm run storybook

# Create new component
mkdir src/components/NewComponent
touch src/components/NewComponent/{index.ts,NewComponent.tsx,NewComponent.stories.tsx,NewComponent.test.tsx}
```

### Theme Development  
```bash
# Theme dev server with HMR
cd packages/theme
npm run dev

# Build for production
npm run build

# Package theme ZIP
npm run package
```

### Admin Panel Development
```bash
# Next.js dev server
cd packages/admin-panel  
npm run dev

# Build for production
npm run build
```

---

## 🧪 Testing Strategy

### Run All Tests
```bash
npm test                    # Unit + Integration + E2E
npm run test:watch         # Watch mode
```

### Individual Test Types
```bash
# Unit Tests (Vitest)
npm run test:unit

# Integration Tests (WordPress API)
npm run test:integration

# E2E Tests (Playwright)
npm run test:e2e

# Visual Tests (Storybook)
npm run test:visual
```

### WordPress Integration Testing
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run WordPress-specific tests
npm run test:integration
```

---

## 📦 Build & Deployment

### Development Build
```bash
npm run build              # Build all packages
npm run theme:package      # Package WordPress theme
```

### Production Deployment
```bash
# Automated via CI/CD
git push origin main

# Manual deployment
npm run theme:deploy
```

### Docker Commands
```bash
npm run wp:up              # Start WordPress
npm run wp:down            # Stop WordPress  
npm run wp:reset           # Reset database
npm run wp:logs            # View logs
```

---

## 🎨 Component Development

### Design System
- **Colors**: Lightning Talk brand palette
- **Typography**: WordPress admin font stack
- **Spacing**: 8px grid system
- **Breakpoints**: Mobile-first responsive

### Storybook Workflow
1. **Design**: Create component in Storybook
2. **Develop**: Implement with TypeScript
3. **Test**: Unit tests with Vitest
4. **Integrate**: Use in WordPress theme
5. **E2E**: Test in full WordPress environment

### WordPress Integration
```php
// PHP: Register React component as shortcode
add_shortcode('lt_event_card', function($atts) {
    return render_react_component('EventCard', $atts);
});
```

```tsx
// TypeScript: Component implementation
export const EventCard: FC<EventCardProps> = ({ event }) => {
  return (
    <div className="event-card">
      <h3>{event.title}</h3>
      <time>{formatDate(event.date)}</time>
    </div>
  );
};
```

---

## 🔧 Configuration

### Environment Variables
```bash
# .env.local
WP_HOME=http://localhost:8080
WP_API_URL=http://localhost:8080/wp-json
STORYBOOK_PORT=6006
NEXT_PUBLIC_API_URL=http://localhost:8080/wp-json
```

### WordPress Configuration
- **Debug Mode**: Enabled in development
- **CORS**: Configured for local development
- **REST API**: Extended with Lightning Talk endpoints
- **Auto-login**: Available for development

### Build Configuration
- **Vite**: Optimized for WordPress
- **TypeScript**: Strict mode enabled
- **CSS**: SCSS with modern features
- **Assets**: Automatic optimization

---

## 📋 Development Guidelines

### Code Standards
- **TypeScript**: Strict mode, no implicit any
- **React**: Functional components, hooks
- **CSS**: SCSS modules, BEM methodology
- **PHP**: WordPress coding standards

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-component
git commit -m "feat: add new component"
git push origin feature/new-component

# Create PR → CI/CD runs → Merge
```

### Testing Requirements
- **Unit Tests**: 90%+ coverage
- **E2E Tests**: Critical user flows
- **Visual Tests**: Component consistency
- **WordPress Tests**: Theme integration

---

## 🔍 Debugging

### Development Tools
- **React DevTools**: Component inspection
- **WordPress Debug**: Error logging enabled
- **Vite DevTools**: Bundle analysis
- **Storybook**: Component isolation

### Common Issues
```bash
# WordPress not starting
docker-compose logs wordpress

# Vite build errors  
npm run type-check

# Test failures
npm run test:watch

# Theme not activating
npm run wp:cli theme list
```

---

## 📚 Documentation

### Available Docs
- [Component Library](./packages/components/README.md)
- [Theme Development](./packages/theme/README.md) 
- [Admin Panel](./packages/admin-panel/README.md)
- [API Documentation](./packages/api/README.md)

### Storybook Documentation
- **Live Docs**: http://localhost:6006
- **Component API**: Auto-generated from TypeScript
- **Design Tokens**: Color, spacing, typography
- **Usage Examples**: Interactive component playground

---

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create feature branch
3. Follow development guidelines
4. Ensure all tests pass
5. Submit pull request

### Pull Request Process
1. **CI/CD**: All checks must pass
2. **Code Review**: At least one approval
3. **Testing**: Manual testing in WordPress
4. **Documentation**: Update relevant docs

---

## 📄 License

GPL v2 or later - compatible with WordPress core

---

## 🔗 Links

- **Live Storybook**: [Coming soon]
- **WordPress Demo**: [Coming soon]
- **CI/CD Pipeline**: GitHub Actions
- **Issue Tracker**: GitHub Issues

---

**🚀 Ready to develop? Run `npm run dev` and start building!**