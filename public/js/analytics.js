/**
 * Lightning Talk Circle - Analytics & Monitoring Module
 * パフォーマンス指標の収集と分析
 */

(function() {
  'use strict';

  // Analytics configuration
  const config = {
    endpoint: '/api/analytics',
    bufferSize: 10,
    flushInterval: 30000, // 30 seconds
    enableRUM: true,
    enableErrorTracking: true,
    enablePerformance: true,
    enableUserActions: true,
    sampling: 1.0 // 100% sampling
  };

  // Analytics data buffer
  const buffer = {
    events: [],
    metrics: [],
    errors: []
  };

  // Performance metrics collector
  class PerformanceCollector {
    constructor() {
      this.metrics = {};
      this.observer = null;
    }

    init() {
      if (!config.enablePerformance) {
        return;
      }

      // Navigation Timing API
      if ('performance' in window && 'getEntriesByType' in performance) {
        this.collectNavigationTiming();
        this.collectResourceTiming();
        this.observePerformance();
      }

      // Core Web Vitals
      this.collectWebVitals();
    }

    collectNavigationTiming() {
      // Defensive check for performance API availability
      if (!performance || !performance.getEntriesByType) {
        console.warn('[Analytics] Navigation timing API not available');
        return;
      }

      const navigation = performance.getEntriesByType('navigation')[0];
      if (!navigation) {
        return;
      }

      const metrics = {
        // Page Load Metrics
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domParsing: navigation.domInteractive - navigation.domLoading,
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        domComplete: navigation.domComplete - navigation.domLoading,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,

        // Total time
        totalTime: navigation.loadEventEnd - navigation.fetchStart,

        // Transfer sizes
        transferSize: navigation.transferSize || 0,
        encodedBodySize: navigation.encodedBodySize || 0,
        decodedBodySize: navigation.decodedBodySize || 0
      };

      this.reportMetrics('navigation', metrics);
    }

    collectResourceTiming() {
      const resources = performance.getEntriesByType('resource');

      // Group resources by type
      const resourcesByType = {};
      resources.forEach(resource => {
        const type = this.getResourceType(resource.name);
        if (!resourcesByType[type]) {
          resourcesByType[type] = {
            count: 0,
            totalDuration: 0,
            totalSize: 0,
            items: []
          };
        }

        resourcesByType[type].count++;
        resourcesByType[type].totalDuration += resource.duration;
        resourcesByType[type].totalSize += resource.transferSize || 0;

        // Track slow resources
        if (resource.duration > 1000) {
          resourcesByType[type].items.push({
            name: resource.name,
            duration: Math.round(resource.duration),
            size: resource.transferSize || 0
          });
        }
      });

      this.reportMetrics('resources', resourcesByType);
    }

    getResourceType(url) {
      if (/\.(js|mjs)(\?|$)/i.test(url)) {
        return 'script';
      }
      if (/\.(css)(\?|$)/i.test(url)) {
        return 'style';
      }
      if (/\.(jpg|jpeg|png|gif|webp|svg|ico)(\?|$)/i.test(url)) {
        return 'image';
      }
      if (/\.(woff|woff2|ttf|otf|eot)(\?|$)/i.test(url)) {
        return 'font';
      }
      if (/\.(json)(\?|$)/i.test(url)) {
        return 'json';
      }
      return 'other';
    }

    observePerformance() {
      if (!('PerformanceObserver' in window)) {
        return;
      }

      // Observe long tasks
      try {
        const longTaskObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              this.reportMetrics('longTask', {
                duration: Math.round(entry.duration),
                startTime: Math.round(entry.startTime),
                name: entry.name
              });
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task observer not supported
      }

      // Observe layout shifts
      try {
        const layoutShiftObserver = new PerformanceObserver(list => {
          let cls = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
          if (cls > 0) {
            this.reportMetrics('layoutShift', { cls: cls.toFixed(3) });
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // Layout shift observer not supported
      }
    }

    collectWebVitals() {
      // Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.reportMetrics('webVitals', {
            lcp: Math.round(lastEntry.renderTime || lastEntry.loadTime)
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP observer not supported
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver(list => {
          const firstInput = list.getEntries()[0];
          this.reportMetrics('webVitals', {
            fid: Math.round(firstInput.processingStart - firstInput.startTime)
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID observer not supported
      }

      // Cumulative Layout Shift (CLS) - handled in observePerformance
    }

    reportMetrics(type, data) {
      analytics.track('performance', {
        type,
        data,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    }
  }

  // Error tracking
  class ErrorTracker {
    init() {
      if (!config.enableErrorTracking) {
        return;
      }

      // Global error handler
      window.addEventListener('error', event => {
        this.trackError({
          message: event.message,
          source: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error ? event.error.stack : '',
          type: 'javascript'
        });
      });

      // Promise rejection handler
      window.addEventListener('unhandledrejection', event => {
        this.trackError({
          message: event.reason.toString(),
          stack: event.reason.stack || '',
          type: 'unhandledRejection'
        });
      });

      // Resource loading errors
      window.addEventListener(
        'error',
        event => {
          if (event.target !== window) {
            this.trackError({
              message: `Failed to load resource: ${event.target.src || event.target.href}`,
              type: 'resource',
              tagName: event.target.tagName
            });
          }
        },
        true
      );
    }

    trackError(error) {
      const errorData = {
        ...error,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        // Add context
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        screen: {
          width: screen.width,
          height: screen.height
        }
      };

      buffer.errors.push(errorData);

      // Immediate report for critical errors
      if (error.type === 'javascript' || buffer.errors.length >= 5) {
        analytics.flush();
      }
    }
  }

  // User action tracking
  class UserActionTracker {
    constructor() {
      this.lastInteraction = Date.now();
      this.sessionStart = Date.now();
      this.pageViews = 0;
      this.interactions = 0;
    }

    init() {
      if (!config.enableUserActions) {
        return;
      }

      // Track page views
      this.trackPageView();

      // Track clicks
      document.addEventListener('click', event => {
        const { target } = event;
        const data = {
          type: 'click',
          tagName: target.tagName,
          className: target.className,
          id: target.id,
          text: target.textContent?.substring(0, 50),
          href: target.href,
          timestamp: Date.now()
        };

        // Special tracking for specific elements
        if (target.matches('button, .btn')) {
          data.category = 'button';
        } else if (target.matches('a')) {
          data.category = 'link';
        } else if (target.matches('input, select, textarea')) {
          data.category = 'form';
        }

        this.track('interaction', data);
      });

      // Track form submissions
      document.addEventListener('submit', event => {
        const form = event.target;
        this.track('formSubmit', {
          formId: form.id,
          formName: form.name,
          action: form.action,
          method: form.method
        });
      });

      // Track scroll depth
      let maxScrollDepth = 0;
      let scrollTimer;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          const scrollDepth = Math.round(
            ((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100
          );
          if (scrollDepth > maxScrollDepth) {
            maxScrollDepth = scrollDepth;
            this.track('scrollDepth', { depth: maxScrollDepth });
          }
        }, 100);
      });

      // Track session time
      setInterval(() => {
        this.track('sessionTime', {
          duration: Date.now() - this.sessionStart,
          pageViews: this.pageViews,
          interactions: this.interactions
        });
      }, 60000); // Every minute

      // Track page visibility
      document.addEventListener('visibilitychange', () => {
        this.track('visibility', {
          state: document.visibilityState,
          hiddenDuration: document.hidden ? 0 : Date.now() - this.lastInteraction
        });
        if (!document.hidden) {
          this.lastInteraction = Date.now();
        }
      });
    }

    trackPageView() {
      this.pageViews++;
      const data = {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        timestamp: Date.now(),
        loadTime:
          performance.timing?.loadEventEnd && performance.timing?.fetchStart
            ? performance.timing.loadEventEnd - performance.timing.fetchStart
            : 0,
        // Page metadata
        meta: {
          description: document.querySelector('meta[name="description"]')?.content,
          keywords: document.querySelector('meta[name="keywords"]')?.content
        }
      };

      this.track('pageView', data);
    }

    track(eventType, data) {
      this.interactions++;
      analytics.track(eventType, data);
    }
  }

  // Main Analytics class
  class Analytics {
    constructor() {
      this.performance = new PerformanceCollector();
      this.errors = new ErrorTracker();
      this.userActions = new UserActionTracker();
      this.flushTimer = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) {
        return;
      }
      this.initialized = true;

      // Check sampling
      if (Math.random() > config.sampling) {
        console.log('[Analytics] Skipped due to sampling');
        return;
      }

      // Initialize collectors
      this.performance.init();
      this.errors.init();
      this.userActions.init();

      // Set up automatic flushing
      this.flushTimer = setInterval(() => {
        this.flush();
      }, config.flushInterval);

      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });

      // Flush on visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.flush();
        }
      });

      console.log('[Analytics] Initialized');
    }

    track(eventType, data) {
      if (!this.initialized) {
        return;
      }

      const event = {
        type: eventType,
        data,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
        userId: this.getUserId()
      };

      buffer.events.push(event);

      // Auto flush if buffer is full
      if (buffer.events.length >= config.bufferSize) {
        this.flush();
      }
    }

    flush(immediate = false) {
      // Check if analytics is disabled via sampling
      if (config.sampling === 0) {
        return;
      }

      const hasData =
        buffer.events.length > 0 || buffer.metrics.length > 0 || buffer.errors.length > 0;

      if (!hasData) {
        return;
      }

      const payload = {
        events: [...buffer.events],
        metrics: [...buffer.metrics],
        errors: [...buffer.errors],
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          sessionId: this.getSessionId(),
          userId: this.getUserId()
        }
      };

      // Clear buffer
      buffer.events = [];
      buffer.metrics = [];
      buffer.errors = [];

      // Send data
      if (immediate && 'sendBeacon' in navigator) {
        // Use sendBeacon for reliable delivery on page unload
        navigator.sendBeacon(config.endpoint, JSON.stringify(payload));
      } else {
        // Regular fetch
        fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }).catch(error => {
          console.error('[Analytics] Failed to send data:', error);
          // Re-add data to buffer for retry
          buffer.events.push(...payload.events);
          buffer.metrics.push(...payload.metrics);
          buffer.errors.push(...payload.errors);
        });
      }
    }

    getSessionId() {
      let sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = this.generateId();
        sessionStorage.setItem('analytics_session_id', sessionId);
      }
      return sessionId;
    }

    getUserId() {
      let userId = localStorage.getItem('analytics_user_id');
      if (!userId) {
        userId = this.generateId();
        localStorage.setItem('analytics_user_id', userId);
      }
      return userId;
    }

    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Public API
    setUser(userId) {
      if (userId) {
        localStorage.setItem('analytics_user_id', userId);
      }
    }

    setConfig(newConfig) {
      Object.assign(config, newConfig);
    }

    enable() {
      config.sampling = 1.0;
      this.init();
    }

    disable() {
      config.sampling = 0;
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }
    }
  }

  // Create and expose global instance
  const analytics = new Analytics();

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => analytics.init());
  } else {
    analytics.init();
  }

  // Expose to global scope
  window.LTCAnalytics = analytics;
})();
