import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define which routes should be protected
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/api/protected(.*)',
  '/api/user(.*)',
  '/api/session(.*)',
  '/test-api(.*)',
]);

// Define which routes require admin role
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
]);

// Define which routes should be protected by rate limiting
const isScraperRoute = createRouteMatcher([
  '/api/scrape(.*)',
  '/api/monitor(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  
  // Additional protection for admin routes
  if (isAdminRoute(req)) {
    const { sessionClaims, orgRole } = await auth();
    
    const isAdmin = sessionClaims?.metadata?.role === 'admin' || 
                    orgRole === 'org:admin';
    
    if (!isAdmin) {
      // Return 403 Forbidden for non-admin users
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};