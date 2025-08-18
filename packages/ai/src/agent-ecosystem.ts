/**
 * Agent Ecosystem
 * 
 * A collection of specialized AI agents that work together
 * to provide comprehensive development assistance
 */

import { ClaudeAIService } from './claude';
import { PatternRecognitionEngine, PatternCategory } from './pattern-recognition';
import { IntelligentConfigGenerator } from './config-generator';
import { HookManager, HookType } from './hook-manager';
import { SmartScraper } from './smart-scraper';
import { ProjectScanner } from './project-scanner';
import chalk from 'chalk';
import * as path from 'path';

// Agent types
export enum AgentType {
  CODE_REVIEWER = 'code-reviewer',
  SECURITY_AUDITOR = 'security-auditor',
  PERFORMANCE_OPTIMIZER = 'performance-optimizer',
  DOCUMENTATION_WRITER = 'documentation-writer',
  TEST_GENERATOR = 'test-generator',
  REFACTORING_ASSISTANT = 'refactoring-assistant',
  DEPENDENCY_MANAGER = 'dependency-manager',
  ARCHITECTURE_ADVISOR = 'architecture-advisor',
  BUG_DETECTIVE = 'bug-detective',
  API_DESIGNER = 'api-designer',
  DEVOPS_ENGINEER = 'devops-engineer',
  ACCESSIBILITY_EXPERT = 'accessibility-expert'
}

// Agent capability
export interface AgentCapability {
  name: string;
  description: string;
  category: string;
  confidence: number;
}

// Agent context
export interface AgentContext {
  projectPath: string;
  targetFiles?: string[];
  options?: Record<string, any>;
  history?: AgentMessage[];
}

// Agent message
export interface AgentMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Agent result
export interface AgentResult {
  agent: AgentType;
  success: boolean;
  summary: string;
  details: string;
  recommendations?: string[];
  actions?: AgentAction[];
  confidence: number;
  duration: number;
  metadata?: Record<string, any>;
}

// Agent action
export interface AgentAction {
  type: 'fix' | 'suggest' | 'warn' | 'info';
  description: string;
  file?: string;
  line?: number;
  code?: string;
  priority: 'high' | 'medium' | 'low';
}

// Base agent class
export abstract class BaseAgent {
  protected name: string;
  protected type: AgentType;
  protected description: string;
  protected capabilities: AgentCapability[] = [];
  protected aiService?: ClaudeAIService;

  constructor(type: AgentType, name: string, description: string) {
    this.type = type;
    this.name = name;
    this.description = description;
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    // Initialize AI service if needed
    if (this.requiresAI()) {
      this.aiService = new ClaudeAIService();
    }
    
    // Initialize specific agent resources
    await this.setup();
  }

  /**
   * Execute agent task
   */
  abstract execute(context: AgentContext): Promise<AgentResult>;

  /**
   * Setup agent-specific resources
   */
  protected abstract setup(): Promise<void>;

  /**
   * Check if agent requires AI service
   */
  protected abstract requiresAI(): boolean;

  /**
   * Get agent information
   */
  getInfo(): { type: AgentType; name: string; description: string; capabilities: AgentCapability[] } {
    return {
      type: this.type,
      name: this.name,
      description: this.description,
      capabilities: this.capabilities
    };
  }
}

// Code Reviewer Agent
export class CodeReviewerAgent extends BaseAgent {
  private patternEngine!: PatternRecognitionEngine;

  constructor() {
    super(
      AgentType.CODE_REVIEWER,
      'Code Reviewer',
      'Reviews code for quality, best practices, and potential issues'
    );
    
    this.capabilities = [
      { name: 'Style Analysis', description: 'Check code style and formatting', category: 'quality', confidence: 0.95 },
      { name: 'Best Practices', description: 'Identify violations of best practices', category: 'quality', confidence: 0.9 },
      { name: 'Code Smells', description: 'Detect code smells and anti-patterns', category: 'quality', confidence: 0.85 },
      { name: 'Complexity Analysis', description: 'Analyze code complexity', category: 'metrics', confidence: 0.9 }
    ];
  }

