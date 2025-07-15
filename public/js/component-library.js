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
    Header: Header,
    EventCard: EventCard,
    Button: Button,
    Input: Input,
    Modal: Modal,
    Toast: Toast,

    // Utility functions
    utils: {
      formatDate: formatDate,
      debounce: debounce,
      throttle: throttle,
      addClass: addClass,
      removeClass: removeClass,
      hasClass: hasClass,
      toggleClass: toggleClass
    },

    // Initialize all components
    init: function () {
      console.log('Lightning Talk Components v' + this.version + ' initialized');

      // Auto-initialize components with data attributes
      this.autoInit();

      // Setup global event listeners
      this.setupGlobalListeners();
    },

    // Auto-initialize components
    autoInit: function () {
      // Initialize headers
      document.querySelectorAll('[data-component="header"]').forEach(function (element) {
        new Header(element);
      });

      // Initialize event cards
      document.querySelectorAll('[data-component="event-card"]').forEach(function (element) {
        new EventCard(element);
      });

      // Initialize buttons
      document.querySelectorAll('[data-component="button"]').forEach(function (element) {
        new Button(element);
      });

      // Initialize inputs
      document.querySelectorAll('[data-component="input"]').forEach(function (element) {
        new Input(element);
      });

      // Initialize modals
      document.querySelectorAll('[data-component="modal"]').forEach(function (element) {
        new Modal(element);
      });
    },

    // Setup global event listeners
    setupGlobalListeners: function () {
      // Close modals with Escape key
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          const openModals = document.querySelectorAll('.lt-modal--open');
          openModals.forEach(function (modal) {
            modal.dispatchEvent(new CustomEvent('modal:close'));
          });
        }
      });

      // Auto-dismiss toasts
      document.addEventListener('toast:show', function (event) {
        const toast = event.detail.element;
        if (toast.getAttribute('data-auto-dismiss') !== 'false') {
          setTimeout(function () {
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
    init: function () {
      this.setupEventListeners();
      this.handleResize();

      if (this.options.sticky) {
        this.makeSticky();
      }
    },

    setupEventListeners: function () {
      var self = this;

      // Mobile menu toggle
      var mobileToggle = this.element.querySelector('.lt-header__mobile-toggle');
      if (mobileToggle) {
        mobileToggle.addEventListener('click', function () {
          self.toggleMobileMenu();
        });
      }

      // Window resize
      window.addEventListener(
        'resize',
        debounce(function () {
          self.handleResize();
        }, 250)
      );
    },

    toggleMobileMenu: function () {
      var mobileNav = this.element.querySelector('.lt-header__mobile-nav');
      if (mobileNav) {
        toggleClass(mobileNav, 'lt-header__mobile-nav--open');
        toggleClass(this.element, 'lt-header--mobile-open');
      }
    },

    handleResize: function () {
      var isMobile = window.innerWidth < this.options.mobileBreakpoint;

      if (!isMobile) {
        var mobileNav = this.element.querySelector('.lt-header__mobile-nav');
        if (mobileNav) {
          removeClass(mobileNav, 'lt-header__mobile-nav--open');
          removeClass(this.element, 'lt-header--mobile-open');
        }
      }
    },

    makeSticky: function () {
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
    init: function () {
      this.setupEventListeners();
      this.updateStatus();
    },

    setupEventListeners: function () {
      var self = this;

      if (this.options.interactive) {
        this.element.addEventListener('click', function (event) {
          if (!event.target.closest('.lt-button')) {
            self.handleCardClick(event);
          }
        });

        this.element.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            self.handleCardClick(event);
          }
        });
      }

      // Participate button
      var participateButton = this.element.querySelector('.lt-event-card__participate-button');
      if (participateButton) {
        participateButton.addEventListener('click', function (event) {
          event.stopPropagation();
          self.handleParticipation();
        });
      }

      // Details button
      var detailsButton = this.element.querySelector('.lt-event-card__details-button');
      if (detailsButton) {
        detailsButton.addEventListener('click', function (event) {
          event.stopPropagation();
          self.handleViewDetails();
        });
      }
    },

    handleCardClick: function (event) {
      this.element.dispatchEvent(
        new CustomEvent('eventcard:click', {
          detail: {
            element: this.element,
            event: event
          }
        })
      );
    },

    handleParticipation: function () {
      this.element.dispatchEvent(
        new CustomEvent('eventcard:participate', {
          detail: {
            element: this.element,
            eventId: this.element.getAttribute('data-event-id')
          }
        })
      );
    },

    handleViewDetails: function () {
      this.element.dispatchEvent(
        new CustomEvent('eventcard:details', {
          detail: {
            element: this.element,
            eventId: this.element.getAttribute('data-event-id')
          }
        })
      );
    },

    updateStatus: function () {
      var status = this.element.getAttribute('data-status');
      var statusBadge = this.element.querySelector('.lt-event-card__status-badge');

      if (statusBadge && status) {
        removeClass(statusBadge, 'lt-event-card__status-badge--upcoming');
        removeClass(statusBadge, 'lt-event-card__status-badge--ongoing');
        removeClass(statusBadge, 'lt-event-card__status-badge--completed');

        addClass(statusBadge, 'lt-event-card__status-badge--' + status);
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
    init: function () {
      this.setupEventListeners();
    },

    setupEventListeners: function () {
      var self = this;

      if (this.options.ripple) {
        this.element.addEventListener('click', function (event) {
          self.createRipple(event);
        });
      }

      this.element.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          self.element.click();
        }
      });
    },

    createRipple: function (event) {
      var ripple = document.createElement('span');
      var rect = this.element.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = event.clientX - rect.left - size / 2 + 'px';
      ripple.style.top = event.clientY - rect.top - size / 2 + 'px';
      ripple.classList.add('lt-button__ripple');

      var existingRipple = this.element.querySelector('.lt-button__ripple');
      if (existingRipple) {
        existingRipple.remove();
      }

      this.element.appendChild(ripple);

      setTimeout(function () {
        ripple.remove();
      }, 600);
    },

    setLoading: function (loading) {
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
    init: function () {
      this.setupEventListeners();
      this.updateCharCount();
    },

    setupEventListeners: function () {
      var self = this;

      this.element.addEventListener('input', function () {
        self.updateCharCount();
        self.clearError();
      });

      this.element.addEventListener('blur', function () {
        if (self.options.validateOnBlur) {
          self.validate();
        }
      });

      this.element.addEventListener('focus', function () {
        self.clearError();
      });
    },

    updateCharCount: function () {
      if (this.options.showCharCount) {
        var charCountElement = this.element.parentNode.querySelector('.lt-input__char-count');
        if (charCountElement) {
          var currentLength = this.element.value.length;
          var maxLength = this.options.maxLength || this.element.getAttribute('maxlength');

          if (maxLength) {
            charCountElement.textContent = currentLength + '/' + maxLength;
          } else {
            charCountElement.textContent = currentLength;
          }
        }
      }
    },

    validate: function () {
      var isValid = true;
      var errorMessage = '';

      // Required validation
      if (this.element.hasAttribute('required') && !this.element.value.trim()) {
        isValid = false;
        errorMessage = 'This field is required';
      }

      // Email validation
      if (this.element.type === 'email' && this.element.value) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.element.value)) {
          isValid = false;
          errorMessage = 'Please enter a valid email address';
        }
      }

      // Custom validation
      var customValidator = this.element.getAttribute('data-validator');
      if (customValidator && window[customValidator]) {
        var customResult = window[customValidator](this.element.value);
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

    showError: function (message) {
      addClass(this.element, 'lt-input--error');

      var errorElement = this.element.parentNode.querySelector('.lt-input__error');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'lt-input__error';
        this.element.parentNode.appendChild(errorElement);
      }

      errorElement.textContent = message;
    },

    clearError: function () {
      removeClass(this.element, 'lt-input--error');

      var errorElement = this.element.parentNode.querySelector('.lt-input__error');
      if (errorElement) {
        errorElement.remove();
      }
    },

    getValue: function () {
      return this.element.value;
    },

    setValue: function (value) {
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
    init: function () {
      this.setupEventListeners();
    },

    setupEventListeners: function () {
      var self = this;

      // Close button
      var closeButton = this.element.querySelector('.lt-modal__close');
      if (closeButton) {
        closeButton.addEventListener('click', function () {
          self.close();
        });
      }

      // Backdrop click
      if (this.options.closeOnBackdrop) {
        this.element.addEventListener('click', function (event) {
          if (event.target === self.element) {
            self.close();
          }
        });
      }

      // Custom events
      this.element.addEventListener('modal:open', function () {
        self.open();
      });

      this.element.addEventListener('modal:close', function () {
        self.close();
      });
    },

    open: function () {
      addClass(this.element, 'lt-modal--open');

      if (this.options.preventBodyScroll) {
        document.body.style.overflow = 'hidden';
      }

      // Focus management
      var focusableElements = this.element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      this.element.dispatchEvent(new CustomEvent('modal:opened'));
    },

    close: function () {
      removeClass(this.element, 'lt-modal--open');

      if (this.options.preventBodyScroll) {
        document.body.style.overflow = '';
      }

      this.element.dispatchEvent(new CustomEvent('modal:closed'));
    },

    toggle: function () {
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
    init: function () {
      this.createElement();
      this.setupEventListeners();
      this.show();
    },

    createElement: function () {
      this.element = document.createElement('div');
      this.element.className = 'lt-toast lt-toast--' + this.options.type;

      var content = document.createElement('div');
      content.className = 'lt-toast__content';

      var message = document.createElement('span');
      message.className = 'lt-toast__message';
      message.textContent = this.options.message;

      content.appendChild(message);

      if (this.options.closable) {
        var closeButton = document.createElement('button');
        closeButton.className = 'lt-toast__close';
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', 'Close notification');
        content.appendChild(closeButton);
      }

      this.element.appendChild(content);
    },

    setupEventListeners: function () {
      var self = this;

      if (this.options.closable) {
        var closeButton = this.element.querySelector('.lt-toast__close');
        if (closeButton) {
          closeButton.addEventListener('click', function () {
            self.hide();
          });
        }
      }

      if (this.options.duration > 0) {
        setTimeout(function () {
          self.hide();
        }, this.options.duration);
      }
    },

    show: function () {
      var container = this.options.container || document.body;
      var toastContainer = container.querySelector('.lt-toast-container');

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

    hide: function () {
      var self = this;

      addClass(this.element, 'lt-toast--hiding');

      setTimeout(function () {
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
    var date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }

  function debounce(func, wait) {
    var timeout;
    return function executedFunction() {
      var context = this;
      var args = arguments;
      var later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function throttle(func, limit) {
    var inThrottle;
    return function () {
      var args = arguments;
      var context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function () {
          inThrottle = false;
        }, limit);
      }
    };
  }

  function addClass(element, className) {
    if (element.classList) {
      element.classList.add(className);
    } else {
      element.className += ' ' + className;
    }
  }

  function removeClass(element, className) {
    if (element.classList) {
      element.classList.remove(className);
    } else {
      element.className = element.className.replace(
        new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'),
        ' '
      );
    }
  }

  function hasClass(element, className) {
    if (element.classList) {
      return element.classList.contains(className);
    } else {
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
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
    document.addEventListener('DOMContentLoaded', function () {
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
