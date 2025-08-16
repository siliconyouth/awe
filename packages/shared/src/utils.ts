import type { ProjectType, Framework, Language } from './types'

/**
 * Utility functions shared across AWE workspace
 */

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
  return `${(ms / 3600000).toFixed(1)}h`
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase()
}

export function detectProjectType(dependencies: Record<string, string>): ProjectType {
  const deps = Object.keys(dependencies)
  
  if (deps.includes('react') || deps.includes('next')) return 'web-app'
  if (deps.includes('express') || deps.includes('fastify')) return 'api'
  if (deps.includes('commander') || deps.includes('yargs')) return 'cli'
  if (deps.includes('react-native') || deps.includes('expo')) return 'mobile'
  if (deps.includes('electron')) return 'desktop'
  if (deps.includes('pandas') || deps.includes('numpy')) return 'data-science'
  if (deps.includes('tensorflow') || deps.includes('pytorch')) return 'ai-ml'
  if (deps.includes('docker') || deps.includes('kubernetes')) return 'devops'
  
  return 'other'
}

export function detectFramework(dependencies: Record<string, string>): Framework {
  const deps = Object.keys(dependencies)
  
  if (deps.includes('next')) return 'next.js'
  if (deps.includes('react')) return 'react'
  if (deps.includes('vue')) return 'vue'
  if (deps.includes('svelte')) return 'svelte'
  if (deps.includes('@angular/core')) return 'angular'
  if (deps.includes('express')) return 'express'
  if (deps.includes('fastify')) return 'fastify'
  if (deps.includes('@nestjs/core')) return 'nest.js'
  
  return 'other'
}

export function detectLanguage(filename: string): Language {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'py':
      return 'python'
    case 'java':
      return 'java'
    case 'cs':
      return 'c#'
    case 'go':
      return 'go'
    case 'rs':
      return 'rust'
    case 'php':
      return 'php'
    case 'rb':
      return 'ruby'
    case 'swift':
      return 'swift'
    case 'kt':
      return 'kotlin'
    case 'dart':
      return 'dart'
    default:
      return 'other'
  }
}

export function calculateComplexity(code: string): number {
  // Simple complexity calculation based on cyclomatic complexity
  const complexityKeywords = [
    'if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'try',
    '&&', '||', '?', ':', 'function', 'class', 'async', 'await'
  ]
  
  let complexity = 1 // Base complexity
  
  for (const keyword of complexityKeywords) {
    const matches = code.match(new RegExp(`\\b${keyword}\\b`, 'g'))
    if (matches) {
      complexity += matches.length
    }
  }
  
  // Normalize to 0-10 scale
  return Math.min(10, Math.max(0, Math.log10(complexity + 1) * 3))
}

export function stripAnsiCodes(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '')
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(message)
    this.name = 'RetryError'
  }
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    attempts?: number
    delay?: number
    exponentialBackoff?: boolean
  } = {}
): Promise<T> {
  const { attempts = 3, delay = 1000, exponentialBackoff = true } = options
  
  let lastError: Error
  
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === attempts) {
        throw new RetryError(
          `Failed after ${attempts} attempts: ${lastError.message}`,
          attempts,
          lastError
        )
      }
      
      const waitTime = exponentialBackoff ? delay * Math.pow(2, attempt - 1) : delay
      await sleep(waitTime)
    }
  }
  
  throw lastError!
}