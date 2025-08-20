import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@awe/database'
import { checkUserRole } from '@/lib/auth-utils'
import { cache } from '@/lib/upstash'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role
    const isAdmin = await checkUserRole(session.userId, 'admin')
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Try to get cached stats first
    const cacheKey = 'admin:stats'
    if (cache) {
      const cached = await cache.get(cacheKey)
      if (cached) {
        return NextResponse.json(cached)
      }
    }

    // Fetch real stats from database with error handling
    const [
      totalResources,
      verifiedResources,
      totalCollections,
      totalCategories,
      totalTags,
      totalUsers,
      activeUsersCount,
      totalProjects,
      totalPatterns
    ] = await Promise.all([
      // Resources count
      prisma.resource.count().catch(() => 0),
      
      // Verified resources (assuming verified = published status)
      prisma.resource.count({
        where: { status: 'PUBLISHED' }
      }).catch(() => 0),
      
      // Collections count
      prisma.collection.count().catch(() => 0),
      
      // Categories count
      prisma.category.count().catch(() => 0),
      
      // Tags count
      prisma.tag.count().catch(() => 0),
      
      // Total users
      prisma.user.count().catch(() => 0),
      
      // Active users (users who signed in within last 30 days)
      prisma.user.count({
        where: {
          lastSignIn: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }).catch(() => 0),
      
      // Total projects
      prisma.project.count().catch(() => 0),
      
      // Total patterns
      prisma.extractedPattern.count().catch(() => 0)
    ])

    // Calculate additional metrics
    const [
      recentDownloads,
      recentViews,
      avgQuality
    ] = await Promise.all([
      // Downloads (from telemetry events)
      prisma.telemetryEvent.count({
        where: {
          eventType: 'resource_download',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }).catch(() => 0),
      
      // Views (from telemetry events)
      prisma.telemetryEvent.count({
        where: {
          eventType: 'resource_view',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }).catch(() => 0),
      
      // Average quality score
      prisma.resource.aggregate({
        _avg: {
          quality: true
        },
        where: {
          status: 'PUBLISHED'
        }
      }).then(result => result._avg.quality || 0)
        .catch(() => 0)
    ])

    const stats = {
      // Resource stats
      totalResources,
      verifiedResources,
      totalCollections,
      totalCategories,
      totalTags,
      
      // User stats
      totalUsers,
      activeUsers: activeUsersCount,
      
      // Project stats
      totalProjects,
      totalPatterns,
      
      // Activity stats
      totalDownloads: recentDownloads,
      totalViews: recentViews,
      
      // Quality metrics
      avgQuality: Math.round(avgQuality * 100) / 100,
      
      // Additional computed stats
      verificationRate: totalResources > 0 
        ? Math.round((verifiedResources / totalResources) * 100) 
        : 0,
      activeUserRate: totalUsers > 0
        ? Math.round((activeUsersCount / totalUsers) * 100)
        : 0,
      
      // Timestamp
      lastUpdated: new Date().toISOString()
    }

    // Cache for 5 minutes
    if (cache) {
      await cache.set(cacheKey, stats, 300).catch(() => {
        // Ignore cache errors
      })
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Stats API error:', error)
    
    // Return safe default stats on error
    return NextResponse.json({
      totalResources: 0,
      verifiedResources: 0,
      totalCollections: 0,
      totalCategories: 0,
      totalTags: 0,
      totalUsers: 0,
      activeUsers: 0,
      totalProjects: 0,
      totalPatterns: 0,
      totalDownloads: 0,
      totalViews: 0,
      avgQuality: 0,
      verificationRate: 0,
      activeUserRate: 0,
      lastUpdated: new Date().toISOString(),
      error: 'Some metrics could not be loaded'
    })
  }
}