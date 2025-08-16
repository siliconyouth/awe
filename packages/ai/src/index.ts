export { ClaudeAIService } from './claude.js'
export { ProjectScanner } from './project-scanner.js'
export { StreamingAIInterface, InteractivePrompt } from './streaming.js'
export { SmartScraper } from './smart-scraper.js'
export { PatternRecognitionEngine, PatternCategory } from './pattern-recognition.js'
export type { StreamingOptions, ThinkingStep } from './streaming.js'
export type { SmartScraperConfig, ScrapedPage, ScrapeOptions } from './smart-scraper.js'
export type { CodePattern, PatternOccurrence, PatternRule } from './pattern-recognition.js'
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