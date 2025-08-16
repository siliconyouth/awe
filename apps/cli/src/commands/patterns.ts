#!/usr/bin/env node

import { Command } from 'commander';
import { PatternRecognitionEngine, PatternCategory } from '@awe/ai';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Pattern Recognition Command
 * Analyzes codebase for patterns, best practices, and anti-patterns
 */

export const patternsCommand = new Command('patterns')
  .description('Analyze code patterns and best practices')
  .argument('[directory]', 'Directory to analyze', process.cwd())
  .option('-c, --categories <categories...>', 'Pattern categories to analyze')
  .option('-p, --patterns <patterns...>', 'Specific patterns to detect')
  .option('-i, --include <patterns...>', 'File patterns to include')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude')
  .option('-o, --output <file>', 'Output report to file')
  .option('--json', 'Output as JSON')
  .option('--verbose', 'Show detailed analysis')
  .action(async (directory, options) => {
    const spinner = ora('Initializing pattern recognition engine...').start();

    try {
      // Validate directory
      const stats = await fs.stat(directory);
      if (!stats.isDirectory()) {
        spinner.fail(chalk.red('Invalid directory path'));
        process.exit(1);
      }

      // Initialize engine
      const engine = new PatternRecognitionEngine();
      
      // Parse categories
      let categories: PatternCategory[] | undefined;
      if (options.categories) {
        categories = options.categories.map((c: string) => {
          const category = c.toLowerCase().replace('-', '_');
          if (!Object.values(PatternCategory).includes(category as PatternCategory)) {
            spinner.warn(chalk.yellow(`Unknown category: ${c}`));
            return null;
          }
          return category as PatternCategory;
        }).filter(Boolean) as PatternCategory[];
      }

      // Analyze codebase
      spinner.text = 'Analyzing codebase patterns...';
      const patterns = await engine.analyzeCodebase(directory, {
        categories,
        patterns: options.patterns,
        include: options.include,
        exclude: options.exclude,
      });

      spinner.succeed(chalk.green('Pattern analysis complete!'));

      // Generate output
      if (options.json) {
        const output = JSON.stringify(patterns, null, 2);
        
        if (options.output) {
          await fs.writeFile(options.output, output);
          console.log(chalk.green(`✓ Report saved to ${options.output}`));
        } else {
          console.log(output);
        }
      } else {
        const report = engine.generateReport(patterns);
        
        if (options.output) {
          await fs.writeFile(options.output, report);
          console.log(chalk.green(`✓ Report saved to ${options.output}`));
        } else {
          console.log('\n' + report);
        }

        // Show summary
        console.log(chalk.cyan('\n📊 Pattern Summary:'));
        
        // Group by category
        const byCategory = new Map<PatternCategory, typeof patterns>();
        for (const pattern of patterns) {
          if (!byCategory.has(pattern.category)) {
            byCategory.set(pattern.category, []);
          }
          byCategory.get(pattern.category)!.push(pattern);
        }

        // Display summary
        for (const [category, categoryPatterns] of byCategory) {
          console.log(chalk.yellow(`\n${category.toUpperCase()}:`));
          
          for (const pattern of categoryPatterns) {
            const confidence = Math.round(pattern.confidence * 100);
            const color = confidence > 80 ? chalk.green : confidence > 60 ? chalk.yellow : chalk.red;
            
            console.log(
              `  ${pattern.name}: ${color(`${confidence}% confidence`)} ` +
              `(${pattern.occurrences.length} occurrences)`
            );

            if (options.verbose && pattern.occurrences.length > 0) {
              const samples = pattern.occurrences.slice(0, 3);
              for (const occurrence of samples) {
                const relativePath = path.relative(directory, occurrence.file);
                console.log(
                  chalk.gray(`    - ${relativePath}:${occurrence.line} - ${occurrence.context}`)
                );
              }
            }
          }
        }

        // Show warnings for anti-patterns and security issues
        const warnings = patterns.filter(p => 
          p.category === PatternCategory.ANTI_PATTERN || 
          p.category === PatternCategory.SECURITY
        );

        if (warnings.length > 0) {
          console.log(chalk.red('\n⚠️  Warnings:'));
          for (const warning of warnings) {
            console.log(chalk.red(`  - ${warning.name}: ${warning.occurrences.length} occurrences`));
            if (warning.metadata?.severity === 'error') {
              console.log(chalk.red(`    SEVERITY: HIGH`));
            }
          }
        }

        // Show recommendations
        const hasAntiPatterns = patterns.some(p => p.category === PatternCategory.ANTI_PATTERN);
        const hasSecurityIssues = patterns.some(p => p.category === PatternCategory.SECURITY);
        const lacksTests = !patterns.some(p => p.category === PatternCategory.TESTING);

        if (hasAntiPatterns || hasSecurityIssues || lacksTests) {
          console.log(chalk.cyan('\n💡 Recommendations:'));
          
          if (hasAntiPatterns) {
            console.log(chalk.yellow('  • Review and refactor anti-patterns for better code quality'));
          }
          
          if (hasSecurityIssues) {
            console.log(chalk.red('  • Address security vulnerabilities immediately'));
          }
          
          if (lacksTests) {
            console.log(chalk.yellow('  • Add test coverage to improve code reliability'));
          }
        }

        // Performance insights
        const performancePatterns = patterns.filter(p => p.category === PatternCategory.PERFORMANCE);
        if (performancePatterns.length > 0) {
          console.log(chalk.cyan('\n⚡ Performance Insights:'));
          
          const hasMemoization = performancePatterns.some(p => p.id === 'memoization');
          const hasOptimizations = performancePatterns.some(p => p.id === 'performance-optimizations');
          
          if (hasMemoization) {
            console.log(chalk.green('  ✓ Memoization patterns detected'));
          } else {
            console.log(chalk.yellow('  • Consider adding memoization for expensive computations'));
          }
          
          if (hasOptimizations) {
            console.log(chalk.green('  ✓ Performance optimizations found'));
          }
        }
      }

    } catch (error) {
      spinner.fail(chalk.red('Pattern analysis failed'));
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Add subcommands for specific pattern types
patternsCommand
  .command('security')
  .description('Analyze security patterns and vulnerabilities')
  .argument('[directory]', 'Directory to analyze', process.cwd())
  .action(async (directory) => {
    const spinner = ora('Analyzing security patterns...').start();
    
    try {
      const engine = new PatternRecognitionEngine();
      const patterns = await engine.analyzeCodebase(directory, {
        categories: [PatternCategory.SECURITY],
      });

      spinner.succeed(chalk.green('Security analysis complete!'));

      const securityIssues = patterns.filter(p => 
        p.metadata?.severity === 'error' || p.metadata?.severity === 'warning'
      );

      if (securityIssues.length === 0) {
        console.log(chalk.green('\n✅ No security issues detected!'));
      } else {
        console.log(chalk.red(`\n⚠️  Found ${securityIssues.length} security issues:`));
        
        for (const issue of securityIssues) {
          console.log(chalk.red(`\n${issue.name}:`));
          console.log(chalk.yellow(`  ${issue.description}`));
          console.log(chalk.gray(`  Occurrences: ${issue.occurrences.length}`));
          
          // Show first 5 occurrences
          const samples = issue.occurrences.slice(0, 5);
          for (const occurrence of samples) {
            const relativePath = path.relative(directory, occurrence.file);
            console.log(chalk.gray(`    - ${relativePath}:${occurrence.line}`));
          }
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('Security analysis failed'));
      console.error(error);
      process.exit(1);
    }
  });

patternsCommand
  .command('performance')
  .description('Analyze performance patterns and optimizations')
  .argument('[directory]', 'Directory to analyze', process.cwd())
  .action(async (directory) => {
    const spinner = ora('Analyzing performance patterns...').start();
    
    try {
      const engine = new PatternRecognitionEngine();
      const patterns = await engine.analyzeCodebase(directory, {
        categories: [PatternCategory.PERFORMANCE],
      });

      spinner.succeed(chalk.green('Performance analysis complete!'));

      const report = engine.generateReport(patterns);
      console.log('\n' + report);

      // Provide optimization suggestions
      console.log(chalk.cyan('\n🚀 Performance Optimization Suggestions:'));
      
      const hasMemoization = patterns.some(p => p.id === 'memoization');
      if (!hasMemoization) {
        console.log(chalk.yellow('  • Add memoization to expensive computations'));
        console.log(chalk.gray('    Use useMemo, useCallback, or React.memo'));
      }
      
      const hasLazyLoading = patterns.some(p => 
        p.occurrences.some(o => o.context?.includes('lazy'))
      );
      if (!hasLazyLoading) {
        console.log(chalk.yellow('  • Implement lazy loading for large components'));
        console.log(chalk.gray('    Use React.lazy() and Suspense'));
      }
      
      console.log(chalk.yellow('  • Consider code splitting for better bundle sizes'));
      console.log(chalk.yellow('  • Use production builds for deployment'));
      
    } catch (error) {
      spinner.fail(chalk.red('Performance analysis failed'));
      console.error(error);
      process.exit(1);
    }
  });

patternsCommand
  .command('architecture')
  .description('Analyze architectural patterns and design')
  .argument('[directory]', 'Directory to analyze', process.cwd())
  .action(async (directory) => {
    const spinner = ora('Analyzing architectural patterns...').start();
    
    try {
      const engine = new PatternRecognitionEngine();
      const patterns = await engine.analyzeCodebase(directory, {
        categories: [PatternCategory.ARCHITECTURE, PatternCategory.DESIGN_PATTERN],
      });

      spinner.succeed(chalk.green('Architecture analysis complete!'));

      // Group patterns
      const designPatterns = patterns.filter(p => p.category === PatternCategory.DESIGN_PATTERN);
      const archPatterns = patterns.filter(p => p.category === PatternCategory.ARCHITECTURE);

      console.log(chalk.cyan('\n🏗️  Architecture Analysis:'));
      
      if (designPatterns.length > 0) {
        console.log(chalk.yellow('\nDesign Patterns Detected:'));
        for (const pattern of designPatterns) {
          console.log(`  • ${pattern.name}: ${pattern.occurrences.length} implementations`);
        }
      }

      if (archPatterns.length > 0) {
        console.log(chalk.yellow('\nArchitectural Patterns:'));
        for (const pattern of archPatterns) {
          console.log(`  • ${pattern.name}: ${pattern.occurrences.length} occurrences`);
        }
      }

      // Provide architectural recommendations
      console.log(chalk.cyan('\n💡 Architectural Recommendations:'));
      
      const hasDI = patterns.some(p => p.id === 'dependency-injection');
      if (!hasDI) {
        console.log(chalk.yellow('  • Consider dependency injection for better testability'));
      }
      
      const hasFactory = patterns.some(p => p.id === 'factory');
      const hasSingleton = patterns.some(p => p.id === 'singleton');
      
      if (hasSingleton && !hasFactory) {
        console.log(chalk.yellow('  • Consider using Factory pattern with Singletons'));
      }
      
      console.log(chalk.green('  • Keep following SOLID principles'));
      console.log(chalk.green('  • Maintain clear separation of concerns'));
      
    } catch (error) {
      spinner.fail(chalk.red('Architecture analysis failed'));
      console.error(error);
      process.exit(1);
    }
  });