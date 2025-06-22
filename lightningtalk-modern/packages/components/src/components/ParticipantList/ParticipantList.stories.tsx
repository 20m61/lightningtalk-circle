/**
 * ParticipantList Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ParticipantList, type Participant } from './ParticipantList';

// Mock participant data
const mockParticipants: Participant[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    role: 'speaker',
    talkTitle: 'React Performance Tips',
    registrationDate: '2025-06-15T10:00:00Z',
    status: 'checked-in',
    company: 'Tech Corp',
    bio: 'Senior Frontend Developer with 8 years of experience in React and performance optimization.',
  },
  {
    id: 2,
    name: 'Mike Johnson',
    email: 'mike.j@startup.com',
    role: 'speaker',
    talkTitle: 'Building Better APIs',
    registrationDate: '2025-06-16T14:30:00Z',
    status: 'registered',
    company: 'StartupCo',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    email: 'emily.r@design.studio',
    role: 'speaker',
    talkTitle: 'Design Systems in Practice',
    registrationDate: '2025-06-17T09:15:00Z',
    status: 'registered',
    company: 'Design Studio',
  },
  {
    id: 4,
    name: 'David Kim',
    email: 'david@eventorganizers.com',
    role: 'organizer',
    registrationDate: '2025-06-10T08:00:00Z',
    status: 'checked-in',
    company: 'Event Organizers',
  },
  {
    id: 5,
    name: 'Lisa Wang',
    email: 'lisa.wang@freelance.com',
    role: 'attendee',
    registrationDate: '2025-06-18T16:45:00Z',
    status: 'registered',
    company: 'Freelancer',
  },
  {
    id: 6,
    name: 'Alex Thompson',
    email: 'alex.t@bigcorp.com',
    role: 'attendee',
    registrationDate: '2025-06-19T11:20:00Z',
    status: 'checked-in',
    company: 'BigCorp Industries',
  },
  {
    id: 7,
    name: 'Maria Gonzalez',
    email: 'maria.g@university.edu',
    role: 'attendee',
    registrationDate: '2025-06-20T13:10:00Z',
    status: 'registered',
    company: 'University Research',
  },
  {
    id: 8,
    name: 'John Smith',
    email: 'john.s@consulting.com',
    role: 'attendee',
    registrationDate: '2025-06-21T07:30:00Z',
    status: 'no-show',
    company: 'Consulting Group',
  },
  {
    id: 9,
    name: 'Rachel Green',
    email: 'rachel@nonprofit.org',
    role: 'attendee',
    registrationDate: '2025-06-14T12:00:00Z',
    status: 'cancelled',
    company: 'NonProfit Org',
  },
  {
    id: 10,
    name: 'Tom Wilson',
    email: 'tom.w@agency.com',
    role: 'attendee',
    registrationDate: '2025-06-22T15:45:00Z',
    status: 'registered',
    company: 'Creative Agency',
  },
];

const meta: Meta<typeof ParticipantList> = {
  title: 'Lightning Talk/ParticipantList',
  component: ParticipantList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# ParticipantList Component

A specialized component for displaying Lightning Talk event participants with filtering, search, and management capabilities.

## Features
- Multiple display variants (list, grid, compact)
- Search and filtering functionality
- Role-based display with icons
- Status management and check-in functionality
- Interactive participant cards
- Responsive design
- Empty states and loading states

## Participant Roles
- **Speaker**: Users presenting lightning talks
- **Attendee**: Users attending the event
- **Organizer**: Event organizers and moderators

## Status Management
- **Registered**: Signed up for the event
- **Checked In**: Arrived at the event
- **No Show**: Registered but didn't attend
- **Cancelled**: Cancelled their registration

## WordPress Integration
This component can be integrated with WordPress user management and event systems.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['list', 'grid', 'compact'],
      description: 'Display variant',
    },
    showSearch: {
      control: { type: 'boolean' },
      description: 'Whether to show search functionality',
    },
    showRoleFilter: {
      control: { type: 'boolean' },
      description: 'Whether to show role filter',
    },
    showStatusFilter: {
      control: { type: 'boolean' },
      description: 'Whether to show status filter',
    },
    showDetails: {
      control: { type: 'boolean' },
      description: 'Whether to show participant details',
    },
    showCheckIn: {
      control: { type: 'boolean' },
      description: 'Whether to show check-in functionality',
    },
  },
  args: {
    participants: mockParticipants,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default Participant List
export const Default: Story = {
  args: {
    participants: mockParticipants,
  },
};

// Display Variants
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>List View</h3>
        <ParticipantList
          participants={mockParticipants.slice(0, 5)}
          variant="list"
        />
      </div>
      
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Grid View</h3>
        <ParticipantList
          participants={mockParticipants.slice(0, 6)}
          variant="grid"
        />
      </div>
      
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Compact View</h3>
        <ParticipantList
          participants={mockParticipants.slice(0, 4)}
          variant="compact"
          showDetails={false}
        />
      </div>
    </div>
  ),
};

// With Search and Filters
export const WithFilters: Story = {
  args: {
    participants: mockParticipants,
    showSearch: true,
    showRoleFilter: true,
    showStatusFilter: true,
  },
};

// Speakers Only
export const SpeakersOnly: Story = {
  args: {
    participants: mockParticipants.filter(p => p.role === 'speaker'),
    showSearch: false,
    showRoleFilter: false,
    variant: 'grid',
  },
  parameters: {
    docs: {
      description: {
        story: 'Display only speakers for a dedicated speakers section',
      },
    },
  },
};

// Event Check-in Interface
export const EventCheckIn: Story = {
  args: {
    participants: mockParticipants,
    showCheckIn: true,
    showStatusFilter: true,
    variant: 'list',
    onCheckIn: (participantId) => {
      console.log('Check in participant:', participantId);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interface for event organizers to check in participants',
      },
    },
  },
};

// Limited Display with Show More
export const LimitedDisplay: Story = {
  args: {
    participants: mockParticipants,
    maxDisplay: 5,
    variant: 'list',
  },
  parameters: {
    docs: {
      description: {
        story: 'Display limited number of participants with option to show more',
      },
    },
  },
};

// Interactive Participants
export const Interactive: Story = {
  args: {
    participants: mockParticipants,
    onParticipantClick: (participant) => {
      alert(`Clicked on ${participant.name}${participant.talkTitle ? ` - "${participant.talkTitle}"` : ''}`);
    },
    onCheckIn: (participantId) => {
      console.log('Check in:', participantId);
    },
    onRemoveParticipant: (participantId) => {
      console.log('Remove participant:', participantId);
    },
    showCheckIn: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive participant list with click handlers and management actions',
      },
    },
  },
};

// Real-world Layouts
export const RealWorldLayouts: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
      {/* Event Dashboard - Speakers */}
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Featured Speakers</h3>
        <ParticipantList
          participants={mockParticipants.filter(p => p.role === 'speaker')}
          variant="grid"
          showSearch={false}
          showRoleFilter={false}
          showDetails={true}
          onParticipantClick={(participant) => console.log('View speaker:', participant.name)}
        />
      </div>
      
      {/* Sidebar - Recent Registrations */}
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Recent Registrations</h3>
        <ParticipantList
          participants={mockParticipants.slice(0, 5)}
          variant="compact"
          showSearch={false}
          showRoleFilter={false}
          showDetails={false}
          maxDisplay={5}
        />
      </div>
      
      {/* Admin Interface - Full Management */}
      <div style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Event Management</h3>
        <ParticipantList
          participants={mockParticipants}
          variant="list"
          showSearch={true}
          showRoleFilter={true}
          showStatusFilter={true}
          showCheckIn={true}
          onParticipantClick={(participant) => console.log('Edit participant:', participant.name)}
          onCheckIn={(id) => console.log('Check in:', id)}
          onRemoveParticipant={(id) => console.log('Remove:', id)}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world layout examples for different use cases in Lightning Talk applications',
      },
    },
  },
};

