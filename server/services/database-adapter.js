/**
 * Database Adapter
 * データベース操作の抽象化レイヤー
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('database-adapter');

/**
 * Base Database Adapter
 * 各データベース実装の基底クラス
 */
export class DatabaseAdapter {
  constructor(config = {}) {
    this.config = config;
    this.isConnected = false;
  }

  async connect() {
    throw new Error('connect() must be implemented by subclass');
  }

  async disconnect() {
    throw new Error('disconnect() must be implemented by subclass');
  }

  async create(collection, data) {
    throw new Error('create() must be implemented by subclass');
  }

  async findOne(collection, query) {
    throw new Error('findOne() must be implemented by subclass');
  }

  async find(collection, query = {}, options = {}) {
    throw new Error('find() must be implemented by subclass');
  }

  async update(collection, id, data) {
    throw new Error('update() must be implemented by subclass');
  }

  async delete(collection, id) {
    throw new Error('delete() must be implemented by subclass');
  }

  async count(collection, query = {}) {
    throw new Error('count() must be implemented by subclass');
  }
}

/**
 * File System Database Adapter
 * JSONファイルベースのシンプルなデータベース
 */
export class FileSystemAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.dataDir = config.dataDir || './data';
    this.data = new Map();
  }

  async connect() {
    // Load data files
    logger.info('FileSystem database connected');
    this.isConnected = true;
  }

  async disconnect() {
    this.data.clear();
    this.isConnected = false;
    logger.info('FileSystem database disconnected');
  }

  async create(collection, data) {
    if (!this.data.has(collection)) {
      this.data.set(collection, new Map());
    }

    const id = data.id || this.generateId();
    const record = {
      ...data,
      id,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.get(collection).set(id, record);
    await this.persist(collection);

    return record;
  }

  async findOne(collection, query) {
    if (!this.data.has(collection)) {
      return null;
    }

    const records = this.data.get(collection);
    for (const [id, record] of records) {
      if (this.matchesQuery(record, query)) {
        return record;
      }
    }

    return null;
  }

  async find(collection, query = {}, options = {}) {
    if (!this.data.has(collection)) {
      return [];
    }

    let results = [];
    const records = this.data.get(collection);

    for (const [id, record] of records) {
      if (this.matchesQuery(record, query)) {
        results.push(record);
      }
    }

    // Apply sorting
    if (options.sort) {
      results = this.sortResults(results, options.sort);
    }

    // Apply limit
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    // Apply skip
    if (options.skip) {
      results = results.slice(options.skip);
    }

    return results;
  }

  async update(collection, id, data) {
    if (!this.data.has(collection)) {
      throw new Error(`Collection ${collection} not found`);
    }

    const records = this.data.get(collection);
    const existing = records.get(id);

    if (!existing) {
      throw new Error(`Record ${id} not found in ${collection}`);
    }

    const updated = {
      ...existing,
      ...data,
      id, // Preserve ID
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    records.set(id, updated);
    await this.persist(collection);

    return updated;
  }

  async delete(collection, id) {
    if (!this.data.has(collection)) {
      return false;
    }

    const records = this.data.get(collection);
    const deleted = records.delete(id);

    if (deleted) {
      await this.persist(collection);
    }

    return deleted;
  }

  async count(collection, query = {}) {
    const results = await this.find(collection, query);
    return results.length;
  }

  // Helper methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  matchesQuery(record, query) {
    for (const [key, value] of Object.entries(query)) {
      if (record[key] !== value) {
        return false;
      }
    }
    return true;
  }

  sortResults(results, sortSpec) {
    return results.sort((a, b) => {
      for (const [field, order] of Object.entries(sortSpec)) {
        const aVal = a[field];
        const bVal = b[field];

        if (aVal < bVal) {
          return order === 1 ? -1 : 1;
        }
        if (aVal > bVal) {
          return order === 1 ? 1 : -1;
        }
      }
      return 0;
    });
  }

  async persist(collection) {
    // In a real implementation, this would write to disk
    logger.debug(`Persisted collection: ${collection}`);
  }
}

