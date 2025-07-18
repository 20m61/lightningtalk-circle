/**
 * Cache Service Unit Tests
 * キャッシュサービスの単体テスト
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../server/utils/logger.js', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

const { CacheService } = await import('../../../server/services/cacheService.js');

describe('CacheService', () => {
  let cacheService;

  beforeEach(() => {
    jest.useFakeTimers();
    cacheService = new CacheService({
      maxSize: 5,
      defaultTTL: 1000,
      checkInterval: 0 // Disable interval for tests
    });
  });

  afterEach(() => {
    cacheService.shutdown();
    jest.useRealTimers();
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      cacheService.set('key1', 'value1');
      expect(cacheService.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cacheService.get('nonexistent')).toBeNull();
    });

    it('should check if key exists', () => {
      cacheService.set('key1', 'value1');
      expect(cacheService.has('key1')).toBe(true);
      expect(cacheService.has('nonexistent')).toBe(false);
    });

    it('should delete values', () => {
      cacheService.set('key1', 'value1');
      expect(cacheService.delete('key1')).toBe(true);
      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.delete('nonexistent')).toBe(false);
    });

    it('should clear all values', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');

      cacheService.clear();

      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', () => {
      cacheService.set('key1', 'value1', 500);

      expect(cacheService.get('key1')).toBe('value1');

      // Fast-forward time
      jest.advanceTimersByTime(600);

      expect(cacheService.get('key1')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      cacheService.set('key1', 'value1');

      // Fast-forward to just before default TTL
      jest.advanceTimersByTime(999);
      expect(cacheService.get('key1')).toBe('value1');

      // Fast-forward past default TTL
      jest.advanceTimersByTime(2);
      expect(cacheService.get('key1')).toBeNull();
    });

    it('should handle has() with expired entries', () => {
      cacheService.set('key1', 'value1', 500);

      expect(cacheService.has('key1')).toBe(true);

      jest.advanceTimersByTime(600);

      expect(cacheService.has('key1')).toBe(false);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used item when at capacity', () => {
      // Fill cache to capacity
      for (let i = 1; i <= 5; i++) {
        cacheService.set(`key${i}`, `value${i}`);
      }

      // Access key2 to make it more recently used
      cacheService.get('key2');

      // Add one more item to trigger eviction
      cacheService.set('key6', 'value6');

      // key1 should be evicted (least recently used)
      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBe('value2');
      expect(cacheService.get('key6')).toBe('value6');
    });

    it('should update stats on eviction', () => {
      // Fill cache to capacity
      for (let i = 1; i <= 5; i++) {
        cacheService.set(`key${i}`, `value${i}`);
      }

      // Trigger eviction
      cacheService.set('key6', 'value6');

      const stats = cacheService.getStats();
      expect(stats.evictions).toBe(1);
    });
  });

  describe('statistics', () => {
    it('should track hit and miss statistics', () => {
      cacheService.set('key1', 'value1');

      // Generate hits
      cacheService.get('key1');
      cacheService.get('key1');

      // Generate misses
      cacheService.get('nonexistent1');
      cacheService.get('nonexistent2');

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe('50.00%');
    });

    it('should track set and delete statistics', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.delete('key1');

      const stats = cacheService.getStats();
      expect(stats.sets).toBe(2);
      expect(stats.deletes).toBe(1);
    });

    it('should calculate hit rate correctly', () => {
      const stats = cacheService.getStats();
      expect(stats.hitRate).toBe('0.00%'); // No requests yet
    });
  });

  describe('multiple operations', () => {
    it('should handle mget (multiple get)', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');

      const results = cacheService.mget(['key1', 'key2', 'nonexistent']);

      expect(results).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
    });

    it('should handle mset (multiple set)', () => {
      const results = cacheService.mset({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      });

      expect(results).toEqual({
        key1: true,
        key2: true,
        key3: true
      });

      expect(cacheService.get('key1')).toBe('value1');
      expect(cacheService.get('key2')).toBe('value2');
      expect(cacheService.get('key3')).toBe('value3');
    });
  });

  describe('pattern matching', () => {
    beforeEach(() => {
      cacheService.set('user:1', 'user1');
      cacheService.set('user:2', 'user2');
      cacheService.set('post:1', 'post1');
      cacheService.set('post:2', 'post2');
    });

    it('should return all keys with wildcard', () => {
      const keys = cacheService.keys('*');
      expect(keys).toEqual(expect.arrayContaining(['user:1', 'user:2', 'post:1', 'post:2']));
    });

    it('should match keys by pattern', () => {
      const userKeys = cacheService.keys('user:*');
      expect(userKeys).toEqual(expect.arrayContaining(['user:1', 'user:2']));
      expect(userKeys).not.toContain('post:1');
    });

    it('should invalidate keys by pattern', () => {
      const deleted = cacheService.invalidate('user:*');

      expect(deleted).toBe(2);
      expect(cacheService.get('user:1')).toBeNull();
      expect(cacheService.get('user:2')).toBeNull();
      expect(cacheService.get('post:1')).toBe('post1');
    });
  });

  describe('getOrSet pattern', () => {
    it('should return cached value if exists', async () => {
      cacheService.set('key1', 'cached-value');

      const fetchFunction = jest.fn().mockResolvedValue('fetched-value');
      const result = await cacheService.getOrSet('key1', fetchFunction);

      expect(result).toBe('cached-value');
      expect(fetchFunction).not.toHaveBeenCalled();
    });

    it('should fetch and cache value if not exists', async () => {
      const fetchFunction = jest.fn().mockResolvedValue('fetched-value');
      const result = await cacheService.getOrSet('key1', fetchFunction, 500);

      expect(result).toBe('fetched-value');
      expect(fetchFunction).toHaveBeenCalled();
      expect(cacheService.get('key1')).toBe('fetched-value');
    });

    it('should propagate errors from fetch function', async () => {
      const fetchFunction = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(cacheService.getOrSet('key1', fetchFunction)).rejects.toThrow('Fetch failed');
      expect(cacheService.get('key1')).toBeNull();
    });
  });

  describe('namespaces', () => {
    it('should create namespaced cache', () => {
      const userCache = cacheService.namespace('users');

      userCache.set('123', { name: 'John' });

      expect(userCache.get('123')).toEqual({ name: 'John' });
      expect(cacheService.get('users:123')).toEqual({ name: 'John' });
    });

    it('should support namespaced operations', () => {
      const userCache = cacheService.namespace('users');

      userCache.set('123', { name: 'John' });
      userCache.set('456', { name: 'Jane' });

      expect(userCache.has('123')).toBe(true);
      expect(userCache.keys('*')).toContain('users:123');

      userCache.invalidate();

      expect(userCache.get('123')).toBeNull();
      expect(userCache.get('456')).toBeNull();
    });

    it('should support namespaced getOrSet', async () => {
      const userCache = cacheService.namespace('users');
      const fetchFunction = jest.fn().mockResolvedValue({ name: 'John' });

      const result = await userCache.getOrSet('123', fetchFunction);

      expect(result).toEqual({ name: 'John' });
      expect(cacheService.get('users:123')).toEqual({ name: 'John' });
    });
  });

  describe('cleanup', () => {
    it('should cleanup expired entries', () => {
      cacheService.set('key1', 'value1', 100);
      cacheService.set('key2', 'value2', 200);
      cacheService.set('key3', 'value3', 300);

      // Fast-forward to expire some entries
      jest.advanceTimersByTime(150);

      cacheService.cleanup();

      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBe('value2');
      expect(cacheService.get('key3')).toBe('value3');
    });
  });

  describe('import/export', () => {
    it('should export cache state', () => {
      cacheService.set('key1', 'value1', 1000);
      cacheService.set('key2', 'value2');

      const exported = cacheService.export();

      expect(exported).toHaveProperty('key1');
      expect(exported).toHaveProperty('key2');
      expect(exported.key1.value).toBe('value1');
      expect(exported.key1.meta.remainingTTL).toBeGreaterThan(0);
    });

    it('should import cache state', () => {
      const data = {
        key1: {
          value: 'value1',
          meta: {
            createdAt: Date.now(),
            hits: 5,
            remainingTTL: 500
          }
        }
      };

      cacheService.import(data);

      // Check metadata before calling get (which increments hits)
      const metaBeforeGet = cacheService.metadata.get('key1');
      expect(metaBeforeGet.hits).toBe(5);

      expect(cacheService.get('key1')).toBe('value1');
    });
  });

  describe('memory estimation', () => {
    it('should estimate memory usage', () => {
      cacheService.set('key1', 'small');
      cacheService.set('key2', { large: 'object with more data' });

      const usage = cacheService.calculateMemoryUsage();
      expect(usage).toBeGreaterThan(0);
    });
  });

  describe('events', () => {
    it('should emit events on operations', () => {
      const hitSpy = jest.fn();
      const setSpy = jest.fn();
      const deleteSpy = jest.fn();

      cacheService.on('hit', hitSpy);
      cacheService.on('set', setSpy);
      cacheService.on('delete', deleteSpy);

      cacheService.set('key1', 'value1', 1000); // Set with explicit TTL
      cacheService.get('key1');
      cacheService.delete('key1');

      expect(setSpy).toHaveBeenCalledWith({
        key: 'key1',
        value: 'value1',
        ttl: expect.any(Number)
      });
      expect(hitSpy).toHaveBeenCalledWith({
        key: 'key1',
        value: 'value1'
      });
      expect(deleteSpy).toHaveBeenCalledWith({ key: 'key1' });
    });
  });
});
