/**
 * Modal Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal, ConfirmModal } from './Modal';
import { Button } from '../Button';
import { Input } from '../Input';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Modal Component

An accessible modal dialog component with focus management, keyboard navigation, and portal rendering.

## Features
- Accessible with ARIA attributes
- Focus management and keyboard navigation
- Portal rendering for proper z-index handling
- Backdrop click and escape key handling
- Multiple size variants
- Customizable appearance
- Body scroll prevention
- Confirmation modal variant

## Lightning Talk Use Cases
- Event registration forms
- Talk submission dialogs
- Confirmation dialogs
- Event details display
- User profile editing
- Image galleries
- Terms and conditions

## Accessibility
- Focus trapping within modal
- Keyboard navigation support
- Screen reader compatibility
- ARIA labels and roles
- Return focus to trigger element
        `,
      },
    },
  },
  argTypes: {
    open: {
      control: { type: 'boolean' },
      description: 'Whether the modal is open',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Size of the modal',
    },
    title: {
      control: { type: 'text' },
      description: 'Modal title',
    },
    showCloseButton: {
      control: { type: 'boolean' },
      description: 'Whether to show close button',
    },
    closeOnBackdropClick: {
      control: { type: 'boolean' },
      description: 'Whether clicking backdrop closes modal',
    },
    closeOnEscape: {
      control: { type: 'boolean' },
      description: 'Whether pressing Escape closes modal',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive Modal Hook
const useModal = (initialOpen = false) => {
  const [open, setOpen] = useState(initialOpen);
  
  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);
  
  return { open, openModal, closeModal };
};

// Basic Modal
export const Default: Story = {
  render: () => {
    const { open, openModal, closeModal } = useModal();
    
    return (
      <>
        <Button onClick={openModal}>Open Modal</Button>
        <Modal
          open={open}
          onClose={closeModal}
          title="Lightning Talk Registration"
        >
          <p>Welcome to Lightning Talk Night! Please fill out the registration form to secure your spot.</p>
          <p>This event features 5-minute presentations on various topics. Whether you're sharing knowledge, showcasing a project, or telling a story, we'd love to hear from you!</p>
        </Modal>
      </>
    );
  },
};

// Size Variants
export const Sizes: Story = {
  render: () => {
    const small = useModal();
    const medium = useModal();
    const large = useModal();
    const extraLarge = useModal();
    const fullscreen = useModal();
    
    return (
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button onClick={small.openModal}>Small</Button>
        <Button onClick={medium.openModal}>Medium</Button>
        <Button onClick={large.openModal}>Large</Button>
        <Button onClick={extraLarge.openModal}>Extra Large</Button>
        <Button onClick={fullscreen.openModal}>Fullscreen</Button>
        
        <Modal open={small.open} onClose={small.closeModal} title="Small Modal" size="sm">
          <p>This is a small modal, perfect for quick confirmations or simple forms.</p>
        </Modal>
        
        <Modal open={medium.open} onClose={medium.closeModal} title="Medium Modal" size="md">
          <p>This is a medium modal, suitable for most dialog content and forms.</p>
          <p>It provides a good balance between space and screen real estate.</p>
        </Modal>
        
        <Modal open={large.open} onClose={large.closeModal} title="Large Modal" size="lg">
          <p>This is a large modal, ideal for detailed forms or rich content.</p>
          <p>It provides more space for complex layouts and multiple sections.</p>
          <p>Perfect for event details, speaker profiles, or registration forms.</p>
        </Modal>
        
        <Modal open={extraLarge.open} onClose={extraLarge.closeModal} title="Extra Large Modal" size="xl">
          <p>This is an extra large modal, suitable for dashboard-like interfaces.</p>
          <p>It provides maximum space while maintaining modal behavior.</p>
          <p>Ideal for data tables, analytics views, or complex multi-step processes.</p>
          <p>Use this size when you need to display substantial amounts of content.</p>
        </Modal>
        
        <Modal open={fullscreen.open} onClose={fullscreen.closeModal} title="Fullscreen Modal" size="full">
          <p>This is a fullscreen modal, taking up nearly the entire viewport.</p>
          <p>Perfect for immersive experiences, detailed forms, or when maximum space is needed.</p>
          <p>Commonly used for editing interfaces, media viewers, or complex workflows.</p>
          <p>The modal still maintains margins to avoid true fullscreen overlap.</p>
        </Modal>
      </div>
    );
  },
};

// Modal with Form
export const WithForm: Story = {
  render: () => {
    const { open, openModal, closeModal } = useModal();
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      talkTitle: '',
      description: '',
    });
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Form submitted:', formData);
      closeModal();
    };
    
    return (
      <>
        <Button onClick={openModal}>Submit a Talk</Button>
        <Modal
          open={open}
          onClose={closeModal}
          title="Submit Your Lightning Talk"
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" form="talk-form">
                Submit Talk
              </Button>
            </>
          }
        >
          <form id="talk-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Your Name"
              placeholder="Full name..."
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Talk Title"
              placeholder="Your lightning talk title..."
              required
              showCharCount
              maxLength={80}
              value={formData.talkTitle}
              onChange={(e) => setFormData({ ...formData, talkTitle: e.target.value })}
            />
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Talk Description
              </label>
              <textarea
                placeholder="Brief description of your talk..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      </>
    );
  },
};

// Confirmation Modal
export const ConfirmationModal: Story = {
  render: () => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [showDanger, setShowDanger] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const handleConfirm = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setShowConfirm(false);
        setShowDanger(false);
      }, 2000);
    };
    
    return (
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button onClick={() => setShowConfirm(true)}>Show Confirmation</Button>
        <Button variant="danger" onClick={() => setShowDanger(true)}>Delete Event</Button>
        
        <ConfirmModal
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
          title="Register for Event"
          message="Are you sure you want to register for this Lightning Talk event? You'll receive a confirmation email."
          confirmText="Register"
          loading={loading}
        />
        
        <ConfirmModal
          open={showDanger}
          onClose={() => setShowDanger(false)}
          onConfirm={handleConfirm}
          title="Delete Event"
          message="Are you sure you want to delete this event? This action cannot be undone and all registrations will be lost."
          confirmText="Delete"
          cancelText="Keep Event"
          variant="danger"
          loading={loading}
        />
      </div>
    );
  },
};

// Lightning Talk Specific Modals
export const LightningTalkModals: Story = {
  render: () => {
    const eventDetails = useModal();
    const speakerProfile = useModal();
    const eventRegistration = useModal();
    
    return (
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button onClick={eventDetails.openModal}>Event Details</Button>
        <Button onClick={speakerProfile.openModal}>Speaker Profile</Button>
        <Button onClick={eventRegistration.openModal}>Quick Registration</Button>
        
        {/* Event Details Modal */}
        <Modal
          open={eventDetails.open}
          onClose={eventDetails.closeModal}
          title="Lightning Talk Night #42"
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={eventDetails.closeModal}>
                Close
              </Button>
              <Button variant="primary">
                Register Now
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>Event Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <strong>Date:</strong> July 15, 2025
                </div>
                <div>
                  <strong>Time:</strong> 7:00 PM - 9:00 PM
                </div>
                <div>
                  <strong>Venue:</strong> Tech Hub Tokyo
                </div>
                <div>
                  <strong>Capacity:</strong> 50 people
                </div>
              </div>
            </div>
            
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>Description</h4>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                Join us for an evening of inspiring 5-minute presentations covering technology, design, and creative projects. 
                This is a fantastic opportunity to share knowledge, network with like-minded individuals, and discover new ideas.
              </p>
            </div>
            
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>Featured Speakers</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    👩‍💻
                  </div>
                  <span><strong>Sarah Chen</strong> - "React Performance Tips"</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    👨‍🎨
                  </div>
                  <span><strong>Mike Design</strong> - "Design Systems in Practice"</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
        
        {/* Speaker Profile Modal */}
        <Modal
          open={speakerProfile.open}
          onClose={speakerProfile.closeModal}
          title="Speaker Profile"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '40px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                👩‍💻
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 600 }}>Sarah Chen</h3>
                <p style={{ margin: '0 0 0.5rem 0', color: '#6B7280' }}>Senior Frontend Developer</p>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ padding: '2px 8px', backgroundColor: '#EFF6FF', color: '#1D4ED8', borderRadius: '12px' }}>React</span>
                  <span style={{ padding: '2px 8px', backgroundColor: '#F0FDF4', color: '#166534', borderRadius: '12px' }}>Performance</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>About</h4>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                Sarah is a Senior Frontend Developer with over 8 years of experience building scalable web applications. 
                She specializes in React performance optimization and has spoken at numerous conferences worldwide.
              </p>
            </div>
            
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>Talk: "React Performance Tips"</h4>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                Learn practical techniques to optimize your React applications for better performance and user experience. 
                This talk covers memoization, code splitting, and profiling strategies.
              </p>
            </div>
          </div>
        </Modal>
        
        {/* Quick Registration Modal */}
        <Modal
          open={eventRegistration.open}
          onClose={eventRegistration.closeModal}
          title="Quick Registration"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={eventRegistration.closeModal}>
                Cancel
              </Button>
              <Button variant="primary">
                Register
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, textAlign: 'center' }}>
              <strong>Lightning Talk Night #42</strong><br />
              July 15, 2025 • 7:00 PM
            </p>
            <Input
              label="Full Name"
              placeholder="Your name..."
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              required
            />
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280', textAlign: 'center' }}>
              You'll receive a confirmation email with event details.
            </p>
          </div>
        </Modal>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Lightning Talk specific modal examples for events, speakers, and registration',
      },
    },
  },
};

