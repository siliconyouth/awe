import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { Roles } from './types/globals';

// Define which routes should be protected
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/api/protected(.*)',
  '/api/user(.*)',
  '/api/session(.*)',
  '/test-api(.*)',
  '/profile(.*)',
  '/organizations(.*)',
  '/organization(.*)',
]);

// Define which routes require admin role
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
]);

// Define which routes require moderator role or higher
const isModeratorRoute = createRouteMatcher([
  '/moderator(.*)',
  '/api/moderator(.*)',
  '/reports(.*)',
]);

// Define which routes require developer role or higher
const isDeveloperRoute = createRouteMatcher([
  '/developer(.*)',
  '/api/developer(.*)',
  '/api/debug(.*)',
  '/logs(.*)',
]);

// Define which routes should be protected by rate limiting
const isScraperRoute = createRouteMatcher([
  '/api/scrape(.*)',
  '/api/monitor(.*)',
]);

// Role hierarchy for checking permissions
const ROLE_HIERARCHY: Record<Roles, number> = {
  admin: 100,
  moderator: 50,
  developer: 30,
  user: 10,
};

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  
  const { sessionClaims, orgRole, userId } = await auth();
  
  // Get user role from Clerk directly
  let userRole: Roles = 'user';
  let userLevel = ROLE_HIERARCHY.user;
  
  if (userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata = user.publicMetadata as any;
      userRole = metadata?.role || 'user';
      userLevel = ROLE_HIERARCHY[userRole] || 0;
    } catch (error) {
      console.error('Failed to fetch user in middleware:', error);
    }
  }
  
  // Check admin routes
  if (isAdminRoute(req)) {
    const requiredLevel = ROLE_HIERARCHY.admin;
    
    if (userLevel < requiredLevel && orgRole !== 'org:admin') {
      return NextResponse.json(
        { 
          error: 'Forbidden', 
          message: 'Admin role required',
          requiredRole: 'admin',
          currentRole: userRole
        },
        { status: 403 }
      );
    }
  }
  
  // Check moderator routes
  if (isModeratorRoute(req)) {
    const requiredLevel = ROLE_HIERARCHY.moderator;
    
    if (userLevel < requiredLevel) {
      return NextResponse.json(
        { 
          error: 'Forbidden', 
          message: 'Moderator role or higher required',
          requiredRole: 'moderator',
          currentRole: userRole
        },
        { status: 403 }
      );
    }
  }
  
  // Check developer routes
  if (isDeveloperRoute(req)) {
    const requiredLevel = ROLE_HIERARCHY.developer;
    
    if (userLevel < requiredLevel) {
      return NextResponse.json(
        { 
          error: 'Forbidden', 
          message: 'Developer role or higher required',
          requiredRole: 'developer',
          currentRole: userRole
        },
        { status: 403 }
      );
    }
  }
  
  // Add role and permissions to request headers for downstream use
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-role', userRole);
  requestHeaders.set('x-user-role-level', userLevel.toString());
  
  if (sessionClaims?.metadata?.permissions) {
    requestHeaders.set('x-user-permissions', JSON.stringify(sessionClaims.metadata.permissions));
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};