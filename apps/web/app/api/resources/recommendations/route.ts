/**
 * Resource Recommendations API
 * Provides AI-powered resource recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ResourceManager } from '@awe/ai'
import { z } from 'zod'

const resourceManager = new ResourceManager()

// Validation schema
const RecommendationSchema = z.object({
  resourceId: z.string().optional(),
  projectId: z.string().optional(),
  recentResources: z.array(z.string()).max(10).optional(),
  limit: z.number().min(1).max(50).optional()
})

/**
 * GET /api/resources/recommendations
 * Get personalized resource recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const searchParams = request.nextUrl.searchParams

    // Parse parameters
    const params = {
      resourceId: searchParams.get('resourceId') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      recentResources: searchParams.get('recentResources')?.split(',') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10
    }

    // Validate parameters
    const validatedParams = RecommendationSchema.parse(params)

    // Get recommendations
    const recommendations = await resourceManager.getRecommendations(
      {
        userId: userId || undefined,
        projectId: validatedParams.projectId,
        resourceId: validatedParams.resourceId,
        recentResources: validatedParams.recentResources
      },
      validatedParams.limit || 10
    )

    // Track recommendation request
    if (userId) {
      await resourceManager.trackUsage('recommendations', 'view', {
        userId,
        metadata: {
          count: recommendations.length,
          context: validatedParams
        }
      })
    }

    return NextResponse.json({
      recommendations,
      total: recommendations.length
    })
  } catch (error) {
    console.error('Recommendation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/resources/recommendations/feedback
 * Provide feedback on recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { resourceId, action, feedback } = body

    // Track feedback
    await resourceManager.trackUsage(resourceId, `recommendation_${action}`, {
      userId,
      metadata: { feedback }
    })

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded'
    })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    )
  }
}