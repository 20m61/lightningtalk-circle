/**
 * Input Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Input Component

A flexible input component with validation support, perfect for Lightning Talk application forms.

## Features
- Multiple size variants (sm, md, lg)
- Visual variants (default, outlined, filled)
- Built-in validation states and error handling
- Start and end icons support
- Character count display
- Loading states
- Accessibility features
- Form integration ready

## Lightning Talk Use Cases
- Event registration forms
- Speaker submission forms
- User profile editing
- Search inputs
- Comment and feedback forms

## Validation
The Input component supports both controlled and uncontrolled usage patterns and integrates well with form validation libraries.
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the input',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'outlined', 'filled'],
      description: 'Visual style variant',
    },
    label: {
      control: { type: 'text' },
      description: 'Input label text',
    },
    helperText: {
      control: { type: 'text' },
      description: 'Helper text displayed below input',
    },
    error: {
      control: { type: 'text' },
      description: 'Error message (shows error state)',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Whether the input is required',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Whether to show loading state',
    },
    showCharCount: {
      control: { type: 'boolean' },
      description: 'Whether to show character count',
    },
  },
  args: {
    label: 'Event Title',
    placeholder: 'Enter your lightning talk title...',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default Input
export const Default: Story = {
  args: {
    label: 'Event Title',
    placeholder: 'Enter your lightning talk title...',
  },
};

// Size Variants
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Input
        size="sm"
        label="Small Input"
        placeholder="Small size input..."
      />
      <Input
        size="md"
        label="Medium Input"
        placeholder="Medium size input..."
      />
      <Input
        size="lg"
        label="Large Input"
        placeholder="Large size input..."
      />
    </div>
  ),
};

// Visual Variants
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Input
        variant="default"
        label="Default Style"
        placeholder="Default input style..."
      />
      <Input
        variant="outlined"
        label="Outlined Style"
        placeholder="Outlined input style..."
      />
      <Input
        variant="filled"
        label="Filled Style"
        placeholder="Filled input style..."
      />
    </div>
  ),
};

// Input States
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Input
        label="Normal State"
        placeholder="Normal input..."
        value="Sample text"
      />
      <Input
        label="Required Field"
        placeholder="Required input..."
        required
        helperText="This field is required"
      />
      <Input
        label="Error State"
        placeholder="Input with error..."
        error="This field is required"
        value="Invalid input"
      />
      <Input
        label="Disabled State"
        placeholder="Disabled input..."
        disabled
        value="Cannot edit this"
      />
      <Input
        label="Loading State"
        placeholder="Loading..."
        loading
        value="Processing..."
      />
    </div>
  ),
};

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Input
        label="Search Events"
        placeholder="Search lightning talks..."
        startIcon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        }
      />
      <Input
        label="Email Address"
        placeholder="your@email.com"
        type="email"
        endIcon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        }
      />
      <Input
        label="Password"
        placeholder="Enter your password..."
        type="password"
        endIcon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <circle cx="12" cy="16" r="1"></circle>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        }
      />
    </div>
  ),
};

// Character Count
export const WithCharacterCount: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Input
        label="Talk Description"
        placeholder="Describe your lightning talk..."
        showCharCount
        maxLength={100}
        helperText="Keep it concise and engaging"
      />
      <Input
        label="Bio"
        placeholder="Tell us about yourself..."
        showCharCount
        maxLength={200}
        helperText="Brief speaker bio for the event page"
        value="I'm a frontend developer passionate about React and modern web technologies."
      />
    </div>
  ),
};

// Lightning Talk Forms
export const LightningTalkForms: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
      {/* Event Registration Form */}
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Event Registration</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Full Name"
            placeholder="Your full name..."
            required
            startIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            }
          />
          <Input
            label="Email Address"
            placeholder="your@email.com"
            type="email"
            required
            startIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            }
          />
          <Input
            label="Company/Organization"
            placeholder="Optional"
            startIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18"></path>
                <path d="M5 21V7l8-4v18"></path>
                <path d="M19 21V11l-6-4"></path>
              </svg>
            }
          />
        </div>
      </div>

      {/* Talk Submission Form */}
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Talk Submission</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Talk Title"
            placeholder="Your lightning talk title..."
            required
            showCharCount
            maxLength={80}
            helperText="Keep it catchy and descriptive"
          />
          <Input
            label="Topic Category"
            placeholder="e.g., Technology, Design, Innovation..."
            startIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
              </svg>
            }
          />
          <Input
            label="Duration (minutes)"
            placeholder="5"
            type="number"
            helperText="Lightning talks are typically 5 minutes"
            min="3"
            max="7"
          />
        </div>
      </div>

      {/* Event Search */}
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Find Events</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Search Events"
            placeholder="Search by title, topic, or location..."
            startIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            }
          />
          <Input
            label="Location"
            placeholder="City or Online"
            startIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            }
          />
          <Input
            label="Date Range"
            placeholder="Select date range..."
            type="date"
            startIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            }
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world examples of input forms used in Lightning Talk applications',
      },
    },
  },
};

// Validation Examples
export const ValidationExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '400px' }}>
      <Input
        label="Email Validation"
        placeholder="Enter your email..."
        type="email"
        error="Please enter a valid email address"
        value="invalid-email"
      />
      <Input
        label="Required Field"
        placeholder="This field is required..."
        required
        error="This field cannot be empty"
        value=""
      />
      <Input
        label="Character Limit"
        placeholder="Max 50 characters..."
        showCharCount
        maxLength={50}
        error="Text exceeds maximum length"
        value="This text is way too long and exceeds the maximum character limit allowed for this input field"
      />
      <Input
        label="Valid Input"
        placeholder="Correctly formatted input..."
        helperText="This input is valid"
        value="Valid content"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of different validation states and error handling',
      },
    },
  },
};