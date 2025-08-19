#!/usr/bin/env tsx

/**
 * Migration script to create default projects for existing users
 * and migrate existing data to these projects
 */

import { PrismaClient } from '@prisma/client'
import { clerkClient } from '@clerk/nextjs/server'

const prisma = new PrismaClient()

async function migrateToProjects() {
  console.log('Starting migration to project-centric architecture...')
  
  try {
    // Get all unique user IDs from existing data
    const userIds = new Set<string>()
    
    // Collect user IDs from various tables
    const [
      knowledgeSources,
      patterns,
      telemetryEvents
    ] = await Promise.all([
      prisma.knowledgeSource.findMany({ select: { userId: true } }),
      prisma.extractedPattern.findMany({ select: { extractedBy: true } }),
      prisma.telemetryEvent.findMany({ select: { userId: true } })
    ])
    
    knowledgeSources.forEach(ks => ks.userId && userIds.add(ks.userId))
    patterns.forEach(p => p.extractedBy && userIds.add(p.extractedBy))
    telemetryEvents.forEach(t => t.userId && userIds.add(t.userId))
    
    console.log(`Found ${userIds.size} users with existing data`)
    
    // Create default project for each user
    for (const userId of userIds) {
      console.log(`Processing user: ${userId}`)
      
      // Check if user already has projects
      const existingProjects = await prisma.project.count({
        where: { userId }
      })
      
      if (existingProjects > 0) {
        console.log(`User ${userId} already has ${existingProjects} projects, skipping...`)
        continue
      }
      
      // Get user info from Clerk
      let userName = 'Default Project'
      try {
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        userName = user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
                  user.username || 
                  'Default Project'
      } catch (error) {
        console.warn(`Could not fetch user info for ${userId}, using default name`)
      }
      
      // Create default project
      const project = await prisma.project.create({
        data: {
          userId,
          name: `${userName}'s Project`,
          description: 'Default project for existing data',
          type: 'unknown',
          isDefault: true,
          path: `/projects/default`,
          languages: [],
          frameworks: [],
          hasClaudeMd: false,
          optimizationLevel: 0
        }
      })
      
      console.log(`Created default project for user ${userId}: ${project.id}`)
      
      // Update existing data to use this project
      const updates = await Promise.all([
        // Update knowledge sources
        prisma.knowledgeSource.updateMany({
          where: { 
            userId,
            projectId: null
          },
          data: { projectId: project.id }
        }),
        
        // Update extracted patterns
        prisma.extractedPattern.updateMany({
          where: { 
            extractedBy: userId,
            projectId: null
          },
          data: { projectId: project.id }
        }),
        
        // Update pattern usage
        prisma.patternUsage.updateMany({
          where: { 
            userId,
            projectId: null
          },
          data: { projectId: project.id }
        }),
        
        // Update telemetry events
        prisma.telemetryEvent.updateMany({
          where: { 
            userId,
            projectId: null
          },
          data: { projectId: project.id }
        })
      ])
      
      console.log(`Migrated data for user ${userId}:`)
      console.log(`  - Knowledge Sources: ${updates[0].count}`)
      console.log(`  - Extracted Patterns: ${updates[1].count}`)
      console.log(`  - Pattern Usage: ${updates[2].count}`)
      console.log(`  - Telemetry Events: ${updates[3].count}`)
    }
    
    // Handle orphaned data (no userId)
    console.log('\nChecking for orphaned data...')
    
    const orphanedKnowledge = await prisma.knowledgeSource.count({
      where: { 
        userId: null,
        projectId: null
      }
    })
    
    if (orphanedKnowledge > 0) {
      console.log(`Found ${orphanedKnowledge} orphaned knowledge sources`)
      
      // Create a system project for orphaned data
      const systemProject = await prisma.project.upsert({
        where: {
          userId_name: {
            userId: 'system',
            name: 'System Project'
          }
        },
        update: {},
        create: {
          userId: 'system',
          name: 'System Project',
          description: 'Project for system-generated or orphaned data',
          type: 'system',
          isDefault: true,
          path: '/projects/system',
          languages: [],
          frameworks: [],
          hasClaudeMd: false,
          optimizationLevel: 0
        }
      })
      
      // Assign orphaned data to system project
      await prisma.knowledgeSource.updateMany({
        where: { 
          userId: null,
          projectId: null
        },
        data: { 
          projectId: systemProject.id,
          userId: 'system'
        }
      })
      
      console.log(`Assigned orphaned data to system project: ${systemProject.id}`)
    }
    
    console.log('\nMigration completed successfully!')
    
    // Print summary
    const projectCount = await prisma.project.count()
    const migratedKnowledge = await prisma.knowledgeSource.count({
      where: { projectId: { not: null } }
    })
    const migratedPatterns = await prisma.extractedPattern.count({
      where: { projectId: { not: null } }
    })
    
    console.log('\nMigration Summary:')
    console.log(`  Total Projects Created: ${projectCount}`)
    console.log(`  Knowledge Sources Migrated: ${migratedKnowledge}`)
    console.log(`  Patterns Migrated: ${migratedPatterns}`)
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateToProjects()
  .then(() => {
    console.log('Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })