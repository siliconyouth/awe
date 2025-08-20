#!/usr/bin/env node

/**
 * Performance Benchmark Runner
 * 
 * Usage:
 *   npm run benchmark
 *   node scripts/benchmark.js
 *   node scripts/benchmark.js --quick
 *   node scripts/benchmark.js --iterations=5000
 */

const { program } = require('commander');
const { PerformanceBenchmark } = require('../tests/performance.test');
const chalk = require('chalk');

program
  .name('awe-benchmark')
  .description('Run AWE performance benchmarks')
  .option('-i, --iterations <number>', 'number of test iterations', '1000')
  .option('-c, --concurrency <number>', 'concurrent operations', '10')
  .option('-q, --quick', 'run quick benchmark (fewer iterations)')
  .option('-v, --verbose', 'verbose output')
  .option('--target <ms>', 'target response time in milliseconds', '100')
  .parse();

const options = program.opts();

async function main() {
  console.log(chalk.cyan('🚀 AWE Performance Benchmark\n'));

  // Configure benchmark options
  const benchmarkOptions = {
    iterations: options.quick ? 100 : parseInt(options.iterations),
    concurrency: parseInt(options.concurrency),
    targetResponseTime: parseInt(options.target),
    verbose: options.verbose
  };

  console.log(chalk.gray('Configuration:'));
  console.log(chalk.gray(`  Iterations: ${benchmarkOptions.iterations}`));
  console.log(chalk.gray(`  Concurrency: ${benchmarkOptions.concurrency}`));
  console.log(chalk.gray(`  Target: <${benchmarkOptions.targetResponseTime}ms\n`));

  const benchmark = new PerformanceBenchmark(benchmarkOptions);

  try {
    await benchmark.runBenchmarks();
    
    // Get final metrics for summary
    const cacheStats = benchmark.components.cache?.getStats();
    const apiStats = benchmark.components.apiClient?.getMetrics();
    
    if (cacheStats || apiStats) {
      console.log(chalk.cyan('\n📈 Live System Stats:'));
      
      if (cacheStats) {
        console.log(chalk.green(`  Cache Hit Rate: ${(cacheStats.overallHitRate * 100).toFixed(1)}%`));
        console.log(chalk.green(`  Memory Entries: ${cacheStats.memoryEntries}`));
        console.log(chalk.green(`  Avg Response: ${cacheStats.avgResponseTime.toFixed(2)}ms`));
      }
      
      if (apiStats) {
        console.log(chalk.blue(`  API Success Rate: ${(apiStats.successRate * 100).toFixed(1)}%`));
        console.log(chalk.blue(`  API Cache Hits: ${(apiStats.cacheHitRate * 100).toFixed(1)}%`));
        console.log(chalk.blue(`  API Avg Response: ${apiStats.avgResponseTime.toFixed(2)}ms`));
      }
    }

  } catch (error) {
    console.error(chalk.red('❌ Benchmark failed:'), error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await benchmark.cleanup();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n⚠️  Benchmark interrupted'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n⚠️  Benchmark terminated'));
  process.exit(0);
});

main().catch(error => {
  console.error(chalk.red('💥 Fatal error:'), error);
  process.exit(1);
});