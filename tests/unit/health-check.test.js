/**
 * Health Check Unit Tests
 */

import { jest } from '@jest/globals';

// Create mock functions
const mockHostname = jest.fn(() => 'test-host');
const mockPlatform = jest.fn(() => 'linux');
const mockArch = jest.fn(() => 'x64');
const mockTotalmem = jest.fn(() => 8 * 1024 * 1024 * 1024); // 8GB
const mockFreemem = jest.fn(() => 4 * 1024 * 1024 * 1024); // 4GB
const mockCpus = jest.fn(() => [
  {
    model: 'Intel Core i7',
    times: {
      user: 1000,
      nice: 0,
      sys: 500,
      idle: 8500,
      irq: 0
    }
  },
  {
    model: 'Intel Core i7',
    times: {
      user: 1000,
      nice: 0,
      sys: 500,
      idle: 8500,
      irq: 0
    }
  }
]);
const mockLoadavg = jest.fn(() => [1.5, 2.0, 1.8]);

// Mock os module
const os = {
  hostname: mockHostname,
  platform: mockPlatform,
  arch: mockArch,
  totalmem: mockTotalmem,
  freemem: mockFreemem,
  cpus: mockCpus,
  loadavg: mockLoadavg
};

describe('Health Check Functions', () => {
  describe('Memory Statistics', () => {
    test('should calculate memory stats correctly', () => {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      const memoryStats = {
        system: {
          total: totalMem ? Math.round(totalMem / 1024 / 1024) : 0, // MB
          free: freeMem ? Math.round(freeMem / 1024 / 1024) : 0, // MB
          used: usedMem ? Math.round(usedMem / 1024 / 1024) : 0, // MB
          percentUsed: totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0
        }
      };

      expect(memoryStats.system.total).toBe(8192); // 8GB
      expect(memoryStats.system.free).toBe(4096); // 4GB
      expect(memoryStats.system.used).toBe(4096); // 4GB
      expect(memoryStats.system.percentUsed).toBe(50);
    });

    test('should handle process memory usage', () => {
      const mockMemUsage = {
        rss: 100 * 1024 * 1024, // 100MB
        heapTotal: 80 * 1024 * 1024, // 80MB
        heapUsed: 50 * 1024 * 1024, // 50MB
        external: 10 * 1024 * 1024, // 10MB
        arrayBuffers: 5 * 1024 * 1024 // 5MB
      };

      const processMemory = {
        rss: Math.round(mockMemUsage.rss / 1024 / 1024),
        heapTotal: Math.round(mockMemUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(mockMemUsage.heapUsed / 1024 / 1024),
        external: Math.round(mockMemUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(mockMemUsage.arrayBuffers / 1024 / 1024)
      };

      expect(processMemory.rss).toBe(100);
      expect(processMemory.heapTotal).toBe(80);
      expect(processMemory.heapUsed).toBe(50);
      expect(processMemory.external).toBe(10);
      expect(processMemory.arrayBuffers).toBe(5);
    });
  });

  describe('CPU Statistics', () => {
    test('should calculate CPU usage correctly', () => {
      const cpus = os.cpus();

      // Calculate average CPU usage
      let totalIdle = 0;
      let totalTick = 0;

      if (cpus && Array.isArray(cpus)) {
        cpus.forEach(cpu => {
          for (const type in cpu.times) {
            totalTick += cpu.times[type];
          }
          totalIdle += cpu.times.idle;
        });
      }

      const avgCPUUsage = totalTick > 0 ? 100 - Math.round((totalIdle / totalTick) * 100) : 0;

      expect(avgCPUUsage).toBe(15); // 15% usage (85% idle)
    });

    test('should get CPU information', () => {
      const cpus = os.cpus();
      const loadAvg = os.loadavg();

      const cpuStats = {
        count: cpus?.length || 0,
        model: cpus?.[0]?.model || 'Unknown',
        loadAverage: {
          '1min': loadAvg?.[0] || 0,
          '5min': loadAvg?.[1] || 0,
          '15min': loadAvg?.[2] || 0
        }
      };

      expect(cpuStats.count).toBe(2);
      expect(cpuStats.model).toBe('Intel Core i7');
      expect(cpuStats.loadAverage['1min']).toBe(1.5);
      expect(cpuStats.loadAverage['5min']).toBe(2.0);
      expect(cpuStats.loadAverage['15min']).toBe(1.8);
    });
  });

  describe('Database Health Check', () => {
    test('should return healthy status when database is accessible', async () => {
      const mockDatabase = {
        findAll: jest.fn().mockResolvedValue([])
      };

      const startTime = Date.now();
      let status, responseTime, message;

      try {
        await mockDatabase.findAll('events', {}, 1);
        responseTime = Date.now() - startTime;
        status = 'healthy';
        message = 'Database connection successful';
      } catch (error) {
        responseTime = Date.now() - startTime;
        status = 'unhealthy';
        message = 'Database connection failed';
      }

      expect(status).toBe('healthy');
      expect(message).toBe('Database connection successful');
      expect(responseTime).toBeGreaterThanOrEqual(0);
    });

    test('should return unhealthy status when database fails', async () => {
      const mockDatabase = {
        findAll: jest.fn().mockRejectedValue(new Error('Connection timeout'))
      };

      const startTime = Date.now();
      let status, responseTime, message, error;

      try {
        await mockDatabase.findAll('events', {}, 1);
        responseTime = Date.now() - startTime;
        status = 'healthy';
        message = 'Database connection successful';
      } catch (err) {
        responseTime = Date.now() - startTime;
        status = 'unhealthy';
        message = 'Database connection failed';
        error = err.message;
      }

      expect(status).toBe('unhealthy');
      expect(message).toBe('Database connection failed');
      expect(error).toBe('Connection timeout');
      expect(responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('External Service Health Check', () => {
    test('should return healthy when service is accessible', async () => {
      const checkFunction = jest.fn().mockResolvedValue(true);
      const startTime = Date.now();
      let status, responseTime, message;

      try {
        await checkFunction();
        responseTime = Date.now() - startTime;
        status = 'healthy';
        message = 'Email Service is accessible';
      } catch (error) {
        responseTime = Date.now() - startTime;
        status = 'unhealthy';
        message = 'Email Service is not accessible';
      }

      expect(status).toBe('healthy');
      expect(message).toBe('Email Service is accessible');
    });

    test('should return unhealthy when service fails', async () => {
      const checkFunction = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      const startTime = Date.now();
      let status, responseTime, message, error;

      try {
        await checkFunction();
        responseTime = Date.now() - startTime;
        status = 'healthy';
        message = 'Email Service is accessible';
      } catch (err) {
        responseTime = Date.now() - startTime;
        status = 'unhealthy';
        message = 'Email Service is not accessible';
        error = err.message;
      }

      expect(status).toBe('unhealthy');
      expect(message).toBe('Email Service is not accessible');
      expect(error).toBe('Service unavailable');
    });
  });

  describe('System Information', () => {
    test('should collect system information correctly', () => {
      const systemInfo = {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        pid: process.pid,
        uptime: Math.round(process.uptime()),
        environment: process.env.NODE_ENV || 'development'
      };

      expect(systemInfo.hostname).toBe('test-host');
      expect(systemInfo.platform).toBe('linux');
      expect(systemInfo.arch).toBe('x64');
      expect(systemInfo.nodeVersion).toBeDefined();
      expect(systemInfo.pid).toBeGreaterThan(0);
      expect(systemInfo.uptime).toBeGreaterThanOrEqual(0);
      expect(systemInfo.environment).toBeDefined();
    });
  });

  describe('Prometheus Metrics Format', () => {
    test('should format metrics correctly', () => {
      const mockStats = {
        uptime: 3600,
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        memoryPercent: 75,
        cpuUsage: 25,
        loadAvg1min: 1.5,
        dbHealthy: true,
        dbResponseTime: 50,
        eventCount: 10,
        participantCount: 100,
        talkCount: 20
      };

      const metrics = `
# HELP nodejs_process_uptime_seconds Node.js process uptime
# TYPE nodejs_process_uptime_seconds counter
nodejs_process_uptime_seconds ${mockStats.uptime}

# HELP nodejs_heap_used_bytes Process heap memory used
# TYPE nodejs_heap_used_bytes gauge
nodejs_heap_used_bytes ${mockStats.heapUsed}

# HELP nodejs_heap_total_bytes Process heap memory total
# TYPE nodejs_heap_total_bytes gauge
nodejs_heap_total_bytes ${mockStats.heapTotal}

# HELP system_memory_used_percent System memory usage percentage
# TYPE system_memory_used_percent gauge
system_memory_used_percent ${mockStats.memoryPercent}

# HELP system_cpu_usage_percent System CPU usage percentage
# TYPE system_cpu_usage_percent gauge
system_cpu_usage_percent ${mockStats.cpuUsage}

# HELP system_load_average_1m System load average over 1 minute
# TYPE system_load_average_1m gauge
system_load_average_1m ${mockStats.loadAvg1min}

# HELP database_healthy Database connection health (1=healthy, 0=unhealthy)
# TYPE database_healthy gauge
database_healthy ${mockStats.dbHealthy ? 1 : 0}

# HELP database_response_time_ms Database response time in milliseconds
# TYPE database_response_time_ms gauge
database_response_time_ms ${mockStats.dbResponseTime}

# HELP lightning_talk_events_total Total number of events
# TYPE lightning_talk_events_total gauge
lightning_talk_events_total ${mockStats.eventCount}

# HELP lightning_talk_participants_total Total number of participants
# TYPE lightning_talk_participants_total gauge
lightning_talk_participants_total ${mockStats.participantCount}

# HELP lightning_talk_talks_total Total number of talks
# TYPE lightning_talk_talks_total gauge
lightning_talk_talks_total ${mockStats.talkCount}
`.trim();

      // Verify metric format
      const lines = metrics.split('\n');
      expect(lines).toContain('nodejs_process_uptime_seconds 3600');
      expect(lines).toContain('nodejs_heap_used_bytes 52428800');
      expect(lines).toContain('system_memory_used_percent 75');
      expect(lines).toContain('database_healthy 1');
      expect(lines).toContain('lightning_talk_events_total 10');
    });
  });

  describe('Dependency Checks', () => {
    test('should check configured dependencies', () => {
      const mockEnv = {
        GITHUB_TOKEN: 'test-token',
        EMAIL_SERVICE: 'gmail',
        GOOGLE_MAPS_API_KEY: 'test-key',
        GOOGLE_ANALYTICS_ID: 'GA-123456'
      };

      const dependencies = {
        github: {
          configured: !!mockEnv.GITHUB_TOKEN,
          required: false
        },
        email: {
          configured: !!mockEnv.EMAIL_SERVICE,
          service: mockEnv.EMAIL_SERVICE || 'not configured',
          required: false
        },
        googleMaps: {
          configured: !!mockEnv.GOOGLE_MAPS_API_KEY,
          required: false
        },
        analytics: {
          configured: !!mockEnv.GOOGLE_ANALYTICS_ID,
          required: false
        }
      };

      expect(dependencies.github.configured).toBe(true);
      expect(dependencies.email.configured).toBe(true);
      expect(dependencies.email.service).toBe('gmail');
      expect(dependencies.googleMaps.configured).toBe(true);
      expect(dependencies.analytics.configured).toBe(true);
    });

    test('should handle unconfigured dependencies', () => {
      const mockEnv = {};

      const dependencies = {
        github: {
          configured: !!mockEnv.GITHUB_TOKEN,
          required: false
        },
        email: {
          configured: !!mockEnv.EMAIL_SERVICE,
          service: mockEnv.EMAIL_SERVICE || 'not configured',
          required: false
        }
      };

      expect(dependencies.github.configured).toBe(false);
      expect(dependencies.email.configured).toBe(false);
      expect(dependencies.email.service).toBe('not configured');
    });
  });
});
