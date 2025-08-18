/**
 * Database helper for API routes
 * Uses dynamic imports to avoid build-time resolution issues
 */

let cachedDb: any = null

export async function getDatabase() {
  if (cachedDb) return cachedDb
  
  try {
    const db = await import('@awe/database')
    cachedDb = db.getPrisma()
    return cachedDb
  } catch (error) {
    console.error('Database import failed:', error)
    return null
  }
}

export async function getSupabase() {
  try {
    const db = await import('@awe/database')
    return db.getSupabase()
  } catch (error) {
    console.error('Supabase import failed:', error)
    return null
  }
}