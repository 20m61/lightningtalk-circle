/**
 * DynamoDB Database Service
 * Provides database operations using AWS DynamoDB with retry logic
 */

import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';
import { wrapDynamoDbClient, batchWriteWithRetry } from '../utils/dynamodb-retry.js';

export class DynamoDBDatabaseService {
  constructor(config = {}) {
    // Configure AWS SDK
    AWS.config.update({
      region: config.region || process.env.AWS_REGION || 'ap-northeast-1',
      ...(config.endpoint && { endpoint: config.endpoint }) // For local testing with DynamoDB Local
    });

    // Create DynamoDB DocumentClient
    const client = new AWS.DynamoDB.DocumentClient({
      convertEmptyValues: true,
      ...(config.dynamoDbOptions || {})
    });

    // Wrap client with retry logic
    this.dynamodb = wrapDynamoDbClient(client);

    // Table names from environment or config
    this.tables = {
      events: config.eventsTable || process.env.DYNAMODB_EVENTS_TABLE || 'lightningtalk-circle-events',
      participants: config.participantsTable || process.env.DYNAMODB_PARTICIPANTS_TABLE || 'lightningtalk-circle-participants',
      users: config.usersTable || process.env.DYNAMODB_USERS_TABLE || 'lightningtalk-circle-users',
      talks: config.talksTable || process.env.DYNAMODB_TALKS_TABLE || 'lightningtalk-circle-talks'
    };

    logger.info('DynamoDB Database Service initialized', { tables: this.tables });
  }

  /**
   * Initialize database (create tables if using DynamoDB Local)
   */
  async initialize() {
    // In production, tables are created by CDK
    // This method is mainly for local development
    if (process.env.NODE_ENV === 'production') {
      logger.info('Running in production mode, skipping table initialization');
      return;
    }

    // Check if tables exist (for local development)
    try {
      const dynamodb = new AWS.DynamoDB();
      const tableNames = Object.values(this.tables);
      
      for (const tableName of tableNames) {
        try {
          await dynamodb.describeTable({ TableName: tableName }).promise();
          logger.info(`Table ${tableName} already exists`);
        } catch (error) {
          if (error.code === 'ResourceNotFoundException') {
            logger.warn(`Table ${tableName} does not exist in local environment`);
          }
        }
      }
    } catch (error) {
      logger.error('Error checking tables:', error);
    }
  }

  /**
   * Generate a unique ID
   */
  generateId() {
    return uuidv4();
  }

