export { ClaudeAIService } from './claude'
export { ProjectScanner } from './project-scanner'
export { ClaudeMdGenerator } from './services/claude-md-generator'
export { ProjectScanner as ProjectScannerService } from './services/project-scanner'
export { ResourceManager } from './services/resource-manager'
export { ResourceProcessor } from './services/resource-processor'
export { aiService, AIService } from './services/ai-service'
export { aiCache, AICache } from './services/cache'
export { rateLimiter, RateLimiter, rateLimiters, withRateLimit } from './services/rate-limiter'
export { StreamingAIInterface, InteractivePrompt } from './streaming'
export { SmartScraper } from './smart-scraper'
export { AdvancedSmartScraper } from './smart-scraper-advanced'
export { PatternRecognitionEngine, PatternCategory } from './pattern-recognition'
export { IntelligentConfigGenerator } from './config-generator'
export { HookManager, HookRegistry, HookExecutor, HookType, HookTrigger } from './hook-manager'
export { 
  AgentOrchestrator, 
  AgentType,
  BaseAgent,
  CodeReviewerAgent,
  SecurityAuditorAgent,
  PerformanceOptimizerAgent,
  TestGeneratorAgent,
  DocumentationWriterAgent
} from './agent-ecosystem'
export type { StreamingOptions, ThinkingStep } from './streaming'
export type { SmartScraperConfig, ScrapedPage, ScrapeOptions } from './smart-scraper'
export type { 
  AdvancedScrapeOptions, 
  EnhancedScrapedPage, 
  ExtractionRule, 
  ProxyConfig, 
  AuthConfig, 
  CloudBrowserConfig 
} from './smart-scraper-advanced'
export type { CodePattern, PatternOccurrence, PatternRule } from './pattern-recognition'
export type { ConfigTemplate, GeneratedConfig, ConfigGeneratorOptions } from './config-generator'
export type { HookConfig, HookResult, HookContext } from './hook-manager'
export type { AgentCapability, AgentContext, AgentMessage, AgentResult, AgentAction } from './agent-ecosystem'
export type {
  AIAnalysisResult,
  AIRecommendation,
  AnalysisDepth,
  PriorityLevel,
  RecommendationType,
  ProjectContext,
  TemplateRecommendation
} from './types'
export {
  AIAnalysisResultSchema,
  AIRecommendationSchema,
  AnalysisDepthSchema,
  PriorityLevelSchema,
  RecommendationTypeSchema,
  ProjectContextSchema,
  TemplateRecommendationSchema
} from './types'