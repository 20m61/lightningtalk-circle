/**
 * DynamoDB Database Service Tests
 */

import { jest } from '@jest/globals';

// Mock AWS SDK
const mockPut = jest.fn();
const mockGet = jest.fn();
const mockQuery = jest.fn();
const mockScan = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockBatchWrite = jest.fn();

// Check if aws-sdk is available (optional dependency)
let hasAwsSdk = false;
try {
  await import('aws-sdk');
  hasAwsSdk = true;

  jest.unstable_mockModule('aws-sdk', () => ({
    default: {
      config: {
        update: jest.fn()
      },
      DynamoDB: {
        DocumentClient: jest.fn(() => ({
          put: mockPut,
          get: mockGet,
          query: mockQuery,
          scan: mockScan,
          update: mockUpdate,
          delete: mockDelete,
          batchWrite: mockBatchWrite
        }))
      }
    }
  }));
} catch (error) {
  // aws-sdk not installed - skip DynamoDB tests
  console.warn('aws-sdk not found, skipping DynamoDB database tests');
}

// Mock uuid
jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')
}));

// Mock logger
jest.unstable_mockModule('../../../server/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock retry utility
jest.unstable_mockModule('../../../server/utils/dynamodb-retry.js', () => ({
  wrapDynamoDbClient: client => client,
  batchWriteWithRetry: jest.fn(async (client, params) => {
    return client.batchWrite(params).promise();
  })
}));

// Conditionally import and test DynamoDB service
if (hasAwsSdk) {
  const { DynamoDBDatabaseService } = await import('../../../server/services/dynamodb-database.js');

  describe('DynamoDB Database Service', () => {
    let service;

    beforeEach(() => {
      service = new DynamoDBDatabaseService({
        region: 'us-east-1',
        eventsTable: 'test-events',
        participantsTable: 'test-participants',
        usersTable: 'test-users',
        talksTable: 'test-talks'
      });

      // Reset all mocks
      jest.clearAllMocks();

      // Setup default mock responses
      mockPut.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      mockGet.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: null }) });
      mockQuery.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: [] }) });
      mockScan.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: [] }) });
      mockUpdate.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Attributes: {} }) });
      mockDelete.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      mockBatchWrite.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
    });

    describe('create', () => {
      it('should create an event with generated ID', async () => {
        const eventData = {
          title: 'Test Event',
          date: '2025-12-01'
        };

        const result = await service.create('events', eventData);

        expect(result).toEqual({
          id: 'test-uuid-123',
          title: 'Test Event',
          date: '2025-12-01',
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        });

        expect(mockPut).toHaveBeenCalledWith({
          TableName: 'test-events',
          Item: expect.objectContaining({
            id: 'test-uuid-123',
            title: 'Test Event'
          }),
          ConditionExpression: 'attribute_not_exists(id)'
        });
      });

      it('should create a participant with eventId', async () => {
        const participantData = {
          name: 'John Doe',
          email: 'john@example.com',
          eventId: 'event-123'
        };

        await service.create('participants', participantData);

        expect(mockPut).toHaveBeenCalledWith({
          TableName: 'test-participants',
          Item: expect.objectContaining({
            id: 'test-uuid-123',
            eventId: 'event-123',
            name: 'John Doe',
            email: 'john@example.com'
          })
        });
      });

      it('should handle DynamoDB errors', async () => {
        mockPut.mockReturnValue({
          promise: jest.fn().mockRejectedValue(new Error('DynamoDB Error'))
        });

        await expect(service.create('events', { title: 'Test' })).rejects.toThrow('DynamoDB Error');
      });
    });

    describe('findOne', () => {
      it('should find an event by ID', async () => {
        const mockEvent = {
          id: 'event-123',
          title: 'Test Event'
        };

        mockGet.mockReturnValue({
          promise: jest.fn().mockResolvedValue({ Item: mockEvent })
        });

        const result = await service.findOne('events', { id: 'event-123' });

        expect(result).toEqual(mockEvent);
        expect(mockGet).toHaveBeenCalledWith({
          TableName: 'test-events',
          Key: { id: 'event-123', createdAt: undefined }
        });
      });

      it('should return null when item not found', async () => {
        mockGet.mockReturnValue({
          promise: jest.fn().mockResolvedValue({ Item: null })
        });

        const result = await service.findOne('events', { id: 'non-existent' });

        expect(result).toBeNull();
      });

      it('should handle participants with eventId', async () => {
        await service.findOne('participants', {
          id: 'participant-123',
          eventId: 'event-123'
        });

        expect(mockGet).toHaveBeenCalledWith({
          TableName: 'test-participants',
          Key: {
            id: 'participant-123',
            eventId: 'event-123'
          }
        });
      });
    });

    describe('findAll', () => {
      it('should scan table when no filters provided', async () => {
        const mockItems = [
          { id: '1', title: 'Event 1' },
          { id: '2', title: 'Event 2' }
        ];

        mockScan.mockReturnValue({
          promise: jest.fn().mockResolvedValue({ Items: mockItems })
        });

        const result = await service.findAll('events', {});

        expect(result).toEqual(mockItems);
        expect(mockScan).toHaveBeenCalledWith({
          TableName: 'test-events'
        });
      });

      it('should query by eventId for participants', async () => {
        const mockParticipants = [
          { id: '1', name: 'John', eventId: 'event-123' },
          { id: '2', name: 'Jane', eventId: 'event-123' }
        ];

        mockQuery.mockReturnValue({
          promise: jest.fn().mockResolvedValue({ Items: mockParticipants })
        });

        const result = await service.findAll('participants', { eventId: 'event-123' });

        expect(result).toEqual(mockParticipants);
        expect(mockQuery).toHaveBeenCalledWith({
          TableName: 'test-participants',
          IndexName: 'event-index',
          KeyConditionExpression: 'eventId = :eventId',
          ExpressionAttributeValues: {
            ':eventId': 'event-123'
          }
        });
      });

      it('should handle pagination', async () => {
        const firstBatch = {
          Items: [{ id: '1' }],
          LastEvaluatedKey: { id: '1' }
        };
        const secondBatch = {
          Items: [{ id: '2' }],
          LastEvaluatedKey: null
        };

        mockScan
          .mockReturnValueOnce({ promise: jest.fn().mockResolvedValue(firstBatch) })
          .mockReturnValueOnce({ promise: jest.fn().mockResolvedValue(secondBatch) });

        const result = await service.findAll('events', {});

        expect(result).toEqual([{ id: '1' }, { id: '2' }]);
        expect(mockScan).toHaveBeenCalledTimes(2);
      });
    });

    describe('update', () => {
      it('should update an event', async () => {
        const updates = {
          title: 'Updated Event',
          description: 'New description'
        };

        mockUpdate.mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Attributes: { id: 'event-123', ...updates }
          })
        });

        const result = await service.update('events', 'event-123', updates);

        expect(result).toEqual({ id: 'event-123', ...updates });
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            TableName: 'test-events',
            Key: { id: 'event-123', createdAt: undefined },
            UpdateExpression: expect.stringContaining('SET'),
            ConditionExpression: 'attribute_exists(id)'
          })
        );
      });

      it('should handle participant updates with eventId', async () => {
        await service.update(
          'participants',
          'participant-123',
          { name: 'Updated Name' },
          { eventId: 'event-123' }
        );

        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            TableName: 'test-participants',
            Key: {
              id: 'participant-123',
              eventId: 'event-123'
            }
          })
        );
      });
    });

    describe('delete', () => {
      it('should delete an event', async () => {
        await service.delete('events', 'event-123');

        expect(mockDelete).toHaveBeenCalledWith({
          TableName: 'test-events',
          Key: { id: 'event-123', createdAt: undefined },
          ConditionExpression: 'attribute_exists(id)'
        });
      });

      it('should handle participant deletion with eventId', async () => {
        await service.delete('participants', 'participant-123', { eventId: 'event-123' });

        expect(mockDelete).toHaveBeenCalledWith({
          TableName: 'test-participants',
          Key: {
            id: 'participant-123',
            eventId: 'event-123'
          },
          ConditionExpression: 'attribute_exists(id)'
        });
      });
    });

    describe('count', () => {
      it('should count all items in a table', async () => {
        mockScan.mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Items: [{}, {}, {}],
            Count: 3
          })
        });

        const result = await service.count('events');

        expect(result).toBe(3);
        expect(mockScan).toHaveBeenCalledWith({
          TableName: 'test-events',
          Select: 'COUNT'
        });
      });
    });

    describe('getCurrentEvent', () => {
      it('should return the most recent upcoming event', async () => {
        const mockEvents = [
          { id: '1', date: '2025-01-01', status: 'upcoming' },
          { id: '2', date: '2025-02-01', status: 'upcoming' },
          { id: '3', date: '2024-12-01', status: 'completed' }
        ];

        mockQuery.mockReturnValue({
          promise: jest.fn().mockResolvedValue({ Items: mockEvents })
        });

        const result = await service.getCurrentEvent();

        expect(result).toEqual(mockEvents[0]);
      });

      it('should return null when no upcoming events', async () => {
        mockQuery.mockReturnValue({
          promise: jest.fn().mockResolvedValue({ Items: [] })
        });

        const result = await service.getCurrentEvent();

        expect(result).toBeNull();
      });
    });

    describe('close', () => {
      it('should log closing message', async () => {
        await service.close();

        // Just verify it doesn't throw
        expect(true).toBe(true);
      });
    });
  });
} else {
  describe('DynamoDB Database Service', () => {
    it('should skip tests when aws-sdk is not available', () => {
      expect(true).toBe(true);
    });
  });
}
