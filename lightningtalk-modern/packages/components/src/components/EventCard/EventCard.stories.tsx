/**
 * EventCard Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { EventCard, type Event } from './EventCard';

// Mock event data
const mockEvents: Event[] = [
  {
    id: 1,
    title: 'Lightning Talk Night #42',
    description: 'Join us for an evening of inspiring 5-minute presentations covering technology, design, and creative projects.',
    date: '2025-07-15T19:00:00Z',
    venue: 'Tech Hub Tokyo',
    venueAddress: '東京都渋谷区神宮前1-1-1',
    capacity: 50,
    participantCount: 23,
    status: 'open',
    online: false,
    organizer: 'Lightning Talk Team',
    tags: ['tech', 'presentation', 'networking', 'innovation'],
  },
  {
    id: 2,
    title: 'Online Lightning Talks',
    description: 'Remote-friendly Lightning Talk session with global speakers.',
    date: '2025-07-22T20:00:00Z',
    venue: 'Online Event',
    capacity: 100,
    participantCount: 67,
    status: 'open',
    online: true,
    onlineUrl: 'https://meet.google.com/abc-defg-hij',
    organizer: 'Remote Community',
    tags: ['online', 'remote', 'global'],
  },
  {
    id: 3,
    title: 'Design System Lightning Talks',
    description: 'Quick presentations about design systems, UX, and frontend development.',
    date: '2025-06-10T18:30:00Z',
    venue: 'Design Studio',
    capacity: 30,
    participantCount: 30,
    status: 'full',
    online: false,
    organizer: 'Design Community',
    tags: ['design', 'ux', 'frontend'],
  },
  {
    id: 4,
    title: 'Startup Pitch Night',
    description: 'Entrepreneurs pitch their startup ideas in lightning format.',
    date: '2025-06-01T19:00:00Z',
    venue: 'Startup Hub',
    capacity: 40,
    participantCount: 35,
    status: 'closed',
    online: false,
    organizer: 'Startup Community',
    tags: ['startup', 'pitch', 'entrepreneurship'],
  },
  {
    id: 5,
    title: 'Cancelled Event Example',
    description: 'This event has been cancelled due to unforeseen circumstances.',
    date: '2025-08-01T19:00:00Z',
    venue: 'Event Center',
    capacity: 60,
    participantCount: 15,
    status: 'cancelled',
    online: false,
    organizer: 'Event Team',
    tags: ['cancelled'],
  },
];

const meta: Meta<typeof EventCard> = {
  title: 'Lightning Talk/EventCard',
  component: EventCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# EventCard Component

A specialized card component for displaying Lightning Talk events with rich information and interactive features.

## Features
- Event status indicators (open, full, cancelled, etc.)
- Participant count with capacity
- Date formatting with relative time
- Venue information (physical or online)
- Tag display for categorization
- Registration and action buttons
- Responsive sizing (compact, default, featured)
- Interactive states

## Event Status
- **Open**: Registration available
- **Full**: Maximum capacity reached
- **Cancelled**: Event cancelled
- **Closed**: Registration closed
- **Draft**: Not yet published

## WordPress Integration
This component integrates with WordPress custom post types and can be rendered via shortcodes:

\`\`\`php
[lt_event_card id="123" size="featured" show_registration="true"]
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['compact', 'default', 'featured'],
      description: 'Size variant of the card',
    },
    showRegistration: {
      control: { type: 'boolean' },
      description: 'Whether to show registration button',
    },
    interactive: {
      control: { type: 'boolean' },
      description: 'Whether the card is clickable',
    },
  },
  args: {
    event: mockEvents[0],
    showRegistration: true,
    interactive: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default Event Card
export const Default: Story = {
  args: {
    event: mockEvents[0],
  },
};

// Size Variants
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Compact Size</h3>
        <EventCard size="compact" event={mockEvents[0]} />
      </div>
      
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Default Size</h3>
        <EventCard size="default" event={mockEvents[0]} />
      </div>
      
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Featured Size</h3>
        <EventCard size="featured" event={mockEvents[0]} />
      </div>
    </div>
  ),
};

// Event Status Examples
export const EventStatuses: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
      <EventCard event={mockEvents[0]} /> {/* Open */}
      <EventCard event={mockEvents[2]} /> {/* Full */}
      <EventCard event={mockEvents[3]} /> {/* Closed/Past */}
      <EventCard event={mockEvents[4]} /> {/* Cancelled */}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different event statuses: Open, Full, Closed/Past, and Cancelled',
      },
    },
  },
};

// Online vs Physical Events
export const OnlineVsPhysical: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
      <EventCard event={mockEvents[0]} /> {/* Physical event */}
      <EventCard event={mockEvents[1]} /> {/* Online event */}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison between physical venue events and online events',
      },
    },
  },
};

// Interactive Card
export const Interactive: Story = {
  args: {
    event: mockEvents[0],
    interactive: true,
    onClick: (event) => alert(`Clicked on event: ${event.title}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive card that responds to clicks. Try clicking the card area.',
      },
    },
  },
};

// Without Registration
export const WithoutRegistration: Story = {
  args: {
    event: mockEvents[0],
    showRegistration: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Event card without registration buttons, useful for display-only contexts',
      },
    },
  },
};

// Event Handlers Example
export const WithEventHandlers: Story = {
  args: {
    event: mockEvents[0],
    onRegister: (eventId) => alert(`Register for event ${eventId}`),
    onViewDetails: (eventId) => alert(`View details for event ${eventId}`),
    onClick: (event) => alert(`Card clicked: ${event.title}`),
    interactive: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Event card with all event handlers attached. Try clicking different areas.',
      },
    },
  },
};

// Real-world Layout Example
export const EventGrid: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
      {mockEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          interactive
          onRegister={(id) => console.log('Register for event:', id)}
          onViewDetails={(id) => console.log('View details for event:', id)}
          onClick={(event) => console.log('Card clicked:', event.title)}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Grid layout showing multiple events with different statuses, typical for an events listing page',
      },
    },
  },
};

// Compact List Layout
export const CompactList: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
      {mockEvents.slice(0, 3).map((event) => (
        <EventCard
          key={event.id}
          event={event}
          size="compact"
          interactive
          onRegister={(id) => console.log('Register for event:', id)}
          onViewDetails={(id) => console.log('View details for event:', id)}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact layout suitable for sidebars or dense listings',
      },
    },
  },
};