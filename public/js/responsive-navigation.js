/**
 * Responsive Navigation Controller
 * マルチデバイス対応ナビゲーション制御
 */

class ResponsiveNavigation {
  constructor() {
    this.elements = {
      header: document.querySelector('.header'),
      menuToggle: document.querySelector('.mobile-menu-toggle'),
      mobileMenu: document.querySelector('.mobile-menu'),
      mobileMenuOverlay: document.querySelector('.mobile-menu-overlay'),
      body: document.body,
      navLinks: document.querySelectorAll('.mobile-menu__link')
    };

    this.breakpoints = {
      mobile: 375,
      tablet: 768,
      desktop: 1024,
      desktopLarge: 1440
    };

    this.state = {
      isMenuOpen: false,
      isScrolled: false,
      currentBreakpoint: this.getCurrentBreakpoint(),
      scrollPosition: 0
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.handleScroll();
    this.handleResize();
    this.setupAccessibility();
    this.setupTouchHandling();
  }

  bindEvents() {
    // Mobile menu toggle
    if (this.elements.menuToggle) {
      this.elements.menuToggle.addEventListener('click', e => {
        e.preventDefault();
        this.toggleMobileMenu();
      });
    }

    // Overlay click to close
    if (this.elements.mobileMenuOverlay) {
      this.elements.mobileMenuOverlay.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    }

    // Close menu when clicking nav links
    this.elements.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    });

