import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  monitorSessionTokenSize, 
  getTokenSizeRecommendations,
  calculateTokenSize
} from '../../../../lib/auth/session-monitor'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated',
        solution: 'Sign in to test session token size'
      }, { status: 401 })
    }
    
    // Monitor current session token
    const report = await monitorSessionTokenSize()
    
    if (!report) {
      return NextResponse.json({
        error: 'No session claims found',
        solution: 'Ensure session token claims are configured in Clerk Dashboard'
      }, { status: 400 })
    }
    
    // Get optimization recommendations
    const recommendations = getTokenSizeRecommendations(report.claims)
    
    // Calculate sizes for different configurations
    const configurations = {
      current: calculateTokenSize(report.claims),
      minimal: calculateTokenSize({
        sub: sessionClaims?.sub,
        metadata: {
          role: (sessionClaims?.metadata as any)?.role || 'user',
        },
      }),
      withPermissions: calculateTokenSize({
        sub: sessionClaims?.sub,
        metadata: {
          role: (sessionClaims?.metadata as any)?.role || 'user',
          permissions: ['read', 'write', 'delete', 'admin'],
        },
      }),
      withOrganization: calculateTokenSize({
        sub: sessionClaims?.sub,
        org_id: 'org_123',
        org_role: 'admin',
        metadata: {
          role: (sessionClaims?.metadata as any)?.role || 'user',
        },
      }),
    }
    
    // Prepare response
    const response = {
      '📊 Current Session Token': {
        size: `${report.size} bytes`,
        sizeKB: `${report.sizeKB} KB`,
        status: report.isOverLimit ? '❌ OVER LIMIT' : report.warning ? '⚠️ WARNING' : '✅ OK',
        limit: '1.2 KB (Clerk recommended)',
      },
      '🔍 Token Breakdown': Object.entries(report.claims).reduce((acc, [key, value]) => {
        const valueSize = new TextEncoder().encode(JSON.stringify(value)).length
        acc[key] = `${valueSize} bytes`
        return acc
      }, {} as Record<string, string>),
      '📐 Size Comparisons': {
        current: `${configurations.current.sizeKB} KB ${configurations.current.isValid ? '✅' : '❌'}`,
        minimal: `${configurations.minimal.sizeKB} KB ${configurations.minimal.isValid ? '✅' : '❌'}`,
        withPermissions: `${configurations.withPermissions.sizeKB} KB ${configurations.withPermissions.isValid ? '✅' : '❌'}`,
        withOrganization: `${configurations.withOrganization.sizeKB} KB ${configurations.withOrganization.isValid ? '✅' : '❌'}`,
      },
      '💡 Recommendations': recommendations.length > 0 ? recommendations : ['Token size is optimal'],
      '🔧 Next Steps': report.isOverLimit ? [
        '1. Review session claims in Clerk Dashboard',
        '2. Remove unnecessary claims',
        '3. Store large data in database instead',
        '4. Use minimal metadata structure',
      ] : report.warning ? [
        'Consider optimizing session claims to prevent future issues',
      ] : [
        '✅ Session token size is within healthy limits',
      ],
    }
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token-Size': `${report.sizeKB}KB`,
        'X-Session-Token-Status': report.isOverLimit ? 'over-limit' : report.warning ? 'warning' : 'ok',
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to analyze session token',
      details: error instanceof Error ? error.message : 'Unknown error',
      solution: 'Check server logs for details'
    }, { status: 500 })
  }
}