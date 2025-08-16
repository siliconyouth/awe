/**
 * Intelligent Configuration Generator
 * 
 * Analyzes project context and generates optimal configuration files
 * for various tools and frameworks based on patterns and best practices.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { PatternRecognitionEngine, PatternCategory } from './pattern-recognition.js';
import type { CodePattern } from './pattern-recognition.js';

// Configuration templates for different tools
export interface ConfigTemplate {
  name: string;
  description: string;
  tool: string;
  template: Record<string, any>;
  requiredPatterns?: string[];
  optionalPatterns?: string[];
  conflictingPatterns?: string[];
}

export interface GeneratedConfig {
  tool: string;
  filename: string;
  content: string;
  confidence: number;
  reasoning: string[];
  warnings?: string[];
}

export interface ConfigGeneratorOptions {
  targetDir?: string;
  tools?: string[];
  force?: boolean;
  dryRun?: boolean;
  interactive?: boolean;
}

export class IntelligentConfigGenerator {
  private templates: Map<string, ConfigTemplate> = new Map();
  private patternEngine: PatternRecognitionEngine;

  constructor() {
    this.patternEngine = new PatternRecognitionEngine();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // ESLint configuration
    this.templates.set('eslint', {
      name: 'ESLint Configuration',
      description: 'Modern ESLint configuration with TypeScript support',
      tool: 'eslint',
      template: {
        env: {
          browser: true,
          es2022: true,
          node: true,
        },
        extends: [
          'eslint:recommended',
        ],
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
        plugins: [],
        rules: {
          'no-unused-vars': 'warn',
          'no-console': 'warn',
          'prefer-const': 'error',
        },
      },
      requiredPatterns: ['typescript'],
      optionalPatterns: ['react', 'next.js'],
    });

    // Prettier configuration
    this.templates.set('prettier', {
      name: 'Prettier Configuration',
      description: 'Code formatting configuration',
      tool: 'prettier',
      template: {
        semi: true,
        trailingComma: 'es5',
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
        useTabs: false,
        bracketSpacing: true,
        arrowParens: 'always',
      },
      optionalPatterns: ['typescript', 'react'],
    });

    // TypeScript configuration
    this.templates.set('typescript', {
      name: 'TypeScript Configuration',
      description: 'TypeScript compiler configuration',
      tool: 'typescript',
      template: {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          lib: ['ES2022'],
          jsx: 'react-jsx',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          declaration: true,
          declarationMap: true,
          sourceMap: true,
          outDir: './dist',
          rootDir: './src',
          resolveJsonModule: true,
          allowSyntheticDefaultImports: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts'],
      },
      requiredPatterns: ['typescript'],
      optionalPatterns: ['react', 'jest', 'vitest'],
    });

    // Jest configuration
    this.templates.set('jest', {
      name: 'Jest Configuration',
      description: 'Testing framework configuration',
      tool: 'jest',
      template: {
        preset: 'ts-jest',
        testEnvironment: 'node',
        roots: ['<rootDir>/src'],
        testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
        transform: {
          '^.+\\.tsx?$': 'ts-jest',
        },
        collectCoverageFrom: [
          'src/**/*.{ts,tsx}',
          '!src/**/*.d.ts',
          '!src/**/index.ts',
          '!src/**/*.stories.ts',
        ],
        coverageThreshold: {
          global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
          },
        },
      },
      requiredPatterns: ['testing'],
      optionalPatterns: ['typescript', 'react'],
    });

    // Vitest configuration
    this.templates.set('vitest', {
      name: 'Vitest Configuration',
      description: 'Modern testing framework configuration',
      tool: 'vitest',
      template: {
        test: {
          globals: true,
          environment: 'node',
          coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
              'node_modules',
              'dist',
              '**/*.d.ts',
              '**/*.config.*',
              '**/mockData',
              '**/*.stories.ts',
            ],
          },
        },
      },
      requiredPatterns: ['testing'],
      optionalPatterns: ['typescript', 'react'],
    });

    // Husky configuration
    this.templates.set('husky', {
      name: 'Husky Git Hooks',
      description: 'Git hooks configuration',
      tool: 'husky',
      template: {
        hooks: {
          'pre-commit': 'lint-staged',
          'commit-msg': 'commitlint -E HUSKY_GIT_PARAMS',
          'pre-push': 'npm test',
        },
      },
      optionalPatterns: ['git', 'testing'],
    });

    // Commitlint configuration
    this.templates.set('commitlint', {
      name: 'Commitlint Configuration',
      description: 'Commit message linting',
      tool: 'commitlint',
      template: {
        extends: ['@commitlint/config-conventional'],
        rules: {
          'type-enum': [
            2,
            'always',
            [
              'feat',
              'fix',
              'docs',
              'style',
              'refactor',
              'perf',
              'test',
              'chore',
              'revert',
              'build',
              'ci',
            ],
          ],
        },
      },
      optionalPatterns: ['git'],
    });

    // GitHub Actions CI/CD
    this.templates.set('github-actions', {
      name: 'GitHub Actions CI/CD',
      description: 'Continuous Integration workflow',
      tool: 'github-actions',
      template: {
        name: 'CI',
        on: {
          push: {
            branches: ['main', 'develop'],
          },
          pull_request: {
            branches: ['main'],
          },
        },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              {
                uses: 'actions/checkout@v4',
              },
              {
                name: 'Setup Node.js',
                uses: 'actions/setup-node@v4',
                with: {
                  'node-version': '22',
                  'cache': 'npm',
                },
              },
              {
                name: 'Install dependencies',
                run: 'npm ci',
              },
              {
                name: 'Run tests',
                run: 'npm test',
              },
              {
                name: 'Build',
                run: 'npm run build',
              },
            ],
          },
        },
      },
      requiredPatterns: ['git'],
      optionalPatterns: ['testing', 'typescript'],
    });

    // Docker configuration
    this.templates.set('docker', {
      name: 'Docker Configuration',
      description: 'Container configuration',
      tool: 'docker',
      template: {
        dockerfile: [
          'FROM node:22-alpine',
          '',
          'WORKDIR /app',
          '',
          'COPY package*.json ./',
          'RUN npm ci --only=production',
          '',
          'COPY . .',
          '',
          'EXPOSE 3000',
          'CMD ["npm", "start"]',
        ].join('\n'),
        dockerignore: [
          'node_modules',
          'npm-debug.log',
          '.git',
          '.gitignore',
          'README.md',
          '.env',
          'coverage',
          '.coverage',
          '.vscode',
          '.idea',
          '.DS_Store',
        ].join('\n'),
      },
      optionalPatterns: ['node.js', 'express'],
    });

    // Tailwind CSS configuration
    this.templates.set('tailwind', {
      name: 'Tailwind CSS Configuration',
      description: 'Utility-first CSS framework configuration',
      tool: 'tailwind',
      template: {
        content: [
          './src/**/*.{js,ts,jsx,tsx,mdx}',
          './app/**/*.{js,ts,jsx,tsx,mdx}',
          './pages/**/*.{js,ts,jsx,tsx,mdx}',
          './components/**/*.{js,ts,jsx,tsx,mdx}',
        ],
        theme: {
          extend: {
            colors: {
              primary: {
                50: '#eff6ff',
                500: '#3b82f6',
                900: '#1e3a8a',
              },
            },
          },
        },
        plugins: [],
      },
      requiredPatterns: ['css', 'tailwind'],
      optionalPatterns: ['react', 'next.js'],
    });
  }

  /**
   * Analyze project and generate configurations
   */
  async generateConfigurations(
    projectDir: string,
    options: ConfigGeneratorOptions = {}
  ): Promise<GeneratedConfig[]> {
    const configs: GeneratedConfig[] = [];

    // Analyze project patterns
    const patterns = await this.patternEngine.analyzeCodebase(projectDir);
    const detectedPatternIds = new Set(patterns.map(p => p.id));

    // Check each template
    for (const [toolName, template] of this.templates) {
      // Skip if specific tools requested and this isn't one
      if (options.tools && !options.tools.includes(toolName)) {
        continue;
      }

      // Check if configuration already exists
      const existingConfig = await this.checkExistingConfig(projectDir, toolName);
      if (existingConfig && !options.force) {
        continue;
      }

      // Calculate confidence based on pattern matching
      const confidence = this.calculateConfidence(template, detectedPatternIds);
      
      if (confidence > 0.5) {
        const config = await this.generateConfig(
          template,
          patterns,
          projectDir,
          confidence
        );
        configs.push(config);
      }
    }

    // Write configurations if not dry run
    if (!options.dryRun) {
      for (const config of configs) {
        await this.writeConfig(projectDir, config);
      }
    }

    return configs;
  }

  /**
   * Calculate confidence score for a template
   */
  private calculateConfidence(
    template: ConfigTemplate,
    detectedPatterns: Set<string>
  ): number {
    let score = 0.5; // Base score

    // Check required patterns
    if (template.requiredPatterns) {
      const hasRequired = template.requiredPatterns.every(p => detectedPatterns.has(p));
      if (!hasRequired) return 0; // Missing required patterns
      score += 0.3;
    }

    // Check optional patterns
    if (template.optionalPatterns) {
      const matchedOptional = template.optionalPatterns.filter(p => detectedPatterns.has(p));
      score += (matchedOptional.length / template.optionalPatterns.length) * 0.2;
    }

    // Check conflicting patterns
    if (template.conflictingPatterns) {
      const hasConflicts = template.conflictingPatterns.some(p => detectedPatterns.has(p));
      if (hasConflicts) score -= 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Generate configuration based on template and patterns
   */
  private async generateConfig(
    template: ConfigTemplate,
    patterns: CodePattern[],
    projectDir: string,
    confidence: number
  ): Promise<GeneratedConfig> {
    const reasoning: string[] = [];
    const warnings: string[] = [];
    let config = JSON.parse(JSON.stringify(template.template));

    // Enhance configuration based on detected patterns
    switch (template.tool) {
      case 'eslint':
        config = await this.enhanceESLintConfig(config, patterns, reasoning);
        break;
      case 'typescript':
        config = await this.enhanceTypeScriptConfig(config, patterns, projectDir, reasoning);
        break;
      case 'jest':
      case 'vitest':
        config = await this.enhanceTestConfig(config, patterns, template.tool, reasoning);
        break;
      case 'github-actions':
        config = await this.enhanceGitHubActionsConfig(config, patterns, reasoning);
        break;
    }

    // Determine filename
    const filename = this.getConfigFilename(template.tool);

    // Format content based on file type
    let content: string;
    if (filename.endsWith('.json')) {
      content = JSON.stringify(config, null, 2);
    } else if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
      content = this.toYAML(config);
    } else if (filename === 'Dockerfile') {
      content = config.dockerfile || '';
    } else if (filename === '.dockerignore') {
      content = config.dockerignore || '';
    } else if (filename.endsWith('.js') || filename.endsWith('.ts')) {
      content = `module.exports = ${JSON.stringify(config, null, 2)};`;
    } else {
      content = JSON.stringify(config, null, 2);
    }

    return {
      tool: template.tool,
      filename,
      content,
      confidence,
      reasoning,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Enhance ESLint configuration based on patterns
   */
  private async enhanceESLintConfig(
    config: any,
    patterns: CodePattern[],
    reasoning: string[]
  ): Promise<any> {
    // Check for React patterns
    const hasReact = patterns.some(p => p.id === 'react-components');
    if (hasReact) {
      config.extends.push('plugin:react/recommended');
      config.plugins = config.plugins || [];
      config.plugins.push('react');
      config.settings = {
        react: {
          version: 'detect',
        },
      };
      reasoning.push('Added React ESLint configuration');
    }

    // Check for TypeScript
    const hasTypeScript = patterns.some(p => 
      p.id === 'typescript' || 
      p.occurrences.some(o => o.file.endsWith('.ts') || o.file.endsWith('.tsx'))
    );
    if (hasTypeScript) {
      config.extends.push(
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking'
      );
      config.plugins = config.plugins || [];
      config.plugins.push('@typescript-eslint');
      reasoning.push('Added TypeScript ESLint rules');
    }

    // Check for security issues
    const hasSecurityIssues = patterns.some(p => p.category === PatternCategory.SECURITY);
    if (hasSecurityIssues) {
      config.extends.push('plugin:security/recommended');
      config.plugins = config.plugins || [];
      config.plugins.push('security');
      reasoning.push('Added security linting rules');
    }

    return config;
  }

  /**
   * Enhance TypeScript configuration based on patterns
   */
  private async enhanceTypeScriptConfig(
    config: any,
    patterns: CodePattern[],
    projectDir: string,
    reasoning: string[]
  ): Promise<any> {
    // Check for React
    const hasReact = patterns.some(p => p.id === 'react-components');
    if (hasReact) {
      config.compilerOptions.jsx = 'react-jsx';
      config.compilerOptions.lib = config.compilerOptions.lib || [];
      if (!config.compilerOptions.lib.includes('DOM')) {
        config.compilerOptions.lib.push('DOM');
      }
      reasoning.push('Configured for React development');
    }

    // Check for Node.js patterns
    const hasNode = patterns.some(p => 
      p.occurrences.some(o => o.context?.includes('express') || o.context?.includes('http'))
    );
    if (hasNode) {
      config.compilerOptions.types = config.compilerOptions.types || [];
      config.compilerOptions.types.push('node');
      reasoning.push('Added Node.js types');
    }

    // Check for decorators
    const hasDecorators = patterns.some(p => 
      p.occurrences.some(o => o.context?.includes('@'))
    );
    if (hasDecorators) {
      config.compilerOptions.experimentalDecorators = true;
      config.compilerOptions.emitDecoratorMetadata = true;
      reasoning.push('Enabled decorator support');
    }

    // Detect monorepo structure
    const isMonorepo = await this.detectMonorepo(projectDir);
    if (isMonorepo) {
      config.compilerOptions.composite = true;
      config.references = [];
      reasoning.push('Configured for monorepo with project references');
    }

    return config;
  }

  /**
   * Enhance test configuration based on patterns
   */
  private async enhanceTestConfig(
    config: any,
    patterns: CodePattern[],
    tool: string,
    reasoning: string[]
  ): Promise<any> {
    // Check for React testing
    const hasReactTesting = patterns.some(p => 
      p.occurrences.some(o => 
        o.context?.includes('@testing-library/react') ||
        o.context?.includes('render(')
      )
    );

    if (hasReactTesting) {
      if (tool === 'jest') {
        config.testEnvironment = 'jsdom';
        config.setupFilesAfterEnv = ['<rootDir>/src/setupTests.ts'];
      } else if (tool === 'vitest') {
        config.test.environment = 'jsdom';
        config.test.setupFiles = ['./src/setupTests.ts'];
      }
      reasoning.push('Configured for React component testing');
    }

    // Check for E2E testing patterns
    const hasE2E = patterns.some(p => 
      p.occurrences.some(o => 
        o.context?.includes('playwright') ||
        o.context?.includes('cypress') ||
        o.context?.includes('puppeteer')
      )
    );

    if (hasE2E) {
      config.testMatch = config.testMatch || [];
      config.testMatch.push('**/*.e2e.{ts,tsx}');
      reasoning.push('Added E2E test file patterns');
    }

    return config;
  }

  /**
   * Enhance GitHub Actions configuration
   */
  private async enhanceGitHubActionsConfig(
    config: any,
    patterns: CodePattern[],
    reasoning: string[]
  ): Promise<any> {
    // Check for different package managers
    const hasYarn = patterns.some(p => 
      p.occurrences.some(o => o.file.includes('yarn.lock'))
    );
    const hasPnpm = patterns.some(p => 
      p.occurrences.some(o => o.file.includes('pnpm-lock.yaml'))
    );

    if (hasYarn) {
      config.jobs.test.steps[1].with.cache = 'yarn';
      config.jobs.test.steps[2].run = 'yarn install --frozen-lockfile';
      config.jobs.test.steps[3].run = 'yarn test';
      config.jobs.test.steps[4].run = 'yarn build';
      reasoning.push('Configured for Yarn package manager');
    } else if (hasPnpm) {
      config.jobs.test.steps[1].with.cache = 'pnpm';
      config.jobs.test.steps.splice(2, 0, {
        name: 'Install pnpm',
        uses: 'pnpm/action-setup@v2',
        with: {
          version: 8,
        },
      });
      config.jobs.test.steps[3].run = 'pnpm install --frozen-lockfile';
      config.jobs.test.steps[4].run = 'pnpm test';
      config.jobs.test.steps[5].run = 'pnpm build';
      reasoning.push('Configured for pnpm package manager');
    }

    // Add linting step if ESLint detected
    const hasLinting = patterns.some(p => 
      p.occurrences.some(o => o.file.includes('.eslintrc'))
    );
    if (hasLinting) {
      config.jobs.test.steps.splice(3, 0, {
        name: 'Run linting',
        run: 'npm run lint',
      });
      reasoning.push('Added linting step');
    }

    return config;
  }

  /**
   * Check if configuration already exists
   */
  private async checkExistingConfig(projectDir: string, tool: string): Promise<boolean> {
    const filename = this.getConfigFilename(tool);
    const configPath = path.join(projectDir, filename);
    
    try {
      await fs.access(configPath);
      return true;
    } catch {
      // Also check for alternative filenames
      const alternatives = this.getAlternativeFilenames(tool);
      for (const alt of alternatives) {
        try {
          await fs.access(path.join(projectDir, alt));
          return true;
        } catch {
          continue;
        }
      }
      return false;
    }
  }

  /**
   * Get configuration filename for a tool
   */
  private getConfigFilename(tool: string): string {
    const filenames: Record<string, string> = {
      eslint: '.eslintrc.json',
      prettier: '.prettierrc',
      typescript: 'tsconfig.json',
      jest: 'jest.config.js',
      vitest: 'vitest.config.ts',
      husky: '.huskyrc.json',
      commitlint: 'commitlint.config.js',
      'github-actions': '.github/workflows/ci.yml',
      docker: 'Dockerfile',
      tailwind: 'tailwind.config.js',
    };
    return filenames[tool] || `${tool}.config.json`;
  }

  /**
   * Get alternative filenames for a tool
   */
  private getAlternativeFilenames(tool: string): string[] {
    const alternatives: Record<string, string[]> = {
      eslint: ['.eslintrc', '.eslintrc.js', '.eslintrc.yml', 'eslint.config.js'],
      prettier: ['.prettierrc.json', '.prettierrc.js', 'prettier.config.js'],
      typescript: ['tsconfig.base.json'],
      jest: ['jest.config.ts', 'jest.config.json'],
      vitest: ['vitest.config.js', 'vite.config.ts'],
      commitlint: ['.commitlintrc.js', '.commitlintrc.json'],
    };
    return alternatives[tool] || [];
  }

  /**
   * Write configuration to file
   */
  private async writeConfig(projectDir: string, config: GeneratedConfig): Promise<void> {
    const configPath = path.join(projectDir, config.filename);
    const configDir = path.dirname(configPath);

    // Create directory if needed
    await fs.mkdir(configDir, { recursive: true });

    // Write file
    await fs.writeFile(configPath, config.content, 'utf-8');
  }

  /**
   * Detect if project is a monorepo
   */
  private async detectMonorepo(projectDir: string): Promise<boolean> {
    const indicators = [
      'lerna.json',
      'pnpm-workspace.yaml',
      'rush.json',
      'nx.json',
    ];

    for (const indicator of indicators) {
      try {
        await fs.access(path.join(projectDir, indicator));
        return true;
      } catch {
        continue;
      }
    }

    // Check for workspaces in package.json
    try {
      const packageJson = await fs.readFile(path.join(projectDir, 'package.json'), 'utf-8');
      const pkg = JSON.parse(packageJson);
      return !!(pkg.workspaces || pkg.bolt?.workspaces);
    } catch {
      return false;
    }
  }

  /**
   * Convert object to YAML format
   */
  private toYAML(obj: any, indent: number = 0): string {
    const lines: string[] = [];
    const spaces = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        lines.push(`${spaces}${key}:`);
      } else if (Array.isArray(value)) {
        lines.push(`${spaces}${key}:`);
        for (const item of value) {
          if (typeof item === 'object') {
            lines.push(`${spaces}  -`);
            lines.push(this.toYAML(item, indent + 2));
          } else {
            lines.push(`${spaces}  - ${item}`);
          }
        }
      } else if (typeof value === 'object') {
        lines.push(`${spaces}${key}:`);
        lines.push(this.toYAML(value, indent + 1));
      } else {
        lines.push(`${spaces}${key}: ${value}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate report of recommended configurations
   */
  generateReport(configs: GeneratedConfig[]): string {
    const lines: string[] = [
      '# Configuration Generation Report',
      '',
      `Generated ${configs.length} configuration files`,
      '',
    ];

    for (const config of configs) {
      lines.push(`## ${config.tool}`);
      lines.push(`File: ${config.filename}`);
      lines.push(`Confidence: ${Math.round(config.confidence * 100)}%`);
      
      if (config.reasoning.length > 0) {
        lines.push('');
        lines.push('### Reasoning:');
        for (const reason of config.reasoning) {
          lines.push(`- ${reason}`);
        }
      }

      if (config.warnings && config.warnings.length > 0) {
        lines.push('');
        lines.push('### Warnings:');
        for (const warning of config.warnings) {
          lines.push(`- ⚠️ ${warning}`);
        }
      }

      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }
}