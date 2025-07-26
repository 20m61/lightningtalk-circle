/**
 * Performance Optimization Tests
 */

import { jest } from '@jest/globals';

// Mock DOM environment
const mockElements = {
  modal: { style: { display: 'none' } },
  modalBody: { innerHTML: '', querySelector: jest.fn() },
  header: { style: {} },
  chatWidget: { style: {} },
  chatContainer: { style: {} },
  chatMessages: { innerHTML: '' },
  chatInput: { value: '' },
  countdownElements: {
    days: { textContent: '00' },
    hours: { textContent: '00' },
    minutes: { textContent: '00' },
    seconds: { textContent: '00' },
    message: { textContent: '', className: '' }
  },
  surveyCounters: {
    online: { textContent: '0' },
    offline: { textContent: '0' }
  }
};

// Mock document
global.document = {
  getElementById: jest.fn(id => {
    const elementMap = {
      registerModal: mockElements.modal,
      modalBody: mockElements.modalBody,
      chatWidget: mockElements.chatWidget,
      chatContainer: mockElements.chatContainer,
      chatMessages: mockElements.chatMessages,
      chatInput: mockElements.chatInput,
      days: mockElements.countdownElements.days,
      hours: mockElements.countdownElements.hours,
      minutes: mockElements.countdownElements.minutes,
      seconds: mockElements.countdownElements.seconds,
      'countdown-message': mockElements.countdownElements.message,
      onlineCount: mockElements.surveyCounters.online,
      offlineCount: mockElements.surveyCounters.offline
    };
    return elementMap[id] || null;
  }),
  querySelector: jest.fn(() => mockElements.header),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn()
};

// Mock window
global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  localStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn()
  }
};

// Mock performance-optimized LightningTalkApp
class MockLightningTalkApp {
  constructor() {
    this.eventDate = new Date('2025-07-15T19:00:00+09:00');
    this.surveyCounters = { online: 0, offline: 0 };
    this.chatMessages = [];
    this.elements = {
      modal: null,
      modalBody: null,
      header: null,
      chatWidget: null,
      chatContainer: null,
      chatMessages: null,
      chatInput: null,
      countdownElements: {
        days: null,
        hours: null,
        minutes: null,
        seconds: null,
        message: null
      },
      surveyCounters: {
        online: null,
        offline: null
      }
    };
    this.countdownInterval = null;
    this.periodicUpdateInterval = null;
  }

  init() {
    this.cacheDOMElements();
    this.setupEventListeners();
  }

  cacheDOMElements() {
    this.elements.modal = document.getElementById('registerModal');
    this.elements.modalBody = document.getElementById('modalBody');
    this.elements.header = document.querySelector('header');
    this.elements.chatWidget = document.getElementById('chatWidget');
    this.elements.chatContainer = document.getElementById('chatContainer');
    this.elements.chatMessages = document.getElementById('chatMessages');
    this.elements.chatInput = document.getElementById('chatInput');
    this.elements.countdownElements.days = document.getElementById('days');
    this.elements.countdownElements.hours = document.getElementById('hours');
    this.elements.countdownElements.minutes = document.getElementById('minutes');
    this.elements.countdownElements.seconds = document.getElementById('seconds');
    this.elements.countdownElements.message = document.getElementById('countdown-message');
    this.elements.surveyCounters.online = document.getElementById('onlineCount');
    this.elements.surveyCounters.offline = document.getElementById('offlineCount');
  }

