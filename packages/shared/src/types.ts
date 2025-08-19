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

// Resource Management Types
export enum ResourceType {
  PATTERN = 'PATTERN',
  SNIPPET = 'SNIPPET',
  HOOK = 'HOOK',
  AGENT = 'AGENT',
  TEMPLATE = 'TEMPLATE',
  GUIDE = 'GUIDE',
  TOOL = 'TOOL',
  CONFIG = 'CONFIG',
  WORKFLOW = 'WORKFLOW',
  INTEGRATION = 'INTEGRATION'
}

export enum ResourceStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DEPRECATED = 'DEPRECATED'
}

export enum ResourceVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED'
}

export enum TagType {
  USER = 'USER',
  AI = 'AI',
  SYSTEM = 'SYSTEM'
}

export interface Resource {
  id: string
  slug: string
  name: string
  description: string
  type: ResourceType
  status: ResourceStatus
  visibility: ResourceVisibility
  content: ResourceContent
  metadata: Record<string, any>
  quality: number
  usageCount: number
  downloads: number
  stars: number
  rating?: number
  tags?: ResourceTag[]
  category?: Category
  categoryId?: string
  authorId?: string
  workspaceId?: string
  projectId?: string
  author?: string
  version?: string
  sourceUrl?: string
  changelog?: string
  reviews?: ResourceReview[]
  usage?: ResourceUsage[]
  createdAt: Date
  updatedAt: Date
}

export interface ResourceContent {
  main: string
  examples?: string[]
  prerequisites?: string[]
  relatedResources?: string[]
  supportedVersions?: string[]
}

export interface Tag {
  id: string
  name: string
  slug: string
  description?: string | null
  category?: string | null
  icon?: string | null
  color?: string | null
  usageCount: number
  isOfficial: boolean
  metadata?: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
}

export interface ResourceTag {
  id: string
  resourceId: string
  tagId: string
  tag?: Tag
  tagType: TagType
  confidence?: number
  addedBy?: string
  createdAt: Date
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  parentId?: string
  parent?: Category
  children?: Category[]
  order: number
  isActive: boolean
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface TagCategory {
  id: string
  name: string
  description: string
  icon: string
  tags: Tag[]
}

export interface Collection {
  id: string
  name: string
  slug: string
  description: string
  isOfficial: boolean
  isCurated: boolean
  resources?: Resource[]
  author?: string | null
  metadata?: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
}

export interface ResourceSearchParams {
  query?: string
  type?: ResourceType[]
  types?: ResourceType[]  // Alias for compatibility
  status?: ResourceStatus[]
  visibility?: ResourceVisibility[]
  tags?: string[]
  categories?: string[]
  qualityMin?: number
  minQuality?: number  // Alias for compatibility
  minRating?: number
  author?: string
  authorId?: string
  workspaceId?: string
  projectId?: string
  sortBy?: 'relevance' | 'quality' | 'usage' | 'downloads' | 'created' | 'updated' | 'createdAt' | 'rating'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
  page?: number  // For pagination
}

export interface ResourceSearchResult {
  resources: Resource[]
  total: number
  page?: number
  pages?: number
  facets: {
    types: Record<ResourceType, number>
    tags: Record<string, number>
    categories: Record<string, number>
    qualityDistribution: Record<string, number>
  }
}

export interface ResourceFilter {
  type?: string
  category?: string
  tags?: string[]
  verified?: boolean
  official?: boolean
  search?: string
}

export interface ResourceRecommendation {
  resourceId: string
  resource?: Resource
  reason: string
  relevanceScore: number
  priority: 'high' | 'medium' | 'low'
  suggestedTags?: string[]
  relatedResources?: string[]
}

export interface ResourceStats {
  totalResources: number
  verifiedResources: number
  officialResources: number
  resourcesByType: Record<string, number>
  resourcesByCategory: Record<string, number>
  topTags: Array<{ tag: string; count: number }>
  averageQuality: number
  totalDownloads: number
  totalUsage: number
}

export interface ResourceReview {
  id: string
  resourceId: string
  resource?: Resource
  userId: string
  rating: number
  comment?: string
  helpful: number
  verified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ResourceUsage {
  id: string
  resourceId: string
  resource?: Resource
  userId?: string
  projectId?: string
  action: string
  context?: Record<string, any>
  sessionId?: string
  createdAt: Date
}