/**
 * DynamoDB Adapter
 * AWS DynamoDBを使用するアダプター
 */
export class DynamoDBAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.client = null;
    this.tablePrefix = config.tablePrefix || 'lightningtalk_';
  }

  async connect() {
    // Import AWS SDK dynamically
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb');

    this.client = DynamoDBDocumentClient.from(new DynamoDBClient(this.config.aws || {}));

    this.isConnected = true;
    logger.info('DynamoDB connected');
  }

  async disconnect() {
    this.client = null;
    this.isConnected = false;
    logger.info('DynamoDB disconnected');
  }

  async create(collection, data) {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');

    const id = data.id || this.generateId();
    const item = {
      ...data,
      id,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.client.send(
      new PutCommand({
        TableName: this.getTableName(collection),
        Item: item
      })
    );

    return item;
  }

  async findOne(collection, query) {
    if (query.id) {
      // Use GetItem for ID queries
      const { GetCommand } = await import('@aws-sdk/lib-dynamodb');

      const response = await this.client.send(
        new GetCommand({
          TableName: this.getTableName(collection),
          Key: { id: query.id }
        })
      );

      return response.Item || null;
    }

    // Use Query for other queries
    const results = await this.find(collection, query, { limit: 1 });
    return results[0] || null;
  }

  async find(collection, query = {}, options = {}) {
    const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');

    const params = {
      TableName: this.getTableName(collection),
      Limit: options.limit
    };

    // Add filter expressions for query
    if (Object.keys(query).length > 0) {
      const filterExpressions = [];
      const expressionValues = {};
      const expressionNames = {};

      Object.entries(query).forEach(([key, value], index) => {
        const placeholder = `:val${index}`;
        const namePlaceholder = `#attr${index}`;

        filterExpressions.push(`${namePlaceholder} = ${placeholder}`);
        expressionValues[placeholder] = value;
        expressionNames[namePlaceholder] = key;
      });

      params.FilterExpression = filterExpressions.join(' AND ');
      params.ExpressionAttributeValues = expressionValues;
      params.ExpressionAttributeNames = expressionNames;
    }

    const response = await this.client.send(new ScanCommand(params));
    return response.Items || [];
  }

  async update(collection, id, data) {
    const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb');

    const updateExpressions = [];
    const expressionValues = {};
    const expressionNames = {};

    // Build update expression
    Object.entries(data).forEach(([key, value], index) => {
      if (key !== 'id') {
        const placeholder = `:val${index}`;
        const namePlaceholder = `#attr${index}`;

        updateExpressions.push(`${namePlaceholder} = ${placeholder}`);
        expressionValues[placeholder] = value;
        expressionNames[namePlaceholder] = key;
      }
    });

    // Add updatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = new Date().toISOString();
    expressionNames['#updatedAt'] = 'updatedAt';

    const response = await this.client.send(
      new UpdateCommand({
        TableName: this.getTableName(collection),
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionValues,
        ExpressionAttributeNames: expressionNames,
        ReturnValues: 'ALL_NEW'
      })
    );

    return response.Attributes;
  }

  async delete(collection, id) {
    const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');

    await this.client.send(
      new DeleteCommand({
        TableName: this.getTableName(collection),
        Key: { id }
      })
    );

    return true;
  }

  async count(collection, query = {}) {
    const results = await this.find(collection, query);
    return results.length;
  }

  // Helper methods
  getTableName(collection) {
    return `${this.tablePrefix}${collection}`;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

/**
 * Create database adapter based on configuration
 */
export function createDatabaseAdapter(config = {}) {
  const type = config.type || process.env.DATABASE_TYPE || 'filesystem';

  switch (type.toLowerCase()) {
    case 'dynamodb':
      return new DynamoDBAdapter(config);
    case 'filesystem':
    case 'file':
    default:
      return new FileSystemAdapter(config);
  }
}

export default { DatabaseAdapter, FileSystemAdapter, DynamoDBAdapter, createDatabaseAdapter };
