/**
 * Role-Based Access Control (RBAC) System
 * 
 * This file defines how Clerk manages user roles and permissions in AWE.
 * 
 * HOW CLERK KNOWS USER ROLES:
 * 
 * 1. **Public Metadata**: Stored on the user object in Clerk Dashboard
 *    - Accessible on both frontend and backend
 *    - Set via Clerk Dashboard or API
 *    - Example: user.publicMetadata.role = "admin"
 * 
 * 2. **Private Metadata**: Stored securely, only accessible on backend
 *    - Used for sensitive permissions
 *    - Set via Clerk Dashboard or Backend API
 *    - Example: user.privateMetadata.permissions = ["delete_users"]
 * 
 * 3. **Organization Roles**: When using Clerk Organizations
 *    - Users can have different roles in different organizations
 *    - Built-in roles: admin, member
 *    - Custom roles can be defined
 * 
 * 4. **Custom Claims in JWT**: Added to session tokens
 *    - Set up in Clerk Dashboard → Sessions → Edit
 *    - Available in auth() responses
 */

import { z } from 'zod'

/**
 * User roles in the AWE system
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',  // Full system access
  ADMIN = 'admin',               // Administrative access
  MODERATOR = 'moderator',       // Content moderation access
  DEVELOPER = 'developer',       // Development features access
  USER = 'user',                 // Standard user access
  GUEST = 'guest'                // Limited guest access
}

/**
 * Permission definitions
 */
export enum Permission {
  // System permissions
  MANAGE_SYSTEM = 'manage_system',
  VIEW_SYSTEM_STATS = 'view_system_stats',
  MANAGE_CONFIG = 'manage_config',
  
  // User management
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',
  DELETE_USERS = 'delete_users',
  IMPERSONATE_USERS = 'impersonate_users',
  
  // Content management
  MANAGE_CONTENT = 'manage_content',
  MODERATE_CONTENT = 'moderate_content',
  PUBLISH_CONTENT = 'publish_content',
  DELETE_CONTENT = 'delete_content',
  
  // Knowledge base
  MANAGE_KNOWLEDGE = 'manage_knowledge',
  ADD_SOURCES = 'add_sources',
  DELETE_SOURCES = 'delete_sources',
  APPROVE_CHANGES = 'approve_changes',
  
  // Scraping
  MANAGE_SCRAPING = 'manage_scraping',
  RUN_SCRAPER = 'run_scraper',
  VIEW_SCRAPER_LOGS = 'view_scraper_logs',
  CONFIGURE_SCRAPER = 'configure_scraper',
  
  // API access
  API_FULL_ACCESS = 'api_full_access',
  API_READ_ACCESS = 'api_read_access',
  API_WRITE_ACCESS = 'api_write_access',
  
  // Features
  USE_ADVANCED_FEATURES = 'use_advanced_features',
  ACCESS_BETA_FEATURES = 'access_beta_features',
  MANAGE_FEATURE_FLAGS = 'manage_feature_flags',
}

/**
 * Role to permissions mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Super admin has all permissions
    ...Object.values(Permission)
  ],
  
  [UserRole.ADMIN]: [
    Permission.VIEW_SYSTEM_STATS,
    Permission.MANAGE_CONFIG,
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.MANAGE_CONTENT,
    Permission.MODERATE_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.MANAGE_KNOWLEDGE,
    Permission.ADD_SOURCES,
    Permission.DELETE_SOURCES,
    Permission.APPROVE_CHANGES,
    Permission.MANAGE_SCRAPING,
    Permission.RUN_SCRAPER,
    Permission.VIEW_SCRAPER_LOGS,
    Permission.CONFIGURE_SCRAPER,
    Permission.API_FULL_ACCESS,
    Permission.USE_ADVANCED_FEATURES,
    Permission.ACCESS_BETA_FEATURES,
    Permission.MANAGE_FEATURE_FLAGS,
  ],
  
  [UserRole.MODERATOR]: [
    Permission.VIEW_SYSTEM_STATS,
    Permission.VIEW_USERS,
    Permission.MODERATE_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.ADD_SOURCES,
    Permission.APPROVE_CHANGES,
    Permission.RUN_SCRAPER,
    Permission.VIEW_SCRAPER_LOGS,
    Permission.API_READ_ACCESS,
    Permission.API_WRITE_ACCESS,
    Permission.USE_ADVANCED_FEATURES,
  ],
  
  [UserRole.DEVELOPER]: [
    Permission.VIEW_SYSTEM_STATS,
    Permission.MANAGE_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.ADD_SOURCES,
    Permission.RUN_SCRAPER,
    Permission.VIEW_SCRAPER_LOGS,
    Permission.CONFIGURE_SCRAPER,
    Permission.API_FULL_ACCESS,
    Permission.USE_ADVANCED_FEATURES,
    Permission.ACCESS_BETA_FEATURES,
  ],
  
  [UserRole.USER]: [
    Permission.PUBLISH_CONTENT,
    Permission.RUN_SCRAPER,
    Permission.API_READ_ACCESS,
  ],
  
  [UserRole.GUEST]: [
    Permission.API_READ_ACCESS,
  ],
}

/**
 * User metadata schema for Clerk
 */
export const UserMetadataSchema = z.object({
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  permissions: z.array(z.nativeEnum(Permission)).optional(),
  organizationRoles: z.record(z.string(), z.nativeEnum(UserRole)).optional(),
  customPermissions: z.array(z.string()).optional(),
  tier: z.enum(['free', 'pro', 'enterprise']).default('free'),
  quotas: z.object({
    apiCalls: z.number().default(1000),
    scrapeRequests: z.number().default(100),
    knowledgeSources: z.number().default(10),
  }).optional(),
})

export type UserMetadata = z.infer<typeof UserMetadataSchema>

/**
 * Check if a user has a specific role
 */
export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 100,
    [UserRole.ADMIN]: 80,
    [UserRole.MODERATOR]: 60,
    [UserRole.DEVELOPER]: 50,
    [UserRole.USER]: 20,
    [UserRole.GUEST]: 10,
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userRole: UserRole | undefined,
  permission: Permission,
  customPermissions?: Permission[]
): boolean {
  if (!userRole) return false
  
  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  if (rolePermissions.includes(permission)) return true
  
  // Check custom permissions
  if (customPermissions && customPermissions.includes(permission)) return true
  
  return false
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Role display names
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrator',
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.MODERATOR]: 'Moderator',
  [UserRole.DEVELOPER]: 'Developer',
  [UserRole.USER]: 'User',
  [UserRole.GUEST]: 'Guest',
}

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Full system access with all permissions',
  [UserRole.ADMIN]: 'Administrative access to manage users and content',
  [UserRole.MODERATOR]: 'Can moderate content and manage knowledge sources',
  [UserRole.DEVELOPER]: 'Access to development features and API',
  [UserRole.USER]: 'Standard user with basic access',
  [UserRole.GUEST]: 'Limited guest access for viewing only',
}

/**
 * Permission display names
 */
export const PERMISSION_DISPLAY_NAMES: Partial<Record<Permission, string>> = {
  [Permission.MANAGE_SYSTEM]: 'Manage System',
  [Permission.MANAGE_USERS]: 'Manage Users',
  [Permission.MANAGE_CONTENT]: 'Manage Content',
  [Permission.MANAGE_KNOWLEDGE]: 'Manage Knowledge Base',
  [Permission.MANAGE_SCRAPING]: 'Manage Scraping',
  [Permission.API_FULL_ACCESS]: 'Full API Access',
}