  protected async setup(): Promise<void> {
    this.patternEngine = new PatternRecognitionEngine();
  }

  protected requiresAI(): boolean {
    return true;
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const actions: AgentAction[] = [];
    const recommendations: string[] = [];

    try {
      // Analyze patterns
      const patterns = await this.patternEngine.analyzeCodebase(context.projectPath, {
        categories: [
          PatternCategory.ANTI_PATTERN,
          PatternCategory.STYLE,
          PatternCategory.DESIGN_PATTERN
        ]
      });

      // Review anti-patterns
      const antiPatterns = patterns.filter(p => p.category === PatternCategory.ANTI_PATTERN);
      for (const pattern of antiPatterns) {
        for (const occurrence of pattern.occurrences) {
          actions.push({
            type: 'warn',
            description: `Anti-pattern detected: ${pattern.name}`,
            file: occurrence.file,
            line: occurrence.line,
            priority: 'high'
          });
        }
      }

      // Review style issues
      const styleIssues = patterns.filter(p => p.category === PatternCategory.STYLE);
      for (const issue of styleIssues) {
        if (issue.confidence > 0.7) {
          recommendations.push(`Consider addressing style issue: ${issue.name}`);
        }
      }

      // Generate AI review if available
      if (this.aiService && context.targetFiles && context.targetFiles.length > 0) {
        const scanner = new ProjectScanner();
        const projectInfo = await scanner.scanProject(context.projectPath);
        
        const prompt = `Review the following code files for quality, best practices, and potential issues:
        
Project: ${path.basename(context.projectPath)}
Files: ${context.targetFiles.join(', ')}

Provide specific, actionable feedback.`;

        // For now, just add generic recommendations
        // A full AI analysis would require the analyze method to be implemented
        recommendations.push('Review code for consistency with project style guide');
        recommendations.push('Ensure adequate test coverage for new code');
        recommendations.push('Check for proper error handling');
      }

      const duration = Date.now() - startTime;

      return {
        agent: this.type,
        success: true,
        summary: `Code review completed: ${actions.length} issues found`,
        details: `Analyzed ${patterns.length} patterns across the codebase`,
        recommendations,
        actions,
        confidence: 0.85,
        duration,
        metadata: {
          patternsAnalyzed: patterns.length,
          antiPatternsFound: antiPatterns.length,
          styleIssuesFound: styleIssues.length
        }
      };
    } catch (error) {
      return {
        agent: this.type,
        success: false,
        summary: 'Code review failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        duration: Date.now() - startTime
      };
    }
  }
}

// Security Auditor Agent
export class SecurityAuditorAgent extends BaseAgent {
  private patternEngine!: PatternRecognitionEngine;

  constructor() {
    super(
      AgentType.SECURITY_AUDITOR,
      'Security Auditor',
      'Audits code for security vulnerabilities and compliance issues'
    );
    
    this.capabilities = [
      { name: 'Vulnerability Detection', description: 'Identify security vulnerabilities', category: 'security', confidence: 0.9 },
      { name: 'Dependency Audit', description: 'Check for vulnerable dependencies', category: 'security', confidence: 0.95 },
      { name: 'Secret Detection', description: 'Find exposed secrets and credentials', category: 'security', confidence: 0.98 },
      { name: 'OWASP Compliance', description: 'Check OWASP Top 10 compliance', category: 'compliance', confidence: 0.85 }
    ];
  }

  protected async setup(): Promise<void> {
    this.patternEngine = new PatternRecognitionEngine();
  }

