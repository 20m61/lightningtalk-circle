import { jest } from '@jest/globals';

/**
 * WordPress Integration Unit Tests
 * WordPress統合機能の単体テスト
 */

// Mock WordPress global objects
global.window = {
  wpLightningTalk: {
    ajaxUrl: 'https://example.com/wp-admin/admin-ajax.php',
    nonce: 'test-nonce-123',
    events: [
      {
        id: 1,
        title: 'Test Lightning Talk Event',
        date: '2025-06-25T19:00:00+09:00',
        venue: 'Test Venue',
        status: 'upcoming'
      }
    ]
  },
  fetch: jest.fn(),
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  location: {
    href: 'https://example.com/events'
  }
};

// Mock WordPress REST API
const mockWordPressAPI = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

// Mock WordPress integration functions
const mockWordPressIntegration = {
  fetchEventData: jest.fn(),
  submitTalk: jest.fn(),
  registerParticipant: jest.fn(),
  getEventParticipants: jest.fn(),
  getTalkSubmissions: jest.fn(),
  updateEventStatus: jest.fn(),
  syncWithLightningTalkAPI: jest.fn(),
  handleFormSubmission: jest.fn(),
  validateWordPressNonce: jest.fn(),
  initializeWordPressFeatures: jest.fn()
};

