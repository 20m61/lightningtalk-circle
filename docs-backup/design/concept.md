# Design Concept

## Design Philosophy

The Lightning Talk Circle website design aims to create a clean, modern, and
professional digital experience that reflects the innovative and communal nature
of the circle. The design emphasizes clarity, accessibility, and ease of
navigation to ensure that all users can easily find and engage with content.

## Color Palette

### Primary Colors

- **Main Color:** Emerald Green (`#2ECC71` or `#00BFA5`)
  - Represents growth, knowledge sharing, and vitality
  - Used for primary buttons, key UI elements, and accents

- **Secondary Color:** Teal (`#1ABC9C`)
  - Complementary to the main color
  - Used for secondary elements, hover states, and subtle accents

### Neutral Colors

- **Background:** Light Gray (`#F8F9FA`)
  - Creates a clean canvas for content
  - Ensures good contrast with text and UI elements

- **Text:** Dark Gray (`#34495E`)
  - Primary text color
  - Provides excellent readability against light backgrounds

- **Secondary Text:** Medium Gray (`#7F8C8D`)
  - Used for less prominent text elements
  - Captions, timestamps, and supplementary information

- **Borders/Dividers:** Light Gray (`#ECF0F1`)
  - Subtle visual separators
  - Provides structure without being distracting

### Accent Colors (for UI States)

- **Success:** Green (`#27AE60`)
- **Warning:** Amber (`#F39C12`)
- **Error:** Red (`#E74C3C`)
- **Info:** Blue (`#3498DB`)

## Typography

### Font Families

- **Primary Font:** Noto Sans JP
  - Modern sans-serif font with excellent Japanese character support
  - Used for most text content and UI elements

- **Secondary Fonts:**
  - Yu Gothic (Japanese support)
  - Inter (Latin characters)
  - Lato (Headings and emphasis)

### Typography Scale

- **Headings:**
  - H1: 2.5rem (40px), weight: 700
  - H2: 2rem (32px), weight: 700
  - H3: 1.75rem (28px), weight: 600
  - H4: 1.5rem (24px), weight: 600
  - H5: 1.25rem (20px), weight: 600
  - H6: 1rem (16px), weight: 600

- **Body Text:**
  - Regular: 1rem (16px), weight: 400
  - Small: 0.875rem (14px), weight: 400
  - Extra Small: 0.75rem (12px), weight: 400

- **Line Heights:**
  - Headings: 1.2
  - Body text: 1.5
  - Small text: 1.4

## UI Elements

### Buttons

- **Primary Buttons:**
  - Background: Main Color (`#2ECC71`)
  - Text: White (`#FFFFFF`)
  - Border: None
  - Border-radius: 4px
  - Padding: 12px 24px
  - Hover: Darken by 10%

- **Secondary Buttons:**
  - Background: Transparent
  - Text: Main Color (`#2ECC71`)
  - Border: 1px solid Main Color
  - Border-radius: 4px
  - Padding: 12px 24px
  - Hover: Light background tint of main color

- **Tertiary/Text Buttons:**
  - Background: None
  - Text: Main Color (`#2ECC71`)
  - Border: None
  - Padding: 8px 16px
  - Hover: Underline

### Cards

- Background: White (`#FFFFFF`)
- Border: None
- Border-radius: 8px
- Box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1)
- Padding: 24px
- Margin: 16px 0

### Forms

- **Input Fields:**
  - Background: White (`#FFFFFF`)
  - Border: 1px solid Border Color (`#ECF0F1`)
  - Border-radius: 4px
  - Padding: 12px 16px
  - Focus: 2px solid Main Color, no box-shadow

- **Checkboxes and Radio Buttons:**
  - Custom styling with Main Color for selected states
  - Animation for state changes

- **Error States:**
  - Red border (`#E74C3C`)
  - Error text in red below the field
  - Error icon where appropriate

## Layout Principles

- **Grid System:** 12-column responsive grid
- **Spacing Scale:** Based on 8px increments (8px, 16px, 24px, 32px, 48px, 64px,
  etc.)
- **Content Width:** Maximum width of 1200px for main content areas
- **Responsive Breakpoints:**
  - Mobile: 0-767px
  - Tablet: 768px-1023px
  - Desktop: 1024px+

## Visual Style

- **Flat Design:** Clean and minimal with subtle depth
- **Rounded Corners:** Consistent border-radius values (4px for small elements,
  8px for cards/larger elements)
- **Iconography:** Consistent icon set (Material Icons or similar)
- **Imagery:**
  - High-quality photographs where appropriate
  - Illustrations for abstract concepts or empty states
  - Consistent treatment (e.g., consistent cropping, color treatment)

## Animation and Transitions

- **Transition Duration:** 0.2s-0.3s for most UI transitions
- **Easing:** Ease-out for most transitions
- **Motion Guidelines:** Subtle and purposeful, not distracting
- **Hover Effects:** Subtle scale or elevation changes

## Responsive Design

- **Mobile-First Approach:** Design for mobile experience first, then enhance
  for larger screens
- **Adaptive Layouts:** Different layout approaches for different screen sizes
  where appropriate
- **Touch Targets:** Minimum size of 44px × 44px for touch interactions on
  mobile
- **Text Sizes:** Adjust typography scale for different screen sizes

## Design System Implementation

- **Component Library:** All UI components documented in Storybook
- **Design Tokens:** Color, typography, spacing, and other design values managed
  as tokens
- **Style Guide:** Living documentation of design patterns and usage guidelines
