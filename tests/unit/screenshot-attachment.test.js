/**
 * Screenshot Attachment System - Unit Tests
 * PR用スクリーンショット添付機能のテスト
 */

import { jest } from '@jest/globals';

// Mock global objects
global.fetch = jest.fn();
global.FormData = jest.fn();
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

// Mock navigator
Object.defineProperty(global.navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn(() => Promise.resolve())
  }
});

// Mock document methods
global.document = {
  createElement: jest.fn(tag => {
    const element = {
      tagName: tag.toUpperCase(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      click: jest.fn(),
      remove: jest.fn(),
      querySelector: jest.fn(() => ({
        addEventListener: jest.fn(),
        style: {}
      })),
      style: {},
      innerHTML: '',
      textContent: '',
      className: '',
      id: ''
    };
    return element;
  }),
  getElementById: jest.fn(() => ({
    addEventListener: jest.fn(),
    querySelector: jest.fn(() => ({
      addEventListener: jest.fn(),
      style: {}
    })),
    style: {},
    remove: jest.fn()
  })),
  querySelector: jest.fn(),
  head: {
    appendChild: jest.fn()
  },
  body: {
    appendChild: jest.fn()
  },
  addEventListener: jest.fn()
};

describe('Screenshot Attachment System', () => {
  let ScreenshotAttachment;
  let mockFile;

  beforeAll(async () => {
    // Dynamic import for ES modules
    const module = await import('../../public/js/screenshot-attachment.js');
    ScreenshotAttachment = module.default;
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock file object
    mockFile = {
      name: 'test-screenshot.png',
      type: 'image/png',
      size: 1024 * 1024 // 1MB
    };

    // Mock fetch responses
    fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            uploadUrl: 'https://mock-s3-upload-url.com',
            downloadUrl: 'https://mock-s3-download-url.com',
            fileKey: 'pr-123/user123/mock-file-key.png'
          }
        })
    });
  });

  describe('Initialization', () => {
    test('should create instance with default options', () => {
      const screenshot = new ScreenshotAttachment();

      expect(screenshot.apiEndpoint).toBe('/api/screenshots');
      expect(screenshot.maxFileSize).toBe(10 * 1024 * 1024);
      expect(screenshot.allowedTypes).toContain('image/png');
      expect(screenshot.screenshots).toEqual([]);
    });

    test('should create instance with custom options', () => {
      const options = {
        apiEndpoint: '/custom/api',
        maxFileSize: 5 * 1024 * 1024,
        prNumber: 456,
        userId: 'custom-user'
      };

      const screenshot = new ScreenshotAttachment(options);

      expect(screenshot.apiEndpoint).toBe('/custom/api');
      expect(screenshot.maxFileSize).toBe(5 * 1024 * 1024);
      expect(screenshot.prNumber).toBe(456);
      expect(screenshot.userId).toBe('custom-user');
    });
  });

  describe('File Validation', () => {
    let screenshot;

    beforeEach(() => {
      screenshot = new ScreenshotAttachment();
      screenshot.showError = jest.fn();
    });

    test('should validate correct file types', () => {
      const validFiles = [
        { name: 'test.png', type: 'image/png', size: 1024 },
        { name: 'test.jpg', type: 'image/jpg', size: 1024 },
        { name: 'test.jpeg', type: 'image/jpeg', size: 1024 },
        { name: 'test.gif', type: 'image/gif', size: 1024 },
        { name: 'test.webp', type: 'image/webp', size: 1024 }
      ];

      validFiles.forEach(file => {
        expect(screenshot.validateFile(file)).toBe(true);
      });
    });

    test('should reject invalid file types', () => {
      const invalidFile = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024
      };

      expect(screenshot.validateFile(invalidFile)).toBe(false);
      expect(screenshot.showError).toHaveBeenCalledWith(
        expect.stringContaining('ファイル形式がサポートされていません')
      );
    });

    test('should reject files that are too large', () => {
      const largeFile = {
        name: 'large.png',
        type: 'image/png',
        size: 20 * 1024 * 1024 // 20MB
      };

      expect(screenshot.validateFile(largeFile)).toBe(false);
      expect(screenshot.showError).toHaveBeenCalledWith(expect.stringContaining('ファイルサイズが大きすぎます'));
    });
  });

  describe('File Upload Process', () => {
    let screenshot;

    beforeEach(() => {
      screenshot = new ScreenshotAttachment({
        prNumber: 123,
        userId: 'test-user'
      });
      screenshot.addScreenshotToUI = jest.fn();
      screenshot.updateScreenshotStatus = jest.fn();
      screenshot.updateMarkdownOutput = jest.fn();
      screenshot.showError = jest.fn();
    });

    test('should upload file successfully', async () => {
      await screenshot.uploadFile(mockFile);

      // Should call presigned URL API
      expect(fetch).toHaveBeenCalledWith('/api/screenshots/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: mockFile.name,
          contentType: mockFile.type,
          prNumber: 123,
          userId: 'test-user'
        })
      });

      // Should add to UI
      expect(screenshot.addScreenshotToUI).toHaveBeenCalledWith(expect.any(String), mockFile, 'uploading');

      // Should update status to uploaded
      expect(screenshot.updateScreenshotStatus).toHaveBeenCalledWith(expect.any(String), 'uploaded');

      // Should update markdown
      expect(screenshot.updateMarkdownOutput).toHaveBeenCalled();
    });

    test('should handle upload failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Upload failed' })
      });

      await screenshot.uploadFile(mockFile);

      expect(screenshot.updateScreenshotStatus).toHaveBeenCalledWith(expect.any(String), 'error');
      expect(screenshot.showError).toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    let screenshot;

    beforeEach(() => {
      screenshot = new ScreenshotAttachment();
    });

    test('should format file sizes correctly', () => {
      expect(screenshot.formatFileSize(0)).toBe('0 Bytes');
      expect(screenshot.formatFileSize(1024)).toBe('1 KB');
      expect(screenshot.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(screenshot.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    test('should sanitize filenames', () => {
      expect(screenshot.sanitizeFilename('test file.png')).toBe('test_file.png');
      expect(screenshot.sanitizeFilename('test@file#.png')).toBe('test_file_.png');
      expect(screenshot.sanitizeFilename('normal-file_123.png')).toBe('normal-file_123.png');
    });

    test('should generate unique upload IDs', () => {
      const id1 = screenshot.generateUploadId();
      const id2 = screenshot.generateUploadId();

      expect(id1).toMatch(/^upload_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^upload_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Markdown Generation', () => {
    let screenshot;

    beforeEach(() => {
      screenshot = new ScreenshotAttachment();
      screenshot.copyToClipboard = jest.fn();
      screenshot.showSuccess = jest.fn();
    });

    test('should generate markdown for single screenshot', () => {
      screenshot.screenshots = [
        {
          id: 'test-id',
          filename: 'test.png',
          url: 'https://example.com/test.png'
        }
      ];

      screenshot.copyMarkdown('test-id');

      expect(screenshot.copyToClipboard).toHaveBeenCalledWith('![test.png](https://example.com/test.png)');
    });

    test('should generate markdown for multiple screenshots', () => {
      screenshot.screenshots = [
        { filename: 'test1.png', url: 'https://example.com/test1.png' },
        { filename: 'test2.png', url: 'https://example.com/test2.png' }
      ];

      screenshot.copyAllMarkdown();

      const expectedMarkdown =
        '![test1.png](https://example.com/test1.png)\n![test2.png](https://example.com/test2.png)';

      expect(screenshot.copyToClipboard).toHaveBeenCalledWith(expectedMarkdown);
    });
  });

  describe('Screenshot Management', () => {
    let screenshot;

    beforeEach(() => {
      screenshot = new ScreenshotAttachment();
      screenshot.updateMarkdownOutput = jest.fn();
    });

    test('should remove screenshot from list', () => {
      screenshot.screenshots = [
        { id: 'test-1', filename: 'test1.png' },
        { id: 'test-2', filename: 'test2.png' }
      ];

      // No need to override document.getElementById again,
      // it's already properly mocked above

      screenshot.removeScreenshot('test-1');

      expect(screenshot.screenshots).toHaveLength(1);
      expect(screenshot.screenshots[0].id).toBe('test-2');
      expect(screenshot.updateMarkdownOutput).toHaveBeenCalled();
    });

    test('should get all screenshots', () => {
      const mockScreenshots = [
        { id: 'test-1', filename: 'test1.png' },
        { id: 'test-2', filename: 'test2.png' }
      ];
      screenshot.screenshots = mockScreenshots;

      expect(screenshot.getScreenshots()).toEqual(mockScreenshots);
    });

    test('should update PR number', () => {
      screenshot.setPRNumber(456);
      expect(screenshot.prNumber).toBe(456);
    });

    test('should update user ID', () => {
      screenshot.setUserId('new-user');
      expect(screenshot.userId).toBe('new-user');
    });
  });
});
