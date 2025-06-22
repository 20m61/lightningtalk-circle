/**
 * Card Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';
import { Button } from '../Button';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Card Component

A flexible card container component for displaying structured content in Lightning Talk applications.

## Features
- Multiple visual variants (default, outlined, elevated, ghost)
- Configurable padding sizes
- Interactive states with hover effects
- Selection state support
- Composable with CardHeader, CardContent, and CardFooter
- Keyboard navigation support for interactive cards

## Subcomponents
- \`CardHeader\`: For titles, subtitles, and action buttons
- \`CardContent\`: For main card content
- \`CardFooter\`: For footer actions and metadata

## WordPress Integration
Cards can be used to display events, talks, and participant information in WordPress templates.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'outlined', 'elevated', 'ghost'],
      description: 'Visual style variant',
    },
    padding: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Internal padding size',
    },
    interactive: {
      control: { type: 'boolean' },
      description: 'Whether the card is clickable',
    },
    selected: {
      control: { type: 'boolean' },
      description: 'Whether the card is selected/active',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Card
export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: 600 }}>
          Lightning Talk Event
        </h3>
        <p style={{ margin: 0, color: '#6B7280' }}>
          Join us for an evening of 5-minute presentations on topics that inspire and educate.
        </p>
      </div>
    ),
  },
};

// Card Variants
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
      <Card variant="default">
        <h4 style={{ margin: '0 0 8px 0' }}>Default Card</h4>
        <p style={{ margin: 0, color: '#6B7280' }}>Standard card with subtle shadow</p>
      </Card>
      
      <Card variant="outlined">
        <h4 style={{ margin: '0 0 8px 0' }}>Outlined Card</h4>
        <p style={{ margin: 0, color: '#6B7280' }}>Card with visible border</p>
      </Card>
      
      <Card variant="elevated">
        <h4 style={{ margin: '0 0 8px 0' }}>Elevated Card</h4>
        <p style={{ margin: 0, color: '#6B7280' }}>Card with prominent shadow</p>
      </Card>
      
      <Card variant="ghost">
        <h4 style={{ margin: '0 0 8px 0' }}>Ghost Card</h4>
        <p style={{ margin: 0, color: '#6B7280' }}>Transparent card background</p>
      </Card>
    </div>
  ),
};

// Interactive Card
export const Interactive: Story = {
  args: {
    interactive: true,
    children: (
      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: 600 }}>
          Click Me!
        </h3>
        <p style={{ margin: 0, color: '#6B7280' }}>
          This card is interactive. Try clicking it or navigating with keyboard.
        </p>
      </div>
    ),
    onClick: () => alert('Card clicked!'),
  },
};

// Selected State
export const Selected: Story = {
  args: {
    selected: true,
    children: (
      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: 600 }}>
          Selected Card
        </h3>
        <p style={{ margin: 0, color: '#6B7280' }}>
          This card is in selected state with highlighted border.
        </p>
      </div>
    ),
  },
};

// Padding Variants
export const PaddingVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      <Card padding="none" variant="outlined">
        <div style={{ padding: '8px', backgroundColor: '#F3F4F6' }}>
          <strong>No Padding</strong>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>padding="none"</p>
        </div>
      </Card>
      
      <Card padding="sm" variant="outlined">
        <strong>Small Padding</strong>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>padding="sm"</p>
      </Card>
      
      <Card padding="md" variant="outlined">
        <strong>Medium Padding</strong>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>padding="md"</p>
      </Card>
      
      <Card padding="lg" variant="outlined">
        <strong>Large Padding</strong>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>padding="lg"</p>
      </Card>
    </div>
  ),
};

// Card with Subcomponents
export const WithSubcomponents: Story = {
  render: () => (
    <Card style={{ maxWidth: '400px' }}>
      <CardHeader
        title="Lightning Talk Night #42"
        subtitle="July 15, 2025 • 7:00 PM"
        action={
          <Button variant="ghost" size="sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </Button>
        }
      />
      
      <CardContent>
        <p style={{ margin: '0 0 16px 0', color: '#374151' }}>
          Join us for an evening of inspiring 5-minute presentations. Topics range from technology 
          and design to personal experiences and creative projects.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: '#6B7280' }}>
          <span>📍 Tech Hub Tokyo</span>
          <span>👥 23/50 registered</span>
          <span>🎤 8 talks scheduled</span>
        </div>
      </CardContent>
      
      <CardFooter>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="primary" size="sm" style={{ flex: 1 }}>
            Register Now
          </Button>
          <Button variant="outline" size="sm">
            Learn More
          </Button>
        </div>
      </CardFooter>
    </Card>
  ),
};

// Lightning Talk Use Cases
export const LightningTalkExamples: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
      {/* Event Card */}
      <Card variant="elevated" interactive>
        <CardHeader
          title="React Performance Tips"
          subtitle="By Sarah Chen • 5 min"
        />
        <CardContent>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#6B7280' }}>
            Learn how to optimize your React applications for better performance and user experience.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ 
              padding: '2px 8px', 
              backgroundColor: '#FEF3F2', 
              color: '#B91C1C', 
              fontSize: '0.75rem', 
              borderRadius: '12px' 
            }}>
              Frontend
            </span>
            <span style={{ 
              padding: '2px 8px', 
              backgroundColor: '#F0FDF4', 
              color: '#166534', 
              fontSize: '0.75rem', 
              borderRadius: '12px' 
            }}>
              React
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Participant Card */}
      <Card variant="outlined">
        <CardHeader
          title="John Developer"
          subtitle="Speaker • Registered"
          action={
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '20px', 
              backgroundColor: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              👨‍💻
            </div>
          }
        />
        <CardContent>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem' }}>
            <strong>Talk:</strong> "Building Better APIs"
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>
            Full-stack developer with 8 years experience in API design and microservices.
          </p>
        </CardContent>
      </Card>
      
      {/* Event Summary Card */}
      <Card variant="default">
        <CardHeader title="Event Statistics" />
        <CardContent>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#FF6B35' }}>42</div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Participants</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#4ECDC4' }}>12</div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Talks</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10B981' }}>5</div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Categories</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F59E0B' }}>60</div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Minutes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world examples of how cards are used in Lightning Talk application',
      },
    },
  },
};