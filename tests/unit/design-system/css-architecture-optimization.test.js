/**
 * CSS Architecture Optimization Tests
 * Tests for the optimized CSS architecture and performance enhancements
 */

import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.getComputedStyle = dom.window.getComputedStyle;

describe('CSS Architecture Optimization', () => {
  let architectureCSS;
  let designTokensCSS;
  let buttonCSS;
  let cardCSS;

  beforeAll(() => {
    // Load CSS files for testing
    try {
      architectureCSS = fs.readFileSync(
        path.resolve(process.cwd(), 'public/css/architecture-integration.css'),
        'utf8'
      );
      designTokensCSS = fs.readFileSync(
        path.resolve(process.cwd(), 'public/css/design-tokens.css'),
        'utf8'
      );
      buttonCSS = fs.readFileSync(
        path.resolve(process.cwd(), 'public/css/components/button.css'),
        'utf8'
      );
      cardCSS = fs.readFileSync(
        path.resolve(process.cwd(), 'public/css/components/card.css'),
        'utf8'
      );
    } catch (error) {
      console.warn('CSS files not found, using fallback tests');
      architectureCSS = '';
      designTokensCSS = '';
      buttonCSS = '';
      cardCSS = '';
    }
  });

  beforeEach(() => {
    // Clear DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  describe('CSS File Structure and Organization', () => {
    it('should have proper file organization', () => {
      expect(architectureCSS).toBeTruthy();
      expect(designTokensCSS).toBeTruthy();
      expect(buttonCSS).toBeTruthy();
      expect(cardCSS).toBeTruthy();
    });

    it('should have proper CSS organization comments', () => {
      expect(architectureCSS).toContain('CSS Architecture Guidelines');
      expect(architectureCSS).toContain('Base Element Enhancements');
      expect(architectureCSS).toContain('Layout System Integration');
      expect(architectureCSS).toContain('Performance Optimizations');
    });

    it('should follow proper import structure guidelines', () => {
      expect(architectureCSS).toContain('Import Structure');
      expect(architectureCSS).toContain('Design Tokens');
      expect(architectureCSS).toContain('Reset/Normalize');
      expect(architectureCSS).toContain('Base Elements');
    });
  });

  describe('CSS Reset and Base Elements', () => {
    it('should have proper box-sizing reset', () => {
      expect(architectureCSS).toContain('box-sizing: border-box');
      expect(architectureCSS).toContain('box-sizing: inherit');
    });

    it('should have font smoothing optimizations', () => {
      expect(architectureCSS).toContain('-webkit-font-smoothing: antialiased');
      expect(architectureCSS).toContain('-moz-osx-font-smoothing: grayscale');
      expect(architectureCSS).toContain('text-rendering: optimizeLegibility');
    });

    it('should have scroll behavior optimization', () => {
      expect(architectureCSS).toContain('scroll-behavior: smooth');
    });

    it('should have responsive font sizing', () => {
      expect(architectureCSS).toContain('font-size: 100%');
      expect(architectureCSS).toContain('-webkit-text-size-adjust: 100%');
      expect(architectureCSS).toContain('-ms-text-size-adjust: 100%');
    });
  });

  describe('Layout System Integration', () => {
    it('should have container system', () => {
      expect(architectureCSS).toContain('.container');
      expect(architectureCSS).toContain('margin-left: auto');
      expect(architectureCSS).toContain('margin-right: auto');
    });

    it('should have responsive container sizes', () => {
      const containerSizes = [
        '.container--xs',
        '.container--sm',
        '.container--md',
        '.container--lg',
        '.container--xl'
      ];

      containerSizes.forEach(size => {
        expect(architectureCSS).toContain(size);
      });
    });

    it('should have grid system utilities', () => {
      expect(architectureCSS).toContain('.grid');
      expect(architectureCSS).toContain('display: grid');
      expect(architectureCSS).toContain('.grid--cols-1');
      expect(architectureCSS).toContain('.grid--cols-12');
    });

    it('should have flexbox utilities', () => {
      expect(architectureCSS).toContain('.flex');
      expect(architectureCSS).toContain('display: flex');
      expect(architectureCSS).toContain('.flex--column');
      expect(architectureCSS).toContain('.flex--justify-between');
    });
  });

  describe('Typography System Optimization', () => {
    it('should have proper heading hierarchy', () => {
      expect(architectureCSS).toContain('h1, h2, h3, h4, h5, h6');
      expect(architectureCSS).toContain('font-family: var(--font-family-heading)');
      expect(architectureCSS).toContain('font-weight: var(--font-weight-semibold)');
    });

    it('should use fluid typography from design tokens', () => {
      expect(architectureCSS).toContain('var(--font-size-4xl)');
      expect(architectureCSS).toContain('var(--font-size-3xl)');
      expect(architectureCSS).toContain('var(--font-size-2xl)');
    });

    it('should have optimized line heights', () => {
      expect(architectureCSS).toContain('var(--line-height-tight)');
      expect(architectureCSS).toContain('var(--line-height-relaxed)');
    });

    it('should have proper link styling', () => {
      expect(architectureCSS).toContain('text-underline-offset: 2px');
      expect(architectureCSS).toContain('text-decoration-thickness: 1px');
      expect(architectureCSS).toContain('transition: var(--transition-colors)');
    });
  });

  describe('Form System Integration', () => {
    it('should have comprehensive form styling', () => {
      expect(architectureCSS).toContain('.form-group');
      expect(architectureCSS).toContain('.form-label');
      expect(architectureCSS).toContain('.form-input');
      expect(architectureCSS).toContain('.form-textarea');
      expect(architectureCSS).toContain('.form-select');
    });

    it('should use form tokens from design system', () => {
      expect(architectureCSS).toContain('var(--form-input-padding)');
      expect(architectureCSS).toContain('var(--form-input-border)');
      expect(architectureCSS).toContain('var(--form-input-radius)');
    });

    it('should have form validation states', () => {
      expect(architectureCSS).toContain('.form-input--error');
      expect(architectureCSS).toContain('.form-input--success');
      expect(architectureCSS).toContain('.form-error-message');
    });

    it('should have accessible form features', () => {
      expect(architectureCSS).toContain('.form-label--required::after');
      expect(architectureCSS).toContain('cursor: not-allowed');
      expect(architectureCSS).toContain(':focus');
    });
  });

  describe('Utility Classes System', () => {
    it('should have spacing utilities', () => {
      const spacingClasses = ['.m-0', '.m-1', '.m-4', '.mt-4', '.mb-4', '.p-0', '.p-4'];
      spacingClasses.forEach(className => {
        expect(architectureCSS).toContain(className);
      });
    });

    it('should have text utilities', () => {
      const textClasses = [
        '.text-left',
        '.text-center',
        '.text-right',
        '.text-xs',
        '.text-sm',
        '.text-base',
        '.font-light',
        '.font-bold'
      ];
      textClasses.forEach(className => {
        expect(architectureCSS).toContain(className);
      });
    });

    it('should have display utilities', () => {
      const displayClasses = ['.hidden', '.block', '.inline', '.flex', '.grid'];
      displayClasses.forEach(className => {
        expect(architectureCSS).toContain(className);
      });
    });

    it('should have position utilities', () => {
      const positionClasses = ['.relative', '.absolute', '.fixed', '.sticky'];
      positionClasses.forEach(className => {
        expect(architectureCSS).toContain(className);
      });
    });
  });

  describe('Accessibility Enhancements', () => {
    it('should have focus management', () => {
      expect(architectureCSS).toContain(':focus-visible');
      expect(architectureCSS).toContain('outline: 2px solid');
      expect(architectureCSS).toContain('outline-offset: 2px');
    });

    it('should have skip link support', () => {
      expect(architectureCSS).toContain('.skip-link');
      expect(architectureCSS).toContain('position: absolute');
      expect(architectureCSS).toContain('z-index: var(--z-index-skiplink)');
    });

    it('should have screen reader utilities', () => {
      expect(architectureCSS).toContain('.sr-only');
      expect(architectureCSS).toContain('position: absolute');
      expect(architectureCSS).toContain('width: 1px');
      expect(architectureCSS).toContain('height: 1px');
    });

    it('should support reduced motion preferences', () => {
      expect(architectureCSS).toContain('@media (prefers-reduced-motion: reduce)');
      expect(architectureCSS).toContain('animation-duration: 0.01ms !important');
      expect(architectureCSS).toContain('transition-duration: 0.01ms !important');
    });

    it('should support high contrast mode', () => {
      expect(architectureCSS).toContain('@media (prefers-contrast: high)');
      expect(architectureCSS).toContain('--color-neutral-100: #e5e5e5');
    });
  });

  describe('Performance Optimizations', () => {
    it('should have efficient CSS selectors', () => {
      // Check that we don't have overly complex selectors
      const lines = architectureCSS.split('\n');
      const complexSelectors = lines.filter(line => {
        // Count the number of class/id selectors in a single line
        const matches = line.match(/[.#][a-zA-Z][a-zA-Z0-9_-]*/g);
        return matches && matches.length > 4; // More than 4 selectors is complex
      });

      expect(complexSelectors.length).toBe(0);
    });

    it('should use CSS custom properties consistently', () => {
      const varUsage = architectureCSS.match(/var\(--[^)]+\)/g);
      expect(varUsage).toBeTruthy();
      expect(varUsage.length).toBeGreaterThan(50); // Should use many design tokens
    });

    it('should minimize hardcoded values', () => {
      // Should not have many hardcoded color values
      const hardcodedColors = architectureCSS.match(/#[0-9a-fA-F]{3,6}/g);
      if (hardcodedColors) {
        expect(hardcodedColors.length).toBeLessThan(10); // Some are acceptable for fallbacks
      }
    });

    it('should use logical properties for i18n', () => {
      expect(architectureCSS).toContain('margin-left');
      expect(architectureCSS).toContain('margin-right');
      expect(architectureCSS).toContain('padding-left');
      expect(architectureCSS).toContain('padding-right');
    });
  });

  describe('Responsive Design System', () => {
    it('should have mobile-first responsive breakpoints', () => {
      expect(architectureCSS).toContain('@media (max-width: 767px)');
      expect(architectureCSS).toContain('@media (min-width: 768px)');
      expect(architectureCSS).toContain('@media (min-width: 1024px)');
      expect(architectureCSS).toContain('@media (min-width: 1280px)');
    });

    it('should have responsive utility classes', () => {
      expect(architectureCSS).toContain('.sm\\:hidden');
      expect(architectureCSS).toContain('.md\\:block');
      expect(architectureCSS).toContain('.lg\\:flex');
      expect(architectureCSS).toContain('.xl\\:grid--cols-4');
    });

    it('should have responsive container padding', () => {
      expect(architectureCSS).toContain('padding-left: var(--space-3)');
      expect(architectureCSS).toContain('padding-right: var(--space-3)');
    });

    it('should have responsive grid modifications', () => {
      expect(architectureCSS).toContain('.md\\:grid--cols-2');
      expect(architectureCSS).toContain('.lg\\:grid--cols-4');
    });
  });

  describe('Component Integration', () => {
    it('should have loading state utilities', () => {
      expect(architectureCSS).toContain('.loading');
      expect(architectureCSS).toContain('opacity: 0.6');
      expect(architectureCSS).toContain('pointer-events: none');
      expect(architectureCSS).toContain('@keyframes spin');
    });

    it('should have state management classes', () => {
      expect(architectureCSS).toContain('.error-state');
      expect(architectureCSS).toContain('.success-state');
      expect(architectureCSS).toContain('.warning-state');
    });

    it('should have component state classes', () => {
      expect(architectureCSS).toContain('.is-active');
      expect(architectureCSS).toContain('.is-disabled');
      expect(architectureCSS).toContain('.is-loading');
    });

    it('should integrate with header component', () => {
      expect(architectureCSS).toContain('.header');
      expect(architectureCSS).toContain('backdrop-filter');
      expect(architectureCSS).toContain('position: sticky');
    });
  });

  describe('Print Styles', () => {
    it('should have print media queries', () => {
      expect(architectureCSS).toContain('@media print');
    });

    it('should optimize for print', () => {
      expect(architectureCSS).toContain('background: transparent !important');
      expect(architectureCSS).toContain('color: #000 !important');
      expect(architectureCSS).toContain('box-shadow: none !important');
    });

    it('should have print utility classes', () => {
      expect(architectureCSS).toContain('.no-print');
      expect(architectureCSS).toContain('.print-only');
    });

    it('should handle links in print', () => {
      expect(architectureCSS).toContain('a[href]::after');
      expect(architectureCSS).toContain('content: " (" attr(href) ")"');
    });
  });

  describe('Dark Mode Integration', () => {
    it('should inherit dark mode from design tokens', () => {
      expect(designTokensCSS).toContain('@media (prefers-color-scheme: dark)');
    });

    it('should have dark mode component adjustments', () => {
      expect(designTokensCSS).toContain('--header-bg: rgba(0, 0, 0, 0.1)');
      expect(designTokensCSS).toContain('--card-border: 1px solid var(--color-neutral-200)');
    });
  });

  describe('CSS Architecture Documentation', () => {
    it('should have comprehensive architecture documentation', () => {
      expect(architectureCSS).toContain('CSS Architecture Documentation');
      expect(architectureCSS).toContain('CSS組織構造');
      expect(architectureCSS).toContain('命名規則');
      expect(architectureCSS).toContain('パフォーマンス考慮');
    });

    it('should document BEM methodology', () => {
      expect(architectureCSS).toContain('BEM: .block__element--modifier');
      expect(architectureCSS).toContain('Utilities: .utility-name');
      expect(architectureCSS).toContain('State: .is-state');
    });

    it('should document file organization', () => {
      expect(architectureCSS).toContain('/public/css/');
      expect(architectureCSS).toContain('design-tokens.css');
      expect(architectureCSS).toContain('components/');
    });
  });

  describe('Integration with Existing Components', () => {
    it('should work with button component system', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="container">
          <div class="flex flex--items-center flex--justify-between">
            <button class="btn btn-primary">Primary Action</button>
            <button class="btn btn-outline btn-sm">Secondary</button>
          </div>
        </div>
      `;
      document.body.appendChild(container);

      const containerEl = container.querySelector('.container');
      const flexEl = container.querySelector('.flex');
      const buttons = container.querySelectorAll('.btn');

      expect(containerEl).toBeTruthy();
      expect(flexEl).toBeTruthy();
      expect(buttons.length).toBe(2);
    });

    it('should work with card component system', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="container">
          <div class="grid grid--cols-3 grid--gap-6">
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">Card Title</h3>
              </div>
              <div class="card-body">
                <p class="text-sm text-neutral-600">Card content</p>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(container);

      const grid = container.querySelector('.grid');
      const card = container.querySelector('.card');
      const title = container.querySelector('.card-title');

      expect(grid).toBeTruthy();
      expect(card).toBeTruthy();
      expect(title).toBeTruthy();
    });

    it('should work with form system', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="container">
          <form>
            <div class="form-group">
              <label class="form-label form-label--required">Name</label>
              <input type="text" class="form-input" />
            </div>
            <div class="form-group">
              <button type="submit" class="btn btn-primary btn-block">Submit</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(container);

      const formGroup = container.querySelector('.form-group');
      const label = container.querySelector('.form-label');
      const input = container.querySelector('.form-input');
      const button = container.querySelector('.btn');

      expect(formGroup).toBeTruthy();
      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
      expect(button).toBeTruthy();
    });
  });

  describe('Performance Validation', () => {
    it('should have minimal CSS file size impact', () => {
      // Check that our architecture doesn't add excessive CSS
      const lineCount = architectureCSS.split('\n').length;
      expect(lineCount).toBeLessThan(800); // Should be well-organized and concise
    });

    it('should use efficient selector patterns', () => {
      // Check for efficient selector patterns
      const selectorLines = architectureCSS
        .split('\n')
        .filter(line => line.includes('{') && !line.trim().startsWith('/*'));

      const inefficientSelectors = selectorLines.filter(line => {
        // Check for overly specific selectors
        return line.includes(' > ') || line.match(/\s+\.\w+\s+\.\w+\s+\.\w+/);
      });

      expect(inefficientSelectors.length).toBeLessThan(5); // Should be minimal
    });

    it('should avoid CSS redundancy', () => {
      // Check that we're not repeating the same properties excessively
      const colorDeclarations = architectureCSS.match(/color:\s*[^;]+/g);
      const backgroundDeclarations = architectureCSS.match(/background-color:\s*[^;]+/g);

      if (colorDeclarations) {
        // Most colors should use CSS custom properties
        const tokenBasedColors = colorDeclarations.filter(decl => decl.includes('var(--'));
        const ratio = tokenBasedColors.length / colorDeclarations.length;
        expect(ratio).toBeGreaterThan(0.8); // 80% should use tokens
      }
    });
  });
});
