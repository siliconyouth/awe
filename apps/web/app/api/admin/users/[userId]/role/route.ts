/**
 * Admin User Role API
 * 
 * API endpoint for updating individual user roles
 */

import { NextRequest, NextResponse } from 'next/server'
import { setUserRole, setUserPermissions, protectApiRoute } from '../../../../../../lib/auth/rbac'
import { z } from 'zod'

// Validation schema
const UpdateRoleSchema = z.object({
  role: z.enum(['admin', 'moderator', 'developer', 'user']),
  permissions: z.array(z.string()).optional(),
})

interface RouteParams {
  params: Promise<{
    userId: string
  }>
}

/**
 * PUT /api/admin/users/[userId]/role
 * Update a user's role and permissions
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  // Require admin role
  const unauthorizedResponse = await protectApiRoute('admin')
  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  try {
    const { userId } = await params
    
    // Parse and validate request body
    const body = await request.json()
    const validation = UpdateRoleSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: validation.error.issues 
        },
        { status: 400 }
      )
    }
    
    const { role, permissions } = validation.data
    
    // Update user role
    await setUserRole(userId, role)
    
    // Update custom permissions if provided
    if (permissions && permissions.length > 0) {
      await setUserPermissions(userId, permissions)
    }
    
    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
      userId,
      role,
      permissions,
    })
  } catch (error) {
    console.error('Failed to update user role:', error)
    
    if (error instanceof Error && error.message.includes('Only admins')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/users/[userId]/role
 * Get a user's current role and permissions
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  // Require admin role
  const unauthorizedResponse = await protectApiRoute('admin')
  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  try {
    const { userId } = await params
    
    // Get user role and metadata
    const { getUserRoleById } = await import('../../../../../../lib/auth/rbac')
    const { clerkClient } = await import('@clerk/nextjs/server')
    
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const role = await getUserRoleById(userId)
    const metadata = user.publicMetadata as Record<string, unknown>
    
    return NextResponse.json({
      success: true,
      userId,
      role,
      permissions: metadata.permissions || [],
      tier: metadata.tier || 'free',
      metadata: {
        onboardingCompleted: metadata.onboardingCompleted || false,
        preferences: metadata.preferences || {},
      }
    })
  } catch (error) {
    console.error('Failed to fetch user role:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user role' },
      { status: 500 }
    )
  }
}