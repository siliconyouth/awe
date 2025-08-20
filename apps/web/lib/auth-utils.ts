/**
 * Authentication Utilities
 * Helper functions for authentication and authorization
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@awe/database'

/**
 * Check if a user has a specific role
 */
export async function checkUserRole(userId: string, requiredRole: string): Promise<boolean> {
  try {
    // Get the user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    if (!user) {
      // User not found in database
      return false
    }

    // Check if user has the required role
    return user.role === requiredRole || user.role === 'admin'
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return null
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Ensure user exists in database (for webhook sync)
 */
export async function ensureUserExists(clerkId: string, email: string, firstName?: string, lastName?: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { clerkId }
    })

    if (existingUser) {
      return existingUser
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
        role: 'user',
        lastSignIn: new Date()
      }
    })

    return newUser
  } catch (error) {
    console.error('Error ensuring user exists:', error)
    return null
  }
}

/**
 * Check if the current request is from an admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return false
    }

    return checkUserRole(userId, 'admin')
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Require authentication or throw
 */
export async function requireAuth() {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  return userId
}

/**
 * Require admin role or throw
 */
export async function requireAdmin() {
  const userId = await requireAuth()
  const admin = await checkUserRole(userId, 'admin')
  
  if (!admin) {
    throw new Error('Forbidden - Admin access required')
  }

  return userId
}