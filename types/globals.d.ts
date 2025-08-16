/**
 * Global TypeScript Definitions for AWE
 * 
 * Extends Clerk types with custom RBAC roles and permissions
 */

export {}

/**
 * User roles in the AWE system
 * Following Clerk's basic RBAC pattern
 */
export type Roles = 'admin' | 'moderator' | 'developer' | 'user'

declare global {
  /**
   * Custom JWT session claims for Clerk
   * This extends the default session with our role metadata
   */
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
      permissions?: string[]
      tier?: 'free' | 'pro' | 'enterprise'
      organizationRole?: string
    }
    email?: string
    firstName?: string
    lastName?: string
  }
  
  /**
   * User public metadata structure
   * This is stored in Clerk and accessible everywhere
   */
  interface UserPublicMetadata {
    role?: Roles
    permissions?: string[]
    tier?: 'free' | 'pro' | 'enterprise'
    onboardingCompleted?: boolean
    preferences?: {
      theme?: 'light' | 'dark' | 'system'
      notifications?: boolean
      language?: string
    }
  }

  /**
   * User private metadata structure
   * Only accessible server-side
   */
  interface UserPrivateMetadata {
    stripeCustomerId?: string
    internalNotes?: string
    flags?: Record<string, boolean>
    apiKeys?: Record<string, string>
  }

  /**
   * User unsafe metadata structure
   * Can be modified client-side
   */
  interface UserUnsafeMetadata {
    bio?: string
    location?: string
    website?: string
    social?: {
      twitter?: string
      github?: string
      linkedin?: string
    }
  }
}