/**
 * WebSocket Service Unit Tests
 * WebSocketサービスの単体テスト
 */

import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

// Mock Socket.IO components
class MockSocket extends EventEmitter {
  constructor(id = 'test-socket-id') {
    super();
    this.id = id;
    this.handshake = {
      auth: { token: 'test-token' }
    };
    this.rooms = new Set();
    this.data = {};
  }

  join = jest.fn(room => {
    this.rooms.add(room);
  });

  leave = jest.fn(room => {
    this.rooms.delete(room);
  });

  emit = jest.fn();

  to = jest.fn(() => this);

  broadcast = {
    emit: jest.fn()
  };
}

class MockIO extends EventEmitter {
  constructor() {
    super();
    this.middlewares = [];
    this.sockets = new Map();
  }

  use = jest.fn(middleware => {
    this.middlewares.push(middleware);
  });

  to = jest.fn(room => ({
    emit: jest.fn()
  }));

  emit = jest.fn();

  close = jest.fn(callback => {
    if (callback) callback();
  });
}

// Create mock factory
const createMockIO = () => new MockIO();
const createMockSocket = id => new MockSocket(id);

jest.unstable_mockModule('socket.io', () => ({
  Server: jest.fn(() => createMockIO())
}));

jest.unstable_mockModule('../../../server/utils/logger.js', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

const { WebSocketService } = await import('../../../server/services/websocketService.js');

describe('WebSocketService', () => {
  let websocketService;
  let mockServer;

  beforeEach(() => {
    websocketService = new WebSocketService();
    mockServer = { listen: jest.fn() };
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (websocketService.io && websocketService.io.close) {
      websocketService.io.close();
    }
    jest.clearAllTimers();
  });

  describe('initialize', () => {
    it('should initialize WebSocket server with default options', () => {
      const result = websocketService.initialize(mockServer);

      expect(result).toBeDefined();
      expect(websocketService.io).toBeDefined();
      expect(websocketService.io.use).toHaveBeenCalled();
      expect(websocketService.io.on).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const options = {
        cors: { origin: 'http://localhost:3000' },
        pingTimeout: 30000
      };

      websocketService.initialize(mockServer, options);

      expect(websocketService.io).toBeDefined();
      expect(websocketService.options).toMatchObject(options);
    });
  });

  describe('setupMiddleware', () => {
    beforeEach(() => {
      websocketService.initialize(mockServer);
    });

    it('should set up authentication middleware', () => {
      expect(websocketService.io.use).toHaveBeenCalled();
      expect(websocketService.io.middlewares.length).toBeGreaterThan(0);
    });

    it('should authenticate valid token', async () => {
      const mockSocket = createMockSocket();
      mockSocket.handshake.auth.token = 'valid-token';

      const middleware = websocketService.io.middlewares[0];
      const next = jest.fn();

      // Mock JWT verification
      websocketService.verifyToken = jest.fn().mockResolvedValue({ userId: 'user123' });

      await middleware(mockSocket, next);

      expect(next).toHaveBeenCalledWith();
      expect(mockSocket.data.user).toEqual({ userId: 'user123' });
    });

    it('should reject invalid token', async () => {
      const mockSocket = createMockSocket();
      mockSocket.handshake.auth.token = 'invalid-token';

      const middleware = websocketService.io.middlewares[0];
      const next = jest.fn();

      websocketService.verifyToken = jest.fn().mockResolvedValue(null);

      await middleware(mockSocket, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing token', async () => {
      const mockSocket = createMockSocket();
      delete mockSocket.handshake.auth.token;

      const middleware = websocketService.io.middlewares[0];
      const next = jest.fn();

      await middleware(mockSocket, next);

      expect(next).toHaveBeenCalledWith();
      expect(mockSocket.data.user).toBeUndefined();
    });
  });

  describe('handleConnection', () => {
    let mockSocket;

    beforeEach(() => {
      websocketService.initialize(mockServer);
      mockSocket = createMockSocket();
      mockSocket.data.user = { userId: 'user123', name: 'Test User' };
    });

    it('should handle new connection', () => {
      websocketService.handleConnection(mockSocket);

      expect(websocketService.connections.has(mockSocket.id)).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', expect.any(Object));
    });

    it('should store connection information', () => {
      websocketService.handleConnection(mockSocket);

      const connection = websocketService.connections.get(mockSocket.id);
      expect(connection).toBeDefined();
      expect(connection.user).toEqual(mockSocket.data.user);
      expect(connection.connectedAt).toBeInstanceOf(Date);
    });
  });

  describe('handleDisconnect', () => {
    let mockSocket;

    beforeEach(() => {
      websocketService.initialize(mockServer);
      mockSocket = createMockSocket();
      mockSocket.data.user = { userId: 'user123' };
      websocketService.handleConnection(mockSocket);
    });

    it('should handle disconnection', () => {
      websocketService.handleDisconnect(mockSocket);

      expect(websocketService.connections.has(mockSocket.id)).toBe(false);
    });

    it('should clean up rooms on disconnect', () => {
      mockSocket.rooms.add('room1');
      mockSocket.rooms.add('room2');

      websocketService.roomUsers.set('room1', new Set([mockSocket.id, 'other-id']));
      websocketService.roomUsers.set('room2', new Set([mockSocket.id]));

      websocketService.handleDisconnect(mockSocket);

      expect(websocketService.roomUsers.get('room1').has(mockSocket.id)).toBe(false);
      expect(websocketService.roomUsers.has('room2')).toBe(false);
    });
  });

  describe('handleJoinRoom', () => {
    let mockSocket;

    beforeEach(() => {
      websocketService.initialize(mockServer);
      mockSocket = createMockSocket();
      mockSocket.data.user = { userId: 'user123' };
    });

    it('should allow joining room with valid access', async () => {
      const roomName = 'event-123';
      const callback = jest.fn();

      await websocketService.handleJoinRoom(mockSocket, roomName, callback);

      expect(mockSocket.join).toHaveBeenCalledWith(roomName);
      expect(callback).toHaveBeenCalledWith(null, { joined: true, room: roomName });
    });

    it('should reject joining room without access', async () => {
      const roomName = 'admin';
      const callback = jest.fn();
      mockSocket.data.user = { userId: 'user123', role: 'user' };

      await websocketService.handleJoinRoom(mockSocket, roomName, callback);

      expect(mockSocket.join).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith('Access denied');
    });

    it('should track room membership', async () => {
      const roomName = 'event-123';

      await websocketService.handleJoinRoom(mockSocket, roomName, jest.fn());

      expect(websocketService.roomUsers.has(roomName)).toBe(true);
      expect(websocketService.roomUsers.get(roomName).has(mockSocket.id)).toBe(true);
    });
  });

  describe('handleMessage', () => {
    let mockSocket;

    beforeEach(() => {
      websocketService.initialize(mockServer);
      mockSocket = createMockSocket();
      mockSocket.data.user = { userId: 'user123' };
    });

    it('should handle message without rate limiting', () => {
      const data = { room: 'event-123', message: 'Hello' };
      const callback = jest.fn();

      websocketService.handleMessage(mockSocket, data, callback);

      expect(websocketService.io.to).toHaveBeenCalledWith(data.room);
      expect(callback).toHaveBeenCalledWith(null, { sent: true });
    });

    it('should apply rate limiting for rapid messages', () => {
      const data = { room: 'event-123', message: 'Hello' };
      const callback = jest.fn();

      // Send multiple messages rapidly
      for (let i = 0; i < 15; i++) {
        websocketService.handleMessage(mockSocket, data, callback);
      }

      // Last calls should be rate limited
      expect(callback).toHaveBeenLastCalledWith('Rate limit exceeded');
    });

    it('should route to custom message handler', () => {
      const customHandler = jest.fn();
      websocketService.registerMessageHandler('custom', customHandler);

      const data = { type: 'custom', payload: { test: true } };
      websocketService.handleMessage(mockSocket, data, jest.fn());

      expect(customHandler).toHaveBeenCalledWith(mockSocket, data, expect.any(Function));
    });
  });

  describe('message handlers', () => {
    it('should register custom message handler', () => {
      const handler = jest.fn();

      websocketService.registerMessageHandler('test', handler);

      expect(websocketService.messageHandlers.has('test')).toBe(true);
    });
  });

  describe('broadcasting methods', () => {
    beforeEach(() => {
      websocketService.initialize(mockServer);
    });

    it('should broadcast to room', () => {
      const room = 'event-123';
      const event = 'update';
      const data = { test: true };

      websocketService.broadcastToRoom(room, event, data);

      expect(websocketService.io.to).toHaveBeenCalledWith(room);
    });

    it('should send to specific socket', () => {
      const socketId = 'socket-123';
      const event = 'private';
      const data = { message: 'test' };

      websocketService.sendToSocket(socketId, event, data);

      expect(websocketService.io.to).toHaveBeenCalledWith(socketId);
    });

    it('should broadcast to all', () => {
      const event = 'announcement';
      const data = { message: 'Hello everyone' };

      websocketService.broadcastToAll(event, data);

      expect(websocketService.io.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('metrics', () => {
    it('should return current metrics', () => {
      websocketService.initialize(mockServer);

      const socket1 = createMockSocket('socket1');
      const socket2 = createMockSocket('socket2');

      websocketService.handleConnection(socket1);
      websocketService.handleConnection(socket2);

      const metrics = websocketService.getMetrics();

      expect(metrics.connections).toBe(2);
      expect(metrics.rooms).toBe(0);
      expect(metrics.messagesPerMinute).toBeDefined();
    });
  });

  describe('validateRoomAccess', () => {
    beforeEach(() => {
      websocketService.initialize(mockServer);
    });

    it('should allow authenticated users to join event rooms', () => {
      const socket = createMockSocket();
      socket.data.user = { userId: 'user123' };

      const result = websocketService.validateRoomAccess(socket, 'event-123');
      expect(result).toBe(true);
    });

    it('should deny unauthenticated users access to event rooms', () => {
      const socket = createMockSocket();
      socket.data.user = null;

      const result = websocketService.validateRoomAccess(socket, 'event-123');
      expect(result).toBe(false);
    });

    it('should allow admin users to join admin rooms', () => {
      const socket = createMockSocket();
      socket.data.user = { userId: 'admin123', role: 'admin' };

      const result = websocketService.validateRoomAccess(socket, 'admin');
      expect(result).toBe(true);
    });

    it('should deny non-admin users access to admin rooms', () => {
      const socket = createMockSocket();
      socket.data.user = { userId: 'user123', role: 'user' };

      const result = websocketService.validateRoomAccess(socket, 'admin');
      expect(result).toBe(false);
    });
  });

  describe('shutdown', () => {
    it('should gracefully shutdown', async () => {
      websocketService.initialize(mockServer);

      await websocketService.shutdown();

      expect(websocketService.io.close).toHaveBeenCalled();
      expect(websocketService.io).toBeNull();
    });
  });

  describe('JWT utilities', () => {
    it('should verify valid JWT token', async () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMTIzIiwiaWF0IjoxNjE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const result = await websocketService.verifyToken(token);

      expect(result).toBeDefined();
    });

    it('should return null for invalid token', async () => {
      const token = 'invalid-token';

      const result = await websocketService.verifyToken(token);

      expect(result).toBeNull();
    });
  });
});