    // Scroll handling with throttling
    let scrollTimeout;
    window.addEventListener(
      'scroll',
      () => {
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
          this.handleScroll();
        }, 16); // ~60fps
      },
      { passive: true }
    );

    // Resize handling with debouncing
    let resizeTimeout;
    window.addEventListener('resize', () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });

    // Keyboard navigation
    document.addEventListener('keydown', e => {
      this.handleKeyboard(e);
    });

    // Handle orientation change (mobile devices)
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleResize();
        if (this.state.isMenuOpen) {
          this.closeMobileMenu();
        }
      }, 100);
    });
  }

  toggleMobileMenu() {
    if (this.state.isMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  openMobileMenu() {
    if (this.state.isMenuOpen) {return;}

    this.state.isMenuOpen = true;

    // Add classes
    this.elements.menuToggle?.classList.add('mobile-menu-toggle--active');
    this.elements.mobileMenu?.classList.add('mobile-menu--active');
    this.elements.mobileMenuOverlay?.classList.add('mobile-menu-overlay--active');

    // Prevent body scroll
    this.elements.body.style.overflow = 'hidden';
    this.elements.body.style.position = 'fixed';
    this.elements.body.style.top = `-${this.state.scrollPosition}px`;
    this.elements.body.style.width = '100%';

    // Focus management
    setTimeout(() => {
      const firstLink = this.elements.mobileMenu?.querySelector('.mobile-menu__link');
      firstLink?.focus();
    }, 350); // Wait for animation to complete

    // Analytics tracking
    this.trackEvent('mobile_menu_open');
  }

  closeMobileMenu() {
    if (!this.state.isMenuOpen) {return;}

    this.state.isMenuOpen = false;

    // Remove classes
    this.elements.menuToggle?.classList.remove('mobile-menu-toggle--active');
    this.elements.mobileMenu?.classList.remove('mobile-menu--active');
    this.elements.mobileMenuOverlay?.classList.remove('mobile-menu-overlay--active');

    // Restore body scroll
    const scrollY = this.elements.body.style.top;
    this.elements.body.style.overflow = '';
    this.elements.body.style.position = '';
    this.elements.body.style.top = '';
    this.elements.body.style.width = '';

    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    // Return focus to toggle button
    setTimeout(() => {
      this.elements.menuToggle?.focus();
    }, 50);

    // Analytics tracking
    this.trackEvent('mobile_menu_close');
  }

  handleScroll() {
    this.state.scrollPosition = window.pageYOffset;
    const shouldShowScrolled = this.state.scrollPosition > 50;

    if (shouldShowScrolled !== this.state.isScrolled) {
      this.state.isScrolled = shouldShowScrolled;

      if (this.elements.header) {
        this.elements.header.classList.toggle('header--scrolled', shouldShowScrolled);
      }
    }
  }

  handleResize() {
    const newBreakpoint = this.getCurrentBreakpoint();

    if (newBreakpoint !== this.state.currentBreakpoint) {
      this.state.currentBreakpoint = newBreakpoint;

      // Close mobile menu if switching to desktop
      if (newBreakpoint === 'desktop' || newBreakpoint === 'desktopLarge') {
        this.closeMobileMenu();
      }

      // Update CSS custom properties for JavaScript access
      document.documentElement.style.setProperty('--current-breakpoint', newBreakpoint);

      // Analytics tracking
      this.trackEvent('breakpoint_change', { breakpoint: newBreakpoint });
    }

    // Update viewport height for mobile browsers
    this.updateViewportHeight();
  }

  handleKeyboard(event) {
    const { key } = event;

    // Close menu on Escape
    if (key === 'Escape' && this.state.isMenuOpen) {
      event.preventDefault();
      this.closeMobileMenu();
    }

    // Handle tab navigation within mobile menu
    if (key === 'Tab' && this.state.isMenuOpen) {
      this.handleTabNavigation(event);
    }
  }

  handleTabNavigation(event) {
    if (!this.elements.mobileMenu) {return;}

    const focusableElements = this.elements.mobileMenu.querySelectorAll(
      'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Backward navigation
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Forward navigation
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  getCurrentBreakpoint() {
    const width = window.innerWidth;

    if (width >= this.breakpoints.desktopLarge) {return 'desktopLarge';}
    if (width >= this.breakpoints.desktop) {return 'desktop';}
    if (width >= this.breakpoints.tablet) {return 'tablet';}
    return 'mobile';
  }

  updateViewportHeight() {
    // Fix for mobile browsers (100vh issue)
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  setupAccessibility() {
    // Add ARIA attributes
    if (this.elements.menuToggle) {
      this.elements.menuToggle.setAttribute('aria-label', 'メニューを開く');
      this.elements.menuToggle.setAttribute('aria-expanded', 'false');
      this.elements.menuToggle.setAttribute('aria-controls', 'mobile-menu');
    }

    if (this.elements.mobileMenu) {
      this.elements.mobileMenu.setAttribute('id', 'mobile-menu');
      this.elements.mobileMenu.setAttribute('role', 'navigation');
      this.elements.mobileMenu.setAttribute('aria-label', 'メインナビゲーション');
    }

    // Update ARIA states when menu opens/closes
    const originalOpenMenu = this.openMobileMenu.bind(this);
    const originalCloseMenu = this.closeMobileMenu.bind(this);

    this.openMobileMenu = () => {
      originalOpenMenu();
      this.elements.menuToggle?.setAttribute('aria-expanded', 'true');
      this.elements.menuToggle?.setAttribute('aria-label', 'メニューを閉じる');
    };

    this.closeMobileMenu = () => {
      originalCloseMenu();
      this.elements.menuToggle?.setAttribute('aria-expanded', 'false');
      this.elements.menuToggle?.setAttribute('aria-label', 'メニューを開く');
    };
  }

  setupTouchHandling() {
    if (!('ontouchstart' in window)) {return;}

    let touchStartX = 0;
    let touchStartY = 0;

    // Swipe to close menu
    if (this.elements.mobileMenu) {
      this.elements.mobileMenu.addEventListener(
        'touchstart',
        e => {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        },
        { passive: true }
      );

      this.elements.mobileMenu.addEventListener(
        'touchend',
        e => {
          const touchEndX = e.changedTouches[0].clientX;
          const touchEndY = e.changedTouches[0].clientY;

          const deltaX = touchEndX - touchStartX;
          const deltaY = Math.abs(touchEndY - touchStartY);

          // Swipe right to close (if horizontal swipe is more significant than vertical)
          if (deltaX > 50 && deltaY < 100) {
            this.closeMobileMenu();
          }
        },
        { passive: true }
      );
    }
  }

  trackEvent(eventName, data = {}) {
    // Analytics integration
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: 'Navigation',
        ...data
      });
    }

    // Custom analytics
    if (window.analytics && typeof window.analytics.track === 'function') {
      window.analytics.track(eventName, {
        category: 'Navigation',
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        ...data
      });
    }
  }

  // Public API methods
  destroy() {
    // Remove event listeners and clean up
    if (this.state.isMenuOpen) {
      this.closeMobileMenu();
    }

    // Reset body styles
    this.elements.body.style.overflow = '';
    this.elements.body.style.position = '';
    this.elements.body.style.top = '';
    this.elements.body.style.width = '';
  }

  getState() {
    return { ...this.state };
  }

  forceClose() {
    this.closeMobileMenu();
  }
}

// Initialize navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.navigationController = new ResponsiveNavigation();
});

// Handle page visibility changes (for mobile browsers)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && window.navigationController) {
    window.navigationController.forceClose();
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveNavigation;
}
