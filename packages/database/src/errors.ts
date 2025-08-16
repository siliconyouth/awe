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

export class ConnectionError extends DatabaseError {
  constructor(message: string, cause?: Error) {
    super(`Connection failed: ${message}`, cause)
    this.name = 'ConnectionError'
  }
}

export class QueryError extends DatabaseError {
  constructor(message: string, public query?: string, cause?: Error) {
    super(`Query failed: ${message}`, cause)
    this.name = 'QueryError'
  }
}