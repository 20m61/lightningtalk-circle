/**
 * Form Validation Tests
 */

import { jest } from '@jest/globals';

// Mock DOM environment
const mockField = {
  name: 'test',
  value: '',
  hasAttribute: jest.fn(),
  getAttribute: jest.fn(),
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn()
  },
  closest: jest.fn(() => ({
    querySelector: jest.fn(() => ({
      textContent: '',
      style: {}
    }))
  })),
  addEventListener: jest.fn()
};

// Mock LightningTalkApp with form validation methods
class MockLightningTalkApp {
  validateField(field, type) {
    const fieldName = field.name;
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'この項目は必須です';
    }
    // Email validation
    else if (fieldName === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = '有効なメールアドレスを入力してください';
      }
    }
    // Name validation
    else if (fieldName === 'name' && value) {
      if (value.length < 1 || value.length > 100) {
        isValid = false;
        errorMessage = '名前は1文字以上100文字以内で入力してください';
      }
    }
    // Talk title validation
    else if (fieldName === 'talkTitle' && value) {
      if (value.length < 1 || value.length > 200) {
        isValid = false;
        errorMessage = 'タイトルは1文字以上200文字以内で入力してください';
      }
    }
    // Talk description validation
    else if (fieldName === 'talkDescription' && value) {
      if (value.length < 1 || value.length > 2000) {
        isValid = false;
        errorMessage = '発表概要は1文字以上2000文字以内で入力してください';
      }
    }
    // Message validation
    else if (fieldName === 'message' && value && value.length > 1000) {
      isValid = false;
      errorMessage = 'メッセージは1000文字以内で入力してください';
    }

    return { isValid, errorMessage };
  }

  showFieldError(field, message) {
    field.classList.add('field-invalid');
    return { field, message };
  }

  clearFieldError(field) {
    field.classList.remove('field-invalid');
  }
}

describe('Form Validation', () => {
  let app;

  beforeEach(() => {
    app = new MockLightningTalkApp();
    jest.clearAllMocks();
  });

  describe('validateField', () => {
    test('should validate required fields', () => {
      const field = {
        ...mockField,
        name: 'name',
        value: '',
        hasAttribute: jest.fn(() => true)
      };

      const result = app.validateField(field, 'general');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('この項目は必須です');
    });

    test('should validate email format', () => {
      const field = {
        ...mockField,
        name: 'email',
        value: 'invalid-email',
        hasAttribute: jest.fn(() => false)
      };

      const result = app.validateField(field, 'general');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('有効なメールアドレスを入力してください');
    });

    test('should accept valid email', () => {
      const field = {
        ...mockField,
        name: 'email',
        value: 'test@example.com',
        hasAttribute: jest.fn(() => false)
      };

      const result = app.validateField(field, 'general');
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBe('');
    });

    test('should validate name length', () => {
      const field = {
        ...mockField,
        name: 'name',
        value: 'a'.repeat(101),
        hasAttribute: jest.fn(() => false)
      };

      const result = app.validateField(field, 'general');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('名前は1文字以上100文字以内で入力してください');
    });

    test('should validate talk title length', () => {
      const field = {
        ...mockField,
        name: 'talkTitle',
        value: 'a'.repeat(201),
        hasAttribute: jest.fn(() => false)
      };

      const result = app.validateField(field, 'speaker');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('タイトルは1文字以上200文字以内で入力してください');
    });

    test('should validate talk description length', () => {
      const field = {
        ...mockField,
        name: 'talkDescription',
        value: 'a'.repeat(2001),
        hasAttribute: jest.fn(() => false)
      };

      const result = app.validateField(field, 'speaker');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('発表概要は1文字以上2000文字以内で入力してください');
    });

    test('should validate message length', () => {
      const field = {
        ...mockField,
        name: 'message',
        value: 'a'.repeat(1001),
        hasAttribute: jest.fn(() => false)
      };

      const result = app.validateField(field, 'general');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('メッセージは1000文字以内で入力してください');
    });

    test('should pass validation for valid inputs', () => {
      const validCases = [
        { name: 'name', value: '山田太郎' },
        { name: 'email', value: 'yamada@example.com' },
        { name: 'talkTitle', value: '素晴らしい発表' },
        { name: 'talkDescription', value: 'この発表では...という内容をお話します。' },
        { name: 'message', value: 'よろしくお願いします。' }
      ];

      validCases.forEach(testCase => {
        const field = {
          ...mockField,
          name: testCase.name,
          value: testCase.value,
          hasAttribute: jest.fn(() => false)
        };

        const result = app.validateField(field, 'general');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBe('');
      });
    });
  });

  describe('showFieldError', () => {
    test('should add error class to field', () => {
      const field = { ...mockField };
      const message = 'Test error message';

      app.showFieldError(field, message);
      expect(field.classList.add).toHaveBeenCalledWith('field-invalid');
    });
  });

  describe('clearFieldError', () => {
    test('should remove error class from field', () => {
      const field = { ...mockField };

      app.clearFieldError(field);
      expect(field.classList.remove).toHaveBeenCalledWith('field-invalid');
    });
  });
});