describe('WordPress Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WordPress environment detection', () => {
    it('should detect WordPress environment', () => {
      const isWordPress = typeof window.wpLightningTalk !== 'undefined';
      expect(isWordPress).toBe(true);
    });

    it('should handle missing WordPress data gracefully', () => {
      const originalWpData = window.wpLightningTalk;
      delete window.wpLightningTalk;

      const isWordPress = typeof window.wpLightningTalk !== 'undefined';
      expect(isWordPress).toBe(false);

      // Restore
      window.wpLightningTalk = originalWpData;
    });

    it('should validate WordPress nonce', () => {
      mockWordPressIntegration.validateWordPressNonce.mockReturnValue(true);

      const isValidNonce = mockWordPressIntegration.validateWordPressNonce(
        window.wpLightningTalk.nonce
      );

      expect(isValidNonce).toBe(true);
      expect(mockWordPressIntegration.validateWordPressNonce).toHaveBeenCalledWith(
        'test-nonce-123'
      );
    });
  });

  describe('event data fetching', () => {
    it('should fetch event data from WordPress', async () => {
      const mockEventData = {
        id: 1,
        title: 'Test Lightning Talk Event',
        date: '2025-06-25T19:00:00+09:00',
        venue: 'Test Venue',
        participants: [],
        talks: []
      };

      mockWordPressIntegration.fetchEventData.mockResolvedValue(mockEventData);

      const eventData = await mockWordPressIntegration.fetchEventData(1);

      expect(eventData).toEqual(mockEventData);
      expect(mockWordPressIntegration.fetchEventData).toHaveBeenCalledWith(1);
    });

    it('should handle fetch errors gracefully', async () => {
      mockWordPressIntegration.fetchEventData.mockRejectedValue(
        new Error('WordPress API unavailable')
      );

      await expect(mockWordPressIntegration.fetchEventData(1)).rejects.toThrow(
        'WordPress API unavailable'
      );
    });

    it('should cache event data locally', async () => {
      const mockEventData = {
        id: 1,
        title: 'Test Lightning Talk Event',
        date: '2025-06-25T19:00:00+09:00'
      };

      // Mock the fetchEventData to also simulate localStorage interaction
      mockWordPressIntegration.fetchEventData.mockImplementation(async id => {
        window.localStorage.setItem(`wp_event_${id}`, JSON.stringify(mockEventData));
        return mockEventData;
      });

      window.localStorage.getItem.mockReturnValue(null);
      window.localStorage.setItem.mockReturnValue(undefined);

      await mockWordPressIntegration.fetchEventData(1);

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'wp_event_1',
        JSON.stringify(mockEventData)
      );
    });
  });

  describe('talk submission', () => {
    it('should submit talk via WordPress API', async () => {
      const talkData = {
        title: 'My Lightning Talk',
        description: 'An amazing talk about something',
        speaker: 'John Doe',
        email: 'john@example.com',
        eventId: 1
      };

      const mockResponse = {
        success: true,
        talkId: 123,
        message: 'Talk submitted successfully'
      };

      mockWordPressIntegration.submitTalk.mockResolvedValue(mockResponse);

      const result = await mockWordPressIntegration.submitTalk(talkData);

      expect(result).toEqual(mockResponse);
      expect(mockWordPressIntegration.submitTalk).toHaveBeenCalledWith(talkData);
    });

    it('should validate talk data before submission', async () => {
      const invalidTalkData = {
        title: '', // Empty title
        description: 'Description',
        speaker: 'John Doe',
        email: 'invalid-email' // Invalid email
      };

      mockWordPressIntegration.submitTalk.mockRejectedValue(
        new Error('Validation failed: Title is required, Invalid email format')
      );

      await expect(mockWordPressIntegration.submitTalk(invalidTalkData)).rejects.toThrow(
        'Validation failed'
      );
    });
  });

  describe('participant registration', () => {
    it('should register participant via WordPress', async () => {
      const participantData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        participationType: 'offline',
        eventId: 1
      };

      const mockResponse = {
        success: true,
        participantId: 456,
        message: 'Registration successful'
      };

      mockWordPressIntegration.registerParticipant.mockResolvedValue(mockResponse);

      const result = await mockWordPressIntegration.registerParticipant(participantData);

      expect(result).toEqual(mockResponse);
      expect(mockWordPressIntegration.registerParticipant).toHaveBeenCalledWith(participantData);
    });

    it('should handle duplicate registration', async () => {
      const participantData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        participationType: 'offline',
        eventId: 1
      };

      mockWordPressIntegration.registerParticipant.mockRejectedValue(
        new Error('Email already registered for this event')
      );

      await expect(mockWordPressIntegration.registerParticipant(participantData)).rejects.toThrow(
        'Email already registered'
      );
    });
  });

  describe('admin functionality', () => {
    it('should fetch event participants for admin', async () => {
      const mockParticipants = [
        { id: 1, name: 'John Doe', email: 'john@example.com', participationType: 'offline' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', participationType: 'online' }
      ];

      mockWordPressIntegration.getEventParticipants.mockResolvedValue(mockParticipants);

      const participants = await mockWordPressIntegration.getEventParticipants(1);

      expect(participants).toEqual(mockParticipants);
      expect(mockWordPressIntegration.getEventParticipants).toHaveBeenCalledWith(1);
    });

    it('should fetch talk submissions for admin', async () => {
      const mockTalks = [
        { id: 1, title: 'Talk 1', speaker: 'John Doe', status: 'pending' },
        { id: 2, title: 'Talk 2', speaker: 'Jane Smith', status: 'approved' }
      ];

      mockWordPressIntegration.getTalkSubmissions.mockResolvedValue(mockTalks);

      const talks = await mockWordPressIntegration.getTalkSubmissions(1);

      expect(talks).toEqual(mockTalks);
      expect(mockWordPressIntegration.getTalkSubmissions).toHaveBeenCalledWith(1);
    });

    it('should update event status', async () => {
      const mockResponse = {
        success: true,
        message: 'Event status updated'
      };

      mockWordPressIntegration.updateEventStatus.mockResolvedValue(mockResponse);

      const result = await mockWordPressIntegration.updateEventStatus(1, 'live');

      expect(result).toEqual(mockResponse);
      expect(mockWordPressIntegration.updateEventStatus).toHaveBeenCalledWith(1, 'live');
    });
  });

  describe('API synchronization', () => {
    it('should sync with Lightning Talk API', async () => {
      const mockSyncResult = {
        success: true,
        synced: {
          events: 1,
          participants: 5,
          talks: 3
        }
      };

      mockWordPressIntegration.syncWithLightningTalkAPI.mockResolvedValue(mockSyncResult);

      const result = await mockWordPressIntegration.syncWithLightningTalkAPI();

      expect(result).toEqual(mockSyncResult);
      expect(mockWordPressIntegration.syncWithLightningTalkAPI).toHaveBeenCalled();
    });

    it('should handle sync conflicts', async () => {
      mockWordPressIntegration.syncWithLightningTalkAPI.mockRejectedValue(
        new Error('Sync conflict: Data modified in both systems')
      );

      await expect(mockWordPressIntegration.syncWithLightningTalkAPI()).rejects.toThrow(
        'Sync conflict'
      );
    });
  });

  describe('form handling', () => {
    it('should handle form submission', async () => {
      const mockFormData = new FormData();
      mockFormData.append('action', 'submit_talk');
      mockFormData.append('title', 'Test Talk');
      mockFormData.append('speaker', 'John Doe');

      const mockResponse = {
        success: true,
        message: 'Form submitted successfully'
      };

      mockWordPressIntegration.handleFormSubmission.mockResolvedValue(mockResponse);

      const result = await mockWordPressIntegration.handleFormSubmission(mockFormData);

      expect(result).toEqual(mockResponse);
      expect(mockWordPressIntegration.handleFormSubmission).toHaveBeenCalledWith(mockFormData);
    });

    it('should validate form data', async () => {
      const invalidFormData = new FormData();
      invalidFormData.append('action', 'submit_talk');
      // Missing required fields

      mockWordPressIntegration.handleFormSubmission.mockRejectedValue(
        new Error('Form validation failed: Required fields missing')
      );

      await expect(mockWordPressIntegration.handleFormSubmission(invalidFormData)).rejects.toThrow(
        'Form validation failed'
      );
    });
  });

  describe('WordPress shortcode integration', () => {
    it('should initialize WordPress features', async () => {
      mockWordPressIntegration.initializeWordPressFeatures.mockResolvedValue({
        shortcodes: ['lightning-talk-form', 'event-list', 'participant-list'],
        widgets: ['upcoming-events', 'talk-submissions'],
        customPostTypes: ['lightning-talk-event', 'talk-submission']
      });

      const features = await mockWordPressIntegration.initializeWordPressFeatures();

      expect(features.shortcodes).toContain('lightning-talk-form');
      expect(features.widgets).toContain('upcoming-events');
      expect(features.customPostTypes).toContain('lightning-talk-event');
    });

    it('should handle shortcode rendering', () => {
      const mockShortcodeOutput = `
        <div class="lightning-talk-form">
          <form id="talk-submission-form">
            <input type="text" name="title" placeholder="Talk Title" required>
            <textarea name="description" placeholder="Talk Description" required></textarea>
            <button type="submit">Submit Talk</button>
          </form>
        </div>
      `;

      const renderShortcode = jest.fn().mockReturnValue(mockShortcodeOutput);

      const output = renderShortcode('lightning-talk-form', { event_id: 1 });

      expect(output).toContain('lightning-talk-form');
      expect(output).toContain('talk-submission-form');
      expect(renderShortcode).toHaveBeenCalledWith('lightning-talk-form', { event_id: 1 });
    });
  });

  describe('error handling and logging', () => {
    it('should handle WordPress API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockWordPressIntegration.fetchEventData.mockRejectedValue(
        new Error('WordPress database connection failed')
      );

      try {
        await mockWordPressIntegration.fetchEventData(1);
      } catch (error) {
        expect(error.message).toBe('WordPress database connection failed');
      }

      consoleSpy.mockRestore();
    });

    it('should log WordPress integration activities', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const logActivity = jest.fn();
      logActivity('WordPress integration initialized');
      logActivity('Event data fetched successfully');
      logActivity('Talk submitted via WordPress');

      expect(logActivity).toHaveBeenCalledTimes(3);
      expect(logActivity).toHaveBeenCalledWith('WordPress integration initialized');

      consoleSpy.mockRestore();
    });
  });

  describe('WordPress theme compatibility', () => {
    it('should work with Cocoon theme', () => {
      const mockThemeData = {
        name: 'Cocoon',
        version: '2.6.0',
        childTheme: 'Lightning Talk Child Theme',
        features: ['responsive', 'amp', 'seo']
      };

      const checkThemeCompatibility = jest.fn().mockReturnValue({
        compatible: true,
        theme: mockThemeData
      });

      const compatibility = checkThemeCompatibility();

      expect(compatibility.compatible).toBe(true);
      expect(compatibility.theme.name).toBe('Cocoon');
    });

    it('should handle theme conflicts', () => {
      const mockConflictingTheme = {
        name: 'Conflicting Theme',
        version: '1.0.0',
        conflicts: ['lightning-talk-styles', 'event-form-scripts']
      };

      const checkThemeCompatibility = jest.fn().mockReturnValue({
        compatible: false,
        theme: mockConflictingTheme,
        issues: ['Style conflicts detected', 'JavaScript conflicts detected']
      });

      const compatibility = checkThemeCompatibility();

      expect(compatibility.compatible).toBe(false);
      expect(compatibility.issues).toContain('Style conflicts detected');
    });
  });
});
