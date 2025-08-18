/**
 * RBAC (Role-Based Access Control) Utilities
 * 
 * Core utilities for role and permission checking
 * Following Clerk's basic RBAC pattern
 */

import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Roles } from '../../types/globals'

/**
 * Role hierarchy with permission levels
 * Higher numbers have more permissions
 */
export const ROLE_HIERARCHY: Record<Roles, number> = {
  admin: 100,
  moderator: 50,
  developer: 30,
  user: 10,
}

/**
 * Permission definitions for each role
 */
export const ROLE_PERMISSIONS: Record<Roles, string[]> = {
  admin: [
    'users.view',
    'users.edit',
    'users.delete',
    'users.impersonate',
    'config.view',
    'config.edit',
    'scraper.view',
    'scraper.edit',
    'scraper.run',
    'scraper.delete',
    'knowledge.view',
    'knowledge.edit',
    'knowledge.delete',
    'knowledge.approve',
    'api.unlimited',
    'admin.access',
    'legal.edit',
    'billing.manage',
  ],
  moderator: [
    'users.view',
    'config.view',
    'scraper.view',
    'scraper.run',
    'knowledge.view',
    'knowledge.edit',
    'knowledge.approve',
    'api.elevated',
    'reports.view',
  ],
  developer: [
    'config.view',
    'scraper.view',
    'scraper.run',
    'scraper.edit',
    'knowledge.view',
    'knowledge.edit',
    'api.elevated',
    'api.debug',
    'logs.view',
  ],
  user: [
    'scraper.view',
    'scraper.run',
    'knowledge.view',
    'api.basic',
  ],
}

/**
 * Check if the current user has a specific role
 * @param role The role to check for
 * @returns True if user has the role or a higher role
 */
export async function checkRole(role: Roles): Promise<boolean> {
  const { userId } = await auth()
  
  if (!userId) {
    return false
  }
  
  // Always fetch user from Clerk to get the latest publicMetadata
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Check publicMetadata for role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata = user.publicMetadata as any
    const userRole = metadata?.role as Roles
    
    if (!userRole) {
      console.log(`No role found for user ${userId}`)
      return false
    }
    
    console.log(`User ${userId} has role: ${userRole}`)
    
    const userLevel = ROLE_HIERARCHY[userRole] || 0
    const requiredLevel = ROLE_HIERARCHY[role] || 0
    
    const hasAccess = userLevel >= requiredLevel
    console.log(`Role check: ${userRole} (${userLevel}) >= ${role} (${requiredLevel}) = ${hasAccess}`)
    
    return hasAccess
  } catch (error) {
    console.error('Failed to fetch user for role check:', error)
    return false
  }
}

/**
 * Check if the current user has a specific permission
 * @param permission The permission to check for
 * @returns True if user has the permission
 */
export async function checkPermission(permission: string): Promise<boolean> {
  const { sessionClaims } = await auth()
  
  if (!sessionClaims?.metadata?.role) {
    return false
  }
  
  const userRole = sessionClaims.metadata.role as Roles
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  const customPermissions = sessionClaims.metadata.permissions || []
  
  return rolePermissions.includes(permission) || customPermissions.includes(permission)
}

/**
 * Get the current user's role
 * @returns The user's role or 'user' as default
 */
export async function getUserRole(): Promise<Roles> {
  const { userId } = await auth()
  
  if (!userId) {
    return 'user'
  }
  
  // Fetch user from Clerk to get the latest publicMetadata
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Check publicMetadata for role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata = user.publicMetadata as any
    const userRole = metadata?.role as Roles
    
    return userRole || 'user'
  } catch (error) {
    console.error('Failed to fetch user role:', error)
    return 'user'
  }
}

/**
 * Get all permissions for the current user
 * @returns Array of permission strings
 */
export async function getUserPermissions(): Promise<string[]> {
  const { sessionClaims } = await auth()
  
  if (!sessionClaims?.metadata?.role) {
    return []
  }
  
  const userRole = sessionClaims.metadata.role as Roles
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  const customPermissions = sessionClaims.metadata.permissions || []
  
  return [...new Set([...rolePermissions, ...customPermissions])]
}

