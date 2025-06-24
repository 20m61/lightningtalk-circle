/**
 * リアルタイム通知機能の統合テスト
 * SSE、WebSocket、通知サービスのテスト
 */

const request = require('supertest');
const { expect } = require('@jest/globals');
const WebSocket = require('ws');
const EventSource = require('eventsource');
const { app } = require('../../server/app');
const notificationService = require('../../server/services/notificationService');

describe('Realtime Notifications Integration Tests', () => {
  let server;
  let baseURL;

  beforeAll(async () => {
    server = app.listen(0); // ランダムポート
    const { port } = server.address();
    baseURL = `http://localhost:${port}`;
  });

  afterAll(done => {
    notificationService.shutdown();
    server.close(done);
  });

  describe('SSE (Server-Sent Events)', () => {
    it('should establish SSE connection', done => {
      const eventSource = new EventSource(`${baseURL}/api/notifications/stream`);

      eventSource.addEventListener('open', () => {
        expect(eventSource.readyState).to.equal(EventSource.OPEN);
        eventSource.close();
        done();
      });

      eventSource.addEventListener('error', error => {
        eventSource.close();
        done(error);
      });

      // タイムアウト設定
      setTimeout(() => {
        eventSource.close();
        done(new Error('SSE connection timeout'));
      }, 5000);
    });

    it('should receive connection confirmation', done => {
      const eventSource = new EventSource(`${baseURL}/api/notifications/stream`);

      eventSource.addEventListener('connected', event => {
        const data = JSON.parse(event.data);
        expect(data).to.have.property('message');
        expect(data).to.have.property('clientId');
        expect(data).to.have.property('timestamp');
        eventSource.close();
        done();
      });

      eventSource.addEventListener('error', error => {
        eventSource.close();
        done(error);
      });

      setTimeout(() => {
        eventSource.close();
        done(new Error('Connection confirmation timeout'));
      }, 5000);
    });

    it('should receive notifications via SSE', done => {
      const eventSource = new EventSource(`${baseURL}/api/notifications/stream`);
      let connected = false;

      eventSource.addEventListener('connected', () => {
        connected = true;

        // 通知を送信
        request(app)
          .post('/api/notifications/send')
          .send({
            event: 'test_notification',
            message: 'SSE test message',
            type: 'info'
          })
          .expect(200)
          .end();
      });

      eventSource.addEventListener('test_notification', event => {
        if (connected) {
          const data = JSON.parse(event.data);
          expect(data.message).to.equal('SSE test message');
          expect(data.type).to.equal('info');
          eventSource.close();
          done();
        }
      });

      eventSource.addEventListener('error', error => {
        eventSource.close();
        done(error);
      });

      setTimeout(() => {
        eventSource.close();
        done(new Error('SSE notification timeout'));
      }, 10000);
    });
  });

  describe('WebSocket', () => {
    it('should establish WebSocket connection', done => {
      const wsURL = `${baseURL.replace('http://', 'ws://')}/ws`;
      const ws = new WebSocket(wsURL);

      ws.on('open', () => {
        expect(ws.readyState).to.equal(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on('error', error => {
        done(error);
      });

      setTimeout(() => {
        ws.close();
        done(new Error('WebSocket connection timeout'));
      }, 5000);
    });

    it('should receive connection confirmation via WebSocket', done => {
      const wsURL = `${baseURL.replace('http://', 'ws://')}/ws`;
      const ws = new WebSocket(wsURL);

      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.event === 'connected') {
          expect(message.data).to.have.property('message');
          expect(message.data).to.have.property('clientId');
          expect(message.data).to.have.property('timestamp');
          ws.close();
          done();
        }
      });

      ws.on('error', error => {
        done(error);
      });

      setTimeout(() => {
        ws.close();
        done(new Error('WebSocket connection confirmation timeout'));
      }, 5000);
    });

    it('should handle WebSocket subscription', done => {
      const wsURL = `${baseURL.replace('http://', 'ws://')}/ws`;
      const ws = new WebSocket(wsURL);
      let connected = false;

      ws.on('open', () => {
        // トピック購読
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            topics: ['test-topic']
          })
        );
      });

      ws.on('message', data => {
        const message = JSON.parse(data.toString());

        if (message.event === 'connected') {
          connected = true;
        } else if (message.event === 'subscribed' && connected) {
          expect(message.data.topics).to.include('test-topic');
          ws.close();
          done();
        }
      });

      ws.on('error', error => {
        done(error);
      });

      setTimeout(() => {
        ws.close();
        done(new Error('WebSocket subscription timeout'));
      }, 5000);
    });

    it('should receive notifications via WebSocket', done => {
      const wsURL = `${baseURL.replace('http://', 'ws://')}/ws`;
      const ws = new WebSocket(wsURL);
      let subscribed = false;

      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            topics: ['all']
          })
        );
      });

      ws.on('message', data => {
        const message = JSON.parse(data.toString());

        if (message.event === 'subscribed') {
          subscribed = true;

          // 通知を送信
          request(app)
            .post('/api/notifications/send')
            .send({
              event: 'test_notification',
              message: 'WebSocket test message',
              type: 'info'
            })
            .expect(200)
            .end();
        } else if (message.event === 'test_notification' && subscribed) {
          expect(message.data.message).to.equal('WebSocket test message');
          expect(message.data.type).to.equal('info');
          ws.close();
          done();
        }
      });

      ws.on('error', error => {
        done(error);
      });

      setTimeout(() => {
        ws.close();
        done(new Error('WebSocket notification timeout'));
      }, 10000);
    });

    it('should handle chat messages via WebSocket', done => {
      const wsURL = `${baseURL.replace('http://', 'ws://')}/ws`;
      const ws = new WebSocket(wsURL);
      let subscribed = false;

      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            topics: ['all']
          })
        );
      });

      ws.on('message', data => {
        const message = JSON.parse(data.toString());

        if (message.event === 'subscribed') {
          subscribed = true;

          // チャットメッセージを送信
          ws.send(
            JSON.stringify({
              type: 'chat',
              message: 'Hello from WebSocket test',
              author: 'Test User'
            })
          );
        } else if (message.event === 'chat_message' && subscribed) {
          expect(message.data.message).to.equal('Hello from WebSocket test');
          expect(message.data.author).to.equal('Test User');
          ws.close();
          done();
        }
      });

      ws.on('error', error => {
        done(error);
      });

      setTimeout(() => {
        ws.close();
        done(new Error('WebSocket chat message timeout'));
      }, 10000);
    });
  });

  describe('Notification API Endpoints', () => {
    it('should send manual notification', async () => {
      const response = await request(app)
        .post('/api/notifications/send')
        .send({
          event: 'manual_test',
          message: 'Manual notification test',
          type: 'info',
          topic: 'test'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.event).to.equal('manual_test');
      expect(response.body.topic).to.equal('test');
    });

    it('should send system notification', async () => {
      const response = await request(app)
        .post('/api/notifications/system')
        .send({
          message: 'System test notification',
          type: 'warning',
          priority: 'high'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('System notification sent successfully');
    });

    it('should send participant registration notification', async () => {
      const response = await request(app)
        .post('/api/notifications/participant-registered')
        .send({
          participant: {
            name: 'Test Participant',
            email: 'test@example.com',
            event_id: 1
          }
        })
        .expect(200);

      expect(response.body.success).to.be.true;
    });

    it('should send talk submission notification', async () => {
      const response = await request(app)
        .post('/api/notifications/talk-submitted')
        .send({
          talk: {
            title: 'Test Talk',
            speaker: 'Test Speaker',
            description: 'Test description'
          }
        })
        .expect(200);

      expect(response.body.success).to.be.true;
    });

    it('should send event update notification', async () => {
      const response = await request(app)
        .post('/api/notifications/event-updated')
        .send({
          event: {
            id: 1,
            title: 'Updated Event',
            changes: ['venue', 'time']
          },
          updateType: 'urgent'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
    });

    it('should send chat message', async () => {
      const response = await request(app)
        .post('/api/notifications/chat')
        .send({
          message: 'Test chat message',
          author: 'API Test',
          room: 'general'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
    });

    it('should get connection stats', async () => {
      const response = await request(app).get('/api/notifications/stats').expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.stats).to.have.property('sseClients');
      expect(response.body.stats).to.have.property('wsClients');
      expect(response.body.stats).to.have.property('totalConnections');
    });

    it('should get notification history', async () => {
      // まず通知を送信
      await request(app).post('/api/notifications/send').send({
        event: 'history_test',
        message: 'History test message',
        type: 'info'
      });

      const response = await request(app).get('/api/notifications/history?limit=10').expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.history).to.be.an('array');
      expect(response.body.history.length).to.be.greaterThan(0);
    });

    it('should get available topics', async () => {
      const response = await request(app).get('/api/notifications/topics').expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.topics).to.be.an('array');
    });

    it('should send test notification', async () => {
      const response = await request(app)
        .post('/api/notifications/test')
        .send({
          type: 'both'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.testType).to.equal('both');
    });

    it('should return health check', async () => {
      const response = await request(app).get('/api/notifications/health').expect(200);

      expect(response.body.status).to.equal('healthy');
      expect(response.body).to.have.property('uptime');
      expect(response.body).to.have.property('connections');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid notification data', async () => {
      await request(app)
        .post('/api/notifications/send')
        .send({
          // event missing
          message: 'Invalid notification'
        })
        .expect(400);
    });

    it('should handle invalid participant data', async () => {
      await request(app)
        .post('/api/notifications/participant-registered')
        .send({
          participant: {
            // name missing
            email: 'invalid@example.com'
          }
        })
        .expect(400);
    });

    it('should handle invalid talk data', async () => {
      await request(app)
        .post('/api/notifications/talk-submitted')
        .send({
          talk: {
            // title missing
            speaker: 'Test Speaker'
          }
        })
        .expect(400);
    });

    it('should handle invalid event data', async () => {
      await request(app)
        .post('/api/notifications/event-updated')
        .send({
          event: {
            // id missing
            title: 'Test Event'
          }
        })
        .expect(400);
    });
  });

  describe('Performance and Load', () => {
    it('should handle multiple simultaneous SSE connections', done => {
      const connectionCount = 10;
      let connectedCount = 0;
      const connections = [];

      for (let i = 0; i < connectionCount; i++) {
        const eventSource = new EventSource(`${baseURL}/api/notifications/stream`);
        connections.push(eventSource);

        eventSource.addEventListener('connected', () => {
          connectedCount++;
          if (connectedCount === connectionCount) {
            // 全ての接続を閉じる
            connections.forEach(conn => conn.close());
            done();
          }
        });

        eventSource.addEventListener('error', error => {
          connections.forEach(conn => conn.close());
          done(error);
        });
      }

      setTimeout(() => {
        connections.forEach(conn => conn.close());
        done(new Error('Multiple SSE connections timeout'));
      }, 10000);
    });

    it('should handle multiple simultaneous WebSocket connections', done => {
      const connectionCount = 10;
      let connectedCount = 0;
      const connections = [];
      const wsURL = `${baseURL.replace('http://', 'ws://')}/ws`;

      for (let i = 0; i < connectionCount; i++) {
        const ws = new WebSocket(wsURL);
        connections.push(ws);

        ws.on('message', data => {
          const message = JSON.parse(data.toString());
          if (message.event === 'connected') {
            connectedCount++;
            if (connectedCount === connectionCount) {
              // 全ての接続を閉じる
              connections.forEach(conn => conn.close());
              done();
            }
          }
        });

        ws.on('error', error => {
          connections.forEach(conn => conn.close());
          done(error);
        });
      }

      setTimeout(() => {
        connections.forEach(conn => conn.close());
        done(new Error('Multiple WebSocket connections timeout'));
      }, 10000);
    });

    it('should maintain performance with high notification volume', async () => {
      const notificationCount = 100;
      const startTime = Date.now();

      // 大量の通知を並列送信
      const promises = [];
      for (let i = 0; i < notificationCount; i++) {
        promises.push(
          request(app)
            .post('/api/notifications/send')
            .send({
              event: 'performance_test',
              message: `Performance test message ${i}`,
              type: 'info'
            })
        );
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).to.be.lessThan(5000); // 5秒以内
    });
  });
});

// ヘルパー関数
function _delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
