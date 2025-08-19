/**
 * Session Token Size Monitoring
 * 
 * Monitors JWT session token size to ensure it stays under limits.
 * Clerk recommends keeping session tokens under 1.2KB to avoid issues.
 */

import { auth } from '@clerk/nextjs/server'

interface TokenSizeReport {
  size: number
  sizeKB: number
  isOverLimit: boolean
  warning: boolean
  claims: Record<string, unknown>
}

/**
 * Monitor session token size
 * Logs warnings if token size exceeds recommended limits
 */
export async function monitorSessionTokenSize(): Promise<TokenSizeReport | null> {
  try {
    const { sessionClaims } = await auth()
    
    if (!sessionClaims) {
      return null
    }
    
    // Calculate token size
    const tokenString = JSON.stringify(sessionClaims)
    const tokenSize = new TextEncoder().encode(tokenString).length
    const tokenSizeKB = tokenSize / 1024
    
    // Thresholds
    const WARNING_THRESHOLD_KB = 1.0 // Warn at 1KB
    const ERROR_THRESHOLD_KB = 1.2   // Error at 1.2KB (Clerk recommended limit)
    
    const report: TokenSizeReport = {
      size: tokenSize,
      sizeKB: parseFloat(tokenSizeKB.toFixed(2)),
      isOverLimit: tokenSizeKB > ERROR_THRESHOLD_KB,
      warning: tokenSizeKB > WARNING_THRESHOLD_KB,
      claims: sessionClaims,
    }
    
    // Log warnings
    if (report.isOverLimit) {
      console.error(`❌ Session token size (${report.sizeKB}KB) exceeds recommended limit (${ERROR_THRESHOLD_KB}KB)`)
      console.error('Consider reducing session claims to improve performance')
      console.error('Large tokens can cause:', [
        '- Increased network overhead',
        '- Cookie size limit issues',
        '- Performance degradation',
        '- Request header size limit problems',
      ])
    } else if (report.warning) {
      console.warn(`⚠️ Session token size (${report.sizeKB}KB) approaching limit (${ERROR_THRESHOLD_KB}KB)`)
    }
    
    // In development, log detailed breakdown
    if (process.env.NODE_ENV === 'development' && report.warning) {
      console.log('Session claims breakdown:')
      Object.entries(sessionClaims).forEach(([key, value]) => {
        const valueSize = new TextEncoder().encode(JSON.stringify(value)).length
        console.log(`  ${key}: ${valueSize} bytes`)
      })
    }
    
    return report
  } catch (error) {
    console.error('Failed to monitor session token size:', error)
    return null
  }
}

/**
 * Middleware to monitor session token size on each request
 */
export async function sessionSizeMiddleware(request: Request) {
  // Only monitor in development or if explicitly enabled
  if (process.env.NODE_ENV === 'development' || process.env.MONITOR_SESSION_SIZE === 'true') {
    const report = await monitorSessionTokenSize()
    
    // Add custom header with token size for debugging
    if (report) {
      const headers = new Headers()
      headers.set('X-Session-Token-Size', `${report.sizeKB}KB`)
      headers.set('X-Session-Token-Warning', report.warning ? 'true' : 'false')
      
      // Log to monitoring service in production
      if (process.env.NODE_ENV === 'production' && report.isOverLimit) {
        // TODO: Send to monitoring service (e.g., Sentry, DataDog)
        console.error('Session token size limit exceeded', {
          size: report.sizeKB,
          userId: report.claims.sub,
        })
      }
    }
  }
}

/**
 * Get recommendations for reducing session token size
 */
export function getTokenSizeRecommendations(claims: Record<string, unknown>): string[] {
  const recommendations: string[] = []
  
  // Check for large metadata
  if (claims.metadata) {
    const metadataSize = new TextEncoder().encode(JSON.stringify(claims.metadata)).length
    if (metadataSize > 500) {
      recommendations.push('Consider reducing metadata stored in session claims')
      recommendations.push('Store large data in database and reference by ID')
    }
  }
  
  // Check for unnecessary claims
  const unnecessaryClaims = ['picture', 'given_name', 'family_name']
  const presentUnnecessary = unnecessaryClaims.filter(claim => claim in claims)
  if (presentUnnecessary.length > 0) {
    recommendations.push(`Consider removing unnecessary claims: ${presentUnnecessary.join(', ')}`)
  }
  
  // Check for arrays in claims
  Object.entries(claims).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 10) {
      recommendations.push(`Consider reducing array size in claim '${key}' (currently ${value.length} items)`)
    }
  })
  
  return recommendations
}

/**
 * Utility to test token size with different claim configurations
 */
export function calculateTokenSize(claims: Record<string, unknown>): {
  size: number
  sizeKB: number
  isValid: boolean
} {
  const tokenString = JSON.stringify(claims)
  const size = new TextEncoder().encode(tokenString).length
  const sizeKB = size / 1024
  
  return {
    size,
    sizeKB: parseFloat(sizeKB.toFixed(2)),
    isValid: sizeKB <= 1.2,
  }
}