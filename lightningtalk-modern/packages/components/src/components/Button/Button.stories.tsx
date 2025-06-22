/**
 * Button Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

// Icons for testing
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12,5 19,12 12,19"></polyline>
  </svg>
);

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Button Component

A versatile button component for Lightning Talk applications with multiple variants, sizes, and states.

## Features
- Multiple visual variants (primary, secondary, outline, ghost, danger)
- Three sizes (sm, md, lg)
- Loading and disabled states
- Start and end icons support
- Full width option
- Accessible with keyboard navigation and screen reader support

## WordPress Integration
This component can be used in WordPress through shortcodes or directly in PHP templates.

\`\`\`php
// PHP: Render button via shortcode
[lt_button variant="primary" size="lg"]Register for Event[/lt_button]
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Show loading spinner',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disable the button',
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: 'Make button full width',
    },
    children: {
      control: { type: 'text' },
      description: 'Button text content',
    },
  },
  args: {
    children: 'Button',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Stories
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete Event',
  },
};

// Size Variants
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="sm" variant="primary">Small</Button>
      <Button size="md" variant="primary">Medium</Button>
      <Button size="lg" variant="primary">Large</Button>
    </div>
  ),
};

// State Variants
export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Registering...',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled Button',
  },
};

// Icon Variants
export const WithStartIcon: Story = {
  args: {
    variant: 'primary',
    startIcon: <PlusIcon />,
    children: 'Add Event',
  },
};

export const WithEndIcon: Story = {
  args: {
    variant: 'outline',
    endIcon: <ArrowRightIcon />,
    children: 'Continue',
  },
};

export const WithBothIcons: Story = {
  args: {
    variant: 'secondary',
    startIcon: <PlusIcon />,
    endIcon: <ArrowRightIcon />,
    children: 'Next Step',
  },
};

// Full Width
export const FullWidth: Story = {
  render: () => (
    <div style={{ width: '300px' }}>
      <Button variant="primary" fullWidth>
        Register for Lightning Talk
      </Button>
    </div>
  ),
};

// Lightning Talk Specific Use Cases
export const LightningTalkExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <Button variant="primary" size="lg" fullWidth startIcon={<PlusIcon />}>
        Register for Event
      </Button>
      
      <Button variant="secondary" fullWidth>
        Submit Your Talk
      </Button>
      
      <Button variant="outline" endIcon={<ArrowRightIcon />}>
        View Event Details
      </Button>
      
      <Button variant="ghost">
        Download Schedule
      </Button>
      
      <Button variant="danger" size="sm">
        Cancel Registration
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common button use cases in Lightning Talk application',
      },
    },
  },
};

// Interactive States
export const InteractiveStates: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
      {(['primary', 'secondary', 'outline', 'ghost', 'danger'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize' }}>
            {variant}
          </h4>
          <Button variant={variant} size="sm">Normal</Button>
          <Button variant={variant} size="sm" loading>Loading</Button>
          <Button variant={variant} size="sm" disabled>Disabled</Button>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants in different states',
      },
    },
  },
};

// Accessibility Testing
export const AccessibilityTest: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Button variant="primary" aria-label="Register for Lightning Talk event on July 15th">
        Register Now
      </Button>
      
      <Button 
        variant="outline" 
        title="This will open the event details in a new tab"
        aria-describedby="button-help"
      >
        View Details
      </Button>
      <p id="button-help" style={{ fontSize: '0.875rem', color: '#6B7280' }}>
        Opens event details in new tab
      </p>
      
      <Button variant="danger" aria-label="Cancel your registration for this event">
        Cancel Registration
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button accessibility examples with proper ARIA labels and descriptions',
      },
    },
  },
};