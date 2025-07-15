/**
 * EventCard Stories
 * Lightning Talk event display card with interactive features
 */

import type { Meta, StoryObj } from '@storybook/react';
import { EventCard } from './EventCard';

const meta: Meta<typeof EventCard> = {
  title: 'Components/EventCard',
  component: EventCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Lightning Talk event display card with interactive features and status indicators.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'featured', 'compact']
    },
    showParticipateButton: {
      control: { type: 'boolean' }
    },
    showParticipantCount: {
      control: { type: 'boolean' }
    },
    showStatus: {
      control: { type: 'boolean' }
    },
    onParticipate: { action: 'participate' },
    onViewDetails: { action: 'view-details' }
  }
};

export default meta;
type Story = StoryObj<typeof EventCard>;

// Sample event data
const sampleEvent = {
  id: 'event-1',
  title: '第10回なんでもライトニングトーク',
  date: '2024-03-15',
  time: '19:00〜21:00',
  location: 'オンライン (Zoom)',
  description:
    '5分間で何でも話せる楽しいライトニングトークイベント！技術、趣味、日常の発見など、どんなテーマでもOK。',
  participantsCount: 15,
  maxParticipants: 30,
  imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
  status: 'upcoming' as const,
  tags: ['技術', 'LT', 'オンライン']
};

// Default story
export const Default: Story = {
  args: {
    event: sampleEvent
  }
};

// Featured variant
export const Featured: Story = {
  args: {
    event: sampleEvent,
    variant: 'featured'
  }
};

// Compact variant
export const Compact: Story = {
  args: {
    event: sampleEvent,
    variant: 'compact'
  }
};

// Ongoing event
export const Ongoing: Story = {
  args: {
    event: {
      ...sampleEvent,
      status: 'ongoing' as const,
      title: '🔴 LIVE: 第10回なんでもライトニングトーク'
    }
  }
};

// Completed event
export const Completed: Story = {
  args: {
    event: {
      ...sampleEvent,
      status: 'completed' as const,
      title: '第9回なんでもライトニングトーク (終了)',
      date: '2024-02-15'
    }
  }
};

// Fully booked event
export const FullyBooked: Story = {
  args: {
    event: {
      ...sampleEvent,
      participantsCount: 30,
      maxParticipants: 30
    }
  }
};

// Without image
export const WithoutImage: Story = {
  args: {
    event: {
      ...sampleEvent,
      imageUrl: undefined
    }
  }
};

// Without description
export const WithoutDescription: Story = {
  args: {
    event: {
      ...sampleEvent,
      description: undefined
    }
  }
};

// Without tags
export const WithoutTags: Story = {
  args: {
    event: {
      ...sampleEvent,
      tags: undefined
    }
  }
};

// Minimal configuration
export const Minimal: Story = {
  args: {
    event: {
      ...sampleEvent,
      imageUrl: undefined,
      description: undefined,
      tags: undefined
    },
    showParticipateButton: false,
    showParticipantCount: false,
    showStatus: false
  }
};

// Interactive states
export const Interactive: Story = {
  args: {
    event: sampleEvent,
    onParticipate: (eventId: string) => {
      console.log(`Participating in event: ${eventId}`);
    },
    onViewDetails: (eventId: string) => {
      console.log(`Viewing details for event: ${eventId}`);
    }
  }
};

// Multiple events showcase
export const MultipleEvents: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        padding: '20px'
      }}
    >
      <EventCard event={sampleEvent} />
      <EventCard
        event={{
          ...sampleEvent,
          id: 'event-2',
          title: '技術書典LT',
          status: 'ongoing' as const,
          participantsCount: 8,
          maxParticipants: 20,
          tags: ['技術書', '執筆', '知識共有']
        }}
      />
      <EventCard
        event={{
          ...sampleEvent,
          id: 'event-3',
          title: '趣味発表会',
          status: 'completed' as const,
          participantsCount: 25,
          maxParticipants: 25,
          tags: ['趣味', '発表', '交流']
        }}
        variant="compact"
      />
    </div>
  )
};

// Different statuses
export const AllStatuses: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        padding: '20px'
      }}
    >
      <EventCard
        event={{
          ...sampleEvent,
          status: 'upcoming' as const,
          title: '開催予定イベント'
        }}
      />
      <EventCard
        event={{
          ...sampleEvent,
          status: 'ongoing' as const,
          title: '開催中イベント'
        }}
      />
      <EventCard
        event={{
          ...sampleEvent,
          status: 'completed' as const,
          title: '終了したイベント'
        }}
      />
    </div>
  )
};

// Responsive showcase
export const Responsive: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  args: {
    event: sampleEvent
  }
};