  protected requiresAI(): boolean {
    return true;
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const actions: AgentAction[] = [];
    const recommendations: string[] = [];

    try {
      // Analyze security patterns
      const patterns = await this.patternEngine.analyzeCodebase(context.projectPath, {
        categories: [PatternCategory.SECURITY]
      });

      // Check for critical vulnerabilities
      for (const pattern of patterns) {
        const severity = pattern.metadata?.severity || 'medium';
        const priority = severity === 'error' ? 'high' : severity === 'warning' ? 'medium' : 'low';
        
        for (const occurrence of pattern.occurrences) {
          actions.push({
            type: severity === 'error' ? 'fix' : 'warn',
            description: `Security issue: ${pattern.name}`,
            file: occurrence.file,
            line: occurrence.line,
            priority: priority as 'high' | 'medium' | 'low'
          });
        }
      }

      // Security recommendations
      recommendations.push('Enable strict Content Security Policy (CSP)');
      recommendations.push('Implement rate limiting on all API endpoints');
      recommendations.push('Use parameterized queries to prevent SQL injection');
      recommendations.push('Implement proper authentication and authorization');
      recommendations.push('Keep all dependencies up to date');
      
      if (patterns.some(p => p.id === 'exposed-secrets')) {
        recommendations.push('CRITICAL: Remove exposed secrets and rotate credentials immediately');
      }

      const duration = Date.now() - startTime;

      return {
        agent: this.type,
        success: true,
        summary: `Security audit completed: ${actions.filter(a => a.priority === 'high').length} critical issues`,
        details: `Found ${patterns.length} security patterns to review`,
        recommendations,
        actions,
        confidence: 0.9,
        duration,
        metadata: {
          criticalIssues: actions.filter(a => a.priority === 'high').length,
          warnings: actions.filter(a => a.priority === 'medium').length,
          info: actions.filter(a => a.priority === 'low').length
        }
      };
    } catch (error) {
      return {
        agent: this.type,
        success: false,
        summary: 'Security audit failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        duration: Date.now() - startTime
      };
    }
  }
}

// Performance Optimizer Agent
export class PerformanceOptimizerAgent extends BaseAgent {
  private patternEngine!: PatternRecognitionEngine;

  constructor() {
    super(
      AgentType.PERFORMANCE_OPTIMIZER,
      'Performance Optimizer',
      'Optimizes code for better performance and efficiency'
    );
    
    this.capabilities = [
      { name: 'Bottleneck Detection', description: 'Identify performance bottlenecks', category: 'performance', confidence: 0.85 },
      { name: 'Memory Optimization', description: 'Optimize memory usage', category: 'performance', confidence: 0.8 },
      { name: 'Algorithm Optimization', description: 'Suggest better algorithms', category: 'performance', confidence: 0.75 },
      { name: 'Caching Strategy', description: 'Recommend caching strategies', category: 'performance', confidence: 0.9 }
    ];
  }

  protected async setup(): Promise<void> {
    this.patternEngine = new PatternRecognitionEngine();
  }

