/**
 * Resource Hub CLI Command
 * Manage Claude Code optimization resources
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { ResourceManager } from '@awe/ai'
import { prisma } from '@awe/database'
import { ResourceType, ResourceStatus } from '@awe/shared'
import { createLogger } from '../utils/logger'
import { BaseCommand } from './base'
import * as fs from 'fs/promises'
import * as path from 'path'

const logger = createLogger('resources')

export class ResourcesCommand extends BaseCommand {
  getCommand(): Command {
    const command = new Command('resources')
      .description('Manage Claude Code optimization resources')
      .alias('res')
      .option('-d, --debug', 'enable debug output')

    // Import resources from GitHub or local directory
    command
      .command('import')
      .description('Import resources from GitHub or directory')
      .argument('<source>', 'GitHub URL or local directory path')
      .option('-t, --type <type>', 'Resource type (pattern, hook, agent, template, guide)', 'pattern')
      .option('--auto-tag', 'Automatically generate tags using AI')
      .option('--quality-check', 'Run AI quality assessment')
      .action(async (source, options) => {
        const spinner = ora('Importing resources...').start()
        
        try {
          const manager = new ResourceManager()
          
          // Determine if source is GitHub URL or local path
          const isGitHub = source.startsWith('http') && source.includes('github.com')
          
          let resources = []
          
          if (isGitHub) {
            spinner.text = 'Fetching from GitHub...'
            resources = await manager.importFromGitHub(source, {
              type: options.type as ResourceType,
              autoTag: options.autoTag,
              qualityCheck: options.qualityCheck
            })
          } else {
            spinner.text = 'Scanning local directory...'
            resources = await manager.importFromDirectory(source, {
              type: options.type as ResourceType,
              autoTag: options.autoTag,
              qualityCheck: options.qualityCheck
            })
          }
          
          spinner.succeed(`Imported ${resources.length} resources`)
          
          // Display imported resources
          console.log(chalk.cyan('\n📦 Imported Resources:\n'))
          
          for (const resource of resources) {
            console.log(chalk.yellow(`${resource.title}`))
            console.log(`  Type: ${chalk.blue(resource.type)}`)
            console.log(`  Format: ${resource.format}`)
            
            if (resource.description) {
              console.log(`  Description: ${resource.description}`)
            }
            
            if (resource.tags?.length > 0) {
              console.log(`  Tags: ${resource.tags.map((t: any) => chalk.gray(t.name)).join(', ')}`)
            }
            
            if (resource.qualityScore) {
              const score = Math.round(resource.qualityScore * 100)
              const color = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red
              console.log(`  Quality: ${color(score + '%')}`)
            }
            
            console.log()
          }
          
          // Ask to save to database
          const { save } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'save',
              message: 'Save these resources to the database?',
              default: true
            }
          ])
          
          if (save) {
            spinner.start('Saving to database...')
            
            for (const resource of resources) {
              await manager.saveResource(resource)
            }
            
            spinner.succeed('Resources saved to database')
          }
          
        } catch (error) {
          spinner.fail('Resource import failed')
          logger.error('Import error:', error)
          process.exit(1)
        }
      })

    // Search resources
    command
      .command('search')
      .description('Search for resources')
      .argument('<query>', 'Search query')
      .option('-t, --type <type>', 'Filter by resource type')
      .option('-f, --format <format>', 'Filter by format (markdown, yaml, json)')
      .option('--tags <tags...>', 'Filter by tags')
      .option('--min-quality <score>', 'Minimum quality score (0-100)', '0')
      .action(async (query, options) => {
        const spinner = ora('Searching resources...').start()
        
        try {
          const where: any = {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } }
            ],
            status: ResourceStatus.PUBLISHED
          }
          
          if (options.type) where.type = options.type
          if (options.format) where.format = options.format
          
          if (options.tags?.length > 0) {
            where.tags = {
              some: {
                tag: {
                  name: { in: options.tags }
                }
              }
            }
          }
          
          if (options.minQuality > 0) {
            where.qualityScore = { gte: options.minQuality / 100 }
          }
          
          const resources = await prisma.resource.findMany({
            where,
            include: {
              tags: {
                include: {
                  tag: true
                }
              },
              reviews: {
                select: {
                  rating: true
                }
              },
              collections: {
                include: {
                  collection: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: [
              { qualityScore: 'desc' },
              { createdAt: 'desc' }
            ]
          })
          
          spinner.succeed(`Found ${resources.length} resources`)
          
          if (resources.length === 0) {
            console.log(chalk.yellow('No resources found matching your query'))
            return
          }
          
          // Display results
          console.log(chalk.cyan('\n🔍 Search Results:\n'))
          
          for (const resource of resources) {
            const avgRating = resource.reviews.length > 0
              ? resource.reviews.reduce((sum, r) => sum + r.rating, 0) / resource.reviews.length
              : 0
            
            console.log(chalk.yellow(`${resource.title}`))
            console.log(`  ID: ${chalk.gray(resource.id)}`)
            console.log(`  Type: ${chalk.blue(resource.type)} | Format: ${resource.format}`)
            
            if (resource.description) {
              console.log(`  ${resource.description}`)
            }
            
            if (resource.tags.length > 0) {
              const tags = resource.tags.map(t => t.tag.name).join(', ')
              console.log(`  Tags: ${chalk.gray(tags)}`)
            }
            
            if (resource.qualityScore) {
              const score = Math.round(resource.qualityScore * 100)
              const color = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red
              console.log(`  Quality: ${color(score + '%')}`)
            }
            
            if (avgRating > 0) {
              console.log(`  Rating: ${chalk.yellow('⭐'.repeat(Math.round(avgRating)))} (${avgRating.toFixed(1)})`)
            }
            
            if (resource.collections.length > 0) {
              const collections = resource.collections.map(c => c.collection.name).join(', ')
              console.log(`  Collections: ${chalk.cyan(collections)}`)
            }
            
            console.log()
          }
          
        } catch (error) {
          spinner.fail('Search failed')
          logger.error('Search error:', error)
          process.exit(1)
        }
      })

    // Get resource details
    command
      .command('get')
      .description('Get resource details')
      .argument('<id>', 'Resource ID')
      .option('--show-content', 'Display full content')
      .option('--export <file>', 'Export to file')
      .action(async (id, options) => {
        const spinner = ora('Loading resource...').start()
        
        try {
          const resource = await prisma.resource.findUnique({
            where: { id },
            include: {
              tags: {
                include: {
                  tag: true
                }
              },
              reviews: {
                include: {
                  user: {
                    select: {
                      name: true
                    }
                  }
                }
              },
              collections: {
                include: {
                  collection: true
                }
              },
              usages: true
            }
          })
          
          if (!resource) {
            spinner.fail('Resource not found')
            process.exit(1)
          }
          
          spinner.succeed('Resource loaded')
          
          // Display resource details
          console.log(chalk.cyan('\n📄 Resource Details:\n'))
          console.log(chalk.yellow(resource.title))
          console.log(chalk.gray('─'.repeat(40)))
          
          console.log(`ID: ${resource.id}`)
          console.log(`Type: ${resource.type}`)
          console.log(`Format: ${resource.format}`)
          console.log(`Status: ${resource.status}`)
          console.log(`Visibility: ${resource.visibility}`)
          
          if (resource.description) {
            console.log(`\nDescription:\n${resource.description}`)
          }
          
          if (resource.sourceUrl) {
            console.log(`\nSource: ${chalk.blue(resource.sourceUrl)}`)
          }
          
          if (resource.author) {
            console.log(`Author: ${resource.author}`)
          }
          
          if (resource.tags.length > 0) {
            console.log('\nTags:')
            resource.tags.forEach(t => {
              const conf = t.confidence ? ` (${Math.round(t.confidence * 100)}%)` : ''
              console.log(`  • ${t.tag.name}${chalk.gray(conf)}`)
            })
          }
          
          if (resource.qualityScore) {
            const score = Math.round(resource.qualityScore * 100)
            const color = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red
            console.log(`\nQuality Score: ${color(score + '%')}`)
          }
          
          if (resource.reviews.length > 0) {
            console.log('\nReviews:')
            resource.reviews.forEach(review => {
              console.log(`  ${chalk.yellow('⭐'.repeat(review.rating))} by ${review.user?.name || 'Anonymous'}`)
              if (review.comment) {
                console.log(`    "${review.comment}"`)
              }
            })
          }
          
          if (resource.collections.length > 0) {
            console.log('\nIncluded in Collections:')
            resource.collections.forEach(c => {
              console.log(`  • ${c.collection.name}`)
            })
          }
          
          console.log(`\nUsage Count: ${resource.usages.length}`)
          console.log(`Created: ${resource.createdAt.toLocaleDateString()}`)
          console.log(`Updated: ${resource.updatedAt.toLocaleDateString()}`)
          
          if (options.showContent) {
            console.log(chalk.cyan('\n📝 Content:\n'))
            console.log(chalk.gray('─'.repeat(40)))
            console.log(resource.content)
            console.log(chalk.gray('─'.repeat(40)))
          }
          
          if (options.export) {
            await fs.writeFile(options.export, resource.content)
            console.log(chalk.green(`\n✅ Resource exported to ${options.export}`))
          }
          
        } catch (error) {
          spinner.fail('Failed to get resource')
          logger.error('Get error:', error)
          process.exit(1)
        }
      })

    // Create a collection
    command
      .command('create-collection')
      .description('Create a resource collection')
      .option('-n, --name <name>', 'Collection name')
      .option('-d, --description <desc>', 'Collection description')
      .action(async (options) => {
        try {
          // Get collection details
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Collection name:',
              when: !options.name,
              validate: (input) => input.length > 0
            },
            {
              type: 'input',
              name: 'description',
              message: 'Collection description:',
              when: !options.description
            },
            {
              type: 'confirm',
              name: 'isPublic',
              message: 'Make this collection public?',
              default: true
            }
          ])
          
          const collectionData = {
            name: options.name || answers.name,
            description: options.description || answers.description,
            isPublic: answers.isPublic
          }
          
          const spinner = ora('Creating collection...').start()
          
          const collection = await prisma.collection.create({
            data: collectionData
          })
          
          spinner.succeed('Collection created')
          
          console.log(chalk.green(`\n✅ Collection "${collection.name}" created`))
          console.log(`ID: ${chalk.gray(collection.id)}`)
          
          // Ask to add resources
          const { addResources } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'addResources',
              message: 'Add resources to this collection now?',
              default: true
            }
          ])
          
          if (addResources) {
            // Search for resources to add
            const { searchQuery } = await inquirer.prompt([
              {
                type: 'input',
                name: 'searchQuery',
                message: 'Search for resources to add:'
              }
            ])
            
            const resources = await prisma.resource.findMany({
              where: {
                OR: [
                  { title: { contains: searchQuery, mode: 'insensitive' } },
                  { description: { contains: searchQuery, mode: 'insensitive' } }
                ]
              },
              select: {
                id: true,
                title: true,
                type: true
              }
            })
            
            if (resources.length === 0) {
              console.log(chalk.yellow('No resources found'))
              return
            }
            
            // Select resources to add
            const { selectedIds } = await inquirer.prompt([
              {
                type: 'checkbox',
                name: 'selectedIds',
                message: 'Select resources to add:',
                choices: resources.map(r => ({
                  name: `${r.title} (${r.type})`,
                  value: r.id
                }))
              }
            ])
            
            if (selectedIds.length > 0) {
              spinner.start('Adding resources to collection...')
              
              await prisma.collectionResource.createMany({
                data: selectedIds.map((resourceId: string) => ({
                  collectionId: collection.id,
                  resourceId
                }))
              })
              
              spinner.succeed(`Added ${selectedIds.length} resources to collection`)
            }
          }
          
        } catch (error) {
          logger.error('Collection creation error:', error)
          console.error(chalk.red('Failed to create collection'))
          process.exit(1)
        }
      })

    // List collections
    command
      .command('collections')
      .description('List resource collections')
      .option('--public', 'Show only public collections')
      .option('--with-counts', 'Show resource counts')
      .action(async (options) => {
        const spinner = ora('Loading collections...').start()
        
        try {
          const where: any = {}
          if (options.public) where.isPublic = true
          
          const collections = await prisma.collection.findMany({
            where,
            include: options.withCounts ? {
              resources: {
                select: {
                  id: true
                }
              }
            } : undefined,
            orderBy: {
              createdAt: 'desc'
            }
          })
          
          spinner.succeed(`Found ${collections.length} collections`)
          
          if (collections.length === 0) {
            console.log(chalk.yellow('No collections found'))
            return
          }
          
          console.log(chalk.cyan('\n📚 Resource Collections:\n'))
          
          for (const collection of collections) {
            const visibility = collection.isPublic ? chalk.green('Public') : chalk.gray('Private')
            const count = options.withCounts ? ` (${collection.resources.length} resources)` : ''
            
            console.log(chalk.yellow(`${collection.name}`) + count)
            console.log(`  ID: ${chalk.gray(collection.id)}`)
            console.log(`  ${visibility}`)
            
            if (collection.description) {
              console.log(`  ${collection.description}`)
            }
            
            console.log()
          }
          
        } catch (error) {
          spinner.fail('Failed to list collections')
          logger.error('List error:', error)
          process.exit(1)
        }
      })

    // Export collection
    command
      .command('export-collection')
      .description('Export a collection of resources')
      .argument('<id>', 'Collection ID')
      .option('-f, --format <format>', 'Export format (zip, markdown, json)', 'zip')
      .option('-o, --output <file>', 'Output file')
      .action(async (id, options) => {
        const spinner = ora('Exporting collection...').start()
        
        try {
          const collection = await prisma.collection.findUnique({
            where: { id },
            include: {
              resources: {
                include: {
                  resource: true
                }
              }
            }
          })
          
          if (!collection) {
            spinner.fail('Collection not found')
            process.exit(1)
          }
          
          spinner.text = `Exporting ${collection.resources.length} resources...`
          
          const manager = new ResourceManager()
          const exported = await manager.exportCollection(collection, {
            format: options.format as 'zip' | 'markdown' | 'json'
          })
          
          const outputFile = options.output || `${collection.name.replace(/\s+/g, '-')}.${options.format}`
          
          await fs.writeFile(outputFile, exported)
          
          spinner.succeed(`Collection exported to ${outputFile}`)
          
        } catch (error) {
          spinner.fail('Export failed')
          logger.error('Export error:', error)
          process.exit(1)
        }
      })

    return command
  }
}