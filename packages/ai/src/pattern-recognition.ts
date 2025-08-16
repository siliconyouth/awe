import { readFile } from 'fs/promises';
import { glob } from 'glob';
import * as path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

/**
 * Pattern Recognition Engine
 * Analyzes code patterns, best practices, and common structures
 */

export interface CodePattern {
  id: string;
  name: string;
  description: string;
  category: PatternCategory;
  language: string;
  confidence: number;
  occurrences: PatternOccurrence[];
  metadata?: Record<string, any>;
}

export interface PatternOccurrence {
  file: string;
  line: number;
  column: number;
  snippet: string;
  context?: string;
}

export enum PatternCategory {
  ARCHITECTURE = 'architecture',
  DESIGN_PATTERN = 'design_pattern',
  ANTI_PATTERN = 'anti_pattern',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  STYLE = 'style',
  DEPENDENCY = 'dependency',
  API = 'api',
}

export interface PatternRule {
  id: string;
  name: string;
  description: string;
  category: PatternCategory;
  detector: PatternDetector;
  severity?: 'info' | 'warning' | 'error';
  autoFix?: boolean;
}

export type PatternDetector = (
  code: string,
  filePath: string,
  ast?: any
) => Promise<PatternOccurrence[]>;

export class PatternRecognitionEngine {
  private patterns: Map<string, PatternRule> = new Map();
  private cache: Map<string, CodePattern[]> = new Map();

  constructor() {
    this.registerBuiltInPatterns();
  }

  /**
   * Register built-in pattern detectors
   */
  private registerBuiltInPatterns() {
    // React Patterns
    this.registerPattern({
      id: 'react-hooks',
      name: 'React Hooks Usage',
      description: 'Detects React hooks patterns and best practices',
      category: PatternCategory.DESIGN_PATTERN,
      detector: this.detectReactHooks.bind(this),
    });

    this.registerPattern({
      id: 'react-component-patterns',
      name: 'React Component Patterns',
      description: 'Identifies component patterns (functional, class, HOC)',
      category: PatternCategory.ARCHITECTURE,
      detector: this.detectReactComponents.bind(this),
    });

    // TypeScript Patterns
    this.registerPattern({
      id: 'typescript-interfaces',
      name: 'TypeScript Interfaces',
      description: 'Analyzes interface definitions and usage',
      category: PatternCategory.DESIGN_PATTERN,
      detector: this.detectTypeScriptInterfaces.bind(this),
    });

    this.registerPattern({
      id: 'type-safety',
      name: 'Type Safety Patterns',
      description: 'Identifies type safety patterns and issues',
      category: PatternCategory.STYLE,
      detector: this.detectTypeSafety.bind(this),
    });

    // Architecture Patterns
    this.registerPattern({
      id: 'singleton',
      name: 'Singleton Pattern',
      description: 'Detects singleton pattern implementations',
      category: PatternCategory.DESIGN_PATTERN,
      detector: this.detectSingletonPattern.bind(this),
    });

    this.registerPattern({
      id: 'factory',
      name: 'Factory Pattern',
      description: 'Identifies factory pattern usage',
      category: PatternCategory.DESIGN_PATTERN,
      detector: this.detectFactoryPattern.bind(this),
    });

    this.registerPattern({
      id: 'dependency-injection',
      name: 'Dependency Injection',
      description: 'Detects dependency injection patterns',
      category: PatternCategory.ARCHITECTURE,
      detector: this.detectDependencyInjection.bind(this),
    });

    // Security Patterns
    this.registerPattern({
      id: 'security-vulnerabilities',
      name: 'Security Vulnerabilities',
      description: 'Identifies potential security issues',
      category: PatternCategory.SECURITY,
      detector: this.detectSecurityIssues.bind(this),
      severity: 'error',
    });

    this.registerPattern({
      id: 'authentication-patterns',
      name: 'Authentication Patterns',
      description: 'Analyzes authentication implementations',
      category: PatternCategory.SECURITY,
      detector: this.detectAuthPatterns.bind(this),
    });

    // Performance Patterns
    this.registerPattern({
      id: 'performance-optimizations',
      name: 'Performance Optimizations',
      description: 'Identifies performance optimization opportunities',
      category: PatternCategory.PERFORMANCE,
      detector: this.detectPerformancePatterns.bind(this),
    });

    this.registerPattern({
      id: 'memoization',
      name: 'Memoization Patterns',
      description: 'Detects memoization usage',
      category: PatternCategory.PERFORMANCE,
      detector: this.detectMemoization.bind(this),
    });

    // Testing Patterns
    this.registerPattern({
      id: 'test-patterns',
      name: 'Testing Patterns',
      description: 'Analyzes testing patterns and coverage',
      category: PatternCategory.TESTING,
      detector: this.detectTestPatterns.bind(this),
    });

    // API Patterns
    this.registerPattern({
      id: 'rest-api',
      name: 'REST API Patterns',
      description: 'Identifies REST API patterns',
      category: PatternCategory.API,
      detector: this.detectRestApiPatterns.bind(this),
    });

    this.registerPattern({
      id: 'graphql',
      name: 'GraphQL Patterns',
      description: 'Detects GraphQL schema and resolvers',
      category: PatternCategory.API,
      detector: this.detectGraphQLPatterns.bind(this),
    });
  }