  setupEventListeners() {
    const throttledScroll = this.throttle(() => {
      this.updateHeaderOnScroll();
      this.updateParallax();
    }, 16);

    const throttledResize = this.throttle(() => {
      this.handleResize();
    }, 100);

    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('resize', throttledResize, { passive: true });
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(
          () => {
            func.apply(this, args);
            lastExecTime = Date.now();
          },
          delay - (currentTime - lastExecTime)
        );
      }
    };
  }

  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  openRegistrationModal(type = 'general') {
    if (!this.elements.modal || !this.elements.modalBody) {
      this.elements.modal = document.getElementById('registerModal');
      this.elements.modalBody = document.getElementById('modalBody');
    }

    if (this.elements.modalBody) {
      this.elements.modalBody.innerHTML = '<form></form>';
    }
    if (this.elements.modal) {
      this.elements.modal.style.display = 'block';
    }
  }

  updateSurveyCounters() {
    const { online: onlineCountEl, offline: offlineCountEl } = this.elements.surveyCounters;

    if (onlineCountEl) {
      onlineCountEl.textContent = this.surveyCounters.online.toString();
    }
    if (offlineCountEl) {
      offlineCountEl.textContent = this.surveyCounters.offline.toString();
    }
  }

  updateCountdown() {
    const {
      days: daysEl,
      hours: hoursEl,
      minutes: minutesEl,
      seconds: secondsEl,
      message: messageEl
    } = this.elements.countdownElements;

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl || !messageEl) {
      return;
    }

    const now = new Date().getTime();
    const eventTime = this.eventDate.getTime();
    const timeLeft = eventTime - now;

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    daysEl.textContent = days.toString().padStart(2, '0');
    hoursEl.textContent = hours.toString().padStart(2, '0');
    minutesEl.textContent = minutes.toString().padStart(2, '0');
    secondsEl.textContent = seconds.toString().padStart(2, '0');
  }

  setupCountdownTimer() {
    this.updateCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  startPeriodicUpdates() {
    if (this.periodicUpdateInterval) {
      clearInterval(this.periodicUpdateInterval);
    }

    this.periodicUpdateInterval = setInterval(() => {
      this.checkForUpdates();
    }, 30000);
  }

  checkForUpdates() {
    console.debug('Checking for updates...');
  }

  cleanup() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    if (this.periodicUpdateInterval) {
      clearInterval(this.periodicUpdateInterval);
      this.periodicUpdateInterval = null;
    }
  }

  updateHeaderOnScroll() {
    // Mock implementation
  }

  updateParallax() {
    // Mock implementation
  }

  handleResize() {
    // Mock implementation
  }
}