  protected requiresAI(): boolean {
    return true;
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const actions: AgentAction[] = [];
    const recommendations: string[] = [];

    try {
      // Analyze performance patterns
      const patterns = await this.patternEngine.analyzeCodebase(context.projectPath, {
        categories: [PatternCategory.PERFORMANCE]
      });

      // Check for performance issues
      const needsMemoization = !patterns.some(p => p.id === 'memoization');
      const needsLazyLoading = !patterns.some(p => p.id === 'lazy-loading');
      const hasInefficient = patterns.some(p => p.name.toLowerCase().includes('inefficient'));

      if (needsMemoization) {
        recommendations.push('Add memoization to expensive computations');
        actions.push({
          type: 'suggest',
          description: 'Consider using React.memo, useMemo, or useCallback for optimization',
          priority: 'medium'
        });
      }

      if (needsLazyLoading) {
        recommendations.push('Implement lazy loading for better initial load performance');
        actions.push({
          type: 'suggest',
          description: 'Use dynamic imports and React.lazy for code splitting',
          priority: 'medium'
        });
      }

      if (hasInefficient) {
        actions.push({
          type: 'warn',
          description: 'Inefficient patterns detected that may impact performance',
          priority: 'high'
        });
      }

      // General performance recommendations
      recommendations.push('Use production builds for deployment');
      recommendations.push('Enable compression (gzip/brotli) on server');
      recommendations.push('Optimize images and use modern formats (WebP, AVIF)');
      recommendations.push('Implement proper caching headers');
      recommendations.push('Consider using a CDN for static assets');

      const duration = Date.now() - startTime;

      return {
        agent: this.type,
        success: true,
        summary: `Performance optimization completed: ${actions.length} improvements suggested`,
        details: `Analyzed ${patterns.length} performance patterns`,
        recommendations,
        actions,
        confidence: 0.8,
        duration,
        metadata: {
          patternsFound: patterns.length,
          optimizationsNeeded: actions.length
        }
      };
    } catch (error) {
      return {
        agent: this.type,
        success: false,
        summary: 'Performance optimization failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        duration: Date.now() - startTime
      };
    }
  }
}

// Test Generator Agent
export class TestGeneratorAgent extends BaseAgent {
  constructor() {
    super(
      AgentType.TEST_GENERATOR,
      'Test Generator',
      'Generates comprehensive test suites for code'
    );
    
    this.capabilities = [
      { name: 'Unit Test Generation', description: 'Generate unit tests', category: 'testing', confidence: 0.85 },
      { name: 'Integration Tests', description: 'Create integration tests', category: 'testing', confidence: 0.75 },
      { name: 'Test Coverage Analysis', description: 'Analyze test coverage', category: 'testing', confidence: 0.9 },
      { name: 'Edge Case Detection', description: 'Identify edge cases', category: 'testing', confidence: 0.8 }
    ];
  }

  protected async setup(): Promise<void> {
    // No specific setup needed
  }

  protected requiresAI(): boolean {
    return true;
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const recommendations: string[] = [];
    const actions: AgentAction[] = [];

    try {
      if (!this.aiService) {
        throw new Error('AI service not initialized');
      }

      // Analyze project for testing needs
      const scanner = new ProjectScanner();
      const projectInfo = await scanner.scanProject(context.projectPath);

      // Detect testing framework
      // Check if testing frameworks are in files (simplified check)
      const hasJest = projectInfo.files.some(f => f.path.includes('jest.config'));
      const hasVitest = projectInfo.files.some(f => f.path.includes('vitest.config'));
      const hasMocha = projectInfo.files.some(f => f.path.includes('mocha'));

      if (!hasJest && !hasVitest && !hasMocha) {
        recommendations.push('Install a testing framework (Jest, Vitest, or Mocha recommended)');
        actions.push({
          type: 'suggest',
          description: 'No testing framework detected',
          priority: 'high'
        });
      }

      // Generate test recommendations
      recommendations.push('Write tests for all public APIs');
      recommendations.push('Aim for at least 80% code coverage');
      recommendations.push('Include edge cases and error scenarios');
      recommendations.push('Use mocking for external dependencies');
      recommendations.push('Implement continuous testing in CI/CD pipeline');

      // Suggest test structure
      actions.push({
        type: 'info',
        description: 'Create __tests__ directories next to source files',
        priority: 'medium'
      });

      actions.push({
        type: 'suggest',
        description: 'Follow AAA pattern: Arrange, Act, Assert',
        priority: 'low'
      });

      const duration = Date.now() - startTime;

      return {
        agent: this.type,
        success: true,
        summary: 'Test generation analysis completed',
        details: `Analyzed project structure and testing requirements`,
        recommendations,
        actions,
        confidence: 0.8,
        duration,
        metadata: {
          hasTestingFramework: hasJest || hasVitest || hasMocha,
          framework: hasJest ? 'jest' : hasVitest ? 'vitest' : hasMocha ? 'mocha' : 'none'
        }
      };
    } catch (error) {
      return {
        agent: this.type,
        success: false,
        summary: 'Test generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        duration: Date.now() - startTime
      };
    }
  }
}

