export type Roles = 'admin' | 'moderator' | 'developer' | 'user'

export interface UserMetadata {
  role?: Roles
  permissions?: string[]
}

declare global {
  interface CustomJwtSessionClaims {
    metadata?: UserMetadata
  }
}