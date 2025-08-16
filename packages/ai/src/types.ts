import { z } from 'zod'

// AI Analysis Types
export const AnalysisDepthSchema = z.enum(['shallow', 'deep', 'comprehensive'])
export type AnalysisDepth = z.infer<typeof AnalysisDepthSchema>

export const PriorityLevelSchema = z.enum(['critical', 'high', 'medium', 'low'])
export type PriorityLevel = z.infer<typeof PriorityLevelSchema>

export const RecommendationTypeSchema = z.enum([
  'performance', 
  'security', 
  'maintainability', 
  'architecture', 
  'testing',
  'documentation',
  'deployment',
  'dependency'
])
export type RecommendationType = z.infer<typeof RecommendationTypeSchema>

// AI Recommendation Schema
export const AIRecommendationSchema = z.object({
  id: z.string(),
  type: RecommendationTypeSchema,
  priority: PriorityLevelSchema,
  title: z.string(),
  description: z.string(),
  reasoning: z.string(),
  effort: z.enum(['low', 'medium', 'high']),
  impact: z.enum(['low', 'medium', 'high']),
  confidence: z.number().min(0).max(1),
  commands: z.array(z.string()).optional(),
  codeChanges: z.array(z.object({
    file: z.string(),
    description: z.string(),
    example: z.string().optional()
  })).optional(),
  documentation: z.object({
    links: z.array(z.string()).optional(),
    examples: z.array(z.string()).optional()
  }).optional()
})
export type AIRecommendation = z.infer<typeof AIRecommendationSchema>

// AI Analysis Result Schema
export const AIAnalysisResultSchema = z.object({
  projectName: z.string(),
  analyzedAt: z.string(),
  depth: AnalysisDepthSchema,
  summary: z.object({
    overallScore: z.number().min(0).max(10),
    strengths: z.array(z.string()),
    concerns: z.array(z.string()),
    architecture: z.string(),
    complexity: z.enum(['low', 'medium', 'high']),
    maintainability: z.number().min(0).max(10)
  }),
  codebaseInsights: z.object({
    totalFiles: z.number(),
    languages: z.array(z.string()),
    frameworks: z.array(z.string()),
    testCoverage: z.number().optional(),
    dependencies: z.object({
      total: z.number(),
      outdated: z.number(),
      vulnerable: z.number()
    }),
    codePatterns: z.array(z.object({
      pattern: z.string(),
      frequency: z.number(),
      quality: z.enum(['good', 'acceptable', 'concerning'])
    }))
  }),
  claudeIntegration: z.object({
    hasClaudeMd: z.boolean(),
    hasMemoryFile: z.boolean(),
    contextQuality: z.number().min(0).max(10),
    optimizationOpportunities: z.array(z.string())
  }),
  recommendations: z.array(AIRecommendationSchema),
  nextSteps: z.array(z.string())
})
export type AIAnalysisResult = z.infer<typeof AIAnalysisResultSchema>

// AI Context Schema for Project Understanding
export const ProjectContextSchema = z.object({
  type: z.enum(['web-app', 'api', 'library', 'cli', 'mobile', 'desktop', 'monorepo']),
  technologies: z.array(z.string()),
  architecture: z.string(),
  purpose: z.string(),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  team: z.object({
    size: z.enum(['solo', 'small', 'medium', 'large']),
    experience: z.enum(['junior', 'mixed', 'senior'])
  }),
  constraints: z.object({
    timeline: z.enum(['rapid', 'normal', 'extended']),
    budget: z.enum(['limited', 'moderate', 'flexible']),
    performance: z.enum(['standard', 'high', 'critical'])
  })
})
export type ProjectContext = z.infer<typeof ProjectContextSchema>

// Template Recommendation Schema
export const TemplateRecommendationSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  suitability: z.number().min(0).max(1),
  reasoning: z.string(),
  advantages: z.array(z.string()),
  considerations: z.array(z.string()),
  setupComplexity: z.enum(['simple', 'moderate', 'complex']),
  learningCurve: z.enum(['easy', 'moderate', 'steep'])
})
export type TemplateRecommendation = z.infer<typeof TemplateRecommendationSchema>