  /**
   * Register a custom pattern
   */
  registerPattern(rule: PatternRule) {
    this.patterns.set(rule.id, rule);
  }

  /**
   * Analyze a codebase for patterns
   */
  async analyzeCodebase(
    directory: string,
    options: {
      include?: string[];
      exclude?: string[];
      categories?: PatternCategory[];
      patterns?: string[];
    } = {}
  ): Promise<CodePattern[]> {
    const files = await this.findFiles(directory, options);
    const results: CodePattern[] = [];

    for (const file of files) {
      const patterns = await this.analyzeFile(file, options);
      results.push(...patterns);
    }

    return this.aggregatePatterns(results);
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(
    filePath: string,
    options: {
      categories?: PatternCategory[];
      patterns?: string[];
    } = {}
  ): Promise<CodePattern[]> {
    // Check cache
    const cacheKey = `${filePath}:${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const code = await readFile(filePath, 'utf-8');
    const ext = path.extname(filePath);
    const language = this.getLanguageFromExtension(ext);
    
    let ast: any = null;
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      try {
        ast = parse(code, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx', 'decorators-legacy'],
        });
      } catch (error) {
        console.warn(`Failed to parse ${filePath}:`, error);
      }
    }

    const results: CodePattern[] = [];
    const rulesToRun = this.getApplicableRules(language, options);

    for (const rule of rulesToRun) {
      try {
        const occurrences = await rule.detector(code, filePath, ast);
        if (occurrences.length > 0) {
          results.push({
            id: rule.id,
            name: rule.name,
            description: rule.description,
            category: rule.category,
            language,
            confidence: this.calculateConfidence(occurrences),
            occurrences,
            metadata: {
              severity: rule.severity,
              autoFix: rule.autoFix,
            },
          });
        }
      } catch (error) {
        console.error(`Pattern detector ${rule.id} failed:`, error);
      }
    }

    // Cache results
    this.cache.set(cacheKey, results);
    return results;
  }

  /**
   * Pattern Detectors
   */

  private async detectReactHooks(
    code: string,
    filePath: string,
    ast?: any
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    const hookPattern = /use[A-Z][a-zA-Z]*\(/g;
    
    let match;
    while ((match = hookPattern.exec(code)) !== null) {
      const lines = code.substring(0, match.index).split('\n');
      occurrences.push({
        file: filePath,
        line: lines.length,
        column: lines[lines.length - 1].length,
        snippet: match[0],
        context: 'React Hook usage',
      });
    }

    return occurrences;
  }

  private async detectReactComponents(
    code: string,
    filePath: string,
    ast?: any
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    
    if (ast) {
      traverse(ast, {
        FunctionDeclaration(path: any) {
          if (path.node.id && /^[A-Z]/.test(path.node.id.name)) {
            occurrences.push({
              file: filePath,
              line: path.node.loc?.start.line || 0,
              column: path.node.loc?.start.column || 0,
              snippet: `function ${path.node.id.name}`,
              context: 'Functional Component',
            });
          }
        },
        ClassDeclaration(path: any) {
          if (path.node.superClass?.name === 'Component' ||
              path.node.superClass?.name === 'PureComponent') {
            occurrences.push({
              file: filePath,
              line: path.node.loc?.start.line || 0,
              column: path.node.loc?.start.column || 0,
              snippet: `class ${path.node.id?.name}`,
              context: 'Class Component',
            });
          }
        },
      });
    }

    return occurrences;
  }

  private async detectTypeScriptInterfaces(
    code: string,
    filePath: string
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    const interfacePattern = /interface\s+([A-Z][a-zA-Z0-9]*)/g;
    
    let match;
    while ((match = interfacePattern.exec(code)) !== null) {
      const lines = code.substring(0, match.index).split('\n');
      occurrences.push({
        file: filePath,
        line: lines.length,
        column: lines[lines.length - 1].length,
        snippet: match[0],
        context: `Interface: ${match[1]}`,
      });
    }

    return occurrences;
  }

  private async detectTypeSafety(
    code: string,
    filePath: string
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    const anyPattern = /:\s*any\b/g;
    
    let match;
    while ((match = anyPattern.exec(code)) !== null) {
      const lines = code.substring(0, match.index).split('\n');
      occurrences.push({
        file: filePath,
        line: lines.length,
        column: lines[lines.length - 1].length,
        snippet: match[0],
        context: 'Type safety issue: using "any"',
      });
    }

    return occurrences;
  }

  private async detectSingletonPattern(
    code: string,
    filePath: string
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    const singletonPattern = /getInstance|_instance|singleton/gi;
    
    let match;
    while ((match = singletonPattern.exec(code)) !== null) {
      const lines = code.substring(0, match.index).split('\n');
      occurrences.push({
        file: filePath,
        line: lines.length,
        column: lines[lines.length - 1].length,
        snippet: match[0],
        context: 'Singleton pattern indicator',
      });
    }

    return occurrences;
  }

  private async detectFactoryPattern(
    code: string,
    filePath: string
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    const factoryPattern = /create[A-Z][a-zA-Z]*|factory|Factory/g;
    
    let match;
    while ((match = factoryPattern.exec(code)) !== null) {
      const lines = code.substring(0, match.index).split('\n');
      occurrences.push({
        file: filePath,
        line: lines.length,
        column: lines[lines.length - 1].length,
        snippet: match[0],
        context: 'Factory pattern indicator',
      });
    }

    return occurrences;
  }

  private async detectDependencyInjection(
    code: string,
    filePath: string
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    const diPattern = /@inject|@injectable|Container|Provider/g;
    
    let match;
    while ((match = diPattern.exec(code)) !== null) {
      const lines = code.substring(0, match.index).split('\n');
      occurrences.push({
        file: filePath,
        line: lines.length,
        column: lines[lines.length - 1].length,
        snippet: match[0],
        context: 'Dependency injection pattern',
      });
    }

    return occurrences;
  }

  private async detectSecurityIssues(
    code: string,
    filePath: string
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    
    // Check for potential SQL injection
    const sqlPattern = /query\(.*\+.*\)|query\(`.*\${.*}`\)/g;
    let match;
    while ((match = sqlPattern.exec(code)) !== null) {
      const lines = code.substring(0, match.index).split('\n');
      occurrences.push({
        file: filePath,
        line: lines.length,
        column: lines[lines.length - 1].length,
        snippet: match[0].substring(0, 50),
        context: 'Potential SQL injection vulnerability',
      });
    }

    // Check for hardcoded secrets
    const secretPattern = /api[_-]?key|secret|password|token/gi;
    const valuePattern = /['"][a-zA-Z0-9]{20,}['"]/g;
    
    let secretMatch;
    while ((secretMatch = secretPattern.exec(code)) !== null) {
      const nearbyCode = code.substring(
        Math.max(0, secretMatch.index - 50),
        Math.min(code.length, secretMatch.index + 100)
      );
      
      if (valuePattern.test(nearbyCode)) {
        const lines = code.substring(0, secretMatch.index).split('\n');
        occurrences.push({
          file: filePath,
          line: lines.length,
          column: lines[lines.length - 1].length,
          snippet: secretMatch[0],
          context: 'Potential hardcoded secret',
        });
      }
    }

    return occurrences;
  }

  private async detectAuthPatterns(
    code: string,
    filePath: string
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    const authPattern = /auth|authenticate|authorization|login|logout|session/gi;
    
    let match;
    while ((match = authPattern.exec(code)) !== null) {
      const lines = code.substring(0, match.index).split('\n');
      occurrences.push({
        file: filePath,
        line: lines.length,
        column: lines[lines.length - 1].length,
        snippet: match[0],
        context: 'Authentication pattern',
      });
    }

    return occurrences;
  }

  private async detectPerformancePatterns(
    code: string,
    filePath: string
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    
    // Check for unnecessary re-renders
    const rerenderPattern = /\[\]/g;
    let match;
    while ((match = rerenderPattern.exec(code)) !== null) {
      if (code.substring(match.index - 20, match.index).includes('useEffect')) {
        const lines = code.substring(0, match.index).split('\n');
        occurrences.push({
          file: filePath,
          line: lines.length,
          column: lines[lines.length - 1].length,
          snippet: 'useEffect(..., [])',
          context: 'Empty dependency array (good practice)',
        });
      }
    }

    return occurrences;
  }

  private async detectMemoization(
    code: string,
    filePath: string
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    const memoPattern = /useMemo|useCallback|React\.memo|memoize/g;
    
    let match;
    while ((match = memoPattern.exec(code)) !== null) {
      const lines = code.substring(0, match.index).split('\n');
      occurrences.push({
        file: filePath,
        line: lines.length,
        column: lines[lines.length - 1].length,
        snippet: match[0],
        context: 'Memoization pattern',
      });
    }

    return occurrences;
  }

  private async detectTestPatterns(
    code: string,
    filePath: string
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    const testPattern = /describe|it|test|expect|jest|vitest/g;
    
    let match;
    while ((match = testPattern.exec(code)) !== null) {
      const lines = code.substring(0, match.index).split('\n');
      occurrences.push({
        file: filePath,
        line: lines.length,
        column: lines[lines.length - 1].length,
        snippet: match[0],
        context: 'Test pattern',
      });
    }

    return occurrences;
  }

  private async detectRestApiPatterns(
    code: string,
    filePath: string
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    const apiPattern = /app\.(get|post|put|delete|patch)|router\.(get|post|put|delete|patch)/g;
    
    let match;
    while ((match = apiPattern.exec(code)) !== null) {
      const lines = code.substring(0, match.index).split('\n');
      occurrences.push({
        file: filePath,
        line: lines.length,
        column: lines[lines.length - 1].length,
        snippet: match[0],
        context: 'REST API endpoint',
      });
    }

    return occurrences;
  }

  private async detectGraphQLPatterns(
    code: string,
    filePath: string
  ): Promise<PatternOccurrence[]> {
    const occurrences: PatternOccurrence[] = [];
    const graphqlPattern = /type\s+\w+\s*{|Query|Mutation|Subscription|resolver|gql/g;
    
    let match;
    while ((match = graphqlPattern.exec(code)) !== null) {
      const lines = code.substring(0, match.index).split('\n');
      occurrences.push({
        file: filePath,
        line: lines.length,
        column: lines[lines.length - 1].length,
        snippet: match[0],
        context: 'GraphQL pattern',
      });
    }

    return occurrences;
  }

  /**
   * Helper methods
   */

  private async findFiles(
    directory: string,
    options: {
      include?: string[];
      exclude?: string[];
    }
  ): Promise<string[]> {
    const patterns = options.include || ['**/*.{js,jsx,ts,tsx}'];
    const ignore = options.exclude || ['**/node_modules/**', '**/dist/**', '**/build/**'];
    
    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: directory,
        ignore,
        absolute: true,
      });
      files.push(...matches);
    }
    
    return files;
  }

  private getLanguageFromExtension(ext: string): string {
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
    };
    
    return languageMap[ext] || 'unknown';
  }

  private getApplicableRules(
    language: string,
    options: {
      categories?: PatternCategory[];
      patterns?: string[];
    }
  ): PatternRule[] {
    let rules = Array.from(this.patterns.values());
    
    if (options.categories) {
      rules = rules.filter(r => options.categories!.includes(r.category));
    }
    
    if (options.patterns) {
      rules = rules.filter(r => options.patterns!.includes(r.id));
    }
    
    return rules;
  }

  private calculateConfidence(occurrences: PatternOccurrence[]): number {
    // Simple confidence calculation based on occurrence count
    const count = occurrences.length;
    if (count === 0) return 0;
    if (count === 1) return 0.5;
    if (count < 5) return 0.7;
    if (count < 10) return 0.85;
    return Math.min(0.95, 0.85 + (count - 10) * 0.01);
  }

  private aggregatePatterns(patterns: CodePattern[]): CodePattern[] {
    const aggregated = new Map<string, CodePattern>();
    
    for (const pattern of patterns) {
      const key = `${pattern.id}:${pattern.category}`;
      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.occurrences.push(...pattern.occurrences);
        existing.confidence = this.calculateConfidence(existing.occurrences);
      } else {
        aggregated.set(key, pattern);
      }
    }
    
    return Array.from(aggregated.values());
  }

  /**
   * Generate pattern report
   */
  generateReport(patterns: CodePattern[]): string {
    const report: string[] = ['# Pattern Recognition Report\n'];
    
    // Group by category
    const byCategory = new Map<PatternCategory, CodePattern[]>();
    for (const pattern of patterns) {
      if (!byCategory.has(pattern.category)) {
        byCategory.set(pattern.category, []);
      }
      byCategory.get(pattern.category)!.push(pattern);
    }
    
    // Generate report sections
    for (const [category, categoryPatterns] of byCategory) {
      report.push(`\n## ${category.toUpperCase()}\n`);
      
      for (const pattern of categoryPatterns) {
        report.push(`### ${pattern.name}`);
        report.push(`- **Description**: ${pattern.description}`);
        report.push(`- **Confidence**: ${(pattern.confidence * 100).toFixed(1)}%`);
        report.push(`- **Occurrences**: ${pattern.occurrences.length}`);
        
        if (pattern.metadata?.severity) {
          report.push(`- **Severity**: ${pattern.metadata.severity}`);
        }
        
        // Sample occurrences
        const samples = pattern.occurrences.slice(0, 3);
        if (samples.length > 0) {
          report.push('\n**Examples:**');
          for (const occurrence of samples) {
            report.push(`- ${occurrence.file}:${occurrence.line} - ${occurrence.context}`);
          }
        }
        
        report.push('');
      }
    }
    
    return report.join('\n');
  }
}