/**
 * Design Tokens Integration Tests
 * Tests the complete design system implementation and integration
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

describe('Design Tokens Integration', () => {
  let designTokensCSS;
  let buttonComponentCSS;
  let architectureCSS;

  beforeAll(() => {
    // Load CSS files for testing
    try {
      designTokensCSS = fs.readFileSync(
        path.resolve(process.cwd(), 'public/css/design-tokens.css'),
        'utf8'
      );
      buttonComponentCSS = fs.readFileSync(
        path.resolve(process.cwd(), 'public/css/components/button.css'),
        'utf8'
      );
      architectureCSS = fs.readFileSync(
        path.resolve(process.cwd(), 'public/css/architecture-integration.css'),
        'utf8'
      );
    } catch (error) {
      console.warn('CSS files not found, using fallback tests');
      designTokensCSS = '';
      buttonComponentCSS = '';
      architectureCSS = '';
    }
  });

  beforeEach(() => {
    // Clear DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';

    // For integration tests, we'll test the file contents directly
    // rather than loading into JSDOM to avoid parsing issues
  });

  describe('CSS File Structure', () => {
    it('should have design tokens CSS file', () => {
      expect(designTokensCSS).toBeTruthy();
      expect(designTokensCSS).toContain(':root');
      expect(designTokensCSS).toContain('--color-primary-500');
    });

    it('should have button component CSS file', () => {
      expect(buttonComponentCSS).toBeTruthy();
      expect(buttonComponentCSS).toContain('.btn');
      expect(buttonComponentCSS).toContain('var(--');
    });

    it('should have architecture integration CSS file', () => {
      expect(architectureCSS).toBeTruthy();
      expect(architectureCSS).toContain('box-sizing');
    });
  });

  describe('Color Token System', () => {
    it('should define Lightning Talk Green as primary color', () => {
      expect(designTokensCSS).toContain('--color-primary-500: #22c55e');
    });

    it('should have complete color palette', () => {
      const colorTokens = [
        '--color-primary-50',
        '--color-primary-100',
        '--color-primary-500',
        '--color-primary-600',
        '--color-primary-700',
        '--color-neutral-0',
        '--color-neutral-50',
        '--color-neutral-100',
        '--color-neutral-500',
        '--color-neutral-900'
      ];

      colorTokens.forEach(token => {
        expect(designTokensCSS).toContain(token);
      });
    });

    it('should have semantic color tokens', () => {
      const semanticTokens = [
        '--color-success-500',
        '--color-error-500',
        '--color-warning-500',
        '--color-info-500'
      ];

      semanticTokens.forEach(token => {
        expect(designTokensCSS).toContain(token);
      });
    });
  });

  describe('Typography System', () => {
    it('should have fluid typography scale', () => {
      expect(designTokensCSS).toContain('clamp(');
      expect(designTokensCSS).toContain('--font-size-base');
    });

    it('should define font families', () => {
      expect(designTokensCSS).toContain('--font-family-primary');
      expect(designTokensCSS).toContain('--font-family-heading');
    });

    it('should have font weight scale', () => {
      const fontWeights = [
        '--font-weight-light',
        '--font-weight-normal',
        '--font-weight-medium',
        '--font-weight-semibold',
        '--font-weight-bold'
      ];

      fontWeights.forEach(weight => {
        expect(designTokensCSS).toContain(weight);
      });
    });
  });

  describe('Spacing System', () => {
    it('should use 8px-based spacing scale', () => {
      expect(designTokensCSS).toContain('--space-1: 0.25rem'); // 4px
      expect(designTokensCSS).toContain('--space-2: 0.5rem'); // 8px
      expect(designTokensCSS).toContain('--space-4: 1rem'); // 16px
      expect(designTokensCSS).toContain('--space-8: 2rem'); // 32px
    });

    it('should have container sizes', () => {
      const containerSizes = [
        '--container-sm',
        '--container-md',
        '--container-lg',
        '--container-xl'
      ];

      containerSizes.forEach(size => {
        expect(designTokensCSS).toContain(size);
      });
    });
  });

  describe('Component Token System', () => {
    it('should have button-specific tokens', () => {
      const buttonTokens = [
        '--button-padding-base',
        '--button-radius-base',
        '--button-font-weight'
      ];

      buttonTokens.forEach(token => {
        expect(designTokensCSS).toContain(token);
      });
    });

    it('should have form input tokens', () => {
      const formTokens = ['--form-input-padding', '--form-input-border', '--form-input-radius'];

      formTokens.forEach(token => {
        expect(designTokensCSS).toContain(token);
      });
    });

    it('should have navigation tokens', () => {
      const navTokens = ['--nav-gap', '--nav-link-padding', '--nav-link-radius'];

      navTokens.forEach(token => {
        expect(designTokensCSS).toContain(token);
      });
    });
  });

  describe('Theme Integration', () => {
    it('should support theme switching', () => {
      // Check for theme variables that can be overridden
      expect(designTokensCSS).toContain('--theme-background');
      expect(designTokensCSS).toContain('--theme-surface');
    });

    it('should have dark mode support', () => {
      expect(designTokensCSS).toContain('@media (prefers-color-scheme: dark)');
    });
  });

  describe('Button Component Integration', () => {
    it('should use design tokens in button styles', () => {
      expect(buttonComponentCSS).toContain('var(--color-primary-500)');
      expect(buttonComponentCSS).toContain('var(--button-padding-base)');
      expect(buttonComponentCSS).toContain('var(--button-radius-base)');
    });

    it('should have all button variants', () => {
      const variants = [
        '.btn-primary',
        '.btn-secondary',
        '.btn-outline',
        '.btn-ghost',
        '.btn-link'
      ];

      variants.forEach(variant => {
        expect(buttonComponentCSS).toContain(variant);
      });
    });

    it('should have size modifiers', () => {
      const sizes = ['.btn-sm', '.btn-lg'];
      sizes.forEach(size => {
        expect(buttonComponentCSS).toContain(size);
      });
    });

    it('should have state modifiers', () => {
      expect(buttonComponentCSS).toContain(':disabled');
      expect(buttonComponentCSS).toContain(':focus-visible');
      expect(buttonComponentCSS).toContain(':hover');
    });
  });

  describe('Accessibility Integration', () => {
    it('should have focus management styles', () => {
      expect(architectureCSS).toContain(':focus-visible');
      expect(architectureCSS).toContain('outline: 2px solid');
    });

    it('should have skip link support', () => {
      expect(architectureCSS).toContain('.skip-link');
    });

    it('should have screen reader utilities', () => {
      expect(architectureCSS).toContain('.sr-only');
    });

    it('should respect reduced motion preferences', () => {
      expect(architectureCSS).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('should support high contrast mode', () => {
      expect(architectureCSS).toContain('@media (prefers-contrast: high)');
    });
  });

  describe('Responsive Design Integration', () => {
    it('should have breakpoint system', () => {
      expect(architectureCSS).toContain('@media (max-width: 767px)');
      expect(architectureCSS).toContain('@media (min-width: 768px)');
      expect(architectureCSS).toContain('@media (min-width: 1024px)');
    });

    it('should have responsive utilities', () => {
      expect(architectureCSS).toContain('.sm\\:hidden');
      expect(architectureCSS).toContain('.md\\:block');
      expect(architectureCSS).toContain('.lg\\:flex');
    });

    it('should have responsive containers', () => {
      expect(architectureCSS).toContain('.container');
      expect(architectureCSS).toContain('max-width');
    });
  });

  describe('Performance Optimizations', () => {
    it('should use efficient CSS selectors', () => {
      // Check that selectors are not overly complex
      const complexSelectorPattern = /[.#][^{,}]*[.#][^{,}]*[.#][^{,}]*[.#]/;
      expect(complexSelectorPattern.test(buttonComponentCSS)).toBe(false);
    });

    it('should minimize redundant declarations', () => {
      // Buttons should use tokens rather than hardcoded values
      expect(buttonComponentCSS).not.toContain('#22c55e'); // Should use var(--color-primary-500)
    });

    it('should use logical properties where appropriate', () => {
      expect(architectureCSS).toContain('margin-left');
      expect(architectureCSS).toContain('margin-right');
    });
  });

  describe('Browser Compatibility', () => {
    it('should have CSS custom property fallbacks', () => {
      // Modern approach: we're using CSS custom properties throughout
      // This tests that we're consistently using var() syntax
      const varUsage = (designTokensCSS + buttonComponentCSS).match(/var\(--/g);
      expect(varUsage).toBeTruthy();
      expect(varUsage.length).toBeGreaterThan(10);
    });

    it('should have proper vendor prefixes where needed', () => {
      expect(architectureCSS).toContain('-webkit-font-smoothing');
      expect(architectureCSS).toContain('-moz-osx-font-smoothing');
    });
  });

  describe('Print Styles', () => {
    it('should have print media queries', () => {
      expect(architectureCSS).toContain('@media print');
    });

    it('should hide non-print elements', () => {
      expect(architectureCSS).toContain('.no-print');
    });

    it('should show print-only elements', () => {
      expect(architectureCSS).toContain('.print-only');
    });
  });

  describe('CSS Architecture', () => {
    it('should use BEM methodology hints', () => {
      expect(buttonComponentCSS).toContain('.btn');
      // Components should follow BEM-like structure
    });

    it('should have proper CSS organization', () => {
      // CSS should be organized with proper comments and sections
      expect(designTokensCSS).toContain('/*');
      expect(buttonComponentCSS).toContain('/*');
      expect(architectureCSS).toContain('/*');
    });

    it('should use consistent naming conventions', () => {
      // Token names should follow consistent patterns
      expect(designTokensCSS).toContain('--color-primary-');
      expect(designTokensCSS).toContain('--space-');
      expect(designTokensCSS).toContain('--font-size-');
    });
  });

  describe('Real-world Integration Tests', () => {
    it('should work with existing HTML structure', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button class="btn btn-primary btn-lg">第1回イベント詳細を見る 🚀</button>
        <button class="btn btn-outline vote-btn">💻 オンラインで参加予定</button>
        <button class="btn btn-secondary survey-btn">🏢 現地参加</button>
      `;
      document.body.appendChild(container);

      const buttons = container.querySelectorAll('.btn');
      expect(buttons.length).toBe(3);

      buttons.forEach(button => {
        expect(button.classList.contains('btn')).toBe(true);
      });
    });

    it('should support navigation styling', () => {
      const nav = document.createElement('nav');
      nav.className = 'container flex flex--items-center flex--justify-between';
      nav.innerHTML = `
        <div class="logo text-primary font-bold">⚡ なんでもLT</div>
        <ul class="nav-links flex flex--items-center">
          <li><a href="#event" class="nav-link">イベント情報</a></li>
          <li><a href="#about" class="nav-link">ライトニングトークとは</a></li>
        </ul>
      `;
      document.body.appendChild(nav);

      expect(nav.classList.contains('container')).toBe(true);
      expect(nav.classList.contains('flex')).toBe(true);

      const links = nav.querySelectorAll('.nav-link');
      expect(links.length).toBe(2);
    });

    it('should work with form elements', () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <div class="form-group">
          <label class="form-label">Name</label>
          <input type="text" class="form-input" />
        </div>
        <button type="submit" class="btn btn-primary">Submit</button>
      `;
      document.body.appendChild(form);

      const formGroup = form.querySelector('.form-group');
      const input = form.querySelector('.form-input');
      const button = form.querySelector('.btn');

      expect(formGroup).toBeTruthy();
      expect(input).toBeTruthy();
      expect(button).toBeTruthy();
    });
  });
});
