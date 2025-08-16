export interface DatabaseConfig {
  databaseUrl?: string
  supabaseUrl?: string
  supabaseKey?: string
  maxConnections?: number
  connectionTimeout?: number
}

export class DatabaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}