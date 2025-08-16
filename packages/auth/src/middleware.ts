/**
 * Authentication Middleware
 * 
 * Protects routes based on user roles and permissions
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { UserRole, Permission, hasRole, hasPermission, UserMetadataSchema } from './roles'

/**
 * Route protection configuration
 */
export interface RouteProtection {
  path: string | RegExp
  role?: UserRole
  permissions?: Permission[]
  requireAll?: boolean // Require all permissions vs any permission
  redirect?: string    // Where to redirect if unauthorized
}

/**
 * Default protected routes configuration
 */
export const PROTECTED_ROUTES: RouteProtection[] = [
  // Admin routes
  {
    path: /^\/admin/,
    role: UserRole.ADMIN,
    redirect: '/unauthorized'
  },
  
  // API routes with specific permissions
  {
    path: '/api/config',
    permissions: [Permission.MANAGE_CONFIG],
    redirect: '/api/unauthorized'
  },
  
  {
    path: '/api/users',
    permissions: [Permission.MANAGE_USERS, Permission.VIEW_USERS],
    requireAll: false,
    redirect: '/api/unauthorized'
  },
  
  {
    path: '/api/scraper/run',
    permissions: [Permission.RUN_SCRAPER],
    redirect: '/api/unauthorized'
  },
  
  {
    path: '/api/knowledge/sources',
    permissions: [Permission.MANAGE_KNOWLEDGE, Permission.ADD_SOURCES],
    requireAll: false,
    redirect: '/api/unauthorized'
  },
  
  // Dashboard routes
  {
    path: '/dashboard/admin',
    role: UserRole.ADMIN,
    redirect: '/dashboard'
  },
  
  {
    path: '/dashboard/moderator',
    role: UserRole.MODERATOR,
    redirect: '/dashboard'
  },
  
  // Development routes
  {
    path: /^\/dev/,
    role: UserRole.DEVELOPER,
    redirect: '/unauthorized'
  },
]

/**
 * Create auth middleware for route protection
 */
export function createAuthMiddleware(customRoutes?: RouteProtection[]) {
  const routes = customRoutes || PROTECTED_ROUTES
  
  return async function authMiddleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    
    // Find matching route protection
    const protection = routes.find(route => {
      if (typeof route.path === 'string') {
        return pathname === route.path || pathname.startsWith(route.path)
      } else {
        return route.path.test(pathname)
      }
    })
    
    // If no protection required, continue
    if (!protection) {
      return NextResponse.next()
    }
    
    // Get auth session
    const { userId, sessionClaims } = await auth()
    
    // If not authenticated, redirect to sign in
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('redirect_url', pathname)
      return NextResponse.redirect(signInUrl)
    }
    
    // Parse user metadata from session claims
    const metadata = UserMetadataSchema.safeParse(sessionClaims?.publicMetadata || {})
    const userRole = metadata.success ? metadata.data.role : UserRole.USER
    const userPermissions = metadata.success ? metadata.data.permissions : []
    
    // Check role requirement
    if (protection.role && !hasRole(userRole, protection.role)) {
      const redirectUrl = new URL(protection.redirect || '/unauthorized', request.url)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Check permission requirements
    if (protection.permissions && protection.permissions.length > 0) {
      const hasRequiredPermissions = protection.requireAll
        ? protection.permissions.every(p => hasPermission(userRole, p, userPermissions))
        : protection.permissions.some(p => hasPermission(userRole, p, userPermissions))
      
      if (!hasRequiredPermissions) {
        const redirectUrl = new URL(protection.redirect || '/unauthorized', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }
    
    // Add user info to headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', userId)
    requestHeaders.set('x-user-role', userRole)
    requestHeaders.set('x-user-permissions', JSON.stringify(userPermissions || []))
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
}

/**
 * API route handler wrapper with auth
 */
export function withAuth<T extends any[], R>(
  handler: (...args: T) => R | Promise<R>,
  options?: {
    role?: UserRole
    permissions?: Permission[]
    requireAll?: boolean
  }
) {
  return async function (...args: T): Promise<R | NextResponse> {
    try {
      const { userId, sessionClaims } = await auth()
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized: Authentication required' },
          { status: 401 }
        )
      }
      
      if (options) {
        const metadata = UserMetadataSchema.safeParse(sessionClaims?.publicMetadata || {})
        const userRole = metadata.success ? metadata.data.role : UserRole.USER
        const userPermissions = metadata.success ? metadata.data.permissions : []
        
        // Check role
        if (options.role && !hasRole(userRole, options.role)) {
          return NextResponse.json(
            { error: `Unauthorized: ${options.role} role required` },
            { status: 403 }
          )
        }
        
        // Check permissions
        if (options.permissions && options.permissions.length > 0) {
          const hasRequiredPermissions = options.requireAll
            ? options.permissions.every(p => hasPermission(userRole, p, userPermissions))
            : options.permissions.some(p => hasPermission(userRole, p, userPermissions))
          
          if (!hasRequiredPermissions) {
            return NextResponse.json(
              { error: 'Unauthorized: Insufficient permissions' },
              { status: 403 }
            )
          }
        }
      }
      
      return await handler(...args)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * React Server Component auth check
 */
export async function checkAuth(options?: {
  role?: UserRole
  permissions?: Permission[]
  requireAll?: boolean
}): Promise<{ authorized: boolean; userId?: string; role?: UserRole }> {
  try {
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return { authorized: false }
    }
    
    if (!options) {
      return { authorized: true, userId }
    }
    
    const metadata = UserMetadataSchema.safeParse(sessionClaims?.publicMetadata || {})
    const userRole = metadata.success ? metadata.data.role : UserRole.USER
    const userPermissions = metadata.success ? metadata.data.permissions : []
    
    // Check role
    if (options.role && !hasRole(userRole, options.role)) {
      return { authorized: false, userId, role: userRole }
    }
    
    // Check permissions
    if (options.permissions && options.permissions.length > 0) {
      const hasRequiredPermissions = options.requireAll
        ? options.permissions.every(p => hasPermission(userRole, p, userPermissions))
        : options.permissions.some(p => hasPermission(userRole, p, userPermissions))
      
      if (!hasRequiredPermissions) {
        return { authorized: false, userId, role: userRole }
      }
    }
    
    return { authorized: true, userId, role: userRole }
  } catch (error) {
    console.error('Auth check error:', error)
    return { authorized: false }
  }
}