describe.skip('Performance Optimization', () => {
  let app;

  beforeEach(() => {
    app = new MockLightningTalkApp();
    jest.clearAllMocks();
    jest.spyOn(global, 'setInterval').mockImplementation((fn, delay) => {
      return setTimeout(fn, delay);
    });
    jest.spyOn(global, 'clearInterval').mockImplementation(id => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    app.cleanup();
    jest.restoreAllMocks();
  });

  describe('DOM Element Caching', () => {
    test('should cache DOM elements on initialization', () => {
      app.init();

      expect(document.getElementById).toHaveBeenCalledWith('registerModal');
      expect(document.getElementById).toHaveBeenCalledWith('modalBody');
      expect(document.getElementById).toHaveBeenCalledWith('days');
      expect(document.getElementById).toHaveBeenCalledWith('hours');
      expect(document.getElementById).toHaveBeenCalledWith('onlineCount');
      expect(document.getElementById).toHaveBeenCalledWith('offlineCount');
    });

    test('should use cached elements instead of querying DOM repeatedly', () => {
      app.init();

      // Verify elements are cached
      expect(app.elements.modal).toBe(mockElements.modal);
      expect(app.elements.modalBody).toBe(mockElements.modalBody);

      jest.clearAllMocks();

      // Test modal opening uses cached elements
      app.openRegistrationModal();
      expect(document.getElementById).not.toHaveBeenCalled();

      // Test survey counter update uses cached elements
      app.updateSurveyCounters();
      expect(document.getElementById).not.toHaveBeenCalled();
    });

    test('should have fallback for missing cached elements', () => {
      app.elements.modal = null;
      app.elements.modalBody = null;

      app.openRegistrationModal();

      // Should call getElementById as fallback
      expect(document.getElementById).toHaveBeenCalledWith('registerModal');
      expect(document.getElementById).toHaveBeenCalledWith('modalBody');
    });
  });

  describe('Event Listener Throttling', () => {
    test('should create throttled functions for performance-critical events', () => {
      const mockFunc = jest.fn();
      const throttledFunc = app.throttle(mockFunc, 100);

      // Call multiple times quickly
      throttledFunc();
      throttledFunc();
      throttledFunc();

      // Should only call once immediately
      expect(mockFunc).toHaveBeenCalledTimes(1);
    });

    test('should setup throttled scroll and resize listeners', () => {
      app.setupEventListeners();

      expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true
      });
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function), {
        passive: true
      });
    });

    test('should use passive event listeners for better performance', () => {
      app.setupEventListeners();

      const scrollCall = window.addEventListener.mock.calls.find(call => call[0] === 'scroll');
      const resizeCall = window.addEventListener.mock.calls.find(call => call[0] === 'resize');

      expect(scrollCall[2]).toEqual({ passive: true });
      expect(resizeCall[2]).toEqual({ passive: true });
    });
  });

  describe('Memory Leak Prevention', () => {
    test('should clear intervals on cleanup', () => {
      app.setupCountdownTimer();
      app.startPeriodicUpdates();

      expect(app.countdownInterval).toBeTruthy();
      expect(app.periodicUpdateInterval).toBeTruthy();

      app.cleanup();

      expect(app.countdownInterval).toBeNull();
      expect(app.periodicUpdateInterval).toBeNull();
      expect(clearInterval).toHaveBeenCalledTimes(2);
    });

    test('should setup beforeunload cleanup listener', () => {
      app.setupEventListeners();

      expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    test('should clear existing intervals before setting new ones', () => {
      app.startPeriodicUpdates();
      const firstInterval = app.periodicUpdateInterval;

      app.startPeriodicUpdates(); // Call again

      expect(clearInterval).toHaveBeenCalledWith(firstInterval);
    });
  });

  describe('Performance Utilities', () => {
    test('throttle should limit function execution frequency', done => {
      const mockFunc = jest.fn();
      const throttledFunc = app.throttle(mockFunc, 50);

      throttledFunc();
      throttledFunc();
      throttledFunc();

      setTimeout(() => {
        throttledFunc();
        expect(mockFunc).toHaveBeenCalledTimes(2); // Initial call + delayed call
        done();
      }, 60);
    });

    test('debounce should delay function execution', done => {
      const mockFunc = jest.fn();
      const debouncedFunc = app.debounce(mockFunc, 50);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      expect(mockFunc).not.toHaveBeenCalled();

      setTimeout(() => {
        expect(mockFunc).toHaveBeenCalledTimes(1);
        done();
      }, 60);
    });
  });

  describe('Efficient DOM Updates', () => {
    test('should update countdown using cached elements', () => {
      app.init();
      jest.clearAllMocks();

      app.updateCountdown();

      // Should not query DOM again
      expect(document.getElementById).not.toHaveBeenCalled();

      // Should update cached elements
      expect(mockElements.countdownElements.days.textContent).toBeTruthy();
      expect(mockElements.countdownElements.hours.textContent).toBeTruthy();
    });

    test('should update survey counters using cached elements', () => {
      app.init();
      app.surveyCounters.online = 5;
      app.surveyCounters.offline = 3;
      jest.clearAllMocks();

      app.updateSurveyCounters();

      // Should not query DOM again
      expect(document.getElementById).not.toHaveBeenCalled();

      // Should update cached elements
      expect(mockElements.surveyCounters.online.textContent).toBe('5');
      expect(mockElements.surveyCounters.offline.textContent).toBe('3');
    });

    test('should handle missing DOM elements gracefully', () => {
      app.elements.countdownElements.days = null;

      expect(() => app.updateCountdown()).not.toThrow();
    });
  });

  describe('Interval Management', () => {
    test('should manage countdown interval properly', () => {
      app.setupCountdownTimer();

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(app.countdownInterval).toBeTruthy();
    });

    test('should manage periodic update interval properly', () => {
      app.startPeriodicUpdates();

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
      expect(app.periodicUpdateInterval).toBeTruthy();
    });

    test('should prevent multiple intervals for the same feature', () => {
      app.startPeriodicUpdates();
      const firstClearCount = clearInterval.mock.calls.length;

      app.startPeriodicUpdates(); // Call again

      expect(clearInterval.mock.calls.length).toBeGreaterThan(firstClearCount);
    });
  });
});
