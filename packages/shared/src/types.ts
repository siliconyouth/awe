import { z } from 'zod'

// Core AWE Types
export const ProjectTypeSchema = z.enum([
  'web-app',
  'api',
  'cli',
  'library',
  'mobile',
  'desktop',
  'data-science',
  'ai-ml',
  'devops',
  'other'
])

export const FrameworkSchema = z.enum([
  'react',
  'next.js',
  'vue',
  'svelte',
  'angular',
  'express',
  'fastify',
  'nest.js',
  'django',
  'flask',
  'rails',
  'laravel',
  'spring',
  'dotnet',
  'other'
])

export const LanguageSchema = z.enum([
  'typescript',
  'javascript',
  'python',
  'java',
  'c#',
  'go',
  'rust',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'dart',
  'other'
])

// Project Analysis
export const ProjectAnalysisSchema = z.object({
  id: z.string(),
  path: z.string(),
  name: z.string(),
  type: ProjectTypeSchema,
  languages: z.array(LanguageSchema),
  frameworks: z.array(FrameworkSchema),
  dependencies: z.record(z.string()),
  fileCount: z.number(),
  codeComplexity: z.number().min(0).max(10),
  maintainabilityScore: z.number().min(0).max(10),
  testCoverage: z.number().min(0).max(100).optional(),
  performance: z.object({
    bundleSize: z.number().optional(),
    loadTime: z.number().optional(),
    lighthouse: z.number().min(0).max(100).optional()
  }).optional(),
  claudeIntegration: z.object({
    hasClaudeMd: z.boolean(),
    hasMemoryFile: z.boolean(),
    optimizationLevel: z.number().min(0).max(10)
  }),
  recommendations: z.array(z.object({
    type: z.enum(['performance', 'security', 'maintainability', 'testing', 'accessibility']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    title: z.string(),
    description: z.string(),
    effort: z.enum(['low', 'medium', 'high']),
    impact: z.enum(['low', 'medium', 'high'])
  })),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Template
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  type: ProjectTypeSchema,
  framework: FrameworkSchema.optional(),
  language: LanguageSchema,
  files: z.record(z.string()), // filename -> content
  metadata: z.object({
    author: z.string().optional(),
    version: z.string(),
    license: z.string().optional(),
    repository: z.string().optional(),
    documentation: z.string().optional()
  }),
  requirements: z.object({
    node: z.string().optional(),
    npm: z.string().optional(),
    dependencies: z.array(z.string()).optional()
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Configuration
export const ConfigSchema = z.object({
  supabase: z.object({
    url: z.string().url(),
    anonKey: z.string(),
    serviceKey: z.string().optional()
  }).optional(),
  performance: z.object({
    cacheSize: z.number().default(1000),
    maxConcurrency: z.number().default(10),
    apiTimeout: z.number().default(30000),
    retries: z.number().default(3)
  }).optional(),
  features: z.object({
    aiAnalysis: z.boolean().default(true),
    templateGeneration: z.boolean().default(true),
    backgroundSync: z.boolean().default(true),
    vectorSearch: z.boolean().default(true)
  }).optional(),
  privacy: z.object({
    telemetry: z.boolean().default(false),
    crashReporting: z.boolean().default(false)
  }).optional()
})

// Type exports
export type ProjectType = z.infer<typeof ProjectTypeSchema>
export type Framework = z.infer<typeof FrameworkSchema>
export type Language = z.infer<typeof LanguageSchema>
export type ProjectAnalysis = z.infer<typeof ProjectAnalysisSchema>
export type Template = z.infer<typeof TemplateSchema>
export type Config = z.infer<typeof ConfigSchema>

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
  }
  meta?: {
    timestamp: string
    requestId: string
    version: string
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}