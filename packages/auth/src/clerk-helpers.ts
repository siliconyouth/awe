/**
 * Clerk Helper Functions
 * 
 * Utilities for working with Clerk authentication and user roles
 */

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { type User } from '@clerk/nextjs/server'
import { 
  UserRole, 
  Permission, 
  hasRole, 
  hasPermission, 
  UserMetadata,
  UserMetadataSchema 
} from './roles'

/**
 * Get the current user's role from Clerk metadata
 * 
 * HOW IT WORKS:
 * 1. Fetches the current user from Clerk
 * 2. Checks publicMetadata for role field
 * 3. Falls back to USER role if not set
 */
export async function getCurrentUserRole(): Promise<UserRole> {
  try {
    const user = await currentUser()
    if (!user) return UserRole.GUEST
    
    // Parse metadata with validation
    const metadata = UserMetadataSchema.safeParse(user.publicMetadata)
    if (metadata.success) {
      return metadata.data.role
    }
    
    // Fallback to USER role
    return UserRole.USER
  } catch (error) {
    console.error('Error getting user role:', error)
    return UserRole.GUEST
  }
}

/**
 * Get user role by user ID
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    const metadata = UserMetadataSchema.safeParse(user.publicMetadata)
    if (metadata.success) {
      return metadata.data.role
    }
    
    return UserRole.USER
  } catch (error) {
    console.error('Error getting user role:', error)
    return UserRole.GUEST
  }
}

/**
 * Set user role in Clerk
 * 
 * This is how you assign roles to users:
 * 1. Updates the user's publicMetadata in Clerk
 * 2. The role is then available everywhere
 */
export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  try {
    const client = await clerkClient()
    
    // Get current metadata
    const user = await client.users.getUser(userId)
    const currentMetadata = user.publicMetadata as any || {}
    
    // Update with new role
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        role,
        updatedAt: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Error setting user role:', error)
    throw new Error('Failed to update user role')
  }
}

/**
 * Set multiple permissions for a user
 */
export async function setUserPermissions(
  userId: string, 
  permissions: Permission[]
): Promise<void> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const currentMetadata = user.publicMetadata as any || {}
    
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        permissions,
        updatedAt: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Error setting user permissions:', error)
    throw new Error('Failed to update user permissions')
  }
}

/**
 * Check if current user has a specific role
 */
export async function currentUserHasRole(requiredRole: UserRole): Promise<boolean> {
  const userRole = await getCurrentUserRole()
  return hasRole(userRole, requiredRole)
}

/**
 * Check if current user has a specific permission
 */
export async function currentUserHasPermission(permission: Permission): Promise<boolean> {
  try {
    const user = await currentUser()
    if (!user) return false
    
    const metadata = UserMetadataSchema.safeParse(user.publicMetadata)
    if (!metadata.success) return false
    
    return hasPermission(
      metadata.data.role,
      permission,
      metadata.data.permissions
    )
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Require a specific role (throws error if not met)
 */
export async function requireRole(requiredRole: UserRole): Promise<void> {
  const hasRequiredRole = await currentUserHasRole(requiredRole)
  
  if (!hasRequiredRole) {
    throw new Error(`Unauthorized: ${requiredRole} role required`)
  }
}

/**
 * Require a specific permission (throws error if not met)
 */
export async function requirePermission(permission: Permission): Promise<void> {
  const hasRequiredPermission = await currentUserHasPermission(permission)
  
  if (!hasRequiredPermission) {
    throw new Error(`Unauthorized: Missing permission ${permission}`)
  }
}

/**
 * Get all users with a specific role
 */
export async function getUsersByRole(role: UserRole): Promise<User[]> {
  try {
    const client = await clerkClient()
    const users = await client.users.getUserList({ limit: 500 })
    
    return users.data.filter(user => {
      const metadata = UserMetadataSchema.safeParse(user.publicMetadata)
      return metadata.success && metadata.data.role === role
    })
  } catch (error) {
    console.error('Error getting users by role:', error)
    return []
  }
}

/**
 * Batch update roles for multiple users
 */
export async function batchUpdateRoles(
  updates: Array<{ userId: string; role: UserRole }>
): Promise<void> {
  const client = await clerkClient()
  
  await Promise.all(
    updates.map(({ userId, role }) => setUserRole(userId, role))
  )
}

/**
 * Initialize default roles for new users
 * This can be called from a webhook when a user signs up
 */
export async function initializeUserRole(userId: string, email?: string): Promise<void> {
  try {
    // Determine initial role based on email or other criteria
    let initialRole = UserRole.USER
    
    // Example: Give admin role to specific email domains
    if (email) {
      if (email.endsWith('@awe.dev')) {
        initialRole = UserRole.ADMIN
      } else if (email.endsWith('@partner.com')) {
        initialRole = UserRole.DEVELOPER
      }
    }
    
    await setUserRole(userId, initialRole)
  } catch (error) {
    console.error('Error initializing user role:', error)
  }
}

/**
 * Get user's organization roles (if using Clerk Organizations)
 */
export async function getUserOrganizationRoles(userId: string): Promise<Record<string, UserRole>> {
  try {
    const client = await clerkClient()
    const organizationMemberships = await client.users.getOrganizationMembershipList({ 
      userId 
    })
    
    const roles: Record<string, UserRole> = {}
    
    for (const membership of organizationMemberships.data) {
      // Map Clerk organization roles to our roles
      const clerkRole = membership.role
      let appRole = UserRole.USER
      
      if (clerkRole === 'admin') {
        appRole = UserRole.ADMIN
      } else if (clerkRole === 'moderator') {
        appRole = UserRole.MODERATOR
      }
      
      roles[membership.organization.id] = appRole
    }
    
    return roles
  } catch (error) {
    console.error('Error getting organization roles:', error)
    return {}
  }
}

/**
 * Sync user roles from external source
 * Useful for integrating with existing systems
 */
export async function syncUserRoles(
  externalRoleMapping: Array<{ email: string; role: UserRole }>
): Promise<void> {
  try {
    const client = await clerkClient()
    
    for (const mapping of externalRoleMapping) {
      // Find user by email
      const users = await client.users.getUserList({ 
        emailAddress: [mapping.email] 
      })
      
      if (users.data.length > 0) {
        const user = users.data[0]
        await setUserRole(user.id, mapping.role)
      }
    }
  } catch (error) {
    console.error('Error syncing user roles:', error)
  }
}