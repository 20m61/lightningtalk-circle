/**
 * サーバーユーティリティ関数のユニットテスト
 */

import { describe, expect, it } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';

// テスト対象のユーティリティ関数（実装予定）
class DataManager {
  constructor(dataDir = './server/data') {
    this.dataDir = dataDir;
  }

  async loadData(filename) {
    const filePath = path.join(this.dataDir, filename);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  }

  async saveData(filename, data) {
    const filePath = path.join(this.dataDir, filename);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, { spaces: 2 });
    return true;
  }

  async appendData(filename, newData) {
    const existingData = (await this.loadData(filename)) || [];
    let updatedData;
    if (Array.isArray(existingData)) {
      updatedData = [...existingData, newData];
    } else if (typeof existingData === 'object' && typeof newData === 'object') {
      // 再帰的マージ
      updatedData = deepMerge(existingData, newData);
    } else {
      updatedData = { ...existingData, ...newData };
    }
    return await this.saveData(filename, updatedData);
  }

  async deleteData(filename) {
    const filePath = path.join(this.dataDir, filename);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      return true;
    }
    return false;
  }
}

// 再帰的マージ関数
function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      Object.prototype.hasOwnProperty.call(target, key) &&
      typeof target[key] === 'object' &&
      typeof source[key] === 'object' &&
      !Array.isArray(target[key]) &&
      !Array.isArray(source[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// バリデーション関数
function validateEventData(eventData) {
  const requiredFields = ['title', 'date', 'location'];
  const missingFields = requiredFields.filter(field => !eventData[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // 日付の検証
  const eventDate = new Date(eventData.date);
  if (isNaN(eventDate.getTime())) {
    throw new Error('Invalid date format');
  }

  // 未来の日付かチェック
  if (eventDate < new Date()) {
    throw new Error('Event date must be in the future');
  }

  return true;
}

// レスポンスフォーマッター
function formatApiResponse(data, message = 'Success', status = 200) {
  return {
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

function formatErrorResponse(error, status = 500) {
  return {
    status,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  };
}

describe('DataManager', () => {
  let dataManager;
  const testDataDir = path.join(process.cwd(), 'tests', 'data');

  beforeEach(async () => {
    dataManager = new DataManager(testDataDir);
    await fs.ensureDir(testDataDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(testDataDir)) {
      await fs.remove(testDataDir);
    }
  });

  describe('loadData', () => {
    it('should load existing JSON file', async () => {
      const testData = { name: 'Test Event', participants: 10 };
      const filename = 'test-event.json';

      await fs.writeJson(path.join(testDataDir, filename), testData);

      const loadedData = await dataManager.loadData(filename);
      expect(loadedData).toEqual(testData);
    });

    it('should return null for non-existent file', async () => {
      const loadedData = await dataManager.loadData('non-existent.json');
      expect(loadedData).toBeNull();
    });

    it('should handle malformed JSON gracefully', async () => {
      const filename = 'malformed.json';
      await fs.writeFile(path.join(testDataDir, filename), '{ invalid json content');

      await expect(dataManager.loadData(filename)).rejects.toThrow();
    });
  });

  describe('saveData', () => {
    it('should save data to JSON file', async () => {
      const testData = { title: 'Lightning Talk', date: '2024-12-01' };
      const filename = 'save-test.json';

      const result = await dataManager.saveData(filename, testData);
      expect(result).toBe(true);

      const savedData = await fs.readJson(path.join(testDataDir, filename));
      expect(savedData).toEqual(testData);
    });

    it('should create directory if not exists', async () => {
      const testData = { test: true };
      const filename = 'nested/deep/test.json';

      const result = await dataManager.saveData(filename, testData);
      expect(result).toBe(true);

      const filePath = path.join(testDataDir, filename);
      expect(await fs.pathExists(filePath)).toBe(true);
    });

    it('should overwrite existing file', async () => {
      const filename = 'overwrite-test.json';
      const originalData = { version: 1 };
      const updatedData = { version: 2 };

      await dataManager.saveData(filename, originalData);
      await dataManager.saveData(filename, updatedData);

      const finalData = await dataManager.loadData(filename);
      expect(finalData).toEqual(updatedData);
    });
  });

  describe('appendData', () => {
    it('should append to array data', async () => {
      const filename = 'append-array.json';
      const initialData = [{ id: 1, name: 'First' }];
      const newItem = { id: 2, name: 'Second' };

      await dataManager.saveData(filename, initialData);
      await dataManager.appendData(filename, newItem);

      const result = await dataManager.loadData(filename);
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(newItem);
    });

    it('should merge object data', async () => {
      const filename = 'append-object.json';
      const initialData = { settings: { theme: 'dark' } };
      const newData = { settings: { language: 'ja' } };

      await dataManager.saveData(filename, initialData);
      await dataManager.appendData(filename, newData);

      const result = await dataManager.loadData(filename);
      expect(result.settings).toEqual({ theme: 'dark', language: 'ja' });
    });

    it('should create new file if not exists', async () => {
      const filename = 'new-append.json';
      const newData = { id: 1, name: 'First Item' };

      await dataManager.appendData(filename, newData);

      const result = await dataManager.loadData(filename);
      expect(result).toEqual([newData]);
    });
  });

  describe('deleteData', () => {
    it('should delete existing file', async () => {
      const filename = 'delete-test.json';
      await dataManager.saveData(filename, { test: true });

      const result = await dataManager.deleteData(filename);
      expect(result).toBe(true);

      const filePath = path.join(testDataDir, filename);
      expect(await fs.pathExists(filePath)).toBe(false);
    });

    it('should return false for non-existent file', async () => {
      const result = await dataManager.deleteData('non-existent.json');
      expect(result).toBe(false);
    });
  });
});

describe('validateEventData', () => {
  const validEventData = {
    title: 'Tech Lightning Talk',
    date: '2026-01-15T19:00:00Z',
    location: 'Tokyo Conference Room',
    description: 'Monthly tech sharing event'
  };

  it('should validate complete event data', () => {
    expect(() => validateEventData(validEventData)).not.toThrow();
    expect(validateEventData(validEventData)).toBe(true);
  });

  it('should reject event without title', () => {
    const eventWithoutTitle = { ...validEventData };
    delete eventWithoutTitle.title;

    expect(() => validateEventData(eventWithoutTitle)).toThrow('Missing required fields: title');
  });

  it('should reject event without date', () => {
    const eventWithoutDate = { ...validEventData };
    delete eventWithoutDate.date;

    expect(() => validateEventData(eventWithoutDate)).toThrow('Missing required fields: date');
  });

  it('should reject event without location', () => {
    const eventWithoutLocation = { ...validEventData };
    delete eventWithoutLocation.location;

    expect(() => validateEventData(eventWithoutLocation)).toThrow(
      'Missing required fields: location'
    );
  });

  it('should reject event with invalid date', () => {
    const eventWithInvalidDate = {
      ...validEventData,
      date: 'invalid-date-string'
    };

    expect(() => validateEventData(eventWithInvalidDate)).toThrow('Invalid date format');
  });

  it('should reject event with past date', () => {
    const eventWithPastDate = {
      ...validEventData,
      date: '2020-01-01T00:00:00Z'
    };

    expect(() => validateEventData(eventWithPastDate)).toThrow('Event date must be in the future');
  });

  it('should reject missing multiple fields', () => {
    const incompleteEvent = { description: 'Only description' };

    expect(() => validateEventData(incompleteEvent)).toThrow(
      'Missing required fields: title, date, location'
    );
  });
});

describe('API Response Formatters', () => {
  describe('formatApiResponse', () => {
    it('should format successful response with default values', () => {
      const data = { id: 1, name: 'Test' };
      const response = formatApiResponse(data);

      expect(response).toMatchObject({
        status: 200,
        message: 'Success',
        data,
        timestamp: expect.any(String)
      });
    });

    it('should format response with custom message and status', () => {
      const data = { created: true };
      const response = formatApiResponse(data, 'Created successfully', 201);

      expect(response).toMatchObject({
        status: 201,
        message: 'Created successfully',
        data
      });
    });

    it('should include valid timestamp', () => {
      const response = formatApiResponse({});
      const timestamp = new Date(response.timestamp);

      expect(timestamp.getTime()).not.toBeNaN();
      expect(Date.now() - timestamp.getTime()).toBeLessThan(1000);
    });
  });

  describe('formatErrorResponse', () => {
    it('should format error response with default status', () => {
      const error = new Error('Something went wrong');
      const response = formatErrorResponse(error);

      expect(response).toMatchObject({
        status: 500,
        message: 'Something went wrong',
        timestamp: expect.any(String)
      });
    });

    it('should format error response with custom status', () => {
      const error = new Error('Not found');
      const response = formatErrorResponse(error, 404);

      expect(response.status).toBe(404);
      expect(response.message).toBe('Not found');
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      const response = formatErrorResponse(error);

      expect(response.error).toBeDefined();
      expect(response.error).toContain('Error: Test error');

      process.env.NODE_ENV = originalEnv;
    });

    it('should exclude stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      const response = formatErrorResponse(error);

      expect(response.error).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
