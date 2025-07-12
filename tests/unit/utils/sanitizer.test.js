/**
 * Sanitizer Utility Tests
 */

import { jest } from '@jest/globals';
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeObject,
  sanitizeMiddleware
} from '../../../server/utils/sanitizer.js';

describe('Sanitizer Utils', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const output = sanitizeHtml(input);
      expect(output).toBe('<p>Hello <strong>world</strong>!</p>');
    });

    it('should remove dangerous script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const output = sanitizeHtml(input);
      expect(output).toBe('<p>Hello</p>');
    });

    it('should remove event handlers', () => {
      const input = '<p onclick="alert(\'XSS\')">Click me</p>';
      const output = sanitizeHtml(input);
      expect(output).toBe('<p>Click me</p>');
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
      expect(sanitizeHtml(123)).toBe('');
    });

    it('should allow safe links', () => {
      const input = '<a href="https://example.com" target="_blank">Link</a>';
      const output = sanitizeHtml(input);
      expect(output).toContain('href="https://example.com"');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Bad Link</a>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('javascript:');
    });
  });

  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const output = sanitizeText(input);
      expect(output).toBe('Hello world!');
    });

    it('should decode HTML entities', () => {
      const input = 'Hello &amp; welcome &lt;user&gt;';
      const output = sanitizeText(input);
      expect(output).toBe('Hello & welcome <user>');
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values in object', () => {
      const input = {
        name: '<script>alert("XSS")</script>John',
        description: '<p>Test</p>',
        age: 25
      };
      const output = sanitizeObject(input);

      expect(output.name).toBe('John');
      expect(output.description).toBe('Test');
      expect(output.age).toBe(25);
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<b>John</b>',
          profile: {
            bio: '<script>bad</script>Hello'
          }
        }
      };
      const output = sanitizeObject(input);

      expect(output.user.name).toBe('John');
      expect(output.user.profile.bio).toBe('Hello');
    });

    it('should handle arrays', () => {
      const input = {
        tags: ['<b>tag1</b>', '<script>tag2</script>']
      };
      const output = sanitizeObject(input);

      // sanitizeObject uses sanitizeText by default, which removes ALL HTML
      expect(output.tags[0]).toBe('tag1');
      expect(output.tags[1]).toBe('tag2');
    });

    it('should handle null and non-objects', () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject('string')).toBe('string');
      expect(sanitizeObject(123)).toBe(123);
    });
  });

  describe('sanitizeMiddleware', () => {
    it('should sanitize request body', () => {
      const req = {
        body: {
          name: '<script>alert("XSS")</script>John',
          description: '<p>Test</p>'
        }
      };
      const res = {};
      const next = jest.fn();

      const middleware = sanitizeMiddleware();
      middleware(req, res, next);

      expect(req.body.name).toBe('John');
      expect(req.body.description).toBe('Test');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize only specified fields', () => {
      const req = {
        body: {
          name: '<script>alert("XSS")</script>John',
          description: '<p>Test</p>'
        }
      };
      const res = {};
      const next = jest.fn();

      const middleware = sanitizeMiddleware(['name']);
      middleware(req, res, next);

      expect(req.body.name).toBe('John');
      expect(req.body.description).toBe('<p>Test</p>'); // Not sanitized
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing body', () => {
      const req = {};
      const res = {};
      const next = jest.fn();

      const middleware = sanitizeMiddleware();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should use custom sanitizer', () => {
      const req = {
        body: {
          content: '<p>Hello</p>'
        }
      };
      const res = {};
      const next = jest.fn();
      const customSanitizer = jest.fn(val => val.toUpperCase());

      const middleware = sanitizeMiddleware([], customSanitizer);
      middleware(req, res, next);

      expect(customSanitizer).toHaveBeenCalledWith('<p>Hello</p>');
      expect(next).toHaveBeenCalled();
    });
  });
});