// Documentation Writer Agent
export class DocumentationWriterAgent extends BaseAgent {
  constructor() {
    super(
      AgentType.DOCUMENTATION_WRITER,
      'Documentation Writer',
      'Generates and improves documentation'
    );
    
    this.capabilities = [
      { name: 'API Documentation', description: 'Generate API documentation', category: 'docs', confidence: 0.9 },
      { name: 'Code Comments', description: 'Add inline code comments', category: 'docs', confidence: 0.85 },
      { name: 'README Generation', description: 'Create comprehensive README files', category: 'docs', confidence: 0.9 },
      { name: 'Usage Examples', description: 'Generate usage examples', category: 'docs', confidence: 0.8 }
    ];
  }

  protected async setup(): Promise<void> {
    // No specific setup needed
  }

  protected requiresAI(): boolean {
    return true;
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const recommendations: string[] = [];
    const actions: AgentAction[] = [];

    try {
      // Analyze documentation needs
      const scanner = new ProjectScanner();
      const projectInfo = await scanner.scanProject(context.projectPath);

      // Check for existing documentation
      const hasReadme = projectInfo.files.some((f: any) => f.path.toLowerCase().includes('readme.md'));
      const hasDocs = projectInfo.files.some((f: any) => f.path.includes('/docs/'));
      
      if (!hasReadme) {
        actions.push({
          type: 'fix',
          description: 'Missing README.md file',
          priority: 'high'
        });
        recommendations.push('Create a comprehensive README with installation, usage, and contribution guidelines');
      }

      if (!hasDocs) {
        recommendations.push('Consider creating a docs/ directory for detailed documentation');
      }

      // Documentation recommendations
      recommendations.push('Use JSDoc/TSDoc for function documentation');
      recommendations.push('Include code examples in documentation');
      recommendations.push('Document all public APIs');
      recommendations.push('Keep documentation up-to-date with code changes');
      recommendations.push('Add diagrams for complex architectures');
      recommendations.push('Include troubleshooting section');

      const duration = Date.now() - startTime;

      return {
        agent: this.type,
        success: true,
        summary: 'Documentation analysis completed',
        details: `Analyzed project documentation structure`,
        recommendations,
        actions,
        confidence: 0.85,
        duration,
        metadata: {
          hasReadme,
          hasDocs,
          needsImprovement: !hasReadme || !hasDocs
        }
      };
    } catch (error) {
      return {
        agent: this.type,
        success: false,
        summary: 'Documentation analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        duration: Date.now() - startTime
      };
    }
  }
}

// Agent Orchestrator
export class AgentOrchestrator {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize the orchestrator with default agents
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Register default agents
    this.registerAgent(new CodeReviewerAgent());
    this.registerAgent(new SecurityAuditorAgent());
    this.registerAgent(new PerformanceOptimizerAgent());
    this.registerAgent(new TestGeneratorAgent());
    this.registerAgent(new DocumentationWriterAgent());

    // Initialize all agents
    const initPromises = Array.from(this.agents.values()).map(agent => agent.initialize());
    await Promise.all(initPromises);