/**
 * Protect a page/route - redirects if unauthorized
 * @param requiredRole The minimum role required
 * @param redirectTo Where to redirect unauthorized users
 */
export async function protectRoute(
  requiredRole: Roles,
  redirectTo: string = '/unauthorized'
): Promise<void> {
  const hasRole = await checkRole(requiredRole)
  
  if (!hasRole) {
    redirect(redirectTo)
  }
}

/**
 * Protect an API route - returns error response if unauthorized
 * @param requiredRole The minimum role required
 * @returns Response object if unauthorized, undefined if authorized
 */
export async function protectApiRoute(
  requiredRole: Roles
): Promise<Response | undefined> {
  const hasRole = await checkRole(requiredRole)
  
  if (!hasRole) {
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized', 
        message: `${requiredRole} role required` 
      }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  return undefined
}

/**
 * Set a user's role (admin only)
 * @param userId The user ID to update
 * @param role The new role
 */
export async function setUserRole(userId: string, role: Roles): Promise<void> {
  // Check if current user is admin
  const isAdmin = await checkRole('admin')
  if (!isAdmin) {
    throw new Error('Only admins can set user roles')
  }
  
  const client = await clerkClient()
  
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      role,
      updatedAt: new Date().toISOString(),
    }
  })
}

/**
 * Set custom permissions for a user (admin only)
 * @param userId The user ID to update
 * @param permissions Array of permission strings
 */
export async function setUserPermissions(
  userId: string,
  permissions: string[]
): Promise<void> {
  // Check if current user is admin
  const isAdmin = await checkRole('admin')
  if (!isAdmin) {
    throw new Error('Only admins can set user permissions')
  }
  
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const currentMetadata = user.publicMetadata as UserPublicMetadata
  
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...currentMetadata,
      permissions,
      updatedAt: new Date().toISOString(),
    }
  })
}

/**
 * Get a user's role by ID
 * @param userId The user ID
 * @returns The user's role
 */
export async function getUserRoleById(userId: string): Promise<Roles> {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const metadata = user.publicMetadata as UserPublicMetadata
  
  return (metadata.role || 'user') as Roles
}

/**
 * Get all users with a specific role
 * @param role The role to filter by
 * @returns Array of users with the role
 */
export async function getUsersByRole(role: Roles) {
  const client = await clerkClient()
  const { data: users } = await client.users.getUserList({ limit: 500 })
  
  return users.filter(user => {
    const metadata = user.publicMetadata as UserPublicMetadata
    return metadata.role === role
  })
}

/**
 * Initialize a new user with default role
 * Called from webhook when user signs up
 * @param userId The new user's ID
 * @param email The user's email (for role determination)
 */
export async function initializeUserRole(userId: string, email?: string): Promise<void> {
  const client = await clerkClient()
  
  // Determine initial role based on email domain or other criteria
  let initialRole: Roles = 'user'
  
  if (email) {
    // Admin domains
    if (email.endsWith('@awe.dev') || email.endsWith('@dukelic.com')) {
      initialRole = 'admin'
    }
    // Partner/developer domains
    else if (email.endsWith('@partner.com') || email.includes('+dev@')) {
      initialRole = 'developer'
    }
    // Beta testers
    else if (email.includes('+beta@')) {
      initialRole = 'moderator'
    }
  }
  
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      role: initialRole,
      tier: 'free',
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    }
  })
}

/**
 * Check if user has any of the specified roles
 * @param roles Array of roles to check
 * @returns True if user has any of the roles
 */
export async function hasAnyRole(roles: Roles[]): Promise<boolean> {
  const userRole = await getUserRole()
  return roles.includes(userRole)
}

/**
 * Check if user has all of the specified permissions
 * @param permissions Array of permissions to check
 * @returns True if user has all permissions
 */
export async function hasAllPermissions(permissions: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions()
  return permissions.every(p => userPermissions.includes(p))
}

/**
 * Check if user has any of the specified permissions
 * @param permissions Array of permissions to check
 * @returns True if user has any permission
 */
export async function hasAnyPermission(permissions: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions()
  return permissions.some(p => userPermissions.includes(p))
}