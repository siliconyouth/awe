export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export async function validateEnvironment(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check Node.js version
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
  
  if (majorVersion < 18) {
    errors.push(`Node.js ${nodeVersion} is not supported. Please use Node.js 18 or later.`)
  } else if (majorVersion < 22) {
    warnings.push(`Node.js ${nodeVersion} works but Node.js 22+ is recommended for best performance.`)
  }

  // Check for environment variables
  const requiredEnvVars = {
    optional: [
      'AWE_SUPABASE_URL',
      'AWE_SUPABASE_ANON_KEY',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    ]
  }

  const hasSupabaseConfig = requiredEnvVars.optional.some(envVar => process.env[envVar])
  
  if (!hasSupabaseConfig) {
    warnings.push('No Supabase configuration found. AWE will run in offline mode.')
    warnings.push('Run "awe config --setup" to configure cloud features.')
  }

  // Check for write permissions in current directory
  try {
    const fs = await import('fs/promises')
    await fs.access(process.cwd(), fs.constants.W_OK)
  } catch (error) {
    errors.push('No write permission in current directory')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}