// Empty States
export const EmptyStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>No Participants</h3>
        <ParticipantList
          participants={[]}
          emptyMessage="No participants have registered for this event yet."
        />
      </div>
      
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>No Speakers</h3>
        <ParticipantList
          participants={mockParticipants.filter(p => p.role === 'nonexistent')}
          emptyMessage="No speakers have been confirmed for this event."
          showRoleFilter={false}
        />
      </div>
      
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Loading State</h3>
        <ParticipantList
          participants={[]}
          loading={true}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different empty states and loading conditions',
      },
    },
  },
};

// Status Management
export const StatusManagement: Story = {
  render: () => {
    const statusGroups = [
      { status: 'registered', participants: mockParticipants.filter(p => p.status === 'registered') },
      { status: 'checked-in', participants: mockParticipants.filter(p => p.status === 'checked-in') },
      { status: 'no-show', participants: mockParticipants.filter(p => p.status === 'no-show') },
      { status: 'cancelled', participants: mockParticipants.filter(p => p.status === 'cancelled') },
    ];
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {statusGroups.map(({ status, participants }) => (
          <div key={status}>
            <h3 style={{ 
              marginBottom: '1rem', 
              fontSize: '1.125rem', 
              fontWeight: 600,
              textTransform: 'capitalize'
            }}>
              {status.replace('-', ' ')} ({participants.length})
            </h3>
            <ParticipantList
              participants={participants}
              variant="compact"
              showSearch={false}
              showRoleFilter={false}
              showStatusFilter={false}
              showCheckIn={status === 'registered'}
              onCheckIn={(id) => console.log('Check in participant:', id)}
            />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Participants grouped by status for event management',
      },
    },
  },
};