  /**
   * Get current timestamp in ISO format
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Find one item by ID
   */
  async findOne(collection, id) {
    const params = {
      TableName: this.tables[collection],
      Key: { id }
    };

    try {
      const result = await this.dynamodb.get(params);
      return result.Item || null;
    } catch (error) {
      logger.error(`Error finding item in ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Find all items in a collection with optional filtering
   */
  async findAll(collection, filter = {}) {
    const tableName = this.tables[collection];
    
    // For simple queries, use scan (not recommended for large datasets)
    // In production, use query with GSIs for better performance
    if (Object.keys(filter).length === 0) {
      return this.scan(collection);
    }

    // Handle specific query patterns
    if (collection === 'events' && filter.status) {
      return this.queryEventsByStatus(filter.status);
    }
    
    if (collection === 'participants' && filter.eventId) {
      return this.queryParticipantsByEvent(filter.eventId);
    }
    
    if (collection === 'talks' && filter.eventId) {
      return this.queryTalksByEvent(filter.eventId);
    }

    // Fallback to scan with filter
    return this.scanWithFilter(collection, filter);
  }

  /**
   * Scan entire table (use sparingly)
   */
  async scan(collection) {
    const params = {
      TableName: this.tables[collection]
    };

    try {
      const items = [];
      let lastEvaluatedKey;

      do {
        if (lastEvaluatedKey) {
          params.ExclusiveStartKey = lastEvaluatedKey;
        }

        const result = await this.dynamodb.scan(params);
        items.push(...(result.Items || []));
        lastEvaluatedKey = result.LastEvaluatedKey;
      } while (lastEvaluatedKey);

      return items;
    } catch (error) {
      logger.error(`Error scanning ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Scan with filter expressions
   */
  async scanWithFilter(collection, filter) {
    const filterExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.entries(filter).forEach(([key, value], index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      
      filterExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    });

    const params = {
      TableName: this.tables[collection],
      FilterExpression: filterExpressions.join(' AND '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    };

    try {
      const result = await this.dynamodb.scan(params);
      return result.Items || [];
    } catch (error) {
      logger.error(`Error scanning ${collection} with filter:`, error);
      throw error;
    }
  }

  /**
   * Query events by status using GSI
   */
  async queryEventsByStatus(status) {
    const params = {
      TableName: this.tables.events,
      IndexName: 'date-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      }
    };

    try {
      const result = await this.dynamodb.query(params);
      return result.Items || [];
    } catch (error) {
      logger.error('Error querying events by status:', error);
      throw error;
    }
  }

  /**
   * Query participants by event using GSI
   */
  async queryParticipantsByEvent(eventId) {
    const params = {
      TableName: this.tables.participants,
      IndexName: 'event-index',
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: {
        ':eventId': eventId
      }
    };

    try {
      const result = await this.dynamodb.query(params);
      return result.Items || [];
    } catch (error) {
      logger.error('Error querying participants by event:', error);
      throw error;
    }
  }

  /**
   * Query talks by event using GSI
   */
  async queryTalksByEvent(eventId) {
    const params = {
      TableName: this.tables.talks,
      IndexName: 'event-index',
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: {
        ':eventId': eventId
      }
    };

    try {
      const result = await this.dynamodb.query(params);
      return result.Items || [];
    } catch (error) {
      logger.error('Error querying talks by event:', error);
      throw error;
    }
  }

  /**
   * Insert a new item
   */
  async insert(collection, data) {
    const item = {
      ...data,
      id: data.id || this.generateId(),
      createdAt: data.createdAt || this.getTimestamp(),
      updatedAt: this.getTimestamp()
    };

    const params = {
      TableName: this.tables[collection],
      Item: item,
      ConditionExpression: 'attribute_not_exists(id)' // Ensure item doesn't already exist
    };

    try {
      await this.dynamodb.put(params);
      logger.info(`Inserted item into ${collection}:`, { id: item.id });
      return item;
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('Item with this ID already exists');
      }
      logger.error(`Error inserting into ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing item
   */
  async update(collection, id, updates) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Build update expression
    Object.entries(updates).forEach(([key, value], index) => {
      if (key !== 'id' && key !== 'createdAt') { // Don't update these fields
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      }
    });

    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = this.getTimestamp();

    const params = {
      TableName: this.tables[collection],
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(id)', // Ensure item exists
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await this.dynamodb.update(params);
      logger.info(`Updated item in ${collection}:`, { id });
      return result.Attributes;
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('Item not found');
      }
      logger.error(`Error updating ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async delete(collection, id) {
    const params = {
      TableName: this.tables[collection],
      Key: { id },
      ConditionExpression: 'attribute_exists(id)', // Ensure item exists
      ReturnValues: 'ALL_OLD'
    };

    try {
      const result = await this.dynamodb.delete(params);
      logger.info(`Deleted item from ${collection}:`, { id });
      return result.Attributes;
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('Item not found');
      }
      logger.error(`Error deleting from ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Batch insert items
   */
  async batchInsert(collection, items) {
    const tableName = this.tables[collection];
    const itemsWithMetadata = items.map(item => ({
      ...item,
      id: item.id || this.generateId(),
      createdAt: item.createdAt || this.getTimestamp(),
      updatedAt: this.getTimestamp()
    }));

    try {
      await batchWriteWithRetry(this.dynamodb._originalClient, tableName, itemsWithMetadata);
      logger.info(`Batch inserted ${items.length} items into ${collection}`);
      return itemsWithMetadata;
    } catch (error) {
      logger.error(`Error batch inserting into ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collection) {
    const tableName = this.tables[collection];
    
    try {
      // Get table description for item count
      const dynamodb = new AWS.DynamoDB();
      const tableDesc = await dynamodb.describeTable({ TableName: tableName }).promise();
      
      const stats = {
        total: tableDesc.Table.ItemCount || 0,
        tableSizeBytes: tableDesc.Table.TableSizeBytes || 0,
        status: tableDesc.Table.TableStatus
      };

      // For more detailed stats, we would need to scan the table
      // which is expensive for large tables
      if (stats.total < 1000) { // Only scan small tables
        const items = await this.scan(collection);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        stats.createdToday = items.filter(item => 
          new Date(item.createdAt) >= today
        ).length;

        stats.createdThisWeek = items.filter(item => 
          new Date(item.createdAt) >= weekAgo
        ).length;

        stats.lastUpdated = items.length > 0 
          ? Math.max(...items.map(item => new Date(item.updatedAt).getTime()))
          : null;
      }

      return stats;
    } catch (error) {
      logger.error(`Error getting stats for ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Check if database is connected (health check)
   */
  async isConnected() {
    try {
      // Try to describe one of the tables
      const dynamodb = new AWS.DynamoDB();
      await dynamodb.describeTable({ TableName: this.tables.events }).promise();
      return true;
    } catch (error) {
      logger.error('DynamoDB connection check failed:', error);
      return false;
    }
  }

  /**
   * Close database connection (no-op for DynamoDB)
   */
  async close() {
    // DynamoDB doesn't maintain persistent connections
    logger.info('DynamoDB Database Service closed');
  }
}

export default DynamoDBDatabaseService;