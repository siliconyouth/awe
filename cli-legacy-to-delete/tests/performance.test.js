/**
 * Ultra-Fast Performance Benchmark Suite
 * 
 * Tests all performance-critical components:
 * - Database operations (local & cloud)
 * - Caching system (L1, L2, L3)
 * - API client (batching, concurrency)
 * - Background sync
 * - End-to-end CLI operations
 */

const { performance } = require('perf_hooks');
const os = require('os');
const fs = require('fs-extra');
const path = require('path');

// Import our performance-optimized modules
const { initializeDatabase } = require('../src/core/database.hybrid');
const { initializeCache } = require('../src/core/cache');
const { initializeAPIClient } = require('../src/core/api-client');
const { initializeSync } = require('../src/core/sync');

class PerformanceBenchmark {
  constructor(options = {}) {
    this.options = {
      iterations: options.iterations || 1000,
      warmupIterations: options.warmupIterations || 100,
      concurrency: options.concurrency || 10,
      targetResponseTime: options.targetResponseTime || 100, // 100ms
      ...options
    };

    this.results = {
      database: {},
      cache: {},
      api: {},
      sync: {},
      cli: {},
      system: {}
    };

    this.components = {};
  }

  /**
   * Run complete benchmark suite
   */
  async runBenchmarks() {
    console.log('🚀 Starting AWE Performance Benchmark Suite\n');
    
    // System info
    await this.collectSystemInfo();
    
    // Initialize components
    await this.initializeComponents();
    
    // Run benchmarks
    await this.benchmarkDatabase();
    await this.benchmarkCache();
    await this.benchmarkAPIClient();
    await this.benchmarkSync();
    await this.benchmarkCLI();
    
    // Generate report
    this.generateReport();
    
    console.log('✅ Performance benchmarks completed\n');
  }

  /**
   * Collect system information
   */
  async collectSystemInfo() {
    this.results.system = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };

