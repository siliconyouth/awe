export { ClaudeAIService } from './claude.js'
export { ProjectScanner } from './project-scanner.js'
export { StreamingAIInterface, InteractivePrompt } from './streaming.js'
export { SmartScraper } from './smart-scraper.js'
export { AdvancedSmartScraper } from './smart-scraper-advanced.js'
export { PatternRecognitionEngine, PatternCategory } from './pattern-recognition.js'
export { IntelligentConfigGenerator } from './config-generator.js'
export { HookManager, HookRegistry, HookExecutor, HookType, HookTrigger } from './hook-manager.js'
export { 
  AgentOrchestrator, 
  AgentType,
  BaseAgent,
  CodeReviewerAgent,
  SecurityAuditorAgent,
  PerformanceOptimizerAgent,
  TestGeneratorAgent,
  DocumentationWriterAgent
} from './agent-ecosystem.js'
export type { StreamingOptions, ThinkingStep } from './streaming.js'
export type { SmartScraperConfig, ScrapedPage, ScrapeOptions } from './smart-scraper.js'
export type { 
  AdvancedScrapeOptions, 
  EnhancedScrapedPage, 
  ExtractionRule, 
  ProxyConfig, 
  AuthConfig, 
  CloudBrowserConfig 
} from './smart-scraper-advanced.js'
export type { CodePattern, PatternOccurrence, PatternRule } from './pattern-recognition.js'
export type { ConfigTemplate, GeneratedConfig, ConfigGeneratorOptions } from './config-generator.js'
export type { HookConfig, HookResult, HookContext } from './hook-manager.js'
export type { AgentCapability, AgentContext, AgentMessage, AgentResult, AgentAction } from './agent-ecosystem.js'
export type {
  AIAnalysisResult,
  AIRecommendation,
  AnalysisDepth,
  PriorityLevel,
  RecommendationType,
  ProjectContext,
  TemplateRecommendation
} from './types.js'
export {
  AIAnalysisResultSchema,
  AIRecommendationSchema,
  AnalysisDepthSchema,
  PriorityLevelSchema,
  RecommendationTypeSchema,
  ProjectContextSchema,
  TemplateRecommendationSchema
} from './types.js'