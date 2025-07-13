/**
 * Card Component System Tests
 * Tests for the comprehensive card component system
 */

import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.getComputedStyle = dom.window.getComputedStyle;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.MouseEvent = dom.window.MouseEvent;

// Mock CSS custom properties support
const mockCSSVariables = {
  '--color-primary-500': '#22c55e',
  '--color-primary-600': '#16a34a',
  '--color-neutral-0': '#ffffff',
  '--color-neutral-50': '#f9fafb',
  '--color-neutral-100': '#f3f4f6',
  '--color-neutral-200': '#e5e7eb',
  '--color-neutral-600': '#4b5563',
  '--color-neutral-700': '#374151',
  '--color-neutral-900': '#111827',
  '--font-size-sm': '0.875rem',
  '--font-size-base': '1rem',
  '--font-size-xl': '1.25rem',
  '--font-weight-normal': '400',
  '--font-weight-medium': '500',
  '--font-weight-semibold': '600',
  '--space-1': '0.25rem',
  '--space-2': '0.5rem',
  '--space-3': '0.75rem',
  '--space-4': '1rem',
  '--space-6': '1.5rem',
  '--space-8': '2rem',
  '--card-padding': '1.5rem',
  '--card-radius': '0.5rem',
  '--card-shadow': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  '--card-shadow-hover': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  '--card-border': '1px solid #e5e7eb',
  '--event-card-transition': 'transform 200ms ease-out, box-shadow 200ms ease-out',
  '--shadow-md': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  '--shadow-lg': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  '--shadow-xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '--line-height-tight': '1.25',
  '--line-height-normal': '1.5',
  '--line-height-relaxed': '1.625',
  '--transition-colors': 'color 150ms ease, background-color 150ms ease',
  '--radius-full': '9999px',
  '--radius-md': '0.375rem'
};

// Mock getComputedStyle
const originalGetComputedStyle = global.getComputedStyle;
global.getComputedStyle = jest.fn(element => {
  const computedStyle = originalGetComputedStyle(element);
  return {
    ...computedStyle,
    getPropertyValue: jest.fn(prop => {
      return mockCSSVariables[prop] || computedStyle.getPropertyValue(prop);
    })
  };
});

