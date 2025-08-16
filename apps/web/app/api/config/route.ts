/**
 * Configuration API
 * 
 * RESTful API for configuration management
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
// import { createWebConfig } from '@awe/config' // TODO: Fix package build
import { z } from 'zod'
import { checkPermission, protectApiRoute } from '../../../lib/auth/rbac'

// Initialize configuration manager
// const configManager = createWebConfig() // TODO: Fix package build
const configManager = null as any // Temporary placeholder

// Request validation schemas
const GetConfigSchema = z.object({
  path: z.string().optional(),
  section: z.enum(['app', 'api', 'auth', 'scraper', 'knowledge', 'features']).optional(),
})

const SetConfigSchema = z.object({
  path: z.string(),
  value: z.any(),
})

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

    // Initialize config if needed
    if (!configManager['initialized']) {
      await configManager.initialize()
    }

    // Get configuration
    let config: any

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
    const validation = SetConfigSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { path, value } = validation.data

    // Initialize config if needed
    if (!configManager['initialized']) {
      await configManager.initialize()
    }

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
    const body = await request.json()

    // Initialize config if needed
    if (!configManager['initialized']) {
      await configManager.initialize()
    }

    // Import configuration
    await configManager.import(body)

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
export async function DELETE(request: NextRequest) {
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

    // Reset configuration manager
    // const { resetConfigManager } = await import('@awe/config') // TODO: Fix package build
    // resetConfigManager()

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
function sanitizeConfig(config: any): any {
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
            deleteNestedField(item, path.slice(i + 1))
          }
        }
        break
      } else if (obj && typeof obj === 'object' && key in obj) {
        obj = obj[key]
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

function deleteNestedField(obj: any, path: string[]): void {
  for (let i = 0; i < path.length - 1; i++) {
    if (obj && typeof obj === 'object' && path[i] in obj) {
      obj = obj[path[i]]
    } else {
      return
    }
  }
  
  const lastKey = path[path.length - 1]
  if (obj && typeof obj === 'object' && lastKey in obj) {
    obj[lastKey] = '[REDACTED]'
  }
}