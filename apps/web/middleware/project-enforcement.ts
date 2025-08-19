import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Routes that require a project to be selected
const PROJECT_REQUIRED_ROUTES = [
  '/dashboard',
  '/recommendations',
  '/claude-md',
  '/analytics',
  '/admin/patterns',
  '/admin/knowledge'
]

// Routes that are exempt from project requirement
const PROJECT_EXEMPT_ROUTES = [
  '/projects',
  '/profile',
  '/organizations',
  '/admin/users',
  '/admin/config',
  '/test-api',
  '/sign-in',
  '/sign-up',
  '/'
]

export async function enforceProjectSelection(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Check if route requires project
  const requiresProject = PROJECT_REQUIRED_ROUTES.some(route => 
    pathname.startsWith(route)
  )
  
  const isExempt = PROJECT_EXEMPT_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route)
  )
  
  // If route doesn't require project or is exempt, continue
  if (!requiresProject || isExempt) {
    return NextResponse.next()
  }
  
  // Check if user is authenticated
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }
  
  // Check for project cookie (set by ProjectContext)
  const projectId = req.cookies.get('current_project')?.value
  
  if (!projectId) {
    // Redirect to project selection
    const redirectUrl = new URL('/projects', req.url)
    redirectUrl.searchParams.set('select', 'true')
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  return NextResponse.next()
}