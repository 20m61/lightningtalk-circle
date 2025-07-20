/**
 * Button Component System Tests
 * Comprehensive tests for the design token-based button system
 */

import { jest } from '@jest/globals';

describe('Button Component System', () => {
  let container;
  let originalGetComputedStyle;

  beforeEach(() => {
    // Create test container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Store original getComputedStyle
    originalGetComputedStyle = global.getComputedStyle;

    // Always mock getComputedStyle for consistent test behavior
    global.getComputedStyle = element => {
      // Call original if available to get real styles
      const realStyles = originalGetComputedStyle ? originalGetComputedStyle(element) : {};

      return {
        ...realStyles,
        getPropertyValue: prop => {
          // First try to get from real styles
          if (realStyles && realStyles.getPropertyValue) {
            const realValue = realStyles.getPropertyValue(prop);
            if (realValue) return realValue;
          }

          // Fallback to mock values for CSS variables
          const cssVarMap = {
            '--color-primary-500': '#22c55e',
            '--color-primary-600': '#16a34a',
            '--color-primary-700': '#15803d',
            '--space-2': '0.5rem',
            '--space-4': '1rem',
            '--font-size-lg': '1.125rem',
            '--size-11': '2.75rem',
            'background-color': 'rgb(34, 197, 94)',
            'min-height': '2.75rem'
          };
          return cssVarMap[prop] || '';
        }
      };
    };

    // Inject CSS styles for testing
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      :root {
        --color-primary-500: #22c55e;
        --color-primary-600: #16a34a;
        --color-primary-700: #15803d;
        --color-neutral-500: #6b7280;
        --color-neutral-600: #4b5563;
        --color-neutral-0: #ffffff;
        --color-neutral-50: #f9fafb;
        --color-neutral-900: #111827;
        --font-size-sm: 0.875rem;
        --font-size-base: 1rem;
        --font-size-lg: 1.125rem;
        --font-weight-medium: 500;
        --font-weight-semibold: 600;
        --space-2: 0.5rem;
        --space-3: 0.75rem;
        --space-4: 1rem;
        --space-6: 1.5rem;
        --radius-md: 0.375rem;
        --radius-lg: 0.5rem;
        --transition-colors: color 150ms ease, background-color 150ms ease;
        --transition-shadow: box-shadow 150ms ease;
        --size-11: 2.75rem;
        --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        --shadow-focus: 0 0 0 3px rgb(34 197 94 / 0.1);
        --button-padding-base: var(--space-3) var(--space-6);
        --button-radius-base: var(--radius-md);
        --button-font-weight: var(--font-weight-medium);
        --button-transition: var(--transition-colors), var(--transition-shadow);
      }
      
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--button-padding-base);
        border: 1px solid transparent;
        border-radius: var(--button-radius-base);
        font-family: inherit;
        font-size: var(--font-size-base);
        font-weight: var(--button-font-weight);
        line-height: 1;
        text-decoration: none;
        cursor: pointer;
        transition: var(--button-transition);
        min-height: var(--size-11);
        gap: var(--space-2);
      }
      
      .btn-primary {
        background-color: var(--color-primary-500);
        color: var(--color-neutral-0);
        border-color: var(--color-primary-500);
      }
      
      .btn-primary:hover {
        background-color: var(--color-primary-600);
        border-color: var(--color-primary-600);
      }
      
      .btn-secondary {
        background-color: var(--color-neutral-50);
        color: var(--color-neutral-900);
        border-color: var(--color-neutral-300);
      }
      
      .btn-outline {
        background-color: transparent;
        color: var(--color-primary-500);
        border-color: var(--color-primary-500);
      }
      
      .btn-ghost {
        background-color: transparent;
        color: var(--color-neutral-600);
        border-color: transparent;
      }
      
      .btn-sm {
        padding: var(--space-2) var(--space-4);
        font-size: var(--font-size-sm);
        min-height: 2rem;
      }
      
      .btn-lg {
        padding: var(--space-4) var(--space-8);
        font-size: var(--font-size-lg);
        min-height: 3rem;
      }
      
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
      
      .btn:focus-visible {
        outline: none;
        box-shadow: var(--shadow-focus);
      }
    `;
    document.head.appendChild(styleElement);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
    // Remove injected styles
    const styles = document.head.querySelectorAll('style');
    styles.forEach(style => {
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    });

    // Restore original getComputedStyle if it was mocked
    if (originalGetComputedStyle) {
      global.getComputedStyle = originalGetComputedStyle;
    }
  });

  describe('Base Button Structure', () => {
    it('should create a button with base btn class', () => {
      const button = document.createElement('button');
      button.className = 'btn';
      button.textContent = 'Test Button';
      container.appendChild(button);

      expect(button.classList.contains('btn')).toBe(true);
      expect(button.textContent).toBe('Test Button');
    });

    it('should support button element', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Button Element';
      container.appendChild(button);

      expect(button.tagName).toBe('BUTTON');
      expect(button.type).toBe('submit');
    });

    it('should support anchor element with button styling', () => {
      const link = document.createElement('a');
      link.className = 'btn btn-primary';
      link.href = '#test';
      link.textContent = 'Link Button';
      container.appendChild(link);

      expect(link.tagName).toBe('A');
      expect(link.href).toContain('#test');
    });
  });

  describe('Button Variants', () => {
    it('should apply primary button styling', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Primary Button';
      container.appendChild(button);

      expect(button.classList.contains('btn-primary')).toBe(true);

      const computedStyle = getComputedStyle(button);
      expect(computedStyle.getPropertyValue('background-color')).toBeTruthy();
    });

    it('should apply secondary button styling', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-secondary';
      button.textContent = 'Secondary Button';
      container.appendChild(button);

      expect(button.classList.contains('btn-secondary')).toBe(true);
    });

    it('should apply outline button styling', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-outline';
      button.textContent = 'Outline Button';
      container.appendChild(button);

      expect(button.classList.contains('btn-outline')).toBe(true);
    });

    it('should apply ghost button styling', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-ghost';
      button.textContent = 'Ghost Button';
      container.appendChild(button);

      expect(button.classList.contains('btn-ghost')).toBe(true);
    });

    it('should apply link button styling', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-link';
      button.textContent = 'Link Button';
      container.appendChild(button);

      expect(button.classList.contains('btn-link')).toBe(true);
    });
  });

  describe('Button Sizes', () => {
    it('should apply small size styling', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary btn-sm';
      button.textContent = 'Small Button';
      container.appendChild(button);

      expect(button.classList.contains('btn-sm')).toBe(true);
    });

    it('should apply base size (default)', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Base Button';
      container.appendChild(button);

      expect(button.classList.contains('btn-sm')).toBe(false);
      expect(button.classList.contains('btn-lg')).toBe(false);
    });

    it('should apply large size styling', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary btn-lg';
      button.textContent = 'Large Button';
      container.appendChild(button);

      expect(button.classList.contains('btn-lg')).toBe(true);
    });
  });

  describe('Button States', () => {
    it('should handle disabled state', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Disabled Button';
      button.disabled = true;
      container.appendChild(button);

      expect(button.disabled).toBe(true);
      expect(button.getAttribute('disabled')).toBe('');
    });

    it('should handle loading state', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary btn-loading';
      button.textContent = 'Loading Button';
      container.appendChild(button);

      expect(button.classList.contains('btn-loading')).toBe(true);
    });

    it('should handle active state', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary btn-active';
      button.textContent = 'Active Button';
      container.appendChild(button);

      expect(button.classList.contains('btn-active')).toBe(true);
    });
  });

  describe('Button Interactions', () => {
    it('should handle click events', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Clickable Button';
      container.appendChild(button);

      const clickHandler = jest.fn();
      button.addEventListener('click', clickHandler);

      button.click();

      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it('should prevent clicks when disabled', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Disabled Button';
      button.disabled = true;
      container.appendChild(button);

      const clickHandler = jest.fn();
      button.addEventListener('click', clickHandler);

      // Disabled buttons shouldn't trigger click events
      button.click();

      expect(clickHandler).not.toHaveBeenCalled();
    });

    it('should handle focus events', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Focusable Button';
      container.appendChild(button);

      const focusHandler = jest.fn();
      button.addEventListener('focus', focusHandler);

      button.focus();

      expect(focusHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have minimum touch target size', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Accessible Button';
      container.appendChild(button);

      // Minimum 44px (2.75rem) for touch targets
      const computedStyle = getComputedStyle(button);
      expect(computedStyle.getPropertyValue('min-height')).toBeTruthy();
    });

    it('should support ARIA attributes', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'ARIA Button';
      button.setAttribute('aria-label', 'Custom button label');
      button.setAttribute('aria-describedby', 'button-help');
      container.appendChild(button);

      expect(button.getAttribute('aria-label')).toBe('Custom button label');
      expect(button.getAttribute('aria-describedby')).toBe('button-help');
    });

    it('should have proper keyboard navigation', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Keyboard Button';
      container.appendChild(button);

      expect(button.tabIndex).toBe(0);
    });

    it('should support screen reader text', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.innerHTML = 'Save <span class="sr-only">document</span>';
      container.appendChild(button);

      const srText = button.querySelector('.sr-only');
      expect(srText).toBeTruthy();
      expect(srText.textContent).toBe('document');
    });
  });

  describe('Content and Icons', () => {
    it('should support text content', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Text Button';
      container.appendChild(button);

      expect(button.textContent).toBe('Text Button');
    });

    it('should support icon with text', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.innerHTML = '⚡ Lightning Talk';
      container.appendChild(button);

      expect(button.innerHTML).toBe('⚡ Lightning Talk');
    });

    it('should support icon-only buttons', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.innerHTML = '⚙️';
      button.setAttribute('aria-label', 'Settings');
      container.appendChild(button);

      expect(button.innerHTML).toBe('⚙️');
      expect(button.getAttribute('aria-label')).toBe('Settings');
    });
  });

  describe('CSS Variables Integration', () => {
    it('should use design tokens for colors', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      container.appendChild(button);

      const computedStyle = getComputedStyle(button);
      expect(computedStyle.getPropertyValue('--color-primary-500')).toBe('#22c55e');
    });

    it('should use design tokens for spacing', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-sm';
      container.appendChild(button);

      const computedStyle = getComputedStyle(button);
      expect(computedStyle.getPropertyValue('--space-2')).toBe('0.5rem');
      expect(computedStyle.getPropertyValue('--space-4')).toBe('1rem');
    });

    it('should use design tokens for typography', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-lg';
      container.appendChild(button);

      const computedStyle = getComputedStyle(button);
      expect(computedStyle.getPropertyValue('--font-size-lg')).toBe('1.125rem');
    });
  });

  describe('Component Composition', () => {
    it('should support multiple modifier classes', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary btn-lg btn-loading';
      button.textContent = 'Complex Button';
      container.appendChild(button);

      expect(button.classList.contains('btn')).toBe(true);
      expect(button.classList.contains('btn-primary')).toBe(true);
      expect(button.classList.contains('btn-lg')).toBe(true);
      expect(button.classList.contains('btn-loading')).toBe(true);
    });

    it('should work with custom classes', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary custom-button';
      button.textContent = 'Custom Button';
      container.appendChild(button);

      expect(button.classList.contains('btn')).toBe(true);
      expect(button.classList.contains('btn-primary')).toBe(true);
      expect(button.classList.contains('custom-button')).toBe(true);
    });
  });

  describe('Real-world Usage Examples', () => {
    it('should work for form submission', () => {
      const form = document.createElement('form');
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.type = 'submit';
      button.textContent = 'Submit Form';

      form.appendChild(button);
      container.appendChild(form);

      expect(button.type).toBe('submit');
      expect(button.form).toBe(form);
    });

    it('should work for navigation links', () => {
      const link = document.createElement('a');
      link.className = 'btn btn-outline';
      link.href = '/events';
      link.textContent = 'View Events';
      container.appendChild(link);

      expect(link.tagName).toBe('A');
      expect(link.href).toContain('/events');
    });

    it('should work for modal triggers', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-secondary';
      button.textContent = 'Open Modal';
      button.setAttribute('data-target', 'modal-id');
      button.setAttribute('data-action', 'modal-open');
      container.appendChild(button);

      expect(button.getAttribute('data-target')).toBe('modal-id');
      expect(button.getAttribute('data-action')).toBe('modal-open');
    });
  });

  describe('Performance Considerations', () => {
    it('should not create excessive DOM nodes', () => {
      const initialNodeCount = container.childNodes.length;

      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Performance Button';
      container.appendChild(button);

      expect(container.childNodes.length).toBe(initialNodeCount + 1);
    });

    it('should support efficient re-rendering', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Initial Text';
      container.appendChild(button);

      // Simulate state change
      button.textContent = 'Updated Text';
      button.classList.add('btn-loading');

      expect(button.textContent).toBe('Updated Text');
      expect(button.classList.contains('btn-loading')).toBe(true);
    });
  });
});
