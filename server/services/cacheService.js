/**
 * Cache Service
 * In-memory caching with TTL support for improved performance
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('CacheService');

export class CacheService extends EventEmitter {
  constructor(options = {}) {
    super();

    this.cache = new Map();
    this.metadata = new Map();
    this.timers = new Map();

    this.options = {
      maxSize: options.maxSize || 1000,
      defaultTTL: options.defaultTTL || 3600000, // 1 hour
      checkInterval: options.checkInterval || 60000, // 1 minute
      enableStats: options.enableStats !== false
    };

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      expirations: 0
    };

    if (this.options.checkInterval > 0) {
      this.startCleanupInterval();
    }
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const meta = this.metadata.get(key);

    // Check if expired
    if (meta.expiresAt && Date.now() > meta.expiresAt) {
      this.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return null;
    }

    // Update access time and hit count
    meta.lastAccess = Date.now();
    meta.hits++;

    this.stats.hits++;
    this.emit('hit', { key, value: entry });

    return entry;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = null) {
    // Check size limit
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const expiresAt = ttl !== null ? Date.now() + ttl : Date.now() + this.options.defaultTTL;

    // Clear existing timer
    this.clearTimer(key);

    // Set new value
    this.cache.set(key, value);
    this.metadata.set(key, {
      createdAt: Date.now(),
      lastAccess: Date.now(),
      expiresAt,
      hits: 0,
      size: this.estimateSize(value)
    });

    // Set expiration timer if TTL is reasonable
    if (ttl > 0 && ttl < 86400000) {
      // Less than 24 hours
      const timer = setTimeout(() => {
        this.delete(key);
        this.stats.expirations++;
      }, ttl);
      this.timers.set(key, timer);
    }

    this.stats.sets++;
    this.emit('set', { key, value, ttl });

    return true;
  }

  /**
   * Delete value from cache
   */
  delete(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    this.cache.delete(key);
    this.metadata.delete(key);
    this.clearTimer(key);

    this.stats.deletes++;
    this.emit('delete', { key });

    return true;
  }

  /**
   * Check if key exists
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const meta = this.metadata.get(key);
    if (meta.expiresAt && Date.now() > meta.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache
   */
  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));

    const size = this.cache.size;

    this.cache.clear();
    this.metadata.clear();
    this.timers.clear();

    this.emit('clear', { itemsCleared: size });
    logger.info(`Cache cleared: ${size} items removed`);
  }

  /**
   * Get multiple values
   */
  mget(keys) {
    const results = {};
    keys.forEach(key => {
      const value = this.get(key);
      if (value !== null) {
        results[key] = value;
      }
    });
    return results;
  }

  /**
   * Set multiple values
   */
  mset(entries, ttl = null) {
    const results = {};
    Object.entries(entries).forEach(([key, value]) => {
      results[key] = this.set(key, value, ttl);
    });
    return results;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: (hitRate * 100).toFixed(2) + '%',
      memoryUsage: this.calculateMemoryUsage()
    };
  }

  /**
   * Get keys matching pattern
   */
  keys(pattern = '*') {
    const keys = Array.from(this.cache.keys());

    if (pattern === '*') {
      return keys;
    }

    // Simple pattern matching
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return keys.filter(key => regex.test(key));
  }

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet(key, fetchFunction, ttl = null) {
    let value = this.get(key);

    if (value !== null) {
      return value;
    }

    try {
      value = await fetchFunction();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      logger.error(`Error in getOrSet for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate keys by pattern
   */
  invalidate(pattern) {
    const keys = this.keys(pattern);
    let deleted = 0;

    keys.forEach(key => {
      if (this.delete(key)) {
        deleted++;
      }
    });

    logger.info(`Invalidated ${deleted} keys matching pattern: ${pattern}`);
    this.emit('invalidate', { pattern, keysDeleted: deleted });

    return deleted;
  }

  /**
   * Optimized LRU eviction using priority queue concept
   */
  evictLRU() {
    // Convert to array and use built-in sort for better performance than linear scan
    const entries = Array.from(this.metadata.entries());

    if (entries.length === 0) return;

    // Sort by lastAccess time (ascending) - most recently used last
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    // Evict the least recently used (first in sorted array)
    const lruKey = entries[0][0];

    if (lruKey) {
      this.delete(lruKey);
      this.stats.evictions++;
      this.emit('eviction', { key: lruKey, reason: 'LRU' });

      logger.debug(`Evicted LRU key: ${lruKey}`);
    }
  }

  /**
   * Batch eviction for memory pressure scenarios
   */
  evictBatch(count = 10) {
    const entries = Array.from(this.metadata.entries());

    if (entries.length === 0) return 0;

    // Sort by lastAccess time and evict multiple items
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    const evictCount = Math.min(count, entries.length);
    let evicted = 0;

    for (let i = 0; i < evictCount; i++) {
      const key = entries[i][0];
      this.delete(key);
      evicted++;
    }

    this.stats.evictions += evicted;
    this.emit('batchEviction', { count: evicted, reason: 'memory-pressure' });

    logger.info(`Batch evicted ${evicted} cache entries`);
    return evicted;
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.options.checkInterval);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    this.metadata.forEach((meta, key) => {
      if (meta.expiresAt && now > meta.expiresAt) {
        this.delete(key);
        cleaned++;
        this.stats.expirations++;
      }
    });

    if (cleaned > 0) {
      logger.debug(`Cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Clear timer for key
   */
  clearTimer(key) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /**
   * Estimate size of value
   */
  estimateSize(value) {
    if (typeof value === 'string') {
      return value.length * 2; // Rough estimate for UTF-16
    } else if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    } else {
      return 8; // Default size for primitives
    }
  }

  /**
   * Calculate total memory usage with optimization
   */
  calculateMemoryUsage() {
    let total = 0;
    let entries = 0;

    for (const meta of this.metadata.values()) {
      total += meta.size || 0;
      entries++;
    }

    // Update cached memory usage
    this._lastMemoryUsage = {
      total,
      entries,
      calculatedAt: Date.now()
    };

    return total;
  }

  /**
   * Get cached memory usage (updated every 5 seconds)
   */
  getMemoryUsage() {
    const now = Date.now();

    // Return cached value if recent (within 5 seconds)
    if (this._lastMemoryUsage && now - this._lastMemoryUsage.calculatedAt < 5000) {
      return this._lastMemoryUsage;
    }

    // Recalculate if stale
    const total = this.calculateMemoryUsage();
    return this._lastMemoryUsage;
  }

  /**
   * Check if memory pressure exists and auto-cleanup if needed
   */
  checkMemoryPressure() {
    const usage = this.getMemoryUsage();
    const maxMemory = this.options.maxMemory || 100 * 1024 * 1024; // 100MB default

    if (usage.total > maxMemory * 0.9) {
      // 90% threshold
      logger.warn(`Cache memory usage high: ${Math.round(usage.total / 1024 / 1024)}MB`);

      // Auto-evict 20% of cache
      const evictCount = Math.max(10, Math.floor(usage.entries * 0.2));
      this.evictBatch(evictCount);

      return true;
    }

    return false;
  }

  /**
   * Create namespaced cache
   */
  namespace(prefix) {
    const ns = {
      get: key => this.get(`${prefix}:${key}`),
      set: (key, value, ttl) => this.set(`${prefix}:${key}`, value, ttl),
      delete: key => this.delete(`${prefix}:${key}`),
      has: key => this.has(`${prefix}:${key}`),
      keys: (pattern = '*') => this.keys(`${prefix}:${pattern}`),
      invalidate: () => this.invalidate(`${prefix}:*`),
      getOrSet: (key, fn, ttl) => this.getOrSet(`${prefix}:${key}`, fn, ttl)
    };

    return ns;
  }

  /**
   * Export cache state
   */
  export() {
    const data = {};
    const now = Date.now();

    this.cache.forEach((value, key) => {
      const meta = this.metadata.get(key);
      if (!meta.expiresAt || meta.expiresAt > now) {
        data[key] = {
          value,
          meta: {
            ...meta,
            remainingTTL: meta.expiresAt ? meta.expiresAt - now : null
          }
        };
      }
    });

    return data;
  }

  /**
   * Import cache state
   */
  import(data) {
    Object.entries(data).forEach(([key, entry]) => {
      const ttl = entry.meta.remainingTTL;
      this.set(key, entry.value, ttl);

      // Restore metadata
      const meta = this.metadata.get(key);
      if (meta && entry.meta) {
        meta.createdAt = entry.meta.createdAt;
        meta.hits = entry.meta.hits || 0;
      }
    });

    logger.info(`Imported ${Object.keys(data).length} cache entries`);
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    this.stopCleanupInterval();
    this.timers.forEach(timer => clearTimeout(timer));
    this.clear();
    logger.info('Cache service shut down');
  }
}

// Create singleton instance
const cacheService = new CacheService({
  maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
  defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '3600000'),
  checkInterval: parseInt(process.env.CACHE_CHECK_INTERVAL || '60000')
});

// Common cache namespaces
export const eventCache = cacheService.namespace('events');
export const userCache = cacheService.namespace('users');
export const talkCache = cacheService.namespace('talks');
export const sessionCache = cacheService.namespace('sessions');

export default cacheService;
