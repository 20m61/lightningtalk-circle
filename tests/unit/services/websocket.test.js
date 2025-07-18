/**
 * WebSocket Service Unit Tests
 * WebSocketサービスの単体テスト
 */

import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

// Mock Socket.IO
const mockSocket = {
  id: 'test-socket-id',
  handshake: {
    auth: { token: 'test-token' }
  },
  join: jest.fn(),
  leave: jest.fn(),
  emit: jest.fn(),
  to: jest.fn(() => mockSocket),
  broadcast: {
    emit: jest.fn()
  }
};

const mockIo = {
  use: jest.fn(),
  on: jest.fn(),
  to: jest.fn(() => mockSocket),
  emit: jest.fn(),
  close: jest.fn(callback => callback && callback())
};

jest.unstable_mockModule('socket.io', () => ({
  Server: jest.fn(() => mockIo)
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

    // Reset mocks
    jest.clearAllMocks();
    mockIo.use.mockClear();
    mockIo.on.mockClear();
  });

  afterEach(() => {
    // Clean up any timers or connections
    if (websocketService.io) {
      websocketService.io.close();
    }
    jest.clearAllTimers();
  });

  describe('initialize', () => {
    it('should initialize WebSocket server with default options', () => {
      const result = websocketService.initialize(mockServer);

      expect(result).toBe(mockIo);
      expect(websocketService.io).toBe(mockIo);
      expect(mockIo.use).toHaveBeenCalled(); // Middleware setup
    });

    it('should initialize with custom options', () => {
      const options = {
        cors: { origin: 'http://localhost:3000' },
        pingTimeout: 30000
      };

      websocketService.initialize(mockServer, options);

      expect(websocketService.io).toBe(mockIo);
    });
  });

  describe('setupMiddleware', () => {
    beforeEach(() => {
      websocketService.initialize(mockServer);
    });

    it('should set up authentication middleware', () => {
      expect(mockIo.use).toHaveBeenCalledTimes(2); // Auth + request tracking
    });

    it('should authenticate valid token', () => {
      websocketService.verifyToken = jest.fn().mockReturnValue({
        id: 'user-123',
        role: 'user',
        email: 'test@example.com'
      });

      // Get the auth middleware
      const authMiddleware = mockIo.use.mock.calls[0][0];
      const mockNext = jest.fn();

      authMiddleware(mockSocket, mockNext);

      expect(mockSocket.userId).toBe('user-123');
      expect(mockSocket.userRole).toBe('user');
      expect(mockSocket.authenticated).toBe(true);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid token', () => {
      websocketService.verifyToken = jest.fn().mockReturnValue(null);

      const authMiddleware = mockIo.use.mock.calls[0][0];
      const mockNext = jest.fn();

      authMiddleware(mockSocket, mockNext);

      expect(mockSocket.authenticated).toBe(false);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing token', () => {
      const socketWithoutToken = {
        ...mockSocket,
        handshake: { auth: {} }
      };

      const authMiddleware = mockIo.use.mock.calls[0][0];
      const mockNext = jest.fn();

      authMiddleware(socketWithoutToken, mockNext);

      expect(socketWithoutToken.authenticated).toBe(false);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('handleConnection', () => {
    beforeEach(() => {
      websocketService.initialize(mockServer);
    });

    it('should handle new connection', () => {
      const spy = jest.spyOn(websocketService, 'emit');

      websocketService.handleConnection(mockSocket);

      expect(websocketService.connections.has(mockSocket.id)).toBe(true);
      expect(websocketService.metrics.activeConnections).toBe(1);
      expect(websocketService.metrics.connectionsTotal).toBe(1);
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', expect.any(Object));
      expect(spy).toHaveBeenCalledWith('connection', expect.any(Object));
    });

    it('should store connection information', () => {
      mockSocket.userId = 'user-123';
      mockSocket.authenticated = true;

      websocketService.handleConnection(mockSocket);

      const connectionInfo = websocketService.connections.get(mockSocket.id);
      expect(connectionInfo).toMatchObject({
        id: mockSocket.id,
        userId: 'user-123',
        authenticated: true,
        rooms: expect.any(Set),
        metadata: {}
      });
    });
  });

  describe('handleDisconnect', () => {
    beforeEach(() => {
      websocketService.initialize(mockServer);
      websocketService.handleConnection(mockSocket);
    });

    it('should handle disconnection', () => {
      const spy = jest.spyOn(websocketService, 'emit');

      websocketService.handleDisconnect(mockSocket, 'client disconnect');

      expect(websocketService.connections.has(mockSocket.id)).toBe(false);
      expect(websocketService.metrics.activeConnections).toBe(0);
      expect(spy).toHaveBeenCalledWith('disconnect', {
        socket: mockSocket,
        reason: 'client disconnect'
      });
    });

    it('should clean up rooms on disconnect', () => {
      const roomName = 'test-room';

      // Add socket to room
      websocketService.rooms.set(roomName, {
        name: roomName,
        members: new Set([mockSocket.id]),
        created: new Date(),
        metadata: {}
      });

      const connectionInfo = websocketService.connections.get(mockSocket.id);
      connectionInfo.rooms.add(roomName);

      websocketService.handleDisconnect(mockSocket, 'client disconnect');

      expect(websocketService.rooms.has(roomName)).toBe(false);
    });
  });

  describe('handleJoinRoom', () => {
    beforeEach(() => {
      websocketService.initialize(mockServer);
      websocketService.handleConnection(mockSocket);
      websocketService.validateRoomAccess = jest.fn().mockResolvedValue(true);
    });

    it('should allow joining room with valid access', async () => {
      const roomData = { room: 'test-room', metadata: {} };

      await websocketService.handleJoinRoom(mockSocket, roomData);

      expect(mockSocket.join).toHaveBeenCalledWith('test-room');
      expect(websocketService.rooms.has('test-room')).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('room:joined', expect.any(Object));
    });

    it('should reject joining room without access', async () => {
      websocketService.validateRoomAccess = jest.fn().mockResolvedValue(false);
      const roomData = { room: 'admin-room' };

      await websocketService.handleJoinRoom(mockSocket, roomData);

      expect(mockSocket.join).not.toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('room:error', {
        room: 'admin-room',
        error: 'Access denied'
      });
    });

    it('should track room membership', async () => {
      const roomData = { room: 'test-room' };

      await websocketService.handleJoinRoom(mockSocket, roomData);

      const roomInfo = websocketService.rooms.get('test-room');
      expect(roomInfo.members.has(mockSocket.id)).toBe(true);

      const connectionInfo = websocketService.connections.get(mockSocket.id);
      expect(connectionInfo.rooms.has('test-room')).toBe(true);
    });
  });

  describe('handleMessage', () => {
    beforeEach(() => {
      websocketService.initialize(mockServer);
      // Reset mockSocket properties that may be modified during tests
      mockSocket.messageCount = 0;
      mockSocket.lastMessageTime = Date.now();
      mockSocket.rateLimitExceeded = false;
      websocketService.handleConnection(mockSocket);
    });

    it('should handle message without rate limiting', () => {
      const messageData = {
        type: 'chat',
        payload: { text: 'Hello' },
        room: 'test-room'
      };

      websocketService.handleMessage(mockSocket, messageData);

      expect(websocketService.metrics.messagesTotal).toBe(1);
      expect(mockSocket.to).toHaveBeenCalledWith('test-room');
    });

    it('should apply rate limiting for rapid messages', () => {
      // Send many rapid messages
      for (let i = 0; i < 15; i++) {
        websocketService.handleMessage(mockSocket, { type: 'test' });
      }

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Rate limit exceeded'
      });
      expect(mockSocket.rateLimitExceeded).toBe(true);
    });

    it('should route to custom message handler', () => {
      const customHandler = jest.fn();
      websocketService.registerMessageHandler('custom', customHandler);

      const messageData = {
        type: 'custom',
        payload: { data: 'test' }
      };

      websocketService.handleMessage(mockSocket, messageData);

      expect(customHandler).toHaveBeenCalledWith(mockSocket, { data: 'test' }, { room: undefined, target: undefined });
    });
  });

  describe('registerMessageHandler', () => {
    it('should register custom message handler', () => {
      const handler = jest.fn();

      websocketService.registerMessageHandler('test-type', handler);

      expect(websocketService.messageHandlers.has('test-type')).toBe(true);
      expect(websocketService.messageHandlers.get('test-type')).toBe(handler);
    });
  });

  describe('broadcasting methods', () => {
    beforeEach(() => {
      websocketService.initialize(mockServer);
    });

    it('should broadcast to room', () => {
      websocketService.broadcastToRoom('test-room', 'event', { data: 'test' });

      expect(mockIo.to).toHaveBeenCalledWith('test-room');
      expect(mockSocket.emit).toHaveBeenCalledWith('event', { data: 'test' });
    });

    it('should send to specific socket', () => {
      websocketService.sendToSocket('socket-id', 'event', { data: 'test' });

      expect(mockIo.to).toHaveBeenCalledWith('socket-id');
      expect(mockSocket.emit).toHaveBeenCalledWith('event', { data: 'test' });
    });

    it('should broadcast to all', () => {
      websocketService.broadcast('event', { data: 'test' });

      expect(mockIo.emit).toHaveBeenCalledWith('event', { data: 'test' });
    });
  });

  describe('metrics', () => {
    beforeEach(() => {
      websocketService.initialize(mockServer);
    });

    it('should return current metrics', () => {
      const metrics = websocketService.getMetrics();

      expect(metrics).toMatchObject({
        connectionsTotal: expect.any(Number),
        messagesTotal: expect.any(Number),
        errorsTotal: expect.any(Number),
        activeConnections: expect.any(Number),
        rooms: expect.any(Number),
        roomDetails: expect.any(Array)
      });
    });
  });

  describe('validateRoomAccess', () => {
    beforeEach(() => {
      websocketService.initialize(mockServer);
    });

    it('should allow authenticated users to join event rooms', async () => {
      mockSocket.authenticated = true;

      const canJoin = await websocketService.validateRoomAccess(mockSocket, 'event:123');

      expect(canJoin).toBe(true);
    });

    it('should deny unauthenticated users access to event rooms', async () => {
      mockSocket.authenticated = false;

      const canJoin = await websocketService.validateRoomAccess(mockSocket, 'event:123');

      expect(canJoin).toBe(false);
    });

    it('should allow admin users to join admin rooms', async () => {
      mockSocket.authenticated = true;
      mockSocket.userId = 'admin-user';
      mockSocket.userRole = 'admin';

      const canJoin = await websocketService.validateRoomAccess(mockSocket, 'admin:dashboard');

      expect(canJoin).toBe(true);
    });

    it('should deny non-admin users access to admin rooms', async () => {
      mockSocket.authenticated = true;
      mockSocket.userId = 'regular-user';
      mockSocket.userRole = 'user';

      const canJoin = await websocketService.validateRoomAccess(mockSocket, 'admin:dashboard');

      expect(canJoin).toBe(false);
    });
  });

  describe('shutdown', () => {
    beforeEach(() => {
      websocketService.initialize(mockServer);
    });

    it('should gracefully shutdown', async () => {
      await websocketService.shutdown();

      expect(mockIo.emit).toHaveBeenCalledWith('server:shutdown', expect.any(Object));
      expect(mockIo.close).toHaveBeenCalled();
      expect(websocketService.rooms.size).toBe(0);
      expect(websocketService.connections.size).toBe(0);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', () => {
      // Mock JWT verification
      const mockJwt = {
        verify: jest.fn().mockReturnValue({
          id: 'user-123',
          role: 'user',
          email: 'test@example.com'
        })
      };

      // Mock require for dynamic import
      const originalRequire = global.require;
      global.require = jest.fn().mockReturnValue(mockJwt);

      const user = websocketService.verifyToken('valid-token');

      expect(user).toEqual({
        id: 'user-123',
        role: 'user',
        email: 'test@example.com'
      });

      global.require = originalRequire;
    });

    it('should return null for invalid token', () => {
      const mockJwt = {
        verify: jest.fn().mockImplementation(() => {
          throw new Error('Invalid token');
        })
      };

      global.require = jest.fn().mockReturnValue(mockJwt);

      const user = websocketService.verifyToken('invalid-token');

      expect(user).toBeNull();
    });
  });
});
