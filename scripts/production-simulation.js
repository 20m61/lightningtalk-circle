#!/usr/bin/env node

/**
 * Production Environment Simulation Script
 * Simulates real production load and monitors system behavior
 */

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

class ProductionSimulator {
  constructor() {
    this.baseUrl = process.env.API_URL || 'http://localhost:3000';
    this.results = {
      startTime: new Date(),
      requests: [],
      errors: [],
      metrics: []
    };
    this.running = true;
  }

  async start() {
    console.log('🚀 Starting production environment simulation');
    console.log(`📍 Target: ${this.baseUrl}`);
    console.log('⏱️  Duration: 60 seconds\n');

    // Start the server in production mode
    await this.startProductionServer();

    // Wait for server to be ready
    await this.waitForServer();

    // Run simulation phases
    await this.runSimulation();

    // Generate report
    this.generateReport();
  }

  async startProductionServer() {
    console.log('🔧 Starting server in production mode...');

    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = `production-test-secret-${Math.random()}`;
    process.env.DATABASE_TYPE = 'file'; // Use file DB for simulation

    // Import and start server
    const { default: LightningTalkServer } = await import('../server/app.js');
    this.server = new LightningTalkServer();

    await this.server.start();
    console.log('✅ Server started in production mode\n');
  }

  async waitForServer(maxAttempts = 30) {
    console.log('⏳ Waiting for server to be ready...');

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(`${this.baseUrl}/api/health`);
        if (response.status === 200) {
          console.log('✅ Server is ready\n');
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Server failed to start');
  }

  async runSimulation() {
    console.log('🎯 Starting simulation phases:\n');

    // Phase 1: Normal load
    console.log('📊 Phase 1: Normal Load (5 seconds)');
    await this.simulateNormalLoad(5);

    // Phase 2: Peak load
    console.log('\n📊 Phase 2: Peak Load (5 seconds)');
    await this.simulatePeakLoad(5);

    // Phase 3: Sustained load
    console.log('\n📊 Phase 3: Sustained Load (5 seconds)');
    await this.simulateSustainedLoad(5);
  }

  async simulateNormalLoad(duration) {
    const endTime = Date.now() + duration * 1000;
    let requestCount = 0;

    while (Date.now() < endTime) {
      // 5 requests per second
      await Promise.all([
        this.makeRequest('GET', '/api/events'),
        this.makeRequest('GET', '/api/health'),
        this.makeRequest('GET', '/api/events'),
        this.makeRequest('GET', '/api/health'),
        this.makeRequest('GET', '/api')
      ]);

      requestCount += 5;
      process.stdout.write(`\r  Requests sent: ${requestCount}`);

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async simulatePeakLoad(duration) {
    const endTime = Date.now() + duration * 1000;
    let requestCount = 0;

    while (Date.now() < endTime) {
      // 50 requests per second
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(this.makeRequest('GET', '/api/events'));
        promises.push(
          this.makeRequest('POST', '/api/participants/register', {
            eventId: 'test-event',
            name: `User ${i}`,
            email: `user${i}@example.com`
          })
        );
      }

      await Promise.all(promises);
      requestCount += 100;
      process.stdout.write(`\r  Requests sent: ${requestCount}`);

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async simulateSustainedLoad(duration) {
    const endTime = Date.now() + duration * 1000;
    let requestCount = 0;

    // Create some WebSocket connections
    const wsConnections = [];
    for (let i = 0; i < 10; i++) {
      // Simulate WebSocket connections (would need actual implementation)
      wsConnections.push({ id: `ws-${i}`, connected: true });
    }

    while (Date.now() < endTime) {
      // 20 requests per second with varied endpoints
      const promises = [
        this.makeRequest('GET', '/api/events'),
        this.makeRequest('GET', '/api/events'),
        this.makeRequest('GET', '/api/health'),
        this.makeRequest('POST', '/api/voting/vote', {
          sessionId: 'test-session',
          rating: Math.floor(Math.random() * 5) + 1
        }),
        this.makeRequest('GET', '/api')
      ];

      // Add some random requests
      for (let i = 0; i < 15; i++) {
        const endpoints = ['/api/events', '/api/health', '/api/docs'];
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        promises.push(this.makeRequest('GET', endpoint));
      }

      await Promise.all(promises);
      requestCount += 20;
      process.stdout.write(
        `\r  Requests sent: ${requestCount} | WS connections: ${wsConnections.length}`
      );

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async makeRequest(method, endpoint, data = null) {
    const startTime = Date.now();

    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        timeout: 5000,
        validateStatus: () => true // Don't throw on any status
      };

      if (data) {
        config.data = data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);
      const duration = Date.now() - startTime;

      this.results.requests.push({
        timestamp: new Date(),
        method,
        endpoint,
        status: response.status,
        duration
      });

      // Track slow requests
      if (duration > 1000) {
        console.log(`\n⚠️  Slow request: ${method} ${endpoint} took ${duration}ms`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      this.results.errors.push({
        timestamp: new Date(),
        method,
        endpoint,
        error: error.message,
        duration
      });
    }
  }

  generateReport() {
    console.log('\n\n📊 Production Simulation Report');
    console.log('================================\n');

    const totalRequests = this.results.requests.length;
    const totalErrors = this.results.errors.length;
    const successRate = (((totalRequests - totalErrors) / totalRequests) * 100).toFixed(2);

    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Success Rate: ${successRate}%\n`);

    // Response time analysis
    const responseTimes = this.results.requests.map(r => r.duration);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);

    // Calculate percentiles
    responseTimes.sort((a, b) => a - b);
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

    console.log('Response Time Analysis:');
    console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  Min: ${minResponseTime}ms`);
    console.log(`  Max: ${maxResponseTime}ms`);
    console.log(`  P95: ${p95}ms`);
    console.log(`  P99: ${p99}ms\n`);

    // Status code distribution
    const statusCodes = {};
    this.results.requests.forEach(r => {
      statusCodes[r.status] = (statusCodes[r.status] || 0) + 1;
    });

    console.log('Status Code Distribution:');
    Object.entries(statusCodes).forEach(([code, count]) => {
      const percentage = ((count / totalRequests) * 100).toFixed(2);
      console.log(`  ${code}: ${count} (${percentage}%)`);
    });

    // Error analysis
    if (this.results.errors.length > 0) {
      console.log('\nError Summary:');
      const errorTypes = {};
      this.results.errors.forEach(e => {
        const type = e.error.split(':')[0];
        errorTypes[type] = (errorTypes[type] || 0) + 1;
      });

      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    console.log('\nFinal Memory Usage:');
    console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);

    // Save detailed report
    const reportPath = join(
      process.cwd(),
      'reports',
      `production-sim-${new Date().toISOString().split('T')[0]}.json`
    );
    mkdirSync(join(process.cwd(), 'reports'), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportPath}`);

    // Overall assessment
    console.log('\n🎯 Overall Assessment:');
    if (successRate > 99.5 && p95 < 200) {
      console.log('✅ System is ready for production!');
    } else if (successRate > 95 && p95 < 500) {
      console.log('⚠️  System is functional but needs optimization');
    } else {
      console.log('❌ System needs significant improvements before production');
    }
  }

  async stop() {
    this.running = false;
    if (this.server) {
      await this.server.stop();
    }
  }
}

// Run simulation
const simulator = new ProductionSimulator();
simulator
  .start()
  .then(() => {
    console.log('\n✅ Simulation completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Simulation failed:', error);
    process.exit(1);
  });

// Handle interruption
process.on('SIGINT', async() => {
  console.log('\n\n🛑 Simulation interrupted');
  await simulator.stop();
  process.exit(0);
});
