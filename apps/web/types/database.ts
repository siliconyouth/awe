/**
 * Database Types
 */

import type { PrismaClient } from '@prisma/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export type CachedDatabase = PrismaClient | null
export type CachedSupabase = SupabaseClient | null