# Frontend Technology Stack

## Core Platform

### WordPress with Cocoon Theme

- **Base Theme:** Cocoon (popular Japanese WordPress theme)
- **Customization Approach:** Child theme for all custom development
- **Template Structure:** Modular template parts for reusability
- **Custom Hooks:** Utilize Cocoon's hook system for non-invasive customizations

## CSS Architecture

### SASS/SCSS Implementation

- **Methodology:** BEM (Block, Element, Modifier) for class naming
- **Organization:**
  - `abstracts/` - variables, mixins, functions
  - `base/` - reset, typography, utilities
  - `components/` - UI components
  - `layouts/` - layout structures
  - `pages/` - page-specific styles
  - `themes/` - theme variations
- **Variables:** Comprehensive variable system for colors, typography, spacing,
  etc.
- **Responsive:** Mobile-first approach with mixins for breakpoints
- **Build Process:** Compiled via Vite with autoprefixer and minification

## JavaScript Framework

### Vite Development Environment

- **Features:** Fast hot module replacement, optimized build process
- **Configuration:** Custom Vite config for WordPress integration
- **Build Output:** Optimized assets with code-splitting and tree-shaking

### Next.js Integration

- **Implementation Scope:** Applied selectively to elements requiring:
  - SPA-like features
  - Complex UI interactions
  - Real-time functionality
  - Advanced form handling
- **Examples:**
  - Date coordination voting interface
  - Real-time voting results display
  - Rich event management forms
  - Advanced search/filtering in presentation archives

### State Management

- **Library Options:**
  - **Recoil:** For more complex state requirements
  - **Zustand:** For simpler global state needs
  - **Jotai:** For atomic state management
- **Selection Criteria:** Complexity of state, performance considerations,
  developer experience
- **State Persistence:** Local storage integration where appropriate

### Data Integration

- **WordPress REST API:** Primary method for data exchange
  - Custom endpoints for specialized functionality
  - Authentication via JWT for secure operations
- **GraphQL:** Consideration for more complex data requirements (via WPGraphQL
  plugin)
- **Real-time Updates:** WebSockets for live features (voting results,
  notifications)

## UI Component Management

### Storybook Implementation

- **Purpose:**
  - Isolated component development environment
  - Visual documentation of UI components
  - Interactive testing platform
  - Accessibility verification
- **Key Add-ons:**
  - `@storybook/addon-a11y`: Accessibility testing
  - `@storybook/addon-essentials`: Core Storybook features
  - `@storybook/addon-interactions`: Interactive testing
  - `@storybook/addon-docs`: Component documentation
- **Integration with CI/CD:** Automated visual testing via Chromatic

### Component Structure

- **Atomic Design Methodology:**
  - Atoms (buttons, inputs, icons)
  - Molecules (form groups, card headers)
  - Organisms (complete forms, search interfaces)
  - Templates (page layouts)
  - Pages (complete page implementations)
- **Component API Documentation:** Comprehensive documentation of props, state,
  and usage examples

## Performance Optimization

- **Code Splitting:** Dynamic imports for route-based code splitting
- **Asset Optimization:**
  - Image optimization (WebP format, responsive images)
  - Font optimization (subset loading, display swap)
  - SVG optimization and sprite generation
- **Lazy Loading:** Images and non-critical components
- **Bundle Analysis:** Regular review of bundle size
- **Core Web Vitals Focus:**
  - Largest Contentful Paint (LCP) optimization
  - First Input Delay (FID) improvement strategies
  - Cumulative Layout Shift (CLS) prevention

## Accessibility Integration

- **Component-Level A11y:** Each UI component designed with accessibility in
  mind
- **Storybook A11y Testing:** Automated checks during development
- **Keyboard Navigation:** Full keyboard support for all interactive elements
- **Screen Reader Optimization:** Appropriate ARIA attributes and semantic HTML
- **Focus Management:** Clear focus indicators and logical tab order

## Testing Strategy

- **Unit Testing:** Jest for JavaScript functions and utilities
- **Component Testing:** React Testing Library for component behavior
- **Visual Testing:** Chromatic for UI regression testing
- **End-to-End Testing:** Cypress or Playwright for critical user journeys
- **Accessibility Testing:** Automated via Storybook a11y addon, manual
  verification

## Browser Support

- **Modern Browsers:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile Browsers:** iOS Safari, Android Chrome
- **Graceful Degradation:** Core functionality works in older browsers
- **Progressive Enhancement:** Advanced features enhance experience in modern
  browsers

## Development Workflow

- **Local Development:**
  - Hot Module Replacement for rapid iteration
  - WordPress + Vite integration
  - Storybook for component development
- **Code Quality:**
  - ESLint for JavaScript linting
  - Stylelint for CSS/SCSS linting
  - Prettier for code formatting
  - Husky for pre-commit hooks
- **CI/CD Integration:**
  - Automated testing on pull requests
  - Visual regression testing via Chromatic
  - Deployment to staging/production environments
