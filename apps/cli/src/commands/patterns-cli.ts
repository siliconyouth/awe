/**
 * Pattern Management CLI Command
 * Provides comprehensive pattern extraction, analysis, and management
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { PatternExtractor, PatternReviewer, PatternExporter } from '@awe/ai'
import { prisma } from '@awe/database'
import { createLogger } from '../utils/logger'
import { BaseCommand } from './base'
import * as fs from 'fs/promises'
import * as path from 'path'

const logger = createLogger('patterns')

export class PatternsCommand extends BaseCommand {
  getCommand(): Command {
    const command = new Command('patterns')
      .description('Extract, review, and manage coding patterns')
      .option('-d, --debug', 'enable debug output')

    // Extract patterns from codebase
    command
      .command('extract')
      .description('Extract patterns from your codebase')
      .argument('[directory]', 'Directory to analyze', process.cwd())
      .option('-t, --types <types...>', 'Pattern types to extract (architecture, testing, performance, security)')
      .option('-o, --output <file>', 'Output file for patterns')
      .option('--ai-review', 'Include AI review and recommendations')
      .option('--save-db', 'Save patterns to database')
      .action(async (directory, options) => {
        const spinner = ora('Extracting patterns from codebase...').start()
        
        try {
          const extractor = new PatternExtractor()
          
          // Extract patterns
          const patterns = await extractor.extractPatterns(directory, {
            types: options.types,
            includeAIAnalysis: options.aiReview
          })
          
          spinner.succeed(`Found ${patterns.length} patterns`)
          
          // Display patterns
          console.log(chalk.cyan('\n📋 Extracted Patterns:\n'))
          
          for (const pattern of patterns) {
            console.log(chalk.yellow(`${pattern.name}`))
            console.log(`  Type: ${chalk.blue(pattern.type)}`)
            console.log(`  Category: ${pattern.category}`)
            console.log(`  Occurrences: ${pattern.occurrences}`)
            console.log(`  Confidence: ${chalk.green(pattern.confidence + '%')}`)
            
            if (pattern.description) {
              console.log(`  Description: ${pattern.description}`)
            }
            
            if (pattern.recommendation && options.aiReview) {
              console.log(chalk.cyan(`  AI Recommendation: ${pattern.recommendation}`))
            }
            
            console.log()
          }
          
          // Save to file if requested
          if (options.output) {
            await fs.writeFile(
              options.output,
              JSON.stringify(patterns, null, 2)
            )
            console.log(chalk.green(`✅ Patterns saved to ${options.output}`))
          }
          
          // Save to database if requested
          if (options.saveDb) {
            spinner.start('Saving patterns to database...')
            
            for (const pattern of patterns) {
              await prisma.extractedPattern.create({
                data: {
                  name: pattern.name,
                  type: pattern.type,
                  category: pattern.category,
                  description: pattern.description,
                  code: pattern.code,
                  metadata: pattern.metadata,
                  confidence: pattern.confidence / 100,
                  occurrences: pattern.occurrences,
                  projectId: null // Can be linked to a project later
                }
              })
            }
            
            spinner.succeed('Patterns saved to database')
          }
          
        } catch (error) {
          spinner.fail('Pattern extraction failed')
          logger.error('Pattern extraction error:', error)
          process.exit(1)
        }
      })

    // Review existing patterns
    command
      .command('review')
      .description('Review and rate extracted patterns')
      .option('--unreviewed', 'Show only unreviewed patterns')
      .option('--project <id>', 'Filter by project ID')
      .action(async (options) => {
        const spinner = ora('Loading patterns for review...').start()
        
        try {
          // Fetch patterns from database
          const patterns = await prisma.extractedPattern.findMany({
            where: {
              projectId: options.project || undefined,
              reviews: options.unreviewed ? {
                none: {}
              } : undefined
            },
            include: {
              reviews: true
            }
          })
          
          spinner.succeed(`Found ${patterns.length} patterns to review`)
          
          if (patterns.length === 0) {
            console.log(chalk.yellow('No patterns found matching criteria'))
            return
          }
          
          // Review each pattern
          const reviewer = new PatternReviewer()
          
          for (const pattern of patterns) {
            console.log(chalk.cyan(`\n📋 Pattern: ${pattern.name}`))
            console.log(`Type: ${pattern.type}`)
            console.log(`Category: ${pattern.category}`)
            console.log(`Description: ${pattern.description}`)
            
            if (pattern.code) {
              console.log(chalk.gray('\nCode Sample:'))
              console.log(pattern.code)
            }
            
            // Get AI review
            const aiReview = await reviewer.reviewPattern(pattern)
            
            console.log(chalk.cyan('\n🤖 AI Analysis:'))
            console.log(`Quality Score: ${chalk.green(aiReview.qualityScore + '/10')}`)
            console.log(`Recommendation: ${aiReview.recommendation}`)
            
            if (aiReview.improvements?.length > 0) {
              console.log(chalk.yellow('\nSuggested Improvements:'))
              aiReview.improvements.forEach((imp: string) => {
                console.log(`  • ${imp}`)
              })
            }
            
            // Get user input
            const { action } = await inquirer.prompt([
              {
                type: 'list',
                name: 'action',
                message: 'What would you like to do with this pattern?',
                choices: [
                  { name: 'Approve ✅', value: 'approve' },
                  { name: 'Reject ❌', value: 'reject' },
                  { name: 'Skip ⏭️', value: 'skip' },
                  { name: 'Edit 📝', value: 'edit' }
                ]
              }
            ])
            
            if (action === 'approve' || action === 'reject') {
              const { rating, comment } = await inquirer.prompt([
                {
                  type: 'number',
                  name: 'rating',
                  message: 'Rate this pattern (1-5):',
                  validate: (input) => input >= 1 && input <= 5
                },
                {
                  type: 'input',
                  name: 'comment',
                  message: 'Add a comment (optional):'
                }
              ])
              
              // Save review
              await prisma.patternReview.create({
                data: {
                  patternId: pattern.id,
                  userId: 'cli-user', // Would be actual user ID in production
                  rating,
                  comment: comment || undefined,
                  approved: action === 'approve'
                }
              })
              
              console.log(chalk.green('✅ Review saved'))
            }
            
            if (action === 'edit') {
              // TODO: Implement pattern editing
              console.log(chalk.yellow('Pattern editing not yet implemented'))
            }
          }
          
        } catch (error) {
          spinner.fail('Pattern review failed')
          logger.error('Review error:', error)
          process.exit(1)
        }
      })

    // Export patterns
    command
      .command('export')
      .description('Export patterns to various formats')
      .option('-f, --format <format>', 'Export format (json, markdown, yaml)', 'json')
      .option('-o, --output <file>', 'Output file')
      .option('--approved-only', 'Export only approved patterns')
      .option('--include-reviews', 'Include review data')
      .action(async (options) => {
        const spinner = ora('Exporting patterns...').start()
        
        try {
          // Fetch patterns
          const patterns = await prisma.extractedPattern.findMany({
            where: options.approvedOnly ? {
              reviews: {
                some: {
                  approved: true
                }
              }
            } : undefined,
            include: options.includeReviews ? {
              reviews: true
            } : undefined
          })
          
          spinner.succeed(`Exporting ${patterns.length} patterns`)
          
          const exporter = new PatternExporter()
          const exported = await exporter.export(patterns, {
            format: options.format as 'json' | 'markdown' | 'yaml'
          })
          
          if (options.output) {
            await fs.writeFile(options.output, exported)
            console.log(chalk.green(`✅ Patterns exported to ${options.output}`))
          } else {
            console.log(exported)
          }
          
        } catch (error) {
          spinner.fail('Pattern export failed')
          logger.error('Export error:', error)
          process.exit(1)
        }
      })

    // Apply patterns to project
    command
      .command('apply')
      .description('Apply patterns to your project')
      .argument('<pattern-id>', 'Pattern ID or name to apply')
      .option('-d, --directory <dir>', 'Target directory', process.cwd())
      .option('--dry-run', 'Preview changes without applying')
      .action(async (patternId, options) => {
        const spinner = ora('Loading pattern...').start()
        
        try {
          // Find pattern
          const pattern = await prisma.extractedPattern.findFirst({
            where: {
              OR: [
                { id: patternId },
                { name: patternId }
              ]
            }
          })
          
          if (!pattern) {
            spinner.fail('Pattern not found')
            process.exit(1)
          }
          
          spinner.succeed(`Found pattern: ${pattern.name}`)
          
          console.log(chalk.cyan('\n📋 Pattern Details:'))
          console.log(`Name: ${pattern.name}`)
          console.log(`Type: ${pattern.type}`)
          console.log(`Category: ${pattern.category}`)
          console.log(`Description: ${pattern.description}`)
          
          if (pattern.code) {
            console.log(chalk.gray('\nCode Template:'))
            console.log(pattern.code)
          }
          
          // Confirm application
          if (!options.dryRun) {
            const { confirm } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'confirm',
                message: 'Apply this pattern to your project?',
                default: false
              }
            ])
            
            if (!confirm) {
              console.log(chalk.yellow('Pattern application cancelled'))
              return
            }
          }
          
          // Apply pattern
          // TODO: Implement actual pattern application logic
          console.log(chalk.yellow('\nPattern application logic not yet implemented'))
          console.log('This would:')
          console.log('  1. Generate code based on the pattern')
          console.log('  2. Integrate with existing project structure')
          console.log('  3. Update configuration files as needed')
          console.log('  4. Add necessary dependencies')
          
          // Track usage
          if (!options.dryRun) {
            await prisma.patternUsage.create({
              data: {
                patternId: pattern.id,
                projectId: null, // Would be actual project ID
                appliedAt: new Date(),
                appliedBy: 'cli-user'
              }
            })
          }
          
        } catch (error) {
          spinner.fail('Pattern application failed')
          logger.error('Application error:', error)
          process.exit(1)
        }
      })

    // List patterns
    command
      .command('list')
      .description('List all patterns')
      .option('-t, --type <type>', 'Filter by type')
      .option('-c, --category <category>', 'Filter by category')
      .option('--approved', 'Show only approved patterns')
      .action(async (options) => {
        const spinner = ora('Loading patterns...').start()
        
        try {
          const where: any = {}
          
          if (options.type) where.type = options.type
          if (options.category) where.category = options.category
          if (options.approved) {
            where.reviews = {
              some: {
                approved: true
              }
            }
          }
          
          const patterns = await prisma.extractedPattern.findMany({
            where,
            include: {
              reviews: {
                select: {
                  rating: true,
                  approved: true
                }
              },
              usages: {
                select: {
                  id: true
                }
              }
            }
          })
          
          spinner.succeed(`Found ${patterns.length} patterns`)
          
          if (patterns.length === 0) {
            console.log(chalk.yellow('No patterns found'))
            return
          }
          
          console.log(chalk.cyan('\n📋 Available Patterns:\n'))
          
          // Group by type
          const byType = new Map<string, typeof patterns>()
          patterns.forEach(p => {
            if (!byType.has(p.type)) byType.set(p.type, [])
            byType.get(p.type)!.push(p)
          })
          
          for (const [type, typePatterns] of byType) {
            console.log(chalk.yellow(`${type.toUpperCase()}:`))
            
            for (const pattern of typePatterns) {
              const avgRating = pattern.reviews.length > 0
                ? pattern.reviews.reduce((sum, r) => sum + r.rating, 0) / pattern.reviews.length
                : 0
              
              const status = pattern.reviews.some(r => r.approved)
                ? chalk.green('✅')
                : pattern.reviews.length > 0
                ? chalk.red('❌')
                : chalk.gray('⏸')
              
              console.log(
                `  ${status} ${pattern.name} ` +
                `(${pattern.category}) ` +
                chalk.gray(`[${pattern.usages.length} uses]`) +
                (avgRating > 0 ? chalk.yellow(` ⭐ ${avgRating.toFixed(1)}`) : '')
              )
              
              if (pattern.description) {
                console.log(chalk.gray(`     ${pattern.description}`))
              }
            }
            console.log()
          }
          
        } catch (error) {
          spinner.fail('Failed to list patterns')
          logger.error('List error:', error)
          process.exit(1)
        }
      })

    return command
  }
}