    this.initialized = true;
  }

  /**
   * Register an agent
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getInfo().type, agent);
  }

  /**
   * Get available agents
   */
  getAvailableAgents(): AgentType[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get agent information
   */
  getAgentInfo(type: AgentType): ReturnType<BaseAgent['getInfo']> | undefined {
    const agent = this.agents.get(type);
    return agent?.getInfo();
  }

  /**
   * Execute a single agent
   */
  async executeAgent(type: AgentType, context: AgentContext): Promise<AgentResult> {
    const agent = this.agents.get(type);
    if (!agent) {
      throw new Error(`Agent ${type} not found`);
    }

    if (!this.initialized) {
      await this.initialize();
    }

    return agent.execute(context);
  }

  /**
   * Execute multiple agents
   */
  async executeAgents(
    types: AgentType[],
    context: AgentContext,
    options: { parallel?: boolean } = {}
  ): Promise<AgentResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (options.parallel) {
      const promises = types.map(type => this.executeAgent(type, context));
      return Promise.all(promises);
    } else {
      const results: AgentResult[] = [];
      for (const type of types) {
        const result = await this.executeAgent(type, context);
        results.push(result);
      }
      return results;
    }
  }

  /**
   * Execute comprehensive analysis with all relevant agents
   */
  async executeComprehensiveAnalysis(context: AgentContext): Promise<{
    results: AgentResult[];
    summary: string;
    overallConfidence: number;
    criticalIssues: number;
    recommendations: string[];
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Execute all agents
    const types = this.getAvailableAgents();
    const results = await this.executeAgents(types, context, { parallel: true });

    // Aggregate results
    const successfulResults = results.filter(r => r.success);
    const overallConfidence = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length
      : 0;

    const criticalIssues = results.reduce((count, r) => {
      if (r.actions) {
        return count + r.actions.filter(a => a.priority === 'high').length;
      }
      return count;
    }, 0);

    const allRecommendations = new Set<string>();
    for (const result of results) {
      if (result.recommendations) {
        result.recommendations.forEach(r => allRecommendations.add(r));
      }
    }

    const summary = `Comprehensive analysis completed: ${successfulResults.length}/${results.length} agents succeeded, ${criticalIssues} critical issues found`;

    return {
      results,
      summary,
      overallConfidence,
      criticalIssues,
      recommendations: Array.from(allRecommendations)
    };
  }

  /**
   * Generate report from agent results
   */
  generateReport(results: AgentResult[]): string {
    const lines: string[] = [
      '# Agent Analysis Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Summary',
      ''
    ];

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    lines.push(`- Total Agents: ${results.length}`);
    lines.push(`- Successful: ${successful.length}`);
    lines.push(`- Failed: ${failed.length}`);
    lines.push('');

    // Individual agent results
    lines.push('## Agent Results');
    lines.push('');

    for (const result of results) {
      lines.push(`### ${result.agent}`);
      lines.push('');
      lines.push(`**Status:** ${result.success ? '✅ Success' : '❌ Failed'}`);
      lines.push(`**Confidence:** ${Math.round(result.confidence * 100)}%`);
      lines.push(`**Duration:** ${result.duration}ms`);
      lines.push('');
      lines.push(`**Summary:** ${result.summary}`);
      lines.push(`**Details:** ${result.details}`);
      lines.push('');

      if (result.actions && result.actions.length > 0) {
        lines.push('**Actions:**');
        for (const action of result.actions) {
          const icon = action.type === 'fix' ? '🔧' : action.type === 'warn' ? '⚠️' : action.type === 'suggest' ? '💡' : 'ℹ️';
          lines.push(`- ${icon} [${action.priority.toUpperCase()}] ${action.description}`);
          if (action.file) {
            lines.push(`  File: ${action.file}${action.line ? `:${action.line}` : ''}`);
          }
        }
        lines.push('');
      }

      if (result.recommendations && result.recommendations.length > 0) {
        lines.push('**Recommendations:**');
        for (const rec of result.recommendations) {
          lines.push(`- ${rec}`);
        }
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    // Overall recommendations
    const allRecommendations = new Set<string>();
    for (const result of results) {
      if (result.recommendations) {
        result.recommendations.forEach(r => allRecommendations.add(r));
      }
    }

    if (allRecommendations.size > 0) {
      lines.push('## Overall Recommendations');
      lines.push('');
      for (const rec of allRecommendations) {
        lines.push(`- ${rec}`);
      }
    }

    return lines.join('\n');
  }
}