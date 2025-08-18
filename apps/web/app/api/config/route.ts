/**
 * Configuration API
 * 
 * RESTful API for configuration management
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
// TODO: Fix type declarations in @awe/config package
// import { createWebConfig } from '@awe/config'
// import { z } from 'zod'
import { checkPermission, protectApiRoute } from '../../../lib/auth/rbac'

// Temporary simplified mock - config package has type issues that need fixing
const createWebConfig = () => ({
  initialize: async () => {},
  get: (path?: string) => path ? {} : {},
  set: async (_path: string, _value: unknown) => {},
  getApp: () => ({}),
  getApi: () => ({}),
  getAuth: () => ({}),
  getScraper: () => ({}),
  getKnowledge: () => ({}),
  getFeatures: () => ({}),
  getEnvironment: () => 'development' as const,
  import: async (_data: unknown) => {},
  reload: async () => {}
})

// Initialize configuration manager
const configManager = createWebConfig()

/**
 * GET /api/config
 * Get configuration values
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - viewing config requires proper permissions
    const hasViewPermission = await checkPermission('config.view')
    if (!hasViewPermission) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'config.view permission required' },
        { status: 403 }
      )
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || undefined
    const section = searchParams.get('section') || undefined

    // Initialize config
    await configManager.initialize()

    // Get configuration
    let config: Record<string, unknown>

    if (section) {
      // Get specific section
      switch (section) {
        case 'app':
          config = configManager.getApp()
          break
        case 'api':
          config = configManager.getApi()
          break
        case 'auth':
          config = configManager.getAuth()
          break
        case 'scraper':
          config = configManager.getScraper()
          break
        case 'knowledge':
          config = configManager.getKnowledge()
          break
        case 'features':
          config = configManager.getFeatures()
          break
        default:
          config = configManager.get(path)
      }
    } else if (path) {
      // Get by path
      config = configManager.get(path)
    } else {
      // Get all config (sanitized)
      config = sanitizeConfig(configManager.get())
    }

    return NextResponse.json({
      success: true,
      data: config,
      environment: configManager.getEnvironment(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Config GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/config
 * Update configuration values
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - editing config requires admin or specific permission
    const hasEditPermission = await checkPermission('config.edit')
    if (!hasEditPermission) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'config.edit permission required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { path, value } = body

    // Initialize config
    await configManager.initialize()

    // Update configuration
    await configManager.set(path, value)

    return NextResponse.json({
      success: true,
      message: 'Configuration updated',
      path,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Config POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/config
 * Import complete configuration
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - importing config requires admin role
    const unauthorizedResponse = await protectApiRoute('admin')
    if (unauthorizedResponse) {
      return unauthorizedResponse
    }

    // Parse request body
    const configData = await request.json()

    // Initialize config
    await configManager.initialize()

    // Import configuration
    await configManager.import(configData)

    return NextResponse.json({
      success: true,
      message: 'Configuration imported',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Config PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to import configuration' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/config
 * Reset configuration to defaults
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function DELETE(_request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - resetting config requires admin role
    const unauthorizedResponse = await protectApiRoute('admin')
    if (unauthorizedResponse) {
      return unauthorizedResponse
    }

    // Reload configuration to defaults
    await configManager.reload()

    return NextResponse.json({
      success: true,
      message: 'Configuration reset to defaults',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Config DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to reset configuration' },
      { status: 500 }
    )
  }
}

/**
 * Sanitize configuration for client
 * Remove sensitive values
 */
function sanitizeConfig(config: Record<string, unknown>): Record<string, unknown> {
  const sanitized = JSON.parse(JSON.stringify(config))

  // Remove sensitive fields
  const sensitiveFields = [
    'database.url',
    'database.directUrl',
    'auth.clerk.secretKey',
    'auth.clerk.webhookSecret',
    'auth.session.secret',
    'auth.jwt.secret',
    'email.smtp.auth',
    'email.sendgrid.apiKey',
    'email.ses.accessKeyId',
    'email.ses.secretAccessKey',
    'email.mailgun.apiKey',
    'scraper.proxy.proxies',
    'scraper.cloudBrowser.browserless.apiKey',
    'knowledge.sources.*.authentication.credentials',
  ]

  for (const field of sensitiveFields) {
    const path = field.split('.')
    let obj = sanitized
    
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i]
      
      if (key === '*') {
        // Handle array/object wildcards
        if (Array.isArray(obj)) {
          for (const item of obj) {
            deleteNestedField(item, path.slice(i + 1))
          }
        } else if (typeof obj === 'object' && obj !== null) {
          for (const item of Object.values(obj)) {
            deleteNestedField(item as Record<string, unknown>, path.slice(i + 1))
          }
        }
        break
      } else if (obj && typeof obj === 'object' && key in obj) {
        obj = obj[key] as Record<string, unknown>
      } else {
        break
      }
    }
    
    // Delete the final field
    const lastKey = path[path.length - 1]
    if (obj && typeof obj === 'object' && lastKey in obj) {
      obj[lastKey] = '[REDACTED]'
    }
  }

  return sanitized
}

function deleteNestedField(obj: Record<string, unknown>, path: string[]): void {
  for (let i = 0; i < path.length - 1; i++) {
    if (obj && typeof obj === 'object' && path[i] in obj) {
      obj = obj[path[i]] as Record<string, unknown>
    } else {
      return
    }
  }
  
  const lastKey = path[path.length - 1]
  if (obj && typeof obj === 'object' && lastKey in obj) {
    obj[lastKey] = '[REDACTED]'
  }
}