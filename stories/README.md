# Lightning Talk Storybook Components

This directory contains Storybook stories for the Lightning Talk event management system components.

## Available Components

### 🔘 Button (`LightningTalkButton.stories.js`)
Interactive button component with multiple variants:
- **Primary**: Default gradient button
- **Secondary**: Neutral gray button  
- **Disabled**: Non-interactive state
- **Survey**: Special survey counter buttons
- **Small/Large**: Size variations

### 🎭 Modal (`Modal.stories.js`)
Modal dialogs for registration forms and information:
- **General Registration**: Basic event signup
- **Listener Registration**: Audience-only participation
- **Speaker Registration**: With talk submission fields
- **Walk-in Info**: Information modal for spontaneous speakers

### 🏷️ Topic Item (`TopicItem.stories.js`)
Interactive category tags for Lightning Talk topics:
- 12 predefined categories (Tech, Hobby, Learning, etc.)
- Hover effects and selection states
- Grid layout example

### 📅 Event Card (`EventCard.stories.js`)
Event information display component:
- Event details and timing
- Venue information (physical and online)
- Registration buttons
- Survey counters for participation tracking

### 🎨 Design System (`DesignSystem.stories.js`)
Complete design system documentation:
- **Colors**: Primary gradients, accent colors, neutrals
- **Typography**: Heading hierarchy, body text, button text
- **Spacing**: Containers, padding, grid systems
- **Effects**: Shadows, transitions, animations
- **Iconography**: Core icons and category symbols

## Running Storybook

```bash
npm run storybook
```

This will start the Storybook development server at http://localhost:6006

## Usage in Development

These components can be used as reference for:
1. Design consistency across the application
2. Component behavior documentation
3. Visual regression testing
4. Design handoff to developers
5. Accessibility testing

## Integration with Main Application

The styles and components documented here match the implementation in:
- `/public/css/style.css` - Main stylesheet
- `/public/js/main.js` - JavaScript functionality
- `/public/index.html` - HTML structure

## Design System Features

- **Responsive design** with mobile-first approach
- **Accessibility** considerations for all interactive elements
- **Consistent spacing** using grid systems
- **Brand colors** with Lightning Talk theme
- **Interactive states** for all components
- **Smooth animations** and transitions