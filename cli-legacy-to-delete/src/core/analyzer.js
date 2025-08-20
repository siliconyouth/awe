/**
 * Project Analyzer - Core component for analyzing project structure and patterns
 * 
 * This module provides intelligent analysis of codebases to identify:
 * - Project type and technology stack
 * - Architecture patterns
 * - Optimization opportunities
 * - Claude Code integration potential
 */

const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');
const ignore = require('ignore');
const { logger } = require('../utils/logger');

class ProjectAnalyzer {
  constructor(options = {}) {
    this.options = options;
    this.cache = new Map();
  }

  /**
   * Analyze a project directory
   * @param {string} projectPath - Path to the project
   * @returns {Object} Analysis results
   */
  async analyzeProject(projectPath) {
    logger.info('Analyzing project:', projectPath);
    
    const cacheKey = path.resolve(projectPath);
    if (this.cache.has(cacheKey)) {
      logger.debug('Using cached analysis for:', projectPath);
      return this.cache.get(cacheKey);
    }

    try {
      const analysis = {
        path: projectPath,
        timestamp: new Date().toISOString(),
        structure: await this.analyzeStructure(projectPath),
        dependencies: await this.analyzeDependencies(projectPath),
        languages: await this.analyzeLanguages(projectPath),
        frameworks: await this.analyzeFrameworks(projectPath),
        patterns: await this.analyzePatterns(projectPath),
        configuration: await this.analyzeConfiguration(projectPath),
        git: await this.analyzeGit(projectPath),
        claudeCode: await this.analyzeClaudeCodeSetup(projectPath),
        metrics: await this.calculateMetrics(projectPath),
        classification: null // Will be set after analysis
      };

      // Classify project based on analysis
      analysis.classification = this.classifyProject(analysis);

      // Cache result
      this.cache.set(cacheKey, analysis);

      logger.debug('Project analysis complete:', {
        type: analysis.classification.type,
        languages: analysis.languages.primary,
        frameworks: analysis.frameworks.detected
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze project:', error.message);
      throw error;
    }
  }

  /**
   * Analyze project structure
   */
  async analyzeStructure(projectPath) {
    const structure = {
      directories: [],
      files: [],
      totalFiles: 0,
      totalSize: 0,
      depth: 0
    };

    try {
      const ig = ignore();
      const gitignorePath = path.join(projectPath, '.gitignore');
      
      if (await fs.pathExists(gitignorePath)) {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
        ig.add(gitignoreContent);
      }

      // Add common ignore patterns
      ig.add([
        'node_modules',
        '.git',
        '.DS_Store',
        '*.log',
        'dist',
        'build',
        '.cache'
      ]);

      const files = await globAsync('**/*', {
        cwd: projectPath,
        dot: true,
        ignore: ['node_modules/**', '.git/**']
      });

      for (const file of files) {
        if (ig.ignores(file)) continue;

        const fullPath = path.join(projectPath, file);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          structure.directories.push({
            path: file,
            name: path.basename(file)
          });
        } else {
          structure.files.push({
            path: file,
            name: path.basename(file),
            extension: path.extname(file),
            size: stats.size
          });
          structure.totalFiles++;
          structure.totalSize += stats.size;
        }

        // Calculate max depth
        const depth = file.split(path.sep).length;
        structure.depth = Math.max(structure.depth, depth);
      }

      return structure;
    } catch (error) {
      logger.error('Failed to analyze structure:', error.message);
      return structure;
    }
  }

  /**
   * Analyze project dependencies
   */
  async analyzeDependencies(projectPath) {
    const dependencies = {
      packageManager: null,
      dependencies: [],
      devDependencies: [],
      peerDependencies: [],
      scripts: {}
    };

    try {
      // Check for package.json (Node.js)
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        dependencies.packageManager = 'npm';
        dependencies.dependencies = Object.keys(packageJson.dependencies || {});
        dependencies.devDependencies = Object.keys(packageJson.devDependencies || {});
        dependencies.peerDependencies = Object.keys(packageJson.peerDependencies || {});
        dependencies.scripts = packageJson.scripts || {};
        return dependencies;
      }

      // Check for requirements.txt (Python)
      const requirementsPath = path.join(projectPath, 'requirements.txt');
      if (await fs.pathExists(requirementsPath)) {
        const requirements = await fs.readFile(requirementsPath, 'utf8');
        dependencies.packageManager = 'pip';
        dependencies.dependencies = requirements
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim());
        return dependencies;
      }

      // Check for Cargo.toml (Rust)
      const cargoPath = path.join(projectPath, 'Cargo.toml');
      if (await fs.pathExists(cargoPath)) {
        dependencies.packageManager = 'cargo';
        // Basic parsing - could be enhanced with proper TOML parser
        const cargoContent = await fs.readFile(cargoPath, 'utf8');
        const depSection = cargoContent.match(/\[dependencies\]([\s\S]*?)(?=\[|$)/);
        if (depSection) {
          const deps = depSection[1]
            .split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => line.split('=')[0].trim())
            .filter(dep => dep);
          dependencies.dependencies = deps;
        }
        return dependencies;
      }

      return dependencies;
    } catch (error) {
      logger.error('Failed to analyze dependencies:', error.message);
      return dependencies;
    }
  }

  /**
   * Analyze programming languages used
   */
  async analyzeLanguages(projectPath) {
    const languages = {
      primary: null,
      detected: {},
      total: 0
    };

    try {
      const languageMap = {
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.py': 'Python',
        '.rs': 'Rust',
        '.go': 'Go',
        '.java': 'Java',
        '.cpp': 'C++',
        '.c': 'C',
        '.cs': 'C#',
        '.php': 'PHP',
        '.rb': 'Ruby',
        '.swift': 'Swift',
        '.kt': 'Kotlin',
        '.dart': 'Dart',
        '.vue': 'Vue',
        '.svelte': 'Svelte'
      };

      const files = await globAsync('**/*', {
        cwd: projectPath,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (languageMap[ext]) {
          const language = languageMap[ext];
          languages.detected[language] = (languages.detected[language] || 0) + 1;
          languages.total++;
        }
      }

      // Find primary language
      if (Object.keys(languages.detected).length > 0) {
        languages.primary = Object.entries(languages.detected)
          .sort(([,a], [,b]) => b - a)[0][0];
      }

      return languages;
    } catch (error) {
      logger.error('Failed to analyze languages:', error.message);
      return languages;
    }
  }

  /**
   * Analyze frameworks and libraries
   */
  async analyzeFrameworks(projectPath) {
    const frameworks = {
      detected: [],
      frontend: [],
      backend: [],
      testing: [],
      buildTools: []
    };

    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };

        const frameworkPatterns = {
          // Frontend
          'react': { name: 'React', category: 'frontend' },
          'vue': { name: 'Vue.js', category: 'frontend' },
          'angular': { name: 'Angular', category: 'frontend' },
          'svelte': { name: 'Svelte', category: 'frontend' },
          'next': { name: 'Next.js', category: 'frontend' },
          'nuxt': { name: 'Nuxt.js', category: 'frontend' },
          'gatsby': { name: 'Gatsby', category: 'frontend' },
          
          // Backend
          'express': { name: 'Express.js', category: 'backend' },
          'fastify': { name: 'Fastify', category: 'backend' },
          'koa': { name: 'Koa.js', category: 'backend' },
          'nestjs': { name: 'NestJS', category: 'backend' },
          'django': { name: 'Django', category: 'backend' },
          'flask': { name: 'Flask', category: 'backend' },
          'rails': { name: 'Ruby on Rails', category: 'backend' },
          
          // Testing
          'jest': { name: 'Jest', category: 'testing' },
          'mocha': { name: 'Mocha', category: 'testing' },
          'cypress': { name: 'Cypress', category: 'testing' },
          'playwright': { name: 'Playwright', category: 'testing' },
          'vitest': { name: 'Vitest', category: 'testing' },
          
          // Build Tools
          'webpack': { name: 'Webpack', category: 'buildTools' },
          'vite': { name: 'Vite', category: 'buildTools' },
          'rollup': { name: 'Rollup', category: 'buildTools' },
          'parcel': { name: 'Parcel', category: 'buildTools' },
          'esbuild': { name: 'ESBuild', category: 'buildTools' }
        };

        for (const [pattern, info] of Object.entries(frameworkPatterns)) {
          for (const dep of Object.keys(allDeps)) {
            if (dep.includes(pattern)) {
              frameworks.detected.push(info.name);
              frameworks[info.category].push(info.name);
              break;
            }
          }
        }
      }

      // Check for specific framework files
      const frameworkFiles = {
        'vue.config.js': 'Vue.js',
        'nuxt.config.js': 'Nuxt.js',
        'next.config.js': 'Next.js',
        'gatsby-config.js': 'Gatsby',
        'angular.json': 'Angular',
        'svelte.config.js': 'Svelte'
      };

      for (const [file, framework] of Object.entries(frameworkFiles)) {
        if (await fs.pathExists(path.join(projectPath, file))) {
          if (!frameworks.detected.includes(framework)) {
            frameworks.detected.push(framework);
          }
        }
      }

      return frameworks;
    } catch (error) {
      logger.error('Failed to analyze frameworks:', error.message);
      return frameworks;
    }
  }

  /**
   * Analyze code patterns and architecture
   */
  async analyzePatterns(projectPath) {
    const patterns = {
      architecture: [],
      designPatterns: [],
      conventions: {}
    };

    try {
      const structure = await this.analyzeStructure(projectPath);
      
      // Detect common architectural patterns
      const directories = structure.directories.map(d => d.name.toLowerCase());
      
      if (directories.includes('src') && directories.includes('components')) {
        patterns.architecture.push('Component-based');
      }
      
      if (directories.includes('controllers') && directories.includes('models')) {
        patterns.architecture.push('MVC');
      }
      
      if (directories.includes('services') && directories.includes('repositories')) {
        patterns.architecture.push('Repository Pattern');
      }
      
      if (directories.includes('pages') || directories.includes('routes')) {
        patterns.architecture.push('Route-based');
      }

      // Detect naming conventions
      const files = structure.files;
      const jsFiles = files.filter(f => f.extension === '.js' || f.extension === '.jsx');
      
      if (jsFiles.length > 0) {
        const camelCaseCount = jsFiles.filter(f => /^[a-z][a-zA-Z0-9]*\./.test(f.name)).length;
        const kebabCaseCount = jsFiles.filter(f => /^[a-z0-9-]+\./.test(f.name)).length;
        const pascalCaseCount = jsFiles.filter(f => /^[A-Z][a-zA-Z0-9]*\./.test(f.name)).length;
        
        const total = jsFiles.length;
        if (camelCaseCount / total > 0.6) patterns.conventions.naming = 'camelCase';
        else if (kebabCaseCount / total > 0.6) patterns.conventions.naming = 'kebab-case';
        else if (pascalCaseCount / total > 0.6) patterns.conventions.naming = 'PascalCase';
      }

      return patterns;
    } catch (error) {
      logger.error('Failed to analyze patterns:', error.message);
      return patterns;
    }
  }

  /**
   * Analyze configuration files
   */
  async analyzeConfiguration(projectPath) {
    const config = {
      files: [],
      tools: []
    };

    try {
      const configFiles = [
        '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml',
        '.prettierrc', '.prettierrc.json',
        'tsconfig.json',
        'jest.config.js',
        'webpack.config.js',
        'vite.config.js',
        'rollup.config.js',
        '.babelrc', 'babel.config.js',
        'tailwind.config.js',
        'postcss.config.js',
        'docker-compose.yml', 'Dockerfile',
        '.github/workflows',
        '.gitignore',
        'README.md'
      ];

      for (const file of configFiles) {
        if (await fs.pathExists(path.join(projectPath, file))) {
          config.files.push(file);
          
          // Map files to tools
          if (file.includes('eslint')) config.tools.push('ESLint');
          if (file.includes('prettier')) config.tools.push('Prettier');
          if (file.includes('typescript') || file.includes('tsconfig')) config.tools.push('TypeScript');
          if (file.includes('jest')) config.tools.push('Jest');
          if (file.includes('webpack')) config.tools.push('Webpack');
          if (file.includes('vite')) config.tools.push('Vite');
          if (file.includes('docker')) config.tools.push('Docker');
          if (file.includes('github')) config.tools.push('GitHub Actions');
        }
      }

      return config;
    } catch (error) {
      logger.error('Failed to analyze configuration:', error.message);
      return config;
    }
  }

  /**
   * Analyze Git repository information
   */
  async analyzeGit(projectPath) {
    const git = {
      isRepository: false,
      branch: null,
      remotes: [],
      hasChanges: false
    };

    try {
      const gitPath = path.join(projectPath, '.git');
      git.isRepository = await fs.pathExists(gitPath);

      if (git.isRepository) {
        // This would require git commands - simplified for now
        git.branch = 'main'; // Default assumption
      }

      return git;
    } catch (error) {
      logger.error('Failed to analyze git:', error.message);
      return git;
    }
  }

  /**
   * Analyze existing Claude Code setup
   */
  async analyzeClaudeCodeSetup(projectPath) {
    const claudeCode = {
      hasClaudeMd: false,
      claudeMdPath: null,
      hasClaudeDir: false,
      hooks: [],
      agents: [],
      completeness: 0
    };

    try {
      // Check for CLAUDE.md
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
      if (await fs.pathExists(claudeMdPath)) {
        claudeCode.hasClaudeMd = true;
        claudeCode.claudeMdPath = claudeMdPath;
        claudeCode.completeness += 30;
      }

      // Check for .claude directory
      const claudeDirPath = path.join(projectPath, '.claude');
      if (await fs.pathExists(claudeDirPath)) {
        claudeCode.hasClaudeDir = true;
        claudeCode.completeness += 20;

        // Check for hooks
        const hooksPath = path.join(claudeDirPath, 'hooks');
        if (await fs.pathExists(hooksPath)) {
          const hookFiles = await fs.readdir(hooksPath);
          claudeCode.hooks = hookFiles;
          claudeCode.completeness += 25;
        }

        // Check for agents
        const agentsPath = path.join(claudeDirPath, 'agents');
        if (await fs.pathExists(agentsPath)) {
          const agentFiles = await fs.readdir(agentsPath);
          claudeCode.agents = agentFiles;
          claudeCode.completeness += 25;
        }
      }

      return claudeCode;
    } catch (error) {
      logger.error('Failed to analyze Claude Code setup:', error.message);
      return claudeCode;
    }
  }

  /**
   * Calculate project metrics
   */
  async calculateMetrics(projectPath) {
    const metrics = {
      complexity: 0,
      maintainability: 0,
      testCoverage: 0,
      codeQuality: 0
    };

    try {
      // Basic complexity calculation based on file count and structure
      const structure = await this.analyzeStructure(projectPath);
      metrics.complexity = Math.min(structure.totalFiles / 100, 10);

      // Basic maintainability score
      const config = await this.analyzeConfiguration(projectPath);
      metrics.maintainability = config.tools.length * 1.5;

      return metrics;
    } catch (error) {
      logger.error('Failed to calculate metrics:', error.message);
      return metrics;
    }
  }

  /**
   * Classify project based on analysis
   */
  classifyProject(analysis) {
    const classification = {
      type: 'unknown',
      confidence: 0,
      subtype: null,
      characteristics: []
    };

    try {
      const { languages, frameworks, patterns, dependencies } = analysis;

      // Web application classification
      if (frameworks.frontend.length > 0) {
        classification.type = 'web-app';
        classification.subtype = frameworks.frontend[0].toLowerCase();
        classification.confidence = 0.9;
        classification.characteristics.push('frontend');
      }

      // Backend service classification
      if (frameworks.backend.length > 0) {
        if (classification.type === 'web-app') {
          classification.type = 'full-stack';
        } else {
          classification.type = 'backend-service';
        }
        classification.confidence = 0.85;
        classification.characteristics.push('backend');
      }

      // Library/package classification
      if (dependencies.dependencies.length > 0 && frameworks.detected.length === 0) {
        classification.type = 'library';
        classification.confidence = 0.7;
      }

      // CLI tool classification
      if (dependencies.dependencies.includes('commander') || 
          dependencies.dependencies.includes('yargs') ||
          analysis.structure.files.some(f => f.path.includes('bin/'))) {
        classification.type = 'cli-tool';
        classification.confidence = 0.8;
      }

      // Add language characteristics
      if (languages.primary) {
        classification.characteristics.push(languages.primary.toLowerCase());
      }

      // Add architecture patterns
      classification.characteristics.push(...patterns.architecture.map(p => p.toLowerCase()));

      return classification;
    } catch (error) {
      logger.error('Failed to classify project:', error.message);
      return classification;
    }
  }

  /**
   * Find optimization opportunities
   */
  async findOptimizations(analysis) {
    const optimizations = [];

    try {
      // Claude Code setup optimizations
      if (!analysis.claudeCode.hasClaudeMd) {
        optimizations.push({
          type: 'claude-setup',
          priority: 'high',
          title: 'Add CLAUDE.md configuration',
          description: 'Create a CLAUDE.md file to optimize Claude Code interactions',
          impact: 'Significantly improves Claude Code effectiveness'
        });
      }

      if (analysis.claudeCode.completeness < 50) {
        optimizations.push({
          type: 'claude-enhancement',
          priority: 'medium',
          title: 'Enhance Claude Code setup',
          description: 'Add hooks, agents, or improve existing CLAUDE.md',
          impact: 'Better automation and context management'
        });
      }

      // Development tooling optimizations
      if (!analysis.configuration.tools.includes('ESLint')) {
        optimizations.push({
          type: 'tooling',
          priority: 'medium',
          title: 'Add ESLint for code quality',
          description: 'Configure ESLint to maintain code quality standards',
          impact: 'Improved code consistency and fewer bugs'
        });
      }

      // Testing optimizations
      if (!analysis.configuration.tools.includes('Jest') && 
          !analysis.frameworks.testing.length) {
        optimizations.push({
          type: 'testing',
          priority: 'high',
          title: 'Add testing framework',
          description: 'Set up Jest or another testing framework',
          impact: 'Better code reliability and maintainability'
        });
      }

      // Documentation optimizations
      if (!analysis.configuration.files.includes('README.md')) {
        optimizations.push({
          type: 'documentation',
          priority: 'medium',
          title: 'Add README.md',
          description: 'Create comprehensive project documentation',
          impact: 'Better project onboarding and maintenance'
        });
      }

      return optimizations;
    } catch (error) {
      logger.error('Failed to find optimizations:', error.message);
      return [];
    }
  }
}

module.exports = ProjectAnalyzer;