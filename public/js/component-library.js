/**
 * Lightning Talk Circle - Component Library JavaScript
 * Enhanced UI components for better user experience
 */

(function (global) {
  'use strict';

  // Component Library namespace
  const LightningTalkComponents = {
    version: '1.1.0',

    // Component constructors
    Header,
    EventCard,
    Button,
    Input,
    Modal,
    Toast,

    // Utility functions
    utils: {
      formatDate,
      debounce,
      throttle,
      addClass,
      removeClass,
      hasClass,
      toggleClass
    },

    // Initialize all components
    init() {
      console.log(`Lightning Talk Components v${this.version} initialized`);

      // Auto-initialize components with data attributes
      this.autoInit();

      // Setup global event listeners
      this.setupGlobalListeners();
    },

    // Auto-initialize components
    autoInit() {
      // Initialize headers
      document.querySelectorAll('[data-component="header"]').forEach(element => {
        new Header(element);
      });

      // Initialize event cards
      document.querySelectorAll('[data-component="event-card"]').forEach(element => {
        new EventCard(element);
      });

      // Initialize buttons
      document.querySelectorAll('[data-component="button"]').forEach(element => {
        new Button(element);
      });

      // Initialize inputs
      document.querySelectorAll('[data-component="input"]').forEach(element => {
        new Input(element);
      });

      // Initialize modals
      document.querySelectorAll('[data-component="modal"]').forEach(element => {
        new Modal(element);
      });
    },

    // Setup global event listeners
    setupGlobalListeners() {
      // Close modals with Escape key
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          const openModals = document.querySelectorAll('.lt-modal--open');
          openModals.forEach(modal => {
            modal.dispatchEvent(new CustomEvent('modal:close'));
          });
        }
      });

      // Auto-dismiss toasts
      document.addEventListener('toast:show', event => {
        const toast = event.detail.element;
        if (toast.getAttribute('data-auto-dismiss') !== 'false') {
          setTimeout(() => {
            if (toast.parentNode) {
              toast.remove();
            }
          }, 5000);
        }
      });
    }
  };

  // Header Component
  function Header(element, options) {
    this.element = element;
    this.options = Object.assign(
      {
        sticky: false,
        mobileBreakpoint: 768
      },
      options
    );

    this.init();
  }

  Header.prototype = {
    init() {
      this.setupEventListeners();
      this.handleResize();

      if (this.options.sticky) {
        this.makeSticky();
      }
    },

    setupEventListeners() {
      const self = this;

      // Mobile menu toggle
      const mobileToggle = this.element.querySelector('.lt-header__mobile-toggle');
      if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
          self.toggleMobileMenu();
        });
      }

      // Window resize
      window.addEventListener(
        'resize',
        debounce(() => {
          self.handleResize();
        }, 250)
      );
    },

    toggleMobileMenu() {
      const mobileNav = this.element.querySelector('.lt-header__mobile-nav');
      if (mobileNav) {
        toggleClass(mobileNav, 'lt-header__mobile-nav--open');
        toggleClass(this.element, 'lt-header--mobile-open');
      }
    },

    handleResize() {
      const isMobile = window.innerWidth < this.options.mobileBreakpoint;

      if (!isMobile) {
        const mobileNav = this.element.querySelector('.lt-header__mobile-nav');
        if (mobileNav) {
          removeClass(mobileNav, 'lt-header__mobile-nav--open');
          removeClass(this.element, 'lt-header--mobile-open');
        }
      }
    },

    makeSticky() {
      addClass(this.element, 'lt-header--sticky');
    }
  };

  // EventCard Component
  function EventCard(element, options) {
    this.element = element;
    this.options = Object.assign(
      {
        interactive: true,
        showStatus: true,
        showParticipants: true
      },
      options
    );

    this.init();
  }

  EventCard.prototype = {
    init() {
      this.setupEventListeners();
      this.updateStatus();
    },

    setupEventListeners() {
      const self = this;

      if (this.options.interactive) {
        this.element.addEventListener('click', event => {
          if (!event.target.closest('.lt-button')) {
            self.handleCardClick(event);
          }
        });

        this.element.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            self.handleCardClick(event);
          }
        });
      }

      // Participate button
      const participateButton = this.element.querySelector('.lt-event-card__participate-button');
      if (participateButton) {
        participateButton.addEventListener('click', event => {
          event.stopPropagation();
          self.handleParticipation();
        });
      }

      // Details button
      const detailsButton = this.element.querySelector('.lt-event-card__details-button');
      if (detailsButton) {
        detailsButton.addEventListener('click', event => {
          event.stopPropagation();
          self.handleViewDetails();
        });
      }
    },

    handleCardClick(event) {
      this.element.dispatchEvent(
        new CustomEvent('eventcard:click', {
          detail: {
            element: this.element,
            event
          }
        })
      );
    },

    handleParticipation() {
      this.element.dispatchEvent(
        new CustomEvent('eventcard:participate', {
          detail: {
            element: this.element,
            eventId: this.element.getAttribute('data-event-id')
          }
        })
      );
    },

    handleViewDetails() {
      this.element.dispatchEvent(
        new CustomEvent('eventcard:details', {
          detail: {
            element: this.element,
            eventId: this.element.getAttribute('data-event-id')
          }
        })
      );
    },

    updateStatus() {
      const status = this.element.getAttribute('data-status');
      const statusBadge = this.element.querySelector('.lt-event-card__status-badge');

      if (statusBadge && status) {
        removeClass(statusBadge, 'lt-event-card__status-badge--upcoming');
        removeClass(statusBadge, 'lt-event-card__status-badge--ongoing');
        removeClass(statusBadge, 'lt-event-card__status-badge--completed');

        addClass(statusBadge, `lt-event-card__status-badge--${status}`);
      }
    }
  };

  // Button Component
  function Button(element, options) {
    this.element = element;
    this.options = Object.assign(
      {
        ripple: true,
        loadingText: 'Loading...'
      },
      options
    );

    this.init();
  }

  Button.prototype = {
    init() {
      this.setupEventListeners();
    },

    setupEventListeners() {
      const self = this;

      if (this.options.ripple) {
        this.element.addEventListener('click', event => {
          self.createRipple(event);
        });
      }

      this.element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          self.element.click();
        }
      });
    },

    createRipple(event) {
      const ripple = document.createElement('span');
      const rect = this.element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
      ripple.classList.add('lt-button__ripple');

      const existingRipple = this.element.querySelector('.lt-button__ripple');
      if (existingRipple) {
        existingRipple.remove();
      }

      this.element.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    },

    setLoading(loading) {
      if (loading) {
        this.element.setAttribute('data-loading', 'true');
        this.element.disabled = true;
        this.originalText = this.element.textContent;
        this.element.textContent = this.options.loadingText;
      } else {
        this.element.removeAttribute('data-loading');
        this.element.disabled = false;
        if (this.originalText) {
          this.element.textContent = this.originalText;
        }
      }
    }
  };

  // Input Component
  function Input(element, options) {
    this.element = element;
    this.options = Object.assign(
      {
        validateOnBlur: true,
        showCharCount: false,
        maxLength: null
      },
      options
    );

    this.init();
  }

  Input.prototype = {
    init() {
      this.setupEventListeners();
      this.updateCharCount();
    },

    setupEventListeners() {
      const self = this;

      this.element.addEventListener('input', () => {
        self.updateCharCount();
        self.clearError();
      });

      this.element.addEventListener('blur', () => {
        if (self.options.validateOnBlur) {
          self.validate();
        }
      });

      this.element.addEventListener('focus', () => {
        self.clearError();
      });
    },

    updateCharCount() {
      if (this.options.showCharCount) {
        const charCountElement = this.element.parentNode.querySelector('.lt-input__char-count');
        if (charCountElement) {
          const currentLength = this.element.value.length;
          const maxLength = this.options.maxLength || this.element.getAttribute('maxlength');

          if (maxLength) {
            charCountElement.textContent = `${currentLength}/${maxLength}`;
          } else {
            charCountElement.textContent = currentLength;
          }
        }
      }
    },

    validate() {
      let isValid = true;
      let errorMessage = '';

      // Required validation
      if (this.element.hasAttribute('required') && !this.element.value.trim()) {
        isValid = false;
        errorMessage = 'This field is required';
      }

      // Email validation
      if (this.element.type === 'email' && this.element.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.element.value)) {
          isValid = false;
          errorMessage = 'Please enter a valid email address';
        }
      }

      // Custom validation
      const customValidator = this.element.getAttribute('data-validator');
      if (customValidator && window[customValidator]) {
        const customResult = window[customValidator](this.element.value);
        if (!customResult.isValid) {
          isValid = false;
          errorMessage = customResult.message;
        }
      }

      if (!isValid) {
        this.showError(errorMessage);
      }

      return isValid;
    },

    showError(message) {
      addClass(this.element, 'lt-input--error');

      let errorElement = this.element.parentNode.querySelector('.lt-input__error');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'lt-input__error';
        this.element.parentNode.appendChild(errorElement);
      }

      errorElement.textContent = message;
    },

    clearError() {
      removeClass(this.element, 'lt-input--error');

      const errorElement = this.element.parentNode.querySelector('.lt-input__error');
      if (errorElement) {
        errorElement.remove();
      }
    },

    getValue() {
      return this.element.value;
    },

    setValue(value) {
      this.element.value = value;
      this.updateCharCount();
    }
  };

  // Modal Component
  function Modal(element, options) {
    this.element = element;
    this.options = Object.assign(
      {
        closeOnBackdrop: true,
        closeOnEscape: true,
        preventBodyScroll: true
      },
      options
    );

    this.init();
  }

  Modal.prototype = {
    init() {
      this.setupEventListeners();
    },

    setupEventListeners() {
      const self = this;

      // Close button
      const closeButton = this.element.querySelector('.lt-modal__close');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          self.close();
        });
      }

      // Backdrop click
      if (this.options.closeOnBackdrop) {
        this.element.addEventListener('click', event => {
          if (event.target === self.element) {
            self.close();
          }
        });
      }

      // Custom events
      this.element.addEventListener('modal:open', () => {
        self.open();
      });

      this.element.addEventListener('modal:close', () => {
        self.close();
      });
    },

    open() {
      addClass(this.element, 'lt-modal--open');

      if (this.options.preventBodyScroll) {
        document.body.style.overflow = 'hidden';
      }

      // Focus management
      const focusableElements = this.element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      this.element.dispatchEvent(new CustomEvent('modal:opened'));
    },

    close() {
      removeClass(this.element, 'lt-modal--open');

      if (this.options.preventBodyScroll) {
        document.body.style.overflow = '';
      }

      this.element.dispatchEvent(new CustomEvent('modal:closed'));
    },

    toggle() {
      if (hasClass(this.element, 'lt-modal--open')) {
        this.close();
      } else {
        this.open();
      }
    }
  };

  // Toast Component
  function Toast(options) {
    this.options = Object.assign(
      {
        message: '',
        type: 'info', // success, error, warning, info
        duration: 5000,
        closable: true,
        container: null
      },
      options
    );

    this.init();
  }

  Toast.prototype = {
    init() {
      this.createElement();
      this.setupEventListeners();
      this.show();
    },

    createElement() {
      this.element = document.createElement('div');
      this.element.className = `lt-toast lt-toast--${this.options.type}`;

      const content = document.createElement('div');
      content.className = 'lt-toast__content';

      const message = document.createElement('span');
      message.className = 'lt-toast__message';
      message.textContent = this.options.message;

      content.appendChild(message);

      if (this.options.closable) {
        const closeButton = document.createElement('button');
        closeButton.className = 'lt-toast__close';
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', 'Close notification');
        content.appendChild(closeButton);
      }

      this.element.appendChild(content);
    },

    setupEventListeners() {
      const self = this;

      if (this.options.closable) {
        const closeButton = this.element.querySelector('.lt-toast__close');
        if (closeButton) {
          closeButton.addEventListener('click', () => {
            self.hide();
          });
        }
      }

      if (this.options.duration > 0) {
        setTimeout(() => {
          self.hide();
        }, this.options.duration);
      }
    },

    show() {
      const container = this.options.container || document.body;
      let toastContainer = container.querySelector('.lt-toast-container');

      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'lt-toast-container';
        container.appendChild(toastContainer);
      }

      toastContainer.appendChild(this.element);

      // Trigger show event
      document.dispatchEvent(
        new CustomEvent('toast:show', {
          detail: {
            element: this.element,
            toast: this
          }
        })
      );
    },

    hide() {
      const self = this;

      addClass(this.element, 'lt-toast--hiding');

      setTimeout(() => {
        if (self.element.parentNode) {
          self.element.remove();
        }

        // Trigger hide event
        document.dispatchEvent(
          new CustomEvent('toast:hide', {
            detail: {
              toast: self
            }
          })
        );
      }, 300);
    }
  };

  // Utility Functions
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction() {
      const context = this;
      const args = arguments;
      const later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  function addClass(element, className) {
    if (element.classList) {
      element.classList.add(className);
    } else {
      element.className += ` ${className}`;
    }
  }

  function removeClass(element, className) {
    if (element.classList) {
      element.classList.remove(className);
    } else {
      element.className = element.className.replace(
        new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'),
        ' '
      );
    }
  }

  function hasClass(element, className) {
    if (element.classList) {
      return element.classList.contains(className);
    } else {
      return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
    }
  }

  function toggleClass(element, className) {
    if (hasClass(element, className)) {
      removeClass(element, className);
    } else {
      addClass(element, className);
    }
  }

  // Global API
  global.LightningTalkComponents = LightningTalkComponents;
  global.LTComponents = LightningTalkComponents; // Short alias

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      LightningTalkComponents.init();
    });
  } else {
    LightningTalkComponents.init();
  }

  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LightningTalkComponents;
  }
})(typeof window !== 'undefined' ? window : this);
