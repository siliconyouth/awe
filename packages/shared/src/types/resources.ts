/**
 * Resource Management System Types
 * Comprehensive type definitions for AWE's resource tagging and categorization system
 */

// ============================================
// Enums
// ============================================

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
  WORKSPACE = 'WORKSPACE',
  PROJECT = 'PROJECT'
}

export enum TagType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  USER = 'USER',
  AI = 'AI',
  SYSTEM = 'SYSTEM'
}

export enum TagCategory {
  LANGUAGE = 'LANGUAGE',
  FRAMEWORK = 'FRAMEWORK',
  DOMAIN = 'DOMAIN',
  PURPOSE = 'PURPOSE',
  DIFFICULTY = 'DIFFICULTY',
  QUALITY = 'QUALITY',
  COMPATIBILITY = 'COMPATIBILITY',
  VERSION = 'VERSION',
  FEATURE = 'FEATURE',
  CUSTOM = 'CUSTOM'
}

// ============================================
// Core Types
// ============================================

export interface Resource {
  id: string
  type: ResourceType
  name: string
  slug: string
  description: string
  content: ResourceContent
  metadata: ResourceMetadata
  
  // Categorization
  categoryId: string
  category?: ResourceCategory
  
  // Ownership and visibility
  authorId: string
  workspaceId?: string
  projectId?: string
  visibility: ResourceVisibility
  status: ResourceStatus
  
  // Quality and metrics
  quality: number // 0-100
  usageCount: number
  downloads: number
  rating?: number
  
  // Versioning
  version: string
  changelog?: ChangelogEntry[]
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  archivedAt?: Date
  
  // Relations
  tags?: ResourceTag[]
  reviews?: ResourceReview[]
  dependencies?: ResourceDependency[]
}

