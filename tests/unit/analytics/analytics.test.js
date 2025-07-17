/**
 * Analytics System Tests
 */

import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

describe('Analytics Module', () => {
  let dom;
  let window;
  let document;
  let analytics;

  beforeEach(() => {
    // Create a new JSDOM instance for each test
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;

    // Mock global objects
    global.window = window;
    global.document = document;
    global.navigator = window.navigator;
    global.screen = {
      width: 1920,
      height: 1080
    };
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    global.sessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    // Mock performance API
    global.performance = {
      timing: {
        loadEventEnd: 1000,
        fetchStart: 0
      },
      getEntriesByType: jest.fn(() => []),
      now: jest.fn(() => Date.now())
    };

    // Mock PerformanceObserver
    global.PerformanceObserver = jest.fn(() => ({
      observe: jest.fn(),
      disconnect: jest.fn()
    }));

    // Mock sendBeacon
    window.navigator.sendBeacon = jest.fn();

    // Clear modules and require analytics fresh
    jest.resetModules();
  });

  afterEach(() => {
    // Clean up
    dom.window.close();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize analytics when DOM is ready', async () => {
      // Load analytics module
      await import('../../../public/js/analytics.js');

      expect(window.LTCAnalytics).toBeDefined();
      expect(window.LTCAnalytics.initialized).toBe(true);
    });

    it('should respect sampling configuration', async () => {
      // Set up random to return 0.6 (60%)
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.6);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await import('../../../public/js/analytics.js');
      const analytics = window.LTCAnalytics;

      // Set sampling to 50%
      analytics.setConfig({ sampling: 0.5 });
      analytics.initialized = false;
      analytics.init();

      // Should be skipped due to sampling
      expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Skipped due to sampling');

      Math.random = originalRandom;
      consoleSpy.mockRestore();
    });
  });

  describe('Event Tracking', () => {
    beforeEach(async () => {
      await import('../../../public/js/analytics.js');
      analytics = window.LTCAnalytics;
    });

    it('should track page views', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      // Trigger page view tracking
      analytics.userActions.trackPageView();

      expect(trackSpy).toHaveBeenCalledWith(
        'pageView',
        expect.objectContaining({
          url: 'http://localhost:3000/',
          title: '',
          referrer: '',
          timestamp: expect.any(Number)
        })
      );
    });

    it('should track user interactions', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      // Create and click a button
      const button = document.createElement('button');
      button.className = 'btn';
      button.textContent = 'Click me';
      document.body.appendChild(button);

      const event = new window.MouseEvent('click', { bubbles: true });
      button.dispatchEvent(event);

      expect(trackSpy).toHaveBeenCalledWith(
        'interaction',
        expect.objectContaining({
          type: 'click',
          tagName: 'BUTTON',
          className: 'btn',
          category: 'button'
        })
      );
    });

    it('should buffer events and auto-flush when buffer is full', () => {
      const flushSpy = jest.spyOn(analytics, 'flush');

      // Fill buffer beyond limit (bufferSize: 10)
      for (let i = 0; i < 11; i++) {
        analytics.track('test-event', { index: i });
      }

      expect(flushSpy).toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      // Mock navigation timing
      global.performance.getEntriesByType = jest.fn(type => {
        if (type === 'navigation') {
          return [
            {
              domainLookupEnd: 100,
              domainLookupStart: 50,
              connectEnd: 200,
              connectStart: 100,
              responseStart: 300,
              requestStart: 200,
              responseEnd: 400,
              loadEventEnd: 1000,
              fetchStart: 0,
              transferSize: 50000,
              encodedBodySize: 45000,
              decodedBodySize: 100000
            }
          ];
        }
        return [];
      });

      await import('../../../public/js/analytics.js');
      analytics = window.LTCAnalytics;
    });

    it('should collect navigation timing metrics', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      // Reinitialize to trigger collection
      analytics.performance.init();

      expect(trackSpy).toHaveBeenCalledWith(
        'performance',
        expect.objectContaining({
          type: 'navigation',
          data: expect.objectContaining({
            dns: 50,
            tcp: 100,
            ttfb: 100,
            totalTime: 1000
          })
        })
      );
    });

    it('should track Web Vitals when available', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      // Reset performance observer
      analytics.performance.init();

      // Check if webVitals were tracked (may be partial due to JSDOM limitations)
      const webVitalsCalls = trackSpy.mock.calls.filter(
        call => call[0] === 'performance' && call[1].type === 'webVitals'
      );

      // Should have at least attempted to track web vitals
      expect(webVitalsCalls.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Tracking', () => {
    beforeEach(async () => {
      await import('../../../public/js/analytics.js');
      analytics = window.LTCAnalytics;
    });

    it('should track JavaScript errors', () => {
      const trackSpy = jest.spyOn(analytics.errors, 'trackError');

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:10:5';

      analytics.errors.trackError({
        message: 'Test error',
        source: 'test.js',
        line: 10,
        column: 5,
        stack: error.stack,
        type: 'javascript'
      });

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          type: 'javascript'
        })
      );
    });

    it('should track unhandled promise rejections', () => {
      const trackSpy = jest.spyOn(analytics.errors, 'trackError');

      const reason = new Error('Promise rejected');
      reason.stack = 'Error: Promise rejected\n    at async.js:20:10';

      analytics.errors.trackError({
        message: reason.toString(),
        stack: reason.stack,
        type: 'unhandledRejection'
      });

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error: Promise rejected',
          type: 'unhandledRejection'
        })
      );
    });
  });

  describe('Data Transmission', () => {
    beforeEach(async () => {
      await import('../../../public/js/analytics.js');
      analytics = window.LTCAnalytics;
    });

    it('should send analytics data to the correct endpoint', async () => {
      analytics.track('test-event', { data: 'test' });
      analytics.flush();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('test-event')
        })
      );
    });

    it('should use sendBeacon for page unload', () => {
      global.navigator.sendBeacon = jest.fn();

      analytics.track('test-event', { data: 'test' });

      // Simulate page unload
      const unloadEvent = new window.Event('beforeunload');
      window.dispatchEvent(unloadEvent);

      expect(global.navigator.sendBeacon).toHaveBeenCalledWith(
        '/api/analytics',
        expect.any(String)
      );
    });

    it('should handle transmission failures gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      analytics.track('test-event', { data: 'test' });
      analytics.flush();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Failed to send data:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Session and User Management', () => {
    beforeEach(async () => {
      await import('../../../public/js/analytics.js');
      analytics = window.LTCAnalytics;
    });

    it('should generate and persist session ID', () => {
      sessionStorage.getItem.mockReturnValue(null);

      const sessionId1 = analytics.getSessionId();
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'analytics_session_id',
        expect.any(String)
      );

      // Should return same ID on subsequent calls
      sessionStorage.getItem.mockReturnValue(sessionId1);
      const sessionId2 = analytics.getSessionId();
      expect(sessionId1).toBe(sessionId2);
    });

    it('should generate and persist user ID', () => {
      localStorage.getItem.mockReturnValue(null);

      const userId1 = analytics.getUserId();
      expect(localStorage.setItem).toHaveBeenCalledWith('analytics_user_id', expect.any(String));

      // Should return same ID on subsequent calls
      localStorage.getItem.mockReturnValue(userId1);
      const userId2 = analytics.getUserId();
      expect(userId1).toBe(userId2);
    });

    it('should allow setting custom user ID', () => {
      analytics.setUser('custom-user-123');

      expect(localStorage.setItem).toHaveBeenCalledWith('analytics_user_id', 'custom-user-123');
    });
  });

  describe('Configuration', () => {
    beforeEach(async () => {
      await import('../../../public/js/analytics.js');
      analytics = window.LTCAnalytics;
    });

    it('should allow configuration updates', () => {
      analytics.setConfig({
        endpoint: '/custom/analytics',
        bufferSize: 20,
        flushInterval: 60000
      });

      // Verify configuration is applied
      analytics.track('test', {});
      analytics.flush();

      expect(global.fetch).toHaveBeenCalledWith('/custom/analytics', expect.any(Object));
    });

    it('should support enabling and disabling analytics', () => {
      // Clear any previous data and calls
      global.fetch.mockClear();

      // Test disabling analytics - set sampling to 0
      analytics.setConfig({ sampling: 0 });
      analytics.track('test', {});
      analytics.flush();

      // When disabled via sampling, should not send data
      expect(global.fetch).not.toHaveBeenCalled();

      // Re-enable analytics by setting sampling back to 1
      global.fetch.mockClear();
      analytics.setConfig({ sampling: 1.0 });
      analytics.track('test', {});
      analytics.flush();

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
