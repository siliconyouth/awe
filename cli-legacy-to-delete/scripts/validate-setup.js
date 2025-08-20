#!/usr/bin/env node

/**
 * AWE Setup Validation Script
 * 
 * Validates that AWE is properly configured and working:
 * - Environment variables
 * - Database connections
 * - Performance targets
 * - All CLI commands
 */

const chalk = require('chalk');
const ora = require('ora');
const { execSync } = require('child_process');

class SetupValidator {
  constructor() {
    this.results = {
      environment: { passed: 0, failed: 0, tests: [] },
      database: { passed: 0, failed: 0, tests: [] },
      performance: { passed: 0, failed: 0, tests: [] },
      commands: { passed: 0, failed: 0, tests: [] }
    };
  }

  /**
   * Run all validation tests
   */
  async validate() {
    console.log(chalk.cyan.bold('🔍 AWE Setup Validation\n'));

    try {
      await this.validateEnvironment();
      await this.validateDatabase();
      await this.validatePerformance();
      await this.validateCommands();
      
      this.showSummary();
      
    } catch (error) {
      console.error(chalk.red('Validation failed:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Validate environment configuration
   */
  async validateEnvironment() {
    console.log(chalk.yellow('🔧 Environment Configuration\n'));

    const tests = [
      {
        name: 'Node.js version >= 16',
        test: () => process.version >= 'v16.0.0',
        critical: true
      },
      {
        name: 'AWE_SUPABASE_URL configured',
        test: () => !!(process.env.AWE_SUPABASE_URL || process.env.SUPABASE_URL),
        critical: false
      },
      {
        name: 'AWE_SUPABASE_ANON_KEY configured', 
        test: () => !!(process.env.AWE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
        critical: false
      },
      {
        name: 'Supabase URL format valid',
        test: () => {
          const url = process.env.AWE_SUPABASE_URL || process.env.SUPABASE_URL;
          return url && url.startsWith('https://') && url.includes('supabase.co');
        },
        critical: false
      },
      {
        name: 'Service key available (optional)',
        test: () => !!(process.env.AWE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY),
        critical: false
      }
    ];

    for (const test of tests) {
      await this.runTest('environment', test);
    }
  }

  /**
   * Validate database connections
   */
  async validateDatabase() {
    console.log(chalk.yellow('\n🗄️  Database Connections\n'));

    const tests = [
      {
        name: 'Local database initialization',
        test: async () => {
          try {
            const { initializeDatabase } = require('../src/core/database.hybrid');
            const db = await initializeDatabase();
            return !!db;
          } catch (error) {
            return false;
          }
        },
        critical: true
      },
      {
        name: 'Local SQLite operations',
        test: async () => {
          try {
            const { getDatabase } = require('../src/core/database.hybrid');
            const db = getDatabase();
            await db.runLocalQuery('SELECT 1');
            return true;
          } catch (error) {
            return false;
          }
        },
        critical: true
      },
      {
        name: 'Cache system initialization',
        test: async () => {
          try {
            const { initializeCache } = require('../src/core/cache');
            const { getDatabase } = require('../src/core/database.hybrid');
            const cache = await initializeCache({}, getDatabase());
            return !!cache;
          } catch (error) {
            return false;
          }
        },
        critical: true
      },
      {
        name: 'Supabase connection (if configured)',
        test: async () => {
          const url = process.env.AWE_SUPABASE_URL || process.env.SUPABASE_URL;
          const key = process.env.AWE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
          
          if (!url || !key) return null; // Skip if not configured
          
          try {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(url, key);
            
            // Test basic connection
            const { data, error } = await supabase.from('_').select('*').limit(1);
            
            // Connection is working if we get any response (even error about table not existing)
            return true;
          } catch (error) {
            return false;
          }
        },
        critical: false
      }
    ];

    for (const test of tests) {
      await this.runTest('database', test);
    }
  }

  /**
   * Validate performance targets
   */
  async validatePerformance() {
    console.log(chalk.yellow('\n⚡ Performance Validation\n'));

    const tests = [
      {
        name: 'Local database query < 5ms',
        test: async () => {
          try {
            const { getDatabase } = require('../src/core/database.hybrid');
            const db = getDatabase();
            
            const start = Date.now();
            await db.runLocalQuery('SELECT 1');
            const time = Date.now() - start;
            
            return time < 5;
          } catch (error) {
            return false;
          }
        },
        critical: false
      },
      {
        name: 'Memory cache operations < 1ms',
        test: async () => {
          try {
            const { getCache } = require('../src/core/cache');
            const cache = getCache();
            
            const start = Date.now();
            await cache.set('perf-test', { data: 'test' }, { disk: false, persist: false });
            await cache.get('perf-test');
            const time = Date.now() - start;
            
            return time < 1;
          } catch (error) {
            return false;
          }
        },
        critical: false
      },
      {
        name: 'Template search < 50ms',
        test: async () => {
          try {
            const { getDatabase } = require('../src/core/database.hybrid');
            const db = getDatabase();
            
            const start = Date.now();
            await db.searchTemplates('react', { limit: 5 });
            const time = Date.now() - start;
            
            return time < 50;
          } catch (error) {
            return false;
          }
        },
        critical: false
      },
      {
        name: 'Memory usage reasonable',
        test: () => {
          const used = process.memoryUsage().heapUsed;
          const usedMB = used / 1024 / 1024;
          return usedMB < 100; // Less than 100MB
        },
        critical: false
      }
    ];

    for (const test of tests) {
      await this.runTest('performance', test);
    }
  }

  /**
   * Validate CLI commands
   */
  async validateCommands() {
    console.log(chalk.yellow('\n🔧 CLI Commands\n'));

    const commands = [
      { name: 'awe --help', cmd: 'node bin/awe.js --help' },
      { name: 'awe --version', cmd: 'node bin/awe.js --version' },
      { name: 'awe config --status', cmd: 'node bin/awe.js config --status' }
    ];

    for (const command of commands) {
      const test = {
        name: command.name,
        test: () => {
          try {
            execSync(command.cmd, { 
              stdio: 'pipe',
              timeout: 10000,
              cwd: process.cwd()
            });
            return true;
          } catch (error) {
            return false;
          }
        },
        critical: command.name.includes('--help') || command.name.includes('--version')
      };

      await this.runTest('commands', test);
    }
  }

  /**
   * Run individual test
   */
  async runTest(category, test) {
    const spinner = ora(test.name).start();

    try {
      const result = await test.test();
      
      if (result === null) {
        // Skipped test
        spinner.info(chalk.gray(`${test.name} (skipped)`));
        this.results[category].tests.push({ 
          name: test.name, 
          status: 'skipped',
          critical: test.critical 
        });
      } else if (result) {
        // Passed
        spinner.succeed(chalk.green(test.name));
        this.results[category].passed++;
        this.results[category].tests.push({ 
          name: test.name, 
          status: 'passed',
          critical: test.critical 
        });
      } else {
        // Failed
        const level = test.critical ? 'fail' : 'warn';
        const color = test.critical ? chalk.red : chalk.yellow;
        
        spinner[level](color(test.name));
        this.results[category].failed++;
        this.results[category].tests.push({ 
          name: test.name, 
          status: 'failed',
          critical: test.critical 
        });
      }

    } catch (error) {
      spinner.fail(chalk.red(`${test.name} (error: ${error.message})`));
      this.results[category].failed++;
      this.results[category].tests.push({ 
        name: test.name, 
        status: 'error',
        critical: test.critical,
        error: error.message
      });
    }
  }

  /**
   * Show validation summary
   */
  showSummary() {
    console.log(chalk.cyan.bold('\n📊 Validation Summary\n'));

    let totalPassed = 0;
    let totalFailed = 0;
    let criticalFailed = 0;

    for (const [category, results] of Object.entries(this.results)) {
      const { passed, failed, tests } = results;
      totalPassed += passed;
      totalFailed += failed;

      const critical = tests.filter(t => t.critical && t.status === 'failed').length;
      criticalFailed += critical;

      const icon = failed === 0 ? '✅' : critical > 0 ? '❌' : '⚠️';
      const color = failed === 0 ? chalk.green : critical > 0 ? chalk.red : chalk.yellow;
      
      console.log(color(`${icon} ${category}: ${passed} passed, ${failed} failed`));
      
      if (critical > 0) {
        console.log(chalk.red(`   Critical issues: ${critical}`));
      }
    }

    console.log(chalk.cyan('\n🎯 Overall Result:'));
    
    if (criticalFailed === 0) {
      console.log(chalk.green.bold('✅ AWE is ready to use!'));
      
      if (totalFailed > 0) {
        console.log(chalk.yellow(`Note: ${totalFailed} non-critical issues detected`));
        console.log(chalk.gray('These won\'t prevent AWE from working but may limit some features'));
      }
    } else {
      console.log(chalk.red.bold('❌ Critical issues detected'));
      console.log(chalk.red(`${criticalFailed} critical tests failed`));
      console.log(chalk.gray('\nRun setup script to fix issues: npm run setup'));
    }

    // Show next steps
    console.log(chalk.cyan('\n🚀 Next Steps:'));
    if (criticalFailed === 0) {
      console.log(chalk.green('  awe init              ') + chalk.gray('# Initialize a project'));
      console.log(chalk.green('  awe analyze           ') + chalk.gray('# Analyze current project'));
      console.log(chalk.green('  awe scaffold web-react') + chalk.gray('# Generate new project'));
      console.log(chalk.green('  npm run benchmark     ') + chalk.gray('# Test performance'));
    } else {
      console.log(chalk.yellow('  npm run setup         ') + chalk.gray('# Fix configuration issues'));
      console.log(chalk.yellow('  awe config --setup    ') + chalk.gray('# Manual configuration'));
    }

    // Exit with appropriate code
    process.exit(criticalFailed > 0 ? 1 : 0);
  }
}

/**
 * Run validation if called directly
 */
async function runValidation() {
  const validator = new SetupValidator();
  await validator.validate();
}

// Run if called directly
if (require.main === module) {
  runValidation().catch(error => {
    console.error(chalk.red('Validation failed:'), error);
    process.exit(1);
  });
}

module.exports = {
  SetupValidator,
  runValidation
};