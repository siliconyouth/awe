/**
 * AWE Authentication Package
 * 
 * Comprehensive authentication and authorization system using Clerk
 */

// Export role definitions and utilities
export {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  PERMISSION_DISPLAY_NAMES,
  UserMetadataSchema,
  type UserMetadata,
  hasRole,
  hasPermission,
  getRolePermissions,
} from './roles'

// Export Clerk helper functions
export {
  getCurrentUserRole,
  getUserRole,
  setUserRole,
  setUserPermissions,
  currentUserHasRole,
  currentUserHasPermission,
  requireRole,
  requirePermission,
  getUsersByRole,
  batchUpdateRoles,
  initializeUserRole,
  getUserOrganizationRoles,
  syncUserRoles,
} from './clerk-helpers'

// Export middleware utilities
export {
  createAuthMiddleware,
  withAuth,
  checkAuth,
  PROTECTED_ROUTES,
  type RouteProtection,
} from './middleware'

// Re-export commonly used Clerk utilities
export { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
export { useAuth, useUser, useClerk, SignIn, SignUp, UserButton } from '@clerk/nextjs'