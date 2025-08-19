/**
 * Admin Users API
 * 
 * API endpoints for user management (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { protectApiRoute, getUserRoleById } from '../../../lib/auth/rbac'
import type { Roles } from '../../../types/globals'

/**
 * GET /api/admin/users
 * Get all users with their roles
 */
export async function GET(request: NextRequest) {
  // Require admin role
  const unauthorizedResponse = await protectApiRoute('admin')
  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  try {
    const client = await clerkClient()
    
    // Get search params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    const role = searchParams.get('role') as Roles | null
    const search = searchParams.get('search') || ''
    
    // Build query params for Clerk
    const queryParams: Record<string, unknown> = {
      limit,
      offset,
    }
    
    // Add search if provided
    if (search) {
      queryParams.query = search
    }
    
    // Fetch users from Clerk
    const { data: clerkUsers, totalCount } = await client.users.getUserList(queryParams)
    
    // Map users with their roles
    const users = await Promise.all(
      clerkUsers.map(async (user) => {
        const userRole = await getUserRoleById(user.id)
        const metadata = user.publicMetadata as Record<string, unknown>
        
        // Filter by role if specified
        if (role && userRole !== role) {
          return null
        }
        
        return {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          role: userRole,
          permissions: metadata.permissions || [],
          tier: metadata.tier || 'free',
          onboardingCompleted: metadata.onboardingCompleted || false,
          createdAt: user.createdAt,
          lastSignInAt: user.lastSignInAt,
          banned: user.banned,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          organizationMemberships: (user as unknown as Record<string, any>).organizationMemberships?.map((org: any) => ({
            id: org.id,
            role: org.role,
            organizationId: org.organization?.id,
            organizationName: org.organization?.name,
          })),
        }
      })
    )
    
    // Filter out nulls from role filtering
    const filteredUsers = users.filter(Boolean)
    
    const totalPages = Math.ceil((role ? filteredUsers.length : totalCount) / limit)
    
    return NextResponse.json({
      success: true,
      users: filteredUsers,
      totalCount: role ? filteredUsers.length : totalCount,
      totalPages,
      currentPage: page,
      limit,
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

/**
 * Internal helper function to get user statistics by role
 * Not exported as a route handler
 */
// Currently unused - will be implemented when statistics are needed
/* async function getUserStats() {
  // Require admin role
  const unauthorizedResponse = await protectApiRoute('admin')
  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  try {
    const client = await clerkClient()
    
    // Fetch all users
    const { data: users } = await client.users.getUserList({ limit: 500 })
    
    // Count users by role
    const stats: Record<Roles, number> = {
      admin: 0,
      moderator: 0,
      developer: 0,
      user: 0,
    }
    
    for (const user of users) {
      const userRole = await getUserRoleById(user.id)
      const roleKey = userRole as keyof typeof stats
      stats[roleKey]++
    }
    
    // Get additional stats
    const totalUsers = users.length
    const activeUsers = users.filter(u => {
      const lastActive = u.lastSignInAt
      if (!lastActive) return false
      const daysSinceActive = (Date.now() - lastActive) / (1000 * 60 * 60 * 24)
      return daysSinceActive < 30
    }).length
    
    const newUsers = users.filter(u => {
      const createdAt = u.createdAt
      const daysSinceCreated = (Date.now() - createdAt) / (1000 * 60 * 60 * 24)
      return daysSinceCreated < 7
    }).length
    
    return NextResponse.json({
      success: true,
      stats: {
        byRole: stats,
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
      }
    })
  } catch (error) {
    console.error('Failed to fetch user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    )
  }
} */