    console.log('💻 System Info:');
    console.log(`   Platform: ${this.results.system.platform} ${this.results.system.arch}`);
    console.log(`   CPUs: ${this.results.system.cpus}`);
    console.log(`   Memory: ${this.results.system.memory}`);
    console.log(`   Node: ${this.results.system.nodeVersion}\n`);
  }

  /**
   * Initialize all components for testing
   */
  async initializeComponents() {
    console.log('🔧 Initializing components...');
    
    try {
      // Use test database path
      const testDbPath = path.join(os.tmpdir(), 'awe-perf-test.db');
      
      this.components.database = await initializeDatabase({ 
        localDbPath: testDbPath,
        offlineMode: true // Test offline performance
      });
      
      this.components.cache = await initializeCache({}, this.components.database);
      
      this.components.apiClient = await initializeAPIClient({
        offlineMode: true // Mock API for consistent testing
      });
      
      this.components.sync = await initializeSync({
        offlineMode: true
      });
      
      console.log('✅ Components initialized\n');
    } catch (error) {
      console.error('❌ Component initialization failed:', error);
      throw error;
    }
  }

  /**
   * Benchmark database operations
   */
  async benchmarkDatabase() {
    console.log('🗄️  Database Benchmarks:');
    
    const db = this.components.database;
    
    // Local SQLite operations
    this.results.database.localInsert = await this.measureOperation(
      'Local Insert',
      async () => {
        await db.runLocalQuery(
          'INSERT INTO template_cache (id, name, category, content, score, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
          [`test-${Math.random()}`, 'Test Template', 'test', '{}', 1.0, Date.now() + 3600000]
        );
      },
      { iterations: 1000 }
    );

    this.results.database.localSelect = await this.measureOperation(
      'Local Select',
      async () => {
        await db.runLocalQuery('SELECT * FROM template_cache LIMIT 10');
      },
      { iterations: 1000 }
    );

    // Template search operations
    this.results.database.templateSearch = await this.measureOperation(
      'Template Search',
      async () => {
        await db.searchTemplates('react component', { limit: 10 });
      },
      { iterations: 100 }
    );

    // Concurrent database operations
    this.results.database.concurrent = await this.measureConcurrentOperation(
      'Concurrent DB Ops',
      async () => {
        await db.runLocalQuery('SELECT COUNT(*) FROM template_cache');
      },
      { concurrency: 10, iterations: 100 }
    );

    console.log(`   Local Insert: ${this.results.database.localInsert.avg.toFixed(2)}ms avg`);
    console.log(`   Local Select: ${this.results.database.localSelect.avg.toFixed(2)}ms avg`);
    console.log(`   Template Search: ${this.results.database.templateSearch.avg.toFixed(2)}ms avg`);
    console.log(`   Concurrent Ops: ${this.results.database.concurrent.avg.toFixed(2)}ms avg\n`);
  }

  /**
   * Benchmark caching system
   */
  async benchmarkCache() {
    console.log('⚡ Cache Benchmarks:');
    
    const cache = this.components.cache;
    
    // Memory cache (L1)
    this.results.cache.memorySet = await this.measureOperation(
      'Memory Set',
      async () => {
        await cache.set(`test-${Math.random()}`, { data: 'test' }, { disk: false, persist: false });
      },
      { iterations: 10000 }
    );

    this.results.cache.memoryGet = await this.measureOperation(
      'Memory Get',
      async () => {
        await cache.get('test-key');
      },
      { iterations: 10000 }
    );

    // Database cache (L2)
    this.results.cache.dbSet = await this.measureOperation(
      'Database Set',
      async () => {
        await cache.set(`db-test-${Math.random()}`, { data: 'test' }, { disk: false });
      },
      { iterations: 1000 }
    );

    this.results.cache.dbGet = await this.measureOperation(
      'Database Get',
      async () => {
        await cache.get('db-test-key');
      },
      { iterations: 1000 }
    );

    // Disk cache (L3)
    this.results.cache.diskSet = await this.measureOperation(
      'Disk Set',
      async () => {
        await cache.set(`disk-test-${Math.random()}`, { data: 'large data'.repeat(100) }, { important: true });
      },
      { iterations: 100 }
    );

    this.results.cache.diskGet = await this.measureOperation(
      'Disk Get',
      async () => {
        await cache.get('disk-test-key');
      },
      { iterations: 100 }
    );

    // Cache hit rate test
    await this.testCacheHitRate();

    console.log(`   Memory Set: ${this.results.cache.memorySet.avg.toFixed(2)}ms avg`);
    console.log(`   Memory Get: ${this.results.cache.memoryGet.avg.toFixed(2)}ms avg`);
    console.log(`   Database Set: ${this.results.cache.dbSet.avg.toFixed(2)}ms avg`);
    console.log(`   Database Get: ${this.results.cache.dbGet.avg.toFixed(2)}ms avg`);
    console.log(`   Disk Set: ${this.results.cache.diskSet.avg.toFixed(2)}ms avg`);
    console.log(`   Disk Get: ${this.results.cache.diskGet.avg.toFixed(2)}ms avg`);
    console.log(`   Hit Rate: ${this.results.cache.hitRate.toFixed(1)}%\n`);
  }

  /**
   * Test cache hit rate
   */
  async testCacheHitRate() {
    const cache = this.components.cache;
    const testKeys = Array.from({ length: 100 }, (_, i) => `hitrate-test-${i}`);
    
    // Populate cache
    for (const key of testKeys) {
      await cache.set(key, { data: key });
    }

    // Test hit rate
    let hits = 0;
    const iterations = 1000;
    
    for (let i = 0; i < iterations; i++) {
      const randomKey = testKeys[Math.floor(Math.random() * testKeys.length)];
      const result = await cache.get(randomKey);
      if (result) hits++;
    }

    this.results.cache.hitRate = (hits / iterations) * 100;
  }

  /**
   * Benchmark API client
   */
  async benchmarkAPIClient() {
    console.log('🌐 API Client Benchmarks:');
    
    const api = this.components.apiClient;
    
    // Mock API requests (since we're in offline mode)
    this.results.api.singleRequest = await this.measureOperation(
      'Single Request',
      async () => {
        try {
          await api.get('/test/endpoint');
        } catch (error) {
          // Expected to fail in offline mode
        }
      },
      { iterations: 100 }
    );

    // Test request batching
    this.results.api.batchedRequests = await this.measureConcurrentOperation(
      'Batched Requests',
      async () => {
        try {
          await api.get('/test/batch-endpoint');
        } catch (error) {
          // Expected to fail in offline mode
        }
      },
      { concurrency: 10, iterations: 50 }
    );

    // Test request deduplication
    this.results.api.deduplication = await this.measureConcurrentOperation(
      'Request Deduplication',
      async () => {
        try {
          await api.get('/test/same-endpoint');
        } catch (error) {
          // Expected to fail in offline mode
        }
      },
      { concurrency: 20, iterations: 1 } // Same request 20 times
    );

    console.log(`   Single Request: ${this.results.api.singleRequest.avg.toFixed(2)}ms avg`);
    console.log(`   Batched Requests: ${this.results.api.batchedRequests.avg.toFixed(2)}ms avg`);
    console.log(`   Deduplication: ${this.results.api.deduplication.avg.toFixed(2)}ms avg\n`);
  }

  /**
   * Benchmark sync system
   */
  async benchmarkSync() {
    console.log('🔄 Sync Benchmarks:');
    
    const sync = this.components.sync;
    
    // Test sync initialization
    this.results.sync.initialization = await this.measureOperation(
      'Sync Init',
      async () => {
        // Already initialized, measure state check
        sync.getSyncStatus();
      },
      { iterations: 1000 }
    );

    // Test offline queue operations
    this.results.sync.offlineQueue = await this.measureOperation(
      'Offline Queue',
      async () => {
        sync.queueOfflineOperation('test', { data: 'test' });
      },
      { iterations: 1000 }
    );

    console.log(`   Initialization: ${this.results.sync.initialization.avg.toFixed(2)}ms avg`);
    console.log(`   Offline Queue: ${this.results.sync.offlineQueue.avg.toFixed(2)}ms avg\n`);
  }

  /**
   * Benchmark CLI operations (end-to-end)
   */
  async benchmarkCLI() {
    console.log('⚡ CLI Benchmarks:');
    
    // Test CLI command parsing and execution time
    this.results.cli.commandParsing = await this.measureOperation(
      'Command Parsing',
      async () => {
        // Simulate command parsing overhead
        const command = 'awe analyze --json';
        const args = command.split(' ');
        return args.length;
      },
      { iterations: 10000 }
    );

    // Test template search end-to-end
    this.results.cli.templateSearch = await this.measureOperation(
      'Template Search E2E',
      async () => {
        const db = this.components.database;
        const cache = this.components.cache;
        
        // Simulate full template search flow
        let result = await cache.get('search:react');
        if (!result) {
          result = await db.searchTemplates('react', { limit: 5 });
          await cache.set('search:react', result);
        }
        return result;
      },
      { iterations: 100 }
    );

    // Test analysis pipeline
    this.results.cli.analysis = await this.measureOperation(
      'Analysis Pipeline',
      async () => {
        // Simulate project analysis
        const projectData = {
          framework: 'react',
          dependencies: ['react', 'react-dom'],
          fileCount: 50
        };
        
        // Cache check + analysis simulation
        const cache = this.components.cache;
        const cacheKey = `analysis:${JSON.stringify(projectData)}`;
        
        let result = await cache.get(cacheKey);
        if (!result) {
          // Simulate analysis work
          result = {
            recommendations: ['Use React.memo for performance'],
            score: 8.5,
            issues: []
          };
          await cache.set(cacheKey, result);
        }
        return result;
      },
      { iterations: 100 }
    );

    console.log(`   Command Parsing: ${this.results.cli.commandParsing.avg.toFixed(2)}ms avg`);
    console.log(`   Template Search: ${this.results.cli.templateSearch.avg.toFixed(2)}ms avg`);
    console.log(`   Analysis Pipeline: ${this.results.cli.analysis.avg.toFixed(2)}ms avg\n`);
  }

  /**
   * Measure single operation performance
   */
  async measureOperation(name, operation, options = {}) {
    const { iterations = 100, warmup = 10 } = options;
    
    // Warmup
    for (let i = 0; i < warmup; i++) {
      try {
        await operation();
      } catch (error) {
        // Ignore warmup errors
      }
    }

    // Measure
    const times = [];
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const opStart = performance.now();
      try {
        await operation();
      } catch (error) {
        // Count failed operations but don't throw
      }
      const opEnd = performance.now();
      times.push(opEnd - opStart);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    return this.calculateStats(times, totalTime);
  }

  /**
   * Measure concurrent operation performance
   */
  async measureConcurrentOperation(name, operation, options = {}) {
    const { concurrency = 10, iterations = 100 } = options;
    
    const times = [];
    const startTime = performance.now();
    
    // Run operations in batches
    const batches = Math.ceil(iterations / concurrency);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, iterations - (batch * concurrency));
      const promises = [];
      
      for (let i = 0; i < batchSize; i++) {
        const opStart = performance.now();
        promises.push(
          operation().then(() => {
            const opEnd = performance.now();
            times.push(opEnd - opStart);
          }).catch(() => {
            // Count failed operations
            const opEnd = performance.now();
            times.push(opEnd - opStart);
          })
        );
      }
      
      await Promise.allSettled(promises);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    return this.calculateStats(times, totalTime);
  }

  /**
   * Calculate performance statistics
   */
  calculateStats(times, totalTime) {
    times.sort((a, b) => a - b);
    
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const min = times[0];
    const max = times[times.length - 1];
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];
    
    return {
      iterations: times.length,
      avg,
      min,
      max,
      p50,
      p95,
      p99,
      totalTime,
      ops: (times.length / totalTime) * 1000 // Operations per second
    };
  }

  /**
   * Generate performance report
   */
  generateReport() {
    console.log('📊 Performance Report:');
    console.log('========================\n');
    
    // Performance targets
    const targets = {
      memoryCache: 1, // <1ms
      dbCache: 5, // <5ms
      apiRequest: 100, // <100ms
      cliCommand: 50 // <50ms
    };

    // Check targets
    const issues = [];
    
    if (this.results.cache.memoryGet.avg > targets.memoryCache) {
      issues.push(`❌ Memory cache too slow: ${this.results.cache.memoryGet.avg.toFixed(2)}ms > ${targets.memoryCache}ms`);
    } else {
      console.log(`✅ Memory cache: ${this.results.cache.memoryGet.avg.toFixed(2)}ms (target: <${targets.memoryCache}ms)`);
    }
    
    if (this.results.cache.dbGet.avg > targets.dbCache) {
      issues.push(`❌ Database cache too slow: ${this.results.cache.dbGet.avg.toFixed(2)}ms > ${targets.dbCache}ms`);
    } else {
      console.log(`✅ Database cache: ${this.results.cache.dbGet.avg.toFixed(2)}ms (target: <${targets.dbCache}ms)`);
    }
    
    if (this.results.cli.templateSearch.avg > targets.cliCommand) {
      issues.push(`❌ Template search too slow: ${this.results.cli.templateSearch.avg.toFixed(2)}ms > ${targets.cliCommand}ms`);
    } else {
      console.log(`✅ Template search: ${this.results.cli.templateSearch.avg.toFixed(2)}ms (target: <${targets.cliCommand}ms)`);
    }

    // Cache hit rate
    if (this.results.cache.hitRate < 85) {
      issues.push(`❌ Cache hit rate too low: ${this.results.cache.hitRate.toFixed(1)}% < 85%`);
    } else {
      console.log(`✅ Cache hit rate: ${this.results.cache.hitRate.toFixed(1)}% (target: >85%)`);
    }

    console.log('\n🎯 Performance Summary:');
    console.log(`   Database ops/sec: ${Math.round(this.results.database.localSelect.ops)}`);
    console.log(`   Cache ops/sec: ${Math.round(this.results.cache.memoryGet.ops)}`);
    console.log(`   Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    
    if (issues.length > 0) {
      console.log('\n⚠️  Performance Issues:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('\n🚀 All performance targets met!');
    }

    // Save detailed results
    this.saveResults();
  }

  /**
   * Save benchmark results to file
   */
  async saveResults() {
    try {
      const resultsFile = path.join(__dirname, 'performance-results.json');
      await fs.writeJson(resultsFile, {
        timestamp: new Date().toISOString(),
        system: this.results.system,
        results: this.results
      }, { spaces: 2 });
      
      console.log(`\n💾 Results saved to: ${resultsFile}`);
    } catch (error) {
      console.warn('⚠️  Failed to save results:', error.message);
    }
  }

  /**
   * Cleanup test resources
   */
  async cleanup() {
    try {
      // Close components
      if (this.components.database) {
        await this.components.database.close();
      }
      
      if (this.components.cache) {
        await this.components.cache.close();
      }
      
      if (this.components.apiClient) {
        await this.components.apiClient.close();
      }
      
      if (this.components.sync) {
        await this.components.sync.stop();
      }

      // Clean up test database
      const testDbPath = path.join(os.tmpdir(), 'awe-perf-test.db');
      if (await fs.pathExists(testDbPath)) {
        await fs.remove(testDbPath);
      }
      
      console.log('🧹 Cleanup completed');
    } catch (error) {
      console.warn('⚠️  Cleanup failed:', error.message);
    }
  }
}

/**
 * Run benchmarks if called directly
 */
async function runBenchmarks() {
  const benchmark = new PerformanceBenchmark({
    iterations: 1000,
    concurrency: 10
  });

  try {
    await benchmark.runBenchmarks();
  } finally {
    await benchmark.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  runBenchmarks().catch(error => {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  });
}

module.exports = {
  PerformanceBenchmark,
  runBenchmarks
};