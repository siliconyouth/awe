/**
 * Client-side hooks for RBAC
 * 
 * React hooks for role and permission checking in components
 */

'use client'

import { useAuth } from '@clerk/nextjs'
import type { Roles } from '../../types/globals'

/**
 * Role hierarchy for client-side checking
 */
const ROLE_HIERARCHY: Record<Roles, number> = {
  admin: 100,
  moderator: 50,
  developer: 30,
  user: 10,
}

/**
 * Permission definitions for each role
 */
const ROLE_PERMISSIONS: Record<Roles, string[]> = {
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
 * Hook to get the current user's role
 */
export function useRole(): Roles {
  const { sessionClaims } = useAuth()
  // Check both possible locations for the role
  const role = (sessionClaims?.metadata?.role || 
                sessionClaims?.publicMetadata?.role || 
                sessionClaims?.role) as Roles
  return role || 'user'
}

/**
 * Hook to check if user has a specific role or higher
 */
export function useHasRole(requiredRole: Roles): boolean {
  const { sessionClaims } = useAuth()
  // Check both possible locations for the role
  const userRole = (sessionClaims?.metadata?.role || 
                    sessionClaims?.publicMetadata?.role || 
                    sessionClaims?.role) as Roles || 'user'
  
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(roles: Roles[]): boolean {
  const userRole = useRole()
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  
  return roles.some(role => {
    const requiredLevel = ROLE_HIERARCHY[role] || 0
    return userLevel >= requiredLevel
  })
}

/**
 * Hook to get user's permissions
 */
export function usePermissions(): string[] {
  const { sessionClaims } = useAuth()
  // Check both possible locations for the role
  const userRole = (sessionClaims?.metadata?.role || 
                    sessionClaims?.publicMetadata?.role || 
                    sessionClaims?.role) as Roles || 'user'
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  const customPermissions = sessionClaims?.metadata?.permissions || 
                           sessionClaims?.publicMetadata?.permissions || []
  
  return [...new Set([...rolePermissions, ...customPermissions])]
}

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(permission: string): boolean {
  const permissions = usePermissions()
  return permissions.includes(permission)
}

/**
 * Hook to check if user has all specified permissions
 */
export function useHasAllPermissions(requiredPermissions: string[]): boolean {
  const permissions = usePermissions()
  return requiredPermissions.every(p => permissions.includes(p))
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useHasAnyPermission(requiredPermissions: string[]): boolean {
  const permissions = usePermissions()
  return requiredPermissions.some(p => permissions.includes(p))
}

/**
 * Hook to get role display information
 */
export function useRoleInfo() {
  const role = useRole()
  
  const roleInfo = {
    admin: {
      label: 'Administrator',
      color: 'red',
      description: 'Full system access and control',
    },
    moderator: {
      label: 'Moderator',
      color: 'yellow',
      description: 'Content moderation and user management',
    },
    developer: {
      label: 'Developer',
      color: 'blue',
      description: 'Advanced features and API access',
    },
    user: {
      label: 'User',
      color: 'gray',
      description: 'Standard access to core features',
    },
  }
  
  return roleInfo[role] || roleInfo.user
}

/**
 * Hook for conditional rendering based on role
 */
export function useRoleAccess(requiredRole: Roles) {
  const hasRole = useHasRole(requiredRole)
  const { isLoaded } = useAuth()
  
  return {
    hasAccess: hasRole,
    isLoading: !isLoaded,
    canView: hasRole,
    canEdit: hasRole && (requiredRole === 'admin' || requiredRole === 'moderator'),
    canDelete: hasRole && requiredRole === 'admin',
  }
}