export interface ResourceCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  parentId?: string
  parent?: ResourceCategory
  children?: ResourceCategory[]
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Tag {
  id: string
  name: string
  slug: string
  category: TagCategory
  description?: string
  icon?: string
  color?: string
  usageCount: number
  isSystem: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ResourceTag {
  id: string
  resourceId: string
  tagId: string
  tagType: TagType
  confidence?: number // For AI tags (0-1)
  addedBy?: string
  tag?: Tag
  createdAt: Date
}

// ============================================
// Resource Content Types
// ============================================

export type ResourceContent = 
  | PatternContent
  | TemplateContent
  | HookContent
  | AgentContent
  | SnippetContent
  | CommandContent
  | WorkflowContent
  | KnowledgeContent
  | ConfigurationContent
  | IntegrationContent

export interface PatternContent {
  pattern: string
  language: string
  example: string
  antiPattern?: string
  explanation: string
}

export interface TemplateContent {
  files: TemplateFile[]
  variables: TemplateVariable[]
  instructions?: string
}

export interface HookContent {
  trigger: string
  script: string
  config?: Record<string, any>
  requirements?: string[]
}

export interface AgentContent {
  name: string
  description: string
  capabilities: string[]
  configuration: Record<string, any>
  prompts?: Record<string, string>
}

export interface SnippetContent {
  code: string
  language: string
  prefix?: string
  description?: string
  placeholders?: SnippetPlaceholder[]
}

export interface CommandContent {
  command: string
  description: string
  parameters?: CommandParameter[]
  handler: string
}

export interface WorkflowContent {
  steps: WorkflowStep[]
  triggers?: string[]
  conditions?: WorkflowCondition[]
}

export interface KnowledgeContent {
  type: 'documentation' | 'tutorial' | 'guide' | 'reference'
  content: string
  format: 'markdown' | 'html' | 'plain'
  sections?: KnowledgeSection[]
}

export interface ConfigurationContent {
  schema: Record<string, any>
  defaults: Record<string, any>
  validation?: Record<string, any>
}

export interface IntegrationContent {
  service: string
  apiVersion?: string
  authentication: AuthConfig
  endpoints?: EndpointConfig[]
  webhooks?: WebhookConfig[]
}

// ============================================
// Resource Metadata
// ============================================

export interface ResourceMetadata {
  // Common metadata
  author?: AuthorInfo
  license?: string
  homepage?: string
  repository?: string
  documentation?: string
  
  // Requirements
  minVersion?: string
  maxVersion?: string
  requirements?: Requirement[]
  compatibility?: Compatibility[]
  
  // Analytics
  lastUsed?: Date
  installCount?: number
  successRate?: number
  avgExecutionTime?: number
  
  // AI insights
  aiSummary?: string
  aiTags?: string[]
  aiQualityScore?: number
  aiRecommendations?: string[]
  
  // Custom fields
  custom?: Record<string, any>
}

// ============================================
// Supporting Types
// ============================================

export interface TemplateFile {
  path: string
  content: string
  encoding?: string
  permissions?: string
}

export interface TemplateVariable {
  name: string
  description?: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  default?: any
  required?: boolean
  validation?: string
}

export interface SnippetPlaceholder {
  name: string
  default?: string
  description?: string
}

export interface CommandParameter {
  name: string
  type: string
  required?: boolean
  default?: any
  description?: string
}

export interface WorkflowStep {
  id: string
  name: string
  type: string
  config: Record<string, any>
  dependsOn?: string[]
}

export interface WorkflowCondition {
  type: string
  expression: string
  action: string
}

export interface KnowledgeSection {
  title: string
  content: string
  order: number
}

export interface AuthConfig {
  type: 'apiKey' | 'oauth2' | 'basic' | 'custom'
  config: Record<string, any>
}

export interface EndpointConfig {
  name: string
  method: string
  path: string
  parameters?: Record<string, any>
}

export interface WebhookConfig {
  event: string
  url: string
  headers?: Record<string, string>
}

export interface AuthorInfo {
  id: string
  name: string
  email?: string
  url?: string
  avatar?: string
}

export interface Requirement {
  type: 'resource' | 'package' | 'system'
  name: string
  version?: string
  optional?: boolean
}

export interface Compatibility {
  tool: string
  versions: string[]
  tested?: boolean
}

export interface ChangelogEntry {
  version: string
  date: Date
  changes: string[]
  breaking?: boolean
}

// ============================================
// Resource Operations
// ============================================

export interface ResourceDependency {
  id: string
  resourceId: string
  dependsOnId: string
  dependencyType: 'required' | 'optional' | 'peer'
  versionRange?: string
  resource?: Resource
  dependsOn?: Resource
  createdAt: Date
}

export interface ResourceReview {
  id: string
  resourceId: string
  userId: string
  rating: number // 1-5
  comment?: string
  helpful: number
  unhelpful: number
  verified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ResourceUsage {
  id: string
  resourceId: string
  userId?: string
  projectId?: string
  action: ResourceAction
  context?: Record<string, any>
  sessionId?: string
  createdAt: Date
}

export type ResourceAction = 
  | 'view'
  | 'download'
  | 'apply'
  | 'fork'
  | 'share'
  | 'install'
  | 'uninstall'
  | 'execute'
  | 'edit'

// ============================================
// Collections
// ============================================

export interface Collection {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  ownerId: string
  visibility: ResourceVisibility
  featured: boolean
  tags: string[]
  metadata?: CollectionMetadata
  resources?: CollectionResource[]
  createdAt: Date
  updatedAt: Date
}

export interface CollectionResource {
  id: string
  collectionId: string
  resourceId: string
  order: number
  notes?: string
  resource?: Resource
  addedAt: Date
}

export interface CollectionMetadata {
  purpose?: string
  targetAudience?: string
  prerequisites?: string[]
  estimatedTime?: number // in minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  tags?: string[]
}

// ============================================
// Search and Filter
// ============================================

export interface ResourceSearchParams {
  query?: string
  types?: ResourceType[]
  categories?: string[]
  tags?: string[]
  status?: ResourceStatus[]
  visibility?: ResourceVisibility[]
  authorId?: string
  workspaceId?: string
  projectId?: string
  minQuality?: number
  minRating?: number
  sortBy?: ResourceSortField
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export type ResourceSortField = 
  | 'name'
  | 'createdAt'
  | 'updatedAt'
  | 'quality'
  | 'rating'
  | 'usageCount'
  | 'downloads'

export interface ResourceSearchResult {
  resources: Resource[]
  total: number
  page: number
  pages: number
  facets?: SearchFacets
}

export interface SearchFacets {
  types: FacetValue[]
  categories: FacetValue[]
  tags: FacetValue[]
  languages: FacetValue[]
  frameworks: FacetValue[]
}

export interface FacetValue {
  value: string
  count: number
  label?: string
}

// ============================================
// Recommendations
// ============================================

export interface ResourceRecommendation {
  resource: Resource
  score: number
  reason: string
  context?: RecommendationContext
}

export interface RecommendationContext {
  basedOn?: 'usage' | 'similarity' | 'trending' | 'ai'
  relatedTo?: string[] // Resource IDs
  explanation?: string
}

// ============================================
// Import/Export
// ============================================

export interface ResourceExport {
  version: string
  exportedAt: Date
  resources: Resource[]
  categories?: ResourceCategory[]
  tags?: Tag[]
  collections?: Collection[]
}

export interface ResourceImportOptions {
  overwrite?: boolean
  preserveIds?: boolean
  mapAuthor?: boolean
  targetWorkspace?: string
  targetProject?: string
}