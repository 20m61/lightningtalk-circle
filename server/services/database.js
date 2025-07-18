/**
 * Database Service for Lightning Talk Event Management
 * File-based JSON database with in-memory caching for development
 * Can be easily replaced with PostgreSQL/MongoDB for production
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

let __filename, __dirname;
if (typeof import.meta !== 'undefined' && import.meta.url) {
  __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} else {
  // Fallback for Jest environment
  __filename = '';
  __dirname = path.join(process.cwd(), 'server', 'services');
}

export class DatabaseService extends EventEmitter {
  static _instance = null;
  static _lastConfig = null;

  static getInstance(config = {}) {
    // Create a config signature for comparison
    const configSignature = JSON.stringify(config);

    // If instance exists and config hasn't changed, return existing instance
    if (DatabaseService._instance && DatabaseService._lastConfig === configSignature) {
      return DatabaseService._instance;
    }

    // If config changed, close existing instance and create new one
    if (DatabaseService._instance && DatabaseService._lastConfig !== configSignature) {
      console.log('🔄 Database configuration changed, reinitializing...');
      DatabaseService._instance.close();
    }

    // Create new instance
    DatabaseService._instance = new DatabaseService(config);
    DatabaseService._lastConfig = configSignature;

    return DatabaseService._instance;
  }

  static resetInstance() {
    if (DatabaseService._instance) {
      DatabaseService._instance.close();
      DatabaseService._instance = null;
      DatabaseService._lastConfig = null;
    }
  }

  constructor(config = {}) {
    super();

    // Prevent direct instantiation
    if (DatabaseService._instance && this !== DatabaseService._instance) {
      throw new Error('DatabaseService is a singleton. Use DatabaseService.getInstance() instead.');
    }

    this.config = this._validateConfig(config);
    this.connectionString = this._buildConnectionString(this.config);
    this.dataDir = this._getDataDirectory();
    this.cache = new Map();
    this.initialized = false;
    this.saveQueue = new Map();
    this.saveTimeout = null;
    this.isClosing = false;
    this.lockManager = new Map(); // For handling concurrent operations

    // Performance optimization: Add indexes and query cache
    this.indexes = new Map();
    this.queryCache = new Map();
    this.maxCacheSize = 1000;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.statistics = {
      queries: 0,
      cacheHitRate: 0,
      avgQueryTime: 0
    };
  }

  _validateConfig(config) {
    const validatedConfig = {
      type: config.type || 'file',
      dataDir: config.dataDir || null,
      host: config.host || 'localhost',
      port: config.port || 5432,
      database: config.database || 'lightningtalk',
      user: config.user || null,
      password: config.password || null,
      ssl: config.ssl || false,
      maxConnections: config.maxConnections || 10,
      connectionTimeout: config.connectionTimeout || 5000,
      ...config
    };

    return validatedConfig;
  }

  _getDataDirectory() {
    if (this.config.dataDir) {
      return path.resolve(this.config.dataDir);
    }

    // Default data directory
    const defaultDir = path.join(__dirname, '../data');
    return defaultDir;
  }

  _buildConnectionString(config) {
    if (!config || Object.keys(config).length === 0) {
      return 'file-db://local-json';
    }
    // 簡易的なPostgres風
    return `postgresql://${config.user || 'user'}:${config.password || 'pass'}@${config.host || 'localhost'}:${config.port || 5432}/${config.database || 'db'}`;
  }

  async initialize() {
    try {
      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });

      // Initialize collections
      this.collections = {
        events: 'events.json',
        participants: 'participants.json',
        users: 'users.json',
        talks: 'talks.json',
        presentations: 'presentations.json',
        presentation_interactions: 'presentation_interactions.json',
        settings: 'settings.json',
        analytics: 'analytics.json',
        voting_sessions: 'voting_sessions.json'
      };

      // Load or create each collection
      for (const [collection, filename] of Object.entries(this.collections)) {
        await this.initializeCollection(collection, filename);
      }

      // Initialize settings
      await this.initializeSettings();

      this.initialized = true;
      this.emit('ready');

      console.log('📦 Database service initialized');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async initializeCollection(collection, filename) {
    const filePath = path.join(this.dataDir, filename);

    try {
      const data = await fs.readFile(filePath, 'utf8');
      this.cache.set(collection, JSON.parse(data));
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create empty collection
        const emptyData = [];
        this.cache.set(collection, emptyData);
        await this.saveCollection(collection);
        console.log(`📝 Created new collection: ${collection}`);
      } else {
        throw error;
      }
    }
  }

  async initializeSettings() {
    const defaultSettings = {
      siteName: 'なんでもライトニングトーク',
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
      adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
      emailEnabled: process.env.EMAIL_ENABLED === 'true',
      analyticsEnabled: true,
      registrationSettings: {
        requireApproval: false,
        allowWalkIn: true,
        maxParticipants: 100,
        autoConfirmation: true
      },
      talkSettings: {
        requireApproval: false,
        allowLastMinute: true,
        maxDuration: 5,
        categories: [
          'tech',
          'hobby',
          'learning',
          'travel',
          'food',
          'game',
          'lifehack',
          'pet',
          'garden',
          'money',
          'sports',
          'music',
          'other'
        ]
      },
      notificationSettings: {
        emailOnRegistration: true,
        emailOnTalkSubmission: true,
        reminderEmails: true,
        reminderDays: [7, 1]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingSettings = this.cache.get('settings');
    if (!existingSettings || existingSettings.length === 0) {
      this.cache.set('settings', [defaultSettings]);
      await this.saveCollection('settings');
    }
  }

  async waitForConnection() {
    if (this.initialized) {
      return;
    }

    return new Promise(resolve => {
      this.once('ready', resolve);
    });
  }

  // CRUD Operations with performance optimizations
  async find(collection, filter = {}, options = {}) {
    return this.findAll(collection, filter, options);
  }

  async findAll(collection, filter = {}, options = {}) {
    const startTime = Date.now();
    this.statistics.queries++;

    this.validateCollection(collection);

    // Generate cache key for query result caching
    const cacheKey = `${collection}:${JSON.stringify(filter)}:${JSON.stringify(options)}`;

    // Check query cache first
    if (this.queryCache.has(cacheKey)) {
      this.cacheHits++;
      this._updateCacheStats();
      return this.queryCache.get(cacheKey);
    }

    this.cacheMisses++;
    const data = this.cache.get(collection) || [];

    let result;
    if (Object.keys(filter).length === 0) {
      result = data;
    } else {
      // Use index if available for better performance
      const indexKey = this._getIndexKey(collection, filter);
      if (indexKey && this.indexes.has(indexKey)) {
        result = this._queryWithIndex(collection, filter, options);
      } else {
        result = data.filter(item => this.matchesFilter(item, filter));
      }
    }

    // Apply options (limit, sort, etc.)
    if (options.sort) {
      result = this._applySorting(result, options.sort);
    }

    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    if (options.skip) {
      result = result.slice(options.skip);
    }

    // Cache the result
    this._cacheQuery(cacheKey, result);

    // Update performance statistics
    const queryTime = Date.now() - startTime;
    this._updateQueryStats(queryTime);

    return result;
  }

  async findById(collection, id) {
    this.validateCollection(collection);
    const data = this.cache.get(collection) || [];
    return data.find(item => item.id === id);
  }

  async findOne(collection, filter) {
    this.validateCollection(collection);
    const data = this.cache.get(collection) || [];
    return data.find(item => this.matchesFilter(item, filter));
  }

  async create(collection, document) {
    this.validateCollection(collection);

    // Add metadata
    const now = new Date().toISOString();
    const newDocument = {
      id: this.generateId(),
      ...document,
      createdAt: now,
      updatedAt: now
    };

    // Add to cache
    const data = this.cache.get(collection) || [];
    data.push(newDocument);
    this.cache.set(collection, data);

    // Queue save
    this.queueSave(collection);

    // Emit event
    this.emit('created', { collection, document: newDocument });

    return newDocument;
  }

  async update(collection, id, updates) {
    this.validateCollection(collection);

    const data = this.cache.get(collection) || [];
    const index = data.findIndex(item => item.id === id);

    if (index === -1) {
      throw new Error(`Document with id ${id} not found in ${collection}`);
    }

    // Apply updates
    const updatedDocument = {
      ...data[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    data[index] = updatedDocument;
    this.cache.set(collection, data);

    // Queue save
    this.queueSave(collection);

    // Emit event
    this.emit('updated', { collection, document: updatedDocument });

    return updatedDocument;
  }

  async delete(collection, id) {
    this.validateCollection(collection);

    const data = this.cache.get(collection) || [];
    const index = data.findIndex(item => item.id === id);

    if (index === -1) {
      throw new Error(`Document with id ${id} not found in ${collection}`);
    }

    const deletedDocument = data[index];
    data.splice(index, 1);
    this.cache.set(collection, data);

    // Queue save
    this.queueSave(collection);

    // Emit event
    this.emit('deleted', { collection, document: deletedDocument });

    return deletedDocument;
  }

  // Aggregation methods
  async count(collection, filter = {}) {
    const results = await this.findAll(collection, filter);
    return results.length;
  }

  async countByField(collection, field) {
    const data = await this.findAll(collection);
    const counts = {};

    data.forEach(item => {
      const value = item[field] || 'unknown';
      counts[value] = (counts[value] || 0) + 1;
    });

    return counts;
  }

  async getCollectionStats(collection) {
    const data = await this.findAll(collection);

    return {
      total: data.length,
      createdToday: data.filter(item => {
        const created = new Date(item.createdAt);
        const today = new Date();
        return created.toDateString() === today.toDateString();
      }).length,
      createdThisWeek: data.filter(item => {
        const created = new Date(item.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created >= weekAgo;
      }).length,
      lastUpdated: data.length > 0 ? Math.max(...data.map(item => new Date(item.updatedAt))) : null
    };
  }

  // Event-specific methods
  async getCurrentEvent() {
    const events = await this.findAll('events', { status: 'upcoming' });
    return events.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  }

  async getEventParticipants(eventId) {
    return await this.findAll('participants', { eventId });
  }

  async getEventTalks(eventId) {
    return await this.findAll('talks', { eventId });
  }

  async getEventAnalytics(eventId) {
    const participants = await this.getEventParticipants(eventId);
    const talks = await this.getEventTalks(eventId);

    return {
      participantCount: participants.length,
      speakerCount: talks.length,
      participationTypes: await this.countByField('participants', 'participationType'),
      talkCategories: await this.countByField('talks', 'category'),
      registrationTrend: this.getRegistrationTrend(participants),
      avgRating: this.calculateAverageRating(talks)
    };
  }

  getRegistrationTrend(participants) {
    const trend = {};
    participants.forEach(participant => {
      const date = new Date(participant.createdAt).toDateString();
      trend[date] = (trend[date] || 0) + 1;
    });
    return trend;
  }

  calculateAverageRating(talks) {
    const ratingsArray = talks.filter(talk => talk.rating).map(talk => talk.rating);

    if (ratingsArray.length === 0) {
      return null;
    }

    return ratingsArray.reduce((sum, rating) => sum + rating, 0) / ratingsArray.length;
  }

  // Settings management
  async getSettings() {
    const settings = this.cache.get('settings') || [];
    return settings[0] || {};
  }

  async updateSettings(updates) {
    const settings = await this.getSettings();
    const updatedSettings = {
      ...settings,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.cache.set('settings', [updatedSettings]);
    await this.queueSave('settings');

    return updatedSettings;
  }

  // Data seeding for development
  async seed(seedData) {
    for (const [collection, data] of Object.entries(seedData)) {
      if (this.collections[collection]) {
        this.cache.set(collection, data);
        await this.saveCollection(collection);
        console.log(`🌱 Seeded ${collection} with ${data.length} items`);
      }
    }
  }

  // Data export/backup
  async exportData() {
    const exportData = {};

    for (const collection of Object.keys(this.collections)) {
      exportData[collection] = this.cache.get(collection) || [];
    }

    return {
      ...exportData,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  async importData(importData) {
    for (const [collection, data] of Object.entries(importData)) {
      if (this.collections[collection] && Array.isArray(data)) {
        this.cache.set(collection, data);
        await this.saveCollection(collection);
        console.log(`📥 Imported ${collection} with ${data.length} items`);
      }
    }
  }

  // Helper methods
  validateCollection(collection) {
    if (!this.collections[collection]) {
      throw new Error(`Invalid collection: ${collection}`);
    }
  }

  matchesFilter(item, filter) {
    return Object.entries(filter).every(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle operators like { $gte: value }
        return Object.entries(value).every(([operator, operatorValue]) => {
          switch (operator) {
            case '$gte':
              return item[key] >= operatorValue;
            case '$lte':
              return item[key] <= operatorValue;
            case '$gt':
              return item[key] > operatorValue;
            case '$lt':
              return item[key] < operatorValue;
            case '$ne':
              return item[key] !== operatorValue;
            case '$in':
              return Array.isArray(operatorValue) && operatorValue.includes(item[key]);
            case '$nin':
              return Array.isArray(operatorValue) && !operatorValue.includes(item[key]);
            default:
              return false;
          }
        });
      }
      return item[key] === value;
    });
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  queueSave(collection) {
    this.saveQueue.set(collection, true);

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      const collectionsToSave = Array.from(this.saveQueue.keys());
      this.saveQueue.clear();

      for (const collection of collectionsToSave) {
        await this.saveCollection(collection);
      }
    }, 1000); // Batch saves every 1 second
  }

  async saveCollection(collection) {
    try {
      const filename = this.collections[collection];
      const filePath = path.join(this.dataDir, filename);
      const data = this.cache.get(collection) || [];

      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Failed to save collection ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Acquire lock for a collection to prevent concurrent operations
   */
  async acquireLock(collection) {
    while (this.lockManager.has(collection)) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.lockManager.set(collection, Date.now());
  }

  /**
   * Release lock for a collection
   */
  releaseLock(collection) {
    this.lockManager.delete(collection);
  }

  /**
   * Perform operation with lock
   */
  async withLock(collection, operation) {
    await this.acquireLock(collection);
    try {
      return await operation();
    } finally {
      this.releaseLock(collection);
    }
  }

  /**
   * Get database health status
   */
  getHealth() {
    return {
      status: this.initialized ? 'healthy' : 'initializing',
      type: this.config.type,
      dataDir: this.dataDir,
      collections: Object.keys(this.collections),
      cacheSize: this.cache.size,
      pendingSaves: this.saveQueue.size,
      uptime: process.uptime(),
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const stats = {
      collections: {},
      totalRecords: 0,
      totalSize: 0
    };

    for (const [collection, filename] of Object.entries(this.collections)) {
      const data = this.cache.get(collection) || [];
      const filePath = path.join(this.dataDir, filename);

      let fileSize = 0;
      try {
        const fileStat = await fs.stat(filePath);
        fileSize = fileStat.size;
      } catch (error) {
        // File might not exist yet
      }

      stats.collections[collection] = {
        records: data.length,
        size: fileSize,
        lastModified: new Date().toISOString()
      };

      stats.totalRecords += data.length;
      stats.totalSize += fileSize;
    }

    return stats;
  }

  /**
   * Backup all data
   */
  async backup(backupDir = null) {
    const backupDirectory = backupDir || path.join(this.dataDir, 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDirectory, `backup-${timestamp}`);

    await fs.mkdir(backupPath, { recursive: true });

    for (const [collection, filename] of Object.entries(this.collections)) {
      const sourcePath = path.join(this.dataDir, filename);
      const backupFilePath = path.join(backupPath, filename);

      try {
        await fs.copyFile(sourcePath, backupFilePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    console.log(`📦 Database backup created: ${backupPath}`);
    return backupPath;
  }

  /**
   * Restore from backup
   */
  async restore(backupPath) {
    if (this.isClosing) {
      throw new Error('Cannot restore while database is closing');
    }

    console.log(`📦 Restoring database from: ${backupPath}`);

    for (const [collection, filename] of Object.entries(this.collections)) {
      const backupFilePath = path.join(backupPath, filename);
      const targetPath = path.join(this.dataDir, filename);

      try {
        await fs.copyFile(backupFilePath, targetPath);

        // Reload collection into cache
        const data = await fs.readFile(targetPath, 'utf8');
        this.cache.set(collection, JSON.parse(data));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    console.log('📦 Database restore completed');
  }

  /**
   * Close database connection and cleanup
   */
  async close() {
    if (this.isClosing) {
      return;
    }

    this.isClosing = true;
    console.log('📦 Closing database service...');

    try {
      // Wait for all locks to be released
      const lockWaitTimeout = 5000; // 5 seconds
      const startTime = Date.now();

      while (this.lockManager.size > 0 && Date.now() - startTime < lockWaitTimeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (this.lockManager.size > 0) {
        console.warn(
          '⚠️  Force closing database with active locks:',
          Array.from(this.lockManager.keys())
        );
        this.lockManager.clear();
      }

      // Save all pending changes
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }

      const collectionsToSave = Array.from(this.saveQueue.keys());
      this.saveQueue.clear();

      for (const collection of collectionsToSave) {
        try {
          await this.saveCollection(collection);
        } catch (error) {
          console.error(`Failed to save collection ${collection} during close:`, error);
        }
      }

      // Clear cache
      this.cache.clear();
      this.initialized = false;

      this.emit('closed');
      console.log('📦 Database service closed successfully');
    } catch (error) {
      console.error('Error during database close:', error);
      throw error;
    } finally {
      this.isClosing = false;
    }
  }

  /**
   * Performance optimization helper methods
   */

  _getIndexKey(collection, filter) {
    // Generate index key based on filter fields
    const fields = Object.keys(filter).sort();
    return `${collection}:${fields.join(',')}`;
  }

  _queryWithIndex(collection, filter, options) {
    const indexKey = this._getIndexKey(collection, filter);
    const index = this.indexes.get(indexKey);

    if (!index) {
      // Fallback to linear search
      const data = this.cache.get(collection) || [];
      return data.filter(item => this.matchesFilter(item, filter));
    }

    // Use index for faster lookups
    const results = [];
    for (const [value, ids] of index.entries()) {
      if (this._matchesIndexValue(value, filter)) {
        for (const id of ids) {
          const item = this._getItemById(collection, id);
          if (item && this.matchesFilter(item, filter)) {
            results.push(item);
          }
        }
      }
    }

    return results;
  }

  _matchesIndexValue(value, filter) {
    // Simple equality check for now - can be extended for complex queries
    return Object.values(filter).some(
      filterValue =>
        filterValue === value ||
        (typeof filterValue === 'object' &&
          filterValue !== null &&
          Object.values(filterValue).includes(value))
    );
  }

  _getItemById(collection, id) {
    const data = this.cache.get(collection) || [];
    return data.find(item => item.id === id);
  }

  _applySorting(data, sortOptions) {
    return data.sort((a, b) => {
      for (const [field, direction] of Object.entries(sortOptions)) {
        const aVal = a[field];
        const bVal = b[field];

        if (aVal < bVal) {
          return direction === 1 ? -1 : 1;
        }
        if (aVal > bVal) {
          return direction === 1 ? 1 : -1;
        }
      }
      return 0;
    });
  }

  _cacheQuery(key, result) {
    // Implement LRU cache eviction
    if (this.queryCache.size >= this.maxCacheSize) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }

    this.queryCache.set(key, result);
  }

  _updateCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    this.statistics.cacheHitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  _updateQueryStats(queryTime) {
    const prevAvg = this.statistics.avgQueryTime || 0;
    const count = this.statistics.queries;
    this.statistics.avgQueryTime = (prevAvg * (count - 1) + queryTime) / count;
  }

  createIndex(collection, fields) {
    this.validateCollection(collection);

    const indexKey = `${collection}:${fields.sort().join(',')}`;
    const index = new Map();

    const data = this.cache.get(collection) || [];
    for (const item of data) {
      const indexValue = fields.map(field => item[field]).join('|');

      if (!index.has(indexValue)) {
        index.set(indexValue, new Set());
      }
      index.get(indexValue).add(item.id);
    }

    this.indexes.set(indexKey, index);
    console.log(`📊 Created index for ${collection} on fields: ${fields.join(', ')}`);
  }

  dropIndex(collection, fields) {
    const indexKey = `${collection}:${fields.sort().join(',')}`;
    const deleted = this.indexes.delete(indexKey);

    if (deleted) {
      console.log(`📊 Dropped index for ${collection} on fields: ${fields.join(', ')}`);
    }

    return deleted;
  }

  getPerformanceStats() {
    return {
      ...this.statistics,
      cacheSize: this.queryCache.size,
      indexCount: this.indexes.size,
      totalCacheRequests: this.cacheHits + this.cacheMisses
    };
  }

  clearQueryCache() {
    this.queryCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.log('🧹 Query cache cleared');
  }

  /**
   * Graceful shutdown helper
   */
  async shutdown() {
    await this.close();
    this.removeAllListeners();
  }
}

// Export singleton instance
let databaseInstance = null;

export function getDatabase() {
  if (!databaseInstance) {
    databaseInstance = new DatabaseService();
  }
  return databaseInstance;
}

export default DatabaseService;