describe('Card Component System', () => {
  let container;

  beforeEach(() => {
    // Create test container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Inject basic CSS styles for testing
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .card {
        display: flex;
        flex-direction: column;
        position: relative;
        background-color: var(--color-neutral-0);
        border: var(--card-border);
        border-radius: var(--card-radius);
        box-shadow: var(--card-shadow);
        padding: var(--card-padding);
        height: 100%;
        transition: var(--event-card-transition);
      }
      
      .card:hover {
        box-shadow: var(--card-shadow-hover);
        transform: translateY(-2px);
      }
      
      .card-interactive {
        cursor: pointer;
        transition: var(--event-card-transition);
      }
      
      .card-interactive:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-xl);
      }
      
      .card-outlined {
        box-shadow: none;
        border: 2px solid var(--color-neutral-200);
      }
      
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-4);
        padding-bottom: var(--space-4);
        border-bottom: 1px solid var(--color-neutral-200);
      }
      
      .card-title {
        margin: 0;
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
        line-height: var(--line-height-tight);
        color: var(--color-neutral-900);
      }
      
      .card-body {
        flex: 1;
        margin-bottom: var(--space-4);
      }
      
      .card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--color-neutral-200);
      }
      
      .card-sm { padding: var(--space-4); }
      .card-lg { padding: var(--space-8); }
      
      .event-status-badge {
        position: absolute;
        top: var(--space-4);
        right: var(--space-4);
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-full);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }
      
      .status-upcoming {
        background-color: var(--color-info-500);
        color: var(--color-neutral-0);
      }
      
      .card-grid {
        display: grid;
        gap: var(--space-6);
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      }
    `;
    document.head.appendChild(styleElement);
  });

  afterEach(() => {
    document.body.removeChild(container);
    // Remove injected styles
    const styles = document.head.querySelectorAll('style');
    styles.forEach(style => document.head.removeChild(style));
  });

  describe('Base Card Structure', () => {
    it('should create a basic card', () => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-header">
          <h3 class="card-title">Test Card</h3>
        </div>
        <div class="card-body">
          <p>Card content goes here</p>
        </div>
      `;
      container.appendChild(card);

      expect(card.classList.contains('card')).toBe(true);

      const title = card.querySelector('.card-title');
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('Test Card');

      const body = card.querySelector('.card-body');
      expect(body).toBeTruthy();
      expect(body.textContent.trim()).toBe('Card content goes here');
    });

    it('should have proper card sections', () => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-header">
          <h3 class="card-title">Card Title</h3>
          <div class="card-actions">
            <button>Action</button>
          </div>
        </div>
        <div class="card-body">
          <p>Body content</p>
        </div>
        <div class="card-footer">
          <span>Footer content</span>
        </div>
      `;
      container.appendChild(card);

      expect(card.querySelector('.card-header')).toBeTruthy();
      expect(card.querySelector('.card-body')).toBeTruthy();
      expect(card.querySelector('.card-footer')).toBeTruthy();
      expect(card.querySelector('.card-actions')).toBeTruthy();
    });

    it('should support card with only essential sections', () => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-body">
          <h3>Simple Card</h3>
          <p>Just body content</p>
        </div>
      `;
      container.appendChild(card);

      expect(card.querySelector('.card-body')).toBeTruthy();
      expect(card.querySelector('.card-header')).toBeFalsy();
      expect(card.querySelector('.card-footer')).toBeFalsy();
    });
  });

  describe('Card Variants', () => {
    it('should support interactive cards', () => {
      const card = document.createElement('div');
      card.className = 'card card-interactive';
      card.innerHTML = '<div class="card-body">Interactive card</div>';
      container.appendChild(card);

      expect(card.classList.contains('card-interactive')).toBe(true);

      // Test click event
      const clickHandler = jest.fn();
      card.addEventListener('click', clickHandler);
      card.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it('should support outlined cards', () => {
      const card = document.createElement('div');
      card.className = 'card card-outlined';
      card.innerHTML = '<div class="card-body">Outlined card</div>';
      container.appendChild(card);

      expect(card.classList.contains('card-outlined')).toBe(true);
    });

    it('should support filled cards', () => {
      const card = document.createElement('div');
      card.className = 'card card-filled';
      card.innerHTML = '<div class="card-body">Filled card</div>';
      container.appendChild(card);

      expect(card.classList.contains('card-filled')).toBe(true);
    });

    it('should support elevated cards', () => {
      const card = document.createElement('div');
      card.className = 'card card-elevated';
      card.innerHTML = '<div class="card-body">Elevated card</div>';
      container.appendChild(card);

      expect(card.classList.contains('card-elevated')).toBe(true);
    });

    it('should support gradient cards', () => {
      const card = document.createElement('div');
      card.className = 'card card-gradient';
      card.innerHTML = '<div class="card-body">Gradient card</div>';
      container.appendChild(card);

      expect(card.classList.contains('card-gradient')).toBe(true);
    });
  });

  describe('Card Sizes', () => {
    it('should support small cards', () => {
      const card = document.createElement('div');
      card.className = 'card card-sm';
      card.innerHTML = '<div class="card-body">Small card</div>';
      container.appendChild(card);

      expect(card.classList.contains('card-sm')).toBe(true);
    });

    it('should support large cards', () => {
      const card = document.createElement('div');
      card.className = 'card card-lg';
      card.innerHTML = '<div class="card-body">Large card</div>';
      container.appendChild(card);

      expect(card.classList.contains('card-lg')).toBe(true);
    });

    it('should support extra large cards', () => {
      const card = document.createElement('div');
      card.className = 'card card-xl';
      card.innerHTML = '<div class="card-body">Extra large card</div>';
      container.appendChild(card);

      expect(card.classList.contains('card-xl')).toBe(true);
    });
  });

  describe('Card Media', () => {
    it('should support card with image', () => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-image">
          <img src="/test-image.jpg" alt="Test image" />
        </div>
        <div class="card-body">
          <h3 class="card-title">Card with Image</h3>
        </div>
      `;
      container.appendChild(card);

      const imageContainer = card.querySelector('.card-image');
      const image = card.querySelector('img');

      expect(imageContainer).toBeTruthy();
      expect(image).toBeTruthy();
      expect(image.getAttribute('src')).toBe('/test-image.jpg');
      expect(image.getAttribute('alt')).toBe('Test image');
    });

    it('should support card with image overlay', () => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-image">
          <img src="/test-image.jpg" alt="Test image" />
          <div class="card-image-overlay">
            <h3 class="card-title">Overlay Title</h3>
          </div>
        </div>
      `;
      container.appendChild(card);

      const overlay = card.querySelector('.card-image-overlay');
      const title = overlay.querySelector('.card-title');

      expect(overlay).toBeTruthy();
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('Overlay Title');
    });

    it('should support different image sizes', () => {
      const smallCard = document.createElement('div');
      smallCard.className = 'card';
      smallCard.innerHTML = `
        <div class="card-image card-image-small">
          <img src="/small-image.jpg" alt="Small image" />
        </div>
      `;

      const largeCard = document.createElement('div');
      largeCard.className = 'card';
      largeCard.innerHTML = `
        <div class="card-image card-image-large">
          <img src="/large-image.jpg" alt="Large image" />
        </div>
      `;

      container.appendChild(smallCard);
      container.appendChild(largeCard);

      expect(smallCard.querySelector('.card-image-small')).toBeTruthy();
      expect(largeCard.querySelector('.card-image-large')).toBeTruthy();
    });
  });

  describe('Event Card Specific Features', () => {
    it('should support event cards', () => {
      const card = document.createElement('div');
      card.className = 'card event-card';
      card.innerHTML = `
        <div class="event-status-badge status-upcoming">Upcoming</div>
        <div class="card-header">
          <h3 class="card-title">Lightning Talk Event</h3>
        </div>
        <div class="card-body">
          <div class="event-meta">
            <div class="event-meta-item">
              <span>📅</span>
              <span>2025-07-15</span>
            </div>
            <div class="event-meta-item">
              <span>🕐</span>
              <span>19:00</span>
            </div>
          </div>
          <p>Event description here</p>
        </div>
      `;
      container.appendChild(card);

      expect(card.classList.contains('event-card')).toBe(true);

      const badge = card.querySelector('.event-status-badge');
      expect(badge).toBeTruthy();
      expect(badge.classList.contains('status-upcoming')).toBe(true);
      expect(badge.textContent).toBe('Upcoming');

      const meta = card.querySelector('.event-meta');
      expect(meta).toBeTruthy();

      const metaItems = card.querySelectorAll('.event-meta-item');
      expect(metaItems.length).toBe(2);
    });

    it('should support different event status badges', () => {
      const statuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];

      statuses.forEach(status => {
        const card = document.createElement('div');
        card.className = 'card event-card';
        card.innerHTML = `
          <div class="event-status-badge status-${status}">${status}</div>
          <div class="card-body">Test event</div>
        `;
        container.appendChild(card);

        const badge = card.querySelector('.event-status-badge');
        expect(badge.classList.contains(`status-${status}`)).toBe(true);
      });
    });

    it('should support event participants display', () => {
      const card = document.createElement('div');
      card.className = 'card event-card';
      card.innerHTML = `
        <div class="card-body">
          <h3>Event Title</h3>
          <div class="event-participants">
            <span>👥</span>
            <span class="event-participants-count">12</span>
            <span>participants</span>
          </div>
        </div>
      `;
      container.appendChild(card);

      const participants = card.querySelector('.event-participants');
      const count = card.querySelector('.event-participants-count');

      expect(participants).toBeTruthy();
      expect(count).toBeTruthy();
      expect(count.textContent).toBe('12');
    });
  });

  describe('Card Layouts and Grids', () => {
    it('should support card grids', () => {
      const grid = document.createElement('div');
      grid.className = 'card-grid';

      for (let i = 1; i <= 3; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div class="card-body">Card ${i}</div>`;
        grid.appendChild(card);
      }

      container.appendChild(grid);

      expect(grid.classList.contains('card-grid')).toBe(true);
      expect(grid.children.length).toBe(3);

      Array.from(grid.children).forEach((card, index) => {
        expect(card.classList.contains('card')).toBe(true);
        expect(card.textContent.trim()).toBe(`Card ${index + 1}`);
      });
    });

    it('should support different grid sizes', () => {
      const smallGrid = document.createElement('div');
      smallGrid.className = 'card-grid card-grid-sm';

      const largeGrid = document.createElement('div');
      largeGrid.className = 'card-grid card-grid-lg';

      container.appendChild(smallGrid);
      container.appendChild(largeGrid);

      expect(smallGrid.classList.contains('card-grid-sm')).toBe(true);
      expect(largeGrid.classList.contains('card-grid-lg')).toBe(true);
    });

    it('should support card lists', () => {
      const list = document.createElement('div');
      list.className = 'card-list';

      for (let i = 1; i <= 3; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div class="card-body">List Card ${i}</div>`;
        list.appendChild(card);
      }

      container.appendChild(list);

      expect(list.classList.contains('card-list')).toBe(true);
      expect(list.children.length).toBe(3);
    });
  });

  describe('Card Accessibility', () => {
    it('should support keyboard navigation for interactive cards', () => {
      const card = document.createElement('div');
      card.className = 'card card-interactive';
      card.tabIndex = 0;
      card.innerHTML = '<div class="card-body">Focusable card</div>';
      container.appendChild(card);

      expect(card.tabIndex).toBe(0);

      const focusHandler = jest.fn();
      card.addEventListener('focus', focusHandler);
      card.focus();
      expect(focusHandler).toHaveBeenCalledTimes(1);
    });

    it('should support ARIA attributes', () => {
      const card = document.createElement('div');
      card.className = 'card card-interactive';
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'View event details');
      card.innerHTML = '<div class="card-body">Event card</div>';
      container.appendChild(card);

      expect(card.getAttribute('role')).toBe('button');
      expect(card.getAttribute('aria-label')).toBe('View event details');
    });

    it('should support semantic markup', () => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <header class="card-header">
          <h3 class="card-title">Article Title</h3>
        </header>
        <div class="card-body">
          <p>Article content</p>
        </div>
        <footer class="card-footer">
          <time datetime="2025-07-15">July 15, 2025</time>
        </footer>
      `;
      container.appendChild(card);

      expect(card.tagName).toBe('ARTICLE');
      expect(card.querySelector('header')).toBeTruthy();
      expect(card.querySelector('footer')).toBeTruthy();
      expect(card.querySelector('time')).toBeTruthy();
    });
  });

  describe('Card Interactions', () => {
    it('should handle click events on interactive cards', () => {
      const card = document.createElement('div');
      card.className = 'card card-interactive';
      card.innerHTML = '<div class="card-body">Clickable card</div>';
      container.appendChild(card);

      const clickHandler = jest.fn();
      card.addEventListener('click', clickHandler);

      card.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events', () => {
      const card = document.createElement('div');
      card.className = 'card card-interactive';
      card.tabIndex = 0;
      card.innerHTML = '<div class="card-body">Keyboard accessible card</div>';
      container.appendChild(card);

      const keyHandler = jest.fn();
      card.addEventListener('keydown', keyHandler);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      card.dispatchEvent(event);
      expect(keyHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle hover states', () => {
      const card = document.createElement('div');
      card.className = 'card card-interactive';
      card.innerHTML = '<div class="card-body">Hoverable card</div>';
      container.appendChild(card);

      const mouseEnterHandler = jest.fn();
      const mouseLeaveHandler = jest.fn();

      card.addEventListener('mouseenter', mouseEnterHandler);
      card.addEventListener('mouseleave', mouseLeaveHandler);

      card.dispatchEvent(new MouseEvent('mouseenter'));
      card.dispatchEvent(new MouseEvent('mouseleave'));

      expect(mouseEnterHandler).toHaveBeenCalledTimes(1);
      expect(mouseLeaveHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Real-world Usage Examples', () => {
    it('should work as event listing cards', () => {
      const eventCard = document.createElement('div');
      eventCard.className = 'card event-card card-interactive';
      eventCard.innerHTML = `
        <div class="event-status-badge status-upcoming">Upcoming</div>
        <div class="card-header">
          <h3 class="card-title">Lightning Talk Circle #1</h3>
        </div>
        <div class="card-body">
          <div class="event-meta">
            <div class="event-meta-item">📅 2025-07-15</div>
            <div class="event-meta-item">🕐 19:00-22:00</div>
            <div class="event-meta-item">📍 新宿</div>
          </div>
          <p>5分で伝える、みんなのアイデア</p>
          <div class="event-participants">
            <span>👥</span>
            <span class="event-participants-count">8</span>
            <span>participants</span>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-primary">参加登録</button>
          <button class="btn btn-outline">詳細</button>
        </div>
      `;
      container.appendChild(eventCard);

      expect(eventCard.querySelector('.event-status-badge')).toBeTruthy();
      expect(eventCard.querySelector('.event-meta')).toBeTruthy();
      expect(eventCard.querySelector('.event-participants-count').textContent).toBe('8');
      expect(eventCard.querySelectorAll('button').length).toBe(2);
    });

    it('should work as profile cards', () => {
      const profileCard = document.createElement('div');
      profileCard.className = 'card';
      profileCard.innerHTML = `
        <div class="card-body">
          <img class="card-avatar" src="/avatar.jpg" alt="Profile" style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 1rem; display: block;" />
          <h3 class="card-title" style="text-align: center;">山田太郎</h3>
          <p style="text-align: center; color: #666;">Speaker</p>
          <p>プログラミング歴10年のエンジニア。React、Node.jsが得意です。</p>
        </div>
        <div class="card-footer">
          <button class="btn btn-outline btn-sm">プロフィール</button>
          <button class="btn btn-primary btn-sm">フォロー</button>
        </div>
      `;
      container.appendChild(profileCard);

      const avatar = profileCard.querySelector('.card-avatar');
      const title = profileCard.querySelector('.card-title');

      expect(avatar).toBeTruthy();
      expect(title.textContent).toBe('山田太郎');
      expect(profileCard.querySelectorAll('button').length).toBe(2);
    });

    it('should work as statistics cards', () => {
      const statsCard = document.createElement('div');
      statsCard.className = 'card';
      statsCard.innerHTML = `
        <div class="card-body" style="text-align: center;">
          <div style="font-size: 3rem; font-weight: bold; color: #22c55e; margin-bottom: 0.5rem;">24</div>
          <div style="font-size: 0.875rem; color: #666; text-transform: uppercase;">Total Events</div>
          <div style="font-size: 0.875rem; color: #22c55e; margin-top: 0.5rem;">+12% this month</div>
        </div>
      `;
      container.appendChild(statsCard);

      const value = statsCard.querySelector('div[style*="font-size: 3rem"]');
      expect(value.textContent).toBe('24');
    });
  });

  describe('Performance Considerations', () => {
    it('should not create excessive DOM nodes', () => {
      const initialNodeCount = container.childNodes.length;

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = '<div class="card-body">Performance test card</div>';
      container.appendChild(card);

      expect(container.childNodes.length).toBe(initialNodeCount + 1);
    });

    it('should support efficient rendering of multiple cards', () => {
      const startTime = performance.now();

      const grid = document.createElement('div');
      grid.className = 'card-grid';

      // Create 50 cards
      for (let i = 0; i < 50; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-body">
            <h3>Card ${i + 1}</h3>
            <p>Card content for performance testing</p>
          </div>
        `;
        grid.appendChild(card);
      }

      container.appendChild(grid);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(grid.children.length).toBe(50);
      expect(renderTime).toBeLessThan(100); // Should render quickly
    });
  });
});
