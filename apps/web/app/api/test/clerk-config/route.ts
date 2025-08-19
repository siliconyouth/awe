import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get current session
    const { userId, sessionClaims, orgRole } = await auth()
    
    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated',
        solution: 'Sign in first'
      }, { status: 401 })
    }

    // Get user details
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Cast metadata to any for flexible access
    const sessionMetadata = sessionClaims?.metadata as any
    const publicMetadata = user.publicMetadata as any
    
    // Check configuration
    const config = {
      '✅ Authentication': {
        userId,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      '🔐 Session Claims': {
        hasMetadata: !!sessionMetadata,
        role: sessionMetadata?.role || '❌ NOT IN SESSION - Configure session claims!',
        permissions: sessionMetadata?.permissions,
        tier: sessionMetadata?.tier,
      },
      '👤 Public Metadata': {
        role: publicMetadata?.role || '❌ NOT SET - Set in Clerk Dashboard',
        tier: publicMetadata?.tier,
        onboardingCompleted: publicMetadata?.onboardingCompleted,
      },
      '🏢 Organization': {
        orgRole: orgRole || 'Not in organization',
      },
      '⚙️ Configuration Status': {
        sessionClaimsConfigured: !!sessionMetadata?.role,
        publicMetadataSet: !!publicMetadata?.role,
        webhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
        publishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      },
      '🔧 Next Steps': []
    }

    // Add recommendations
    const nextSteps = config['🔧 Next Steps'] as string[]
    
    if (!sessionMetadata?.role) {
      nextSteps.push('1. Configure session token claims in Clerk Dashboard → Sessions → Edit session token')
    }
    
    if (!publicMetadata?.role) {
      nextSteps.push('2. Set user role in Clerk Dashboard → Users → [Your User] → Metadata → Public')
    }
    
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      nextSteps.push('3. Configure webhook secret in .env.local')
    }
    
    if (nextSteps.length === 0) {
      nextSteps.push('✅ Everything is configured correctly!')
    }

    return NextResponse.json(config, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Configuration check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      solution: 'Check server logs for details'
    }, { status: 500 })
  }
}