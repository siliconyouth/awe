import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import type { Config } from '@awe/shared'

export * from '@prisma/client'

// Global database instances
let prisma: PrismaClient | null = null
let supabase: ReturnType<typeof createClient> | null = null

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    })
  }
  return prisma
}

export function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL || process.env.AWE_SUPABASE_URL
    const key = process.env.SUPABASE_ANON_KEY || process.env.AWE_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      throw new Error('Supabase credentials not configured')
    }
    
    supabase = createClient(url, key)
  }
  return supabase
}

export async function initializeDatabase(config?: Config) {
  try {
    // Check if DATABASE_URL is set, if not, return null for offline mode
    if (!process.env.DATABASE_URL && !process.env.AWE_DATABASE_URL) {
      // Silently return null - offline mode
      return null
    }
    
    const db = getPrisma()
    
    // Test connection
    await db.$connect()
    
    // Run any pending migrations in development
    if (process.env.NODE_ENV === 'development') {
      // Note: In production, migrations should be run separately
      console.log('Database connected successfully')
    }
    
    return db
  } catch (error: any) {
    // Only log if it's not a missing DATABASE_URL error
    if (!error?.message?.includes('DATABASE_URL')) {
      console.error('Failed to initialize database:', error)
    }
    // Don't throw - allow offline mode
    return null
  }
}

export async function closeDatabase() {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}

// Database repositories
export { ProjectRepository } from './repositories/project'
export { TemplateRepository } from './repositories/template'
export { AnalysisRepository } from './repositories/analysis'
export { ConfigRepository } from './repositories/config'

// Database utilities
export { DatabaseError, ValidationError } from './errors'
export type { DatabaseConfig } from './types'