// Accessibility Features
export const AccessibilityFeatures: Story = {
  render: () => {
    const { open, openModal, closeModal } = useModal();
    
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          <h3>Accessibility Features Demo</h3>
          <p>This modal demonstrates accessibility features:</p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>Focus management (focus traps within modal)</li>
            <li>Keyboard navigation (Tab/Shift+Tab)</li>
            <li>Escape key to close</li>
            <li>Click outside to close</li>
            <li>ARIA attributes for screen readers</li>
            <li>Return focus to trigger element</li>
          </ul>
          <Button onClick={openModal}>Open Accessible Modal</Button>
        </div>
        
        <Modal
          open={open}
          onClose={closeModal}
          title="Accessibility Demo"
          footer={
            <>
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button variant="primary" onClick={closeModal}>
                Save Changes
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p>Try using keyboard navigation:</p>
            <ul>
              <li>Press Tab to move between focusable elements</li>
              <li>Press Shift+Tab to move backward</li>
              <li>Press Escape to close the modal</li>
              <li>Click outside the modal to close it</li>
            </ul>
            <Input label="First Input" placeholder="Tab to next input..." />
            <Input label="Second Input" placeholder="Continue tabbing..." />
            <Input label="Third Input" placeholder="Focus will loop back to first button" />
          </div>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of accessibility features including focus management and keyboard navigation',
      },
    },
  },
};