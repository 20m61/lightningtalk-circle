#!/usr/bin/env node

/**
 * Memory Leak Detection Script
 * Monitors memory usage and detects potential leaks
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import v8 from 'v8';

class MemoryMonitor {
  constructor() {
    this.measurements = [];
    this.interval = null;
    this.duration = 60000; // 1 minute by default
    this.sampleInterval = 1000; // Sample every second
  }

  start() {
    console.log('🔍 Starting memory monitoring...');
    console.log(`📊 Duration: ${this.duration / 1000} seconds`);
    console.log(`📏 Sample interval: ${this.sampleInterval / 1000} seconds\n`);

    // Take initial snapshot
    this.takeSnapshot('initial');

    // Start periodic monitoring
    this.interval = setInterval(() => {
      this.takeMeasurement();
    }, this.sampleInterval);

    // Stop after duration
    setTimeout(() => {
      this.stop();
    }, this.duration);
  }

  takeMeasurement() {
    const usage = process.memoryUsage();
    const measurement = {
      timestamp: new Date().toISOString(),
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers
    };

    this.measurements.push(measurement);

    // Log current status
    console.log(
      `[${new Date().toLocaleTimeString()}] Heap: ${this.formatBytes(usage.heapUsed)} / ${this.formatBytes(usage.heapTotal)} | RSS: ${this.formatBytes(usage.rss)}`
    );
  }

  takeSnapshot(name) {
    if (global.gc) {
      // Force garbage collection if available (run with --expose-gc)
      global.gc();
      console.log('🗑️  Forced garbage collection');
    }

    const snapshot = v8.writeHeapSnapshot();
    console.log(`📸 Heap snapshot saved: ${snapshot}`);
  }

  stop() {
    clearInterval(this.interval);

    console.log('\n🛑 Stopping memory monitoring...');

    // Take final snapshot
    this.takeSnapshot('final');

    // Analyze results
    this.analyze();

    // Save results
    this.saveResults();
  }

  analyze() {
    console.log('\n📊 Memory Analysis Results:');
    console.log('=========================\n');

    if (this.measurements.length < 2) {
      console.log('❌ Not enough data to analyze');
      return;
    }

    const first = this.measurements[0];
    const last = this.measurements[this.measurements.length - 1];

    // Calculate deltas
    const heapDelta = last.heapUsed - first.heapUsed;
    const rssDelta = last.rss - first.rss;

    console.log(`Initial Heap: ${this.formatBytes(first.heapUsed)}`);
    console.log(`Final Heap: ${this.formatBytes(last.heapUsed)}`);
    console.log(
      `Heap Growth: ${this.formatBytes(heapDelta)} (${this.formatPercent(heapDelta, first.heapUsed)}%)\n`
    );

    console.log(`Initial RSS: ${this.formatBytes(first.rss)}`);
    console.log(`Final RSS: ${this.formatBytes(last.rss)}`);
    console.log(
      `RSS Growth: ${this.formatBytes(rssDelta)} (${this.formatPercent(rssDelta, first.rss)}%)\n`
    );

    // Detect potential leak
    const heapGrowthPercent = (heapDelta / first.heapUsed) * 100;
    if (heapGrowthPercent > 20) {
      console.log('⚠️  WARNING: Significant heap growth detected!');
      console.log('   This might indicate a memory leak.');
    } else if (heapGrowthPercent > 10) {
      console.log('⚠️  NOTICE: Moderate heap growth detected.');
      console.log('   Monitor for sustained growth over time.');
    } else {
      console.log('✅ Memory usage appears stable.');
    }

    // Find peak usage
    const peak = this.measurements.reduce((max, m) => (m.heapUsed > max.heapUsed ? m : max));
    console.log(
      `\nPeak Heap Usage: ${this.formatBytes(peak.heapUsed)} at ${new Date(peak.timestamp).toLocaleTimeString()}`
    );
  }

  saveResults() {
    const report = {
      startTime: this.measurements[0]?.timestamp,
      endTime: this.measurements[this.measurements.length - 1]?.timestamp,
      duration: this.duration,
      sampleInterval: this.sampleInterval,
      measurements: this.measurements,
      summary: {
        initialHeap: this.measurements[0]?.heapUsed,
        finalHeap: this.measurements[this.measurements.length - 1]?.heapUsed,
        heapGrowth:
          this.measurements[this.measurements.length - 1]?.heapUsed -
          this.measurements[0]?.heapUsed,
        peakHeap: Math.max(...this.measurements.map(m => m.heapUsed))
      }
    };

    const filename = `memory-report-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = join(process.cwd(), 'reports', filename);

    try {
      writeFileSync(filepath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Report saved: ${filepath}`);
    } catch (error) {
      console.error('Failed to save report:', error.message);
    }
  }

  formatBytes(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  formatPercent(delta, original) {
    return ((delta / original) * 100).toFixed(1);
  }
}

// Load test scenario
async function runTestScenario() {
  console.log('\n🚀 Running test scenario...\n');

  // Import the server
  const { default: LightningTalkServer } = await import('../server/app.js');

  // Create server instance
  const server = new LightningTalkServer();

  // Initialize services
  await server.initializeServices();

  // Simulate some operations
  console.log('📝 Simulating operations...');

  // Simulate WebSocket connections
  const connections = [];
  for (let i = 0; i < 10; i++) {
    connections.push({ id: `conn-${i}`, data: new Array(1000).fill('x') });
  }

  // Simulate database operations
  for (let i = 0; i < 100; i++) {
    await server.database.findAll('events', {});
  }

  console.log('✅ Test scenario completed\n');
}

// Main execution
async function main() {
  const monitor = new MemoryMonitor();

  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.includes('--duration')) {
    const durationIndex = args.indexOf('--duration') + 1;
    monitor.duration = parseInt(args[durationIndex]) * 1000;
  }

  if (args.includes('--with-scenario')) {
    await runTestScenario();
  }

  monitor.start();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MemoryMonitor };
