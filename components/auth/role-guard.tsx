/**
 * Role-based access control components
 * 
 * Components for conditional rendering based on user roles and permissions
 */

'use client'

import { ReactNode } from 'react'
import { useHasRole, useHasPermission, useHasAnyRole, useHasAllPermissions } from '@/lib/auth/hooks'
import type { Roles } from '@/types/globals'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Lock } from 'lucide-react'

interface RoleGuardProps {
  children: ReactNode
  role: Roles
  fallback?: ReactNode
  showError?: boolean
}

/**
 * Component that only renders children if user has the required role
 */
export function RoleGuard({ 
  children, 
  role, 
  fallback = null,
  showError = false 
}: RoleGuardProps) {
  const hasRole = useHasRole(role)
  
  if (hasRole) {
    return <>{children}</>
  }
  
  if (showError) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You need {role} role or higher to access this content.
        </AlertDescription>
      </Alert>
    )
  }
  
  return <>{fallback}</>
}

interface MultiRoleGuardProps {
  children: ReactNode
  roles: Roles[]
  requireAll?: boolean
  fallback?: ReactNode
  showError?: boolean
}

/**
 * Component that renders based on multiple roles
 */
export function MultiRoleGuard({ 
  children, 
  roles, 
  requireAll = false,
  fallback = null,
  showError = false 
}: MultiRoleGuardProps) {
  const hasAnyRole = useHasAnyRole(roles)
  
  // For requireAll, we need to check each role individually
  const hasAllRoles = requireAll ? 
    roles.every(role => useHasRole(role)) : 
    hasAnyRole
  
  if (requireAll ? hasAllRoles : hasAnyRole) {
    return <>{children}</>
  }
  
  if (showError) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You need {requireAll ? 'all of' : 'one of'} these roles to access this content: {roles.join(', ')}
        </AlertDescription>
      </Alert>
    )
  }
  
  return <>{fallback}</>
}

interface PermissionGuardProps {
  children: ReactNode
  permission: string
  fallback?: ReactNode
  showError?: boolean
}

/**
 * Component that only renders children if user has the required permission
 */
export function PermissionGuard({ 
  children, 
  permission, 
  fallback = null,
  showError = false 
}: PermissionGuardProps) {
  const hasPermission = useHasPermission(permission)
  
  if (hasPermission) {
    return <>{children}</>
  }
  
  if (showError) {
    return (
      <Alert variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this content.
        </AlertDescription>
      </Alert>
    )
  }
  
  return <>{fallback}</>
}

interface MultiPermissionGuardProps {
  children: ReactNode
  permissions: string[]
  requireAll?: boolean
  fallback?: ReactNode
  showError?: boolean
}

/**
 * Component that renders based on multiple permissions
 */
export function MultiPermissionGuard({ 
  children, 
  permissions, 
  requireAll = false,
  fallback = null,
  showError = false 
}: MultiPermissionGuardProps) {
  const hasAllPermissions = useHasAllPermissions(permissions)
  const hasAnyPermission = permissions.some(p => useHasPermission(p))
  
  const hasAccess = requireAll ? hasAllPermissions : hasAnyPermission
  
  if (hasAccess) {
    return <>{children}</>
  }
  
  if (showError) {
    return (
      <Alert variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          You need {requireAll ? 'all of' : 'one of'} these permissions to access this content.
        </AlertDescription>
      </Alert>
    )
  }
  
  return <>{fallback}</>
}

/**
 * Admin-only component wrapper
 */
export function AdminOnly({ 
  children, 
  fallback = null,
  showError = false 
}: Omit<RoleGuardProps, 'role'>) {
  return (
    <RoleGuard role="admin" fallback={fallback} showError={showError}>
      {children}
    </RoleGuard>
  )
}

/**
 * Moderator-only component wrapper (includes admin)
 */
export function ModeratorOnly({ 
  children, 
  fallback = null,
  showError = false 
}: Omit<RoleGuardProps, 'role'>) {
  return (
    <RoleGuard role="moderator" fallback={fallback} showError={showError}>
      {children}
    </RoleGuard>
  )
}

/**
 * Developer-only component wrapper (includes admin)
 */
export function DeveloperOnly({ 
  children, 
  fallback = null,
  showError = false 
}: Omit<RoleGuardProps, 'role'>) {
  return (
    <RoleGuard role="developer" fallback={fallback} showError={showError}>
      {children}
    </RoleGuard>
  )
}

/**
 * Component for showing different content based on role
 */
interface RoleSwitchProps {
  admin?: ReactNode
  moderator?: ReactNode
  developer?: ReactNode
  user?: ReactNode
  fallback?: ReactNode
}

export function RoleSwitch({ 
  admin, 
  moderator, 
  developer, 
  user, 
  fallback = null 
}: RoleSwitchProps) {
  // Check roles from highest to lowest priority
  if (admin && useHasRole('admin')) {
    return <>{admin}</>
  }
  
  if (moderator && useHasRole('moderator')) {
    return <>{moderator}</>
  }
  
  if (developer && useHasRole('developer')) {
    return <>{developer}</>
  }
  
  if (user && useHasRole('user')) {
    return <>{user}</>
  }
  
  return <>{fallback}</>
}