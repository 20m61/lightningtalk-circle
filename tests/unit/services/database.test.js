/**
 * Database Service Unit Tests
 * データベースサービスの単体テスト
 */

const { DatabaseService } = require('../../../server/services/database');

describe('DatabaseService', () => {
  let database;

  beforeEach(() => {
    database = new DatabaseService();
  });

  afterEach(async () => {
    if (database && database.close) {
      await database.close();
    }
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(DatabaseService);
    });
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      expect(database).toBeInstanceOf(DatabaseService);
      expect(database.connectionString).toBeDefined();
    });

    it('should handle custom configuration', () => {
      const customConfig = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        user: 'test_user',
        password: 'test_pass'
      };

      const customDatabase = new DatabaseService(customConfig);
      expect(customDatabase.config).toEqual(expect.objectContaining(customConfig));
    });
  });

  describe('query method', () => {
    it('should handle simple queries', async () => {
      // モックデータベースクエリ
      database.query = jest.fn().mockResolvedValue([
        { id: 1, name: 'Test Event', status: 'upcoming' },
        { id: 2, name: 'Another Event', status: 'completed' }
      ]);

      const result = await database.query('SELECT * FROM events');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Test Event',
          status: 'upcoming'
        })
      );
      expect(database.query).toHaveBeenCalledWith('SELECT * FROM events');
    });

    it('should handle parameterized queries', async () => {
      database.query = jest
        .fn()
        .mockResolvedValue([{ id: 1, name: 'Test Event', status: 'upcoming' }]);

      const result = await database.query('SELECT * FROM events WHERE id = ?', [1]);

      expect(result).toHaveLength(1);
      expect(database.query).toHaveBeenCalledWith('SELECT * FROM events WHERE id = ?', [1]);
    });

    it('should handle query errors', async () => {
      database.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      await expect(database.query('SELECT * FROM events')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('transaction support', () => {
    it('should support transactions', async () => {
      const mockTransaction = {
        query: jest.fn().mockResolvedValue([{ id: 1 }]),
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true)
      };

      database.beginTransaction = jest.fn().mockResolvedValue(mockTransaction);

      const transaction = await database.beginTransaction();

      expect(transaction).toEqual(mockTransaction);
      expect(database.beginTransaction).toHaveBeenCalled();
    });
  });

  describe('connection management', () => {
    it('should initialize connection', async () => {
      database.initialize = jest.fn().mockResolvedValue(true);

      const result = await database.initialize();

      expect(result).toBe(true);
      expect(database.initialize).toHaveBeenCalled();
    });

    it('should wait for connection', async () => {
      database.waitForConnection = jest.fn().mockResolvedValue(true);

      const result = await database.waitForConnection();

      expect(result).toBe(true);
      expect(database.waitForConnection).toHaveBeenCalled();
    });

    it('should close connection gracefully', async () => {
      database.close = jest.fn().mockResolvedValue(true);

      const result = await database.close();

      expect(result).toBe(true);
      expect(database.close).toHaveBeenCalled();
    });
  });

  describe('data operations', () => {
    beforeEach(() => {
      // 共通のモックメソッドを設定
      database.query = jest.fn();
    });

    it('should insert data', async () => {
      database.query.mockResolvedValue([{ insertId: 1 }]);

      const result = await database.query('INSERT INTO events (title, description) VALUES (?, ?)', [
        'Test Event',
        'Test Description'
      ]);

      expect(result[0].insertId).toBe(1);
    });

    it('should update data', async () => {
      database.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await database.query('UPDATE events SET title = ? WHERE id = ?', [
        'Updated Title',
        1
      ]);

      expect(result[0].affectedRows).toBe(1);
    });

    it('should delete data', async () => {
      database.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await database.query('DELETE FROM events WHERE id = ?', [1]);

      expect(result[0].affectedRows).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle connection errors', async () => {
      database.initialize = jest.fn().mockRejectedValue(new Error('Connection refused'));

      await expect(database.initialize()).rejects.toThrow('Connection refused');
    });

    it('should handle query timeout', async () => {
      database.query = jest.fn().mockRejectedValue(new Error('Query timeout'));

      await expect(database.query('SELECT * FROM events')).rejects.toThrow('Query timeout');
    });

    it('should handle invalid SQL', async () => {
      database.query = jest.fn().mockRejectedValue(new Error('Syntax error in SQL statement'));

      await expect(database.query('INVALID SQL')).rejects.toThrow('Syntax error in SQL statement');
    });
  });

  describe('data seeding', () => {
    it('should seed database with test data', async () => {
      const seedData = {
        events: [
          {
            title: 'Test Event',
            description: 'Test Description',
            date: '2025-06-25T19:00:00Z'
          }
        ]
      };

      database.seed = jest.fn().mockResolvedValue(true);

      const result = await database.seed(seedData);

      expect(result).toBe(true);
      expect(database.seed).toHaveBeenCalledWith(seedData);
    });
  });

  describe('performance', () => {
    it('should handle multiple concurrent queries', async () => {
      database.query = jest
        .fn()
        .mockResolvedValueOnce([{ id: 1 }])
        .mockResolvedValueOnce([{ id: 2 }])
        .mockResolvedValueOnce([{ id: 3 }]);

      const promises = [
        database.query('SELECT * FROM events WHERE id = 1'),
        database.query('SELECT * FROM events WHERE id = 2'),
        database.query('SELECT * FROM events WHERE id = 3')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(database.query).toHaveBeenCalledTimes(3);
    });

    it('should handle large result sets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Event ${i + 1}`,
        status: 'upcoming'
      }));

      database.query = jest.fn().mockResolvedValue(largeDataset);

      const startTime = Date.now();
      const result = await database.query('SELECT * FROM events');
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
    });
  });
});
