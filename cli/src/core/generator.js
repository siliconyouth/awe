const fs = require('fs').promises;
const path = require('path');
const { getDatabase } = require('./database');
const { logger } = require('../utils/logger');

/**
 * Code Generator - Handles code generation, scaffolding, and configuration creation
 */
class CodeGenerator {
  constructor(options = {}) {
    this.options = options;
    this.db = getDatabase();
    this.templatesDir = path.join(__dirname, '../../..', 'templates');
    this.agentsDir = path.join(__dirname, '../../..', 'agents/examples');
  }

  /**
   * Generate CLAUDE.md configuration based on analysis and recommendations
   */
  async generateConfig(analysis, recommendations, options = {}) {
    logger.info('Generating CLAUDE.md configuration...');

    try {
      const config = await this.buildConfig(analysis, recommendations, options);
      
      if (options.preview) {
        return { config, preview: true };
      }

      // Write CLAUDE.md file
      const outputPath = path.join(analysis.projectPath || process.cwd(), 'CLAUDE.md');
      await fs.writeFile(outputPath, config, 'utf8');

      logger.info(`CLAUDE.md generated successfully at ${outputPath}`);
      
      return {
        config,
        path: outputPath,
        success: true
      };
    } catch (error) {
      logger.error('Failed to generate config:', error.message);
      throw error;
    }
  }

  /**
   * Build CLAUDE.md configuration content
   */
  async buildConfig(analysis, recommendations, options) {
    const template = await this.selectTemplate(analysis, recommendations);
    const context = this.buildContext(analysis, recommendations, options);
    
    return this.interpolateTemplate(template, context);
  }

  /**
   * Select appropriate template based on analysis and recommendations
   */
  async selectTemplate(analysis, recommendations) {
    try {
      // Use top recommendation if available
      if (recommendations.templates && recommendations.templates.length > 0) {
        const topTemplate = recommendations.templates[0];
        return await this.loadTemplate(topTemplate.name);
      }

      // Fallback to project type detection
      const projectType = this.detectProjectType(analysis);
      return await this.loadTemplate(projectType);
      
    } catch (error) {
      logger.warn('Failed to load specific template, using general template');
      return await this.loadTemplate('general');
    }
  }

  /**
   * Load template content
   */
  async loadTemplate(templateName) {
    const templatePath = path.join(this.templatesDir, 'claude-md', `${templateName}-template.md`);
    
    try {
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      // Fallback to general template
      const generalPath = path.join(this.templatesDir, 'claude-md', 'general-template.md');
      return await fs.readFile(generalPath, 'utf8');
    }
  }

  /**
   * Detect project type from analysis
   */
  detectProjectType(analysis) {
    if (!analysis.languages) return 'general';

    const languages = analysis.languages;
    const frameworks = analysis.frameworks || [];

    // Frontend projects
    if (languages.includes('JavaScript') || languages.includes('TypeScript')) {
      if (frameworks.some(f => ['React', 'Vue', 'Angular'].includes(f))) {
        return 'frontend-spa';
      }
      if (frameworks.includes('Next.js')) {
        return 'frontend-nextjs';
      }
      if (frameworks.includes('Express')) {
        return 'backend-nodejs';
      }
      return 'javascript';
    }

    // Python projects
    if (languages.includes('Python')) {
      if (frameworks.some(f => ['Django', 'Flask', 'FastAPI'].includes(f))) {
        return 'backend-python';
      }
      if (frameworks.some(f => ['Jupyter', 'Pandas', 'NumPy'].includes(f))) {
        return 'data-science';
      }
      return 'python';
    }

    // Other languages
    if (languages.includes('Rust')) return 'rust';
    if (languages.includes('Go')) return 'golang';
    if (languages.includes('Java')) return 'java';

    return 'general';
  }

  /**
   * Build template interpolation context
   */
  buildContext(analysis, recommendations, options) {
    return {
      // Project info
      project_name: analysis.name || path.basename(analysis.projectPath || process.cwd()),
      project_type: this.detectProjectType(analysis),
      project_description: analysis.description || 'Project description',
      
      // Tech stack
      languages: (analysis.languages || []).join(', '),
      frameworks: (analysis.frameworks || []).join(', '),
      main_language: analysis.languages?.[0] || 'Unknown',
      package_manager: analysis.packageManager || 'npm',
      
      // Architecture
      structure: this.formatStructure(analysis.structure),
      patterns: (analysis.patterns || []).join(', '),
      conventions: this.generateConventions(analysis),
      
      // Recommended agents
      recommended_agents: this.formatRecommendedAgents(recommendations),
      
      // Workflows
      dev_workflow: this.generateDevWorkflow(analysis),
      testing_workflow: this.generateTestingWorkflow(analysis),
      deployment_workflow: this.generateDeploymentWorkflow(analysis),
      
      // Context loading
      context_triggers: this.generateContextTriggers(analysis),
      
      // Optimization suggestions
      optimizations: this.formatOptimizations(recommendations.optimizations || []),
      
      // Custom options
      ...options.customContext
    };
  }

  /**
   * Interpolate template with context values
   */
  interpolateTemplate(template, context) {
    let result = template;
    
    // Replace {{variable}} placeholders
    for (const [key, value] of Object.entries(context)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(placeholder, value || '');
    }
    
    // Clean up any remaining placeholders
    result = result.replace(/{{[^}]+}}/g, '');
    
    return result;
  }

  /**
   * Format project structure for template
   */
  formatStructure(structure) {
    if (!structure || !structure.directories) {
      return 'Standard project structure';
    }

    const dirs = structure.directories.slice(0, 10); // Limit to top 10
    return dirs.map(dir => `- ${dir}/`).join('\n');
  }

  /**
   * Generate coding conventions based on analysis
   */
  generateConventions(analysis) {
    const conventions = [];
    
    if (analysis.languages?.includes('TypeScript')) {
      conventions.push('- Strict TypeScript mode enabled');
      conventions.push('- Use interfaces over type aliases');
      conventions.push('- No `any` types allowed');
    }
    
    if (analysis.languages?.includes('JavaScript')) {
      conventions.push('- Use ES6+ features');
      conventions.push('- Prefer const/let over var');
      conventions.push('- Use arrow functions for callbacks');
    }
    
    if (analysis.frameworks?.includes('React')) {
      conventions.push('- Functional components with hooks');
      conventions.push('- Use TypeScript for props');
      conventions.push('- Follow React naming conventions');
    }
    
    if (conventions.length === 0) {
      conventions.push('- Follow language/framework best practices');
      conventions.push('- Maintain consistent code style');
      conventions.push('- Use meaningful variable names');
    }
    
    return conventions.join('\n');
  }

  /**
   * Format recommended agents for template
   */
  formatRecommendedAgents(recommendations) {
    if (!recommendations.agents || recommendations.agents.length === 0) {
      return '- code-reviewer: For comprehensive code reviews\n- test-engineer: For testing strategy and implementation';
    }
    
    return recommendations.agents
      .slice(0, 5) // Top 5 recommendations
      .map(agent => `- ${agent.name}: ${agent.description}`)
      .join('\n');
  }

  /**
   * Generate development workflow
   */
  generateDevWorkflow(analysis) {
    const workflow = [];
    
    // Start command
    if (analysis.packageManager) {
      workflow.push(`1. Start development: \`${analysis.packageManager} run dev\``);
    }
    
    // Testing
    if (analysis.hasTests) {
      workflow.push(`2. Run tests: \`${analysis.packageManager || 'npm'} test\``);
    }
    
    // Linting
    if (analysis.hasLinting) {
      workflow.push(`3. Check code style: \`${analysis.packageManager || 'npm'} run lint\``);
    }
    
    // Build
    if (analysis.hasBuild) {
      workflow.push(`4. Build project: \`${analysis.packageManager || 'npm'} run build\``);
    }
    
    if (workflow.length === 0) {
      workflow.push('1. Start development server');
      workflow.push('2. Run tests before committing');
      workflow.push('3. Check code style and format');
    }
    
    return workflow.join('\n');
  }

  /**
   * Generate testing workflow
   */
  generateTestingWorkflow(analysis) {
    if (!analysis.hasTests) {
      return '- Set up testing framework\n- Write unit tests for core functions\n- Add integration tests for key workflows';
    }
    
    const workflow = [`- Run tests: \`${analysis.packageManager || 'npm'} test\``];
    
    if (analysis.testFrameworks?.includes('jest')) {
      workflow.push('- Watch mode: `npm run test:watch`');
      workflow.push('- Coverage: `npm run test:coverage`');
    }
    
    workflow.push('- All features must have corresponding tests');
    workflow.push('- Maintain minimum 80% test coverage');
    
    return workflow.join('\n');
  }

  /**
   * Generate deployment workflow
   */
  generateDeploymentWorkflow(analysis) {
    const workflow = [];
    
    if (analysis.hasDocker) {
      workflow.push('1. Build Docker image: `docker build -t app .`');
      workflow.push('2. Test container: `docker run -p 3000:3000 app`');
    }
    
    if (analysis.cloudPlatform) {
      workflow.push(`3. Deploy to ${analysis.cloudPlatform}`);
    } else {
      workflow.push('3. Deploy to production environment');
    }
    
    workflow.push('4. Run post-deployment tests');
    workflow.push('5. Monitor application health');
    
    return workflow.join('\n');
  }

  /**
   * Generate context loading triggers
   */
  generateContextTriggers(analysis) {
    const triggers = [];
    
    if (analysis.structure?.hasComponents) {
      triggers.push('- **UI Work**: Load `src/components/` and design system files');
    }
    
    if (analysis.structure?.hasAPI) {
      triggers.push('- **API Work**: Load `src/api/` and schema definitions');
    }
    
    if (analysis.structure?.hasDatabase) {
      triggers.push('- **Database Work**: Load schema files and migration scripts');
    }
    
    if (analysis.hasTests) {
      triggers.push('- **Testing**: Load test files and testing utilities');
    }
    
    if (triggers.length === 0) {
      triggers.push('- **Feature Work**: Load relevant source files and documentation');
      triggers.push('- **Bug Fixes**: Load error logs and related code sections');
    }
    
    return triggers.join('\n');
  }

  /**
   * Format optimization suggestions
   */
  formatOptimizations(optimizations) {
    if (optimizations.length === 0) {
      return 'No immediate optimizations identified';
    }
    
    return optimizations
      .slice(0, 5) // Top 5 optimizations
      .map(opt => `- ${opt.description} (Priority: ${opt.priority})`)
      .join('\n');
  }

  /**
   * Scaffold a new project from patterns
   */
  async scaffold(pattern, targetPath, options = {}) {
    logger.info(`Scaffolding project with pattern: ${pattern}`);
    
    try {
      const scaffoldResult = await this.generateScaffold(pattern, targetPath, options);
      
      return {
        pattern,
        targetPath,
        files: scaffoldResult.files,
        instructions: scaffoldResult.instructions,
        success: true
      };
    } catch (error) {
      logger.error('Scaffolding failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate project scaffold
   */
  async generateScaffold(pattern, targetPath, options) {
    // For now, create a basic scaffold structure
    // In a full implementation, this would use pattern templates
    
    const files = [];
    const instructions = [];
    
    // Ensure target directory exists
    await fs.mkdir(targetPath, { recursive: true });
    
    // Create basic CLAUDE.md
    const claudePath = path.join(targetPath, 'CLAUDE.md');
    const claudeContent = await this.generateBasicClaude(pattern, options);
    await fs.writeFile(claudePath, claudeContent, 'utf8');
    files.push('CLAUDE.md');
    
    // Create basic README.md
    const readmePath = path.join(targetPath, 'README.md');
    const readmeContent = this.generateBasicReadme(pattern, options);
    await fs.writeFile(readmePath, readmeContent, 'utf8');
    files.push('README.md');
    
    // Create .gitignore
    const gitignorePath = path.join(targetPath, '.gitignore');
    const gitignoreContent = this.generateGitignore(pattern);
    await fs.writeFile(gitignorePath, gitignoreContent, 'utf8');
    files.push('.gitignore');
    
    instructions.push(`Created ${files.length} files for ${pattern} pattern`);
    instructions.push('Run `awe init` to configure CLAUDE.md for your specific needs');
    
    return { files, instructions };
  }

  /**
   * Generate basic CLAUDE.md for scaffolding
   */
  async generateBasicClaude(pattern, options) {
    try {
      const template = await this.loadTemplate('general');
      const context = {
        project_name: options.name || 'New Project',
        project_type: pattern,
        languages: 'To be determined',
        frameworks: 'To be determined',
        structure: 'Standard project structure',
        recommended_agents: 'code-reviewer, test-engineer',
        dev_workflow: '1. Set up development environment\n2. Run initial setup commands',
        testing_workflow: 'Set up testing framework and write tests',
        deployment_workflow: 'Configure deployment pipeline',
        context_triggers: 'Load relevant files based on current task',
        optimizations: 'Run `awe analyze` to identify optimizations'
      };
      
      return this.interpolateTemplate(template, context);
    } catch (error) {
      return `# ${options.name || 'New Project'}\n\nProject scaffolded with pattern: ${pattern}\n\nRun \`awe init\` to configure this project for Claude Code.`;
    }
  }

  /**
   * Generate basic README.md
   */
  generateBasicReadme(pattern, options) {
    return `# ${options.name || 'New Project'}

Project created with AWE ${pattern} pattern.

## Getting Started

1. Install dependencies
2. Configure your development environment
3. Run \`awe init\` to set up Claude Code configuration
4. Start development

## Development

- Use \`awe analyze\` to understand your project structure
- Use \`awe recommend\` to get optimization suggestions
- Deploy specialized agents with \`awe agent deploy\`

## Documentation

See CLAUDE.md for Claude Code specific configuration and guidelines.
`;
  }

  /**
   * Generate .gitignore based on pattern
   */
  generateGitignore(pattern) {
    const common = `# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
/build
/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
`;

    // Add pattern-specific ignores
    const patternSpecific = {
      'python': '\n# Python\n__pycache__/\n*.py[cod]\n*$py.class\n.Python\nvenv/\nENV/',
      'rust': '\n# Rust\n/target/\nCargo.lock',
      'java': '\n# Java\n*.class\n*.jar\n*.war\n*.ear\ntarget/',
      'golang': '\n# Go\n*.exe\n*.exe~\n*.dll\n*.so\n*.dylib\nvendor/'
    };

    return common + (patternSpecific[pattern] || '');
  }

  /**
   * Apply optimization recommendations
   */
  async applyOptimizations(projectPath, optimizations, options = {}) {
    logger.info(`Applying ${optimizations.length} optimizations to ${projectPath}`);
    
    const applied = [];
    const failed = [];
    
    for (const optimization of optimizations) {
      try {
        if (options.dryRun) {
          applied.push({
            ...optimization,
            status: 'would_apply',
            preview: await this.previewOptimization(optimization, projectPath)
          });
        } else {
          const result = await this.applyOptimization(optimization, projectPath);
          applied.push({
            ...optimization,
            status: 'applied',
            result
          });
        }
      } catch (error) {
        failed.push({
          ...optimization,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return {
      applied,
      failed,
      summary: {
        total: optimizations.length,
        successful: applied.length,
        failed: failed.length
      }
    };
  }

  /**
   * Apply a single optimization
   */
  async applyOptimization(optimization, projectPath) {
    const { type, changes } = optimization;
    
    switch (type) {
      case 'claude_config':
        return await this.applyClaudeConfigOptimization(changes, projectPath);
      
      case 'package_json':
        return await this.applyPackageJsonOptimization(changes, projectPath);
      
      case 'file_structure':
        return await this.applyFileStructureOptimization(changes, projectPath);
      
      case 'documentation':
        return await this.applyDocumentationOptimization(changes, projectPath);
      
      default:
        throw new Error(`Unknown optimization type: ${type}`);
    }
  }

  /**
   * Preview what an optimization would do
   */
  async previewOptimization(optimization, projectPath) {
    return {
      description: optimization.description,
      changes: optimization.changes || [],
      impact: optimization.impact || 'Medium',
      files_affected: optimization.files || []
    };
  }

  /**
   * Apply CLAUDE.md configuration optimization
   */
  async applyClaudeConfigOptimization(changes, projectPath) {
    const claudePath = path.join(projectPath, 'CLAUDE.md');
    
    try {
      let content = await fs.readFile(claudePath, 'utf8');
      
      for (const change of changes) {
        if (change.type === 'append') {
          content += `\n\n${change.content}`;
        } else if (change.type === 'replace') {
          content = content.replace(change.pattern, change.replacement);
        }
      }
      
      await fs.writeFile(claudePath, content, 'utf8');
      return { updated: claudePath, changes: changes.length };
    } catch (error) {
      throw new Error(`Failed to update CLAUDE.md: ${error.message}`);
    }
  }

  /**
   * Apply package.json optimization
   */
  async applyPackageJsonOptimization(changes, projectPath) {
    const packagePath = path.join(projectPath, 'package.json');
    
    try {
      const content = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(content);
      
      for (const change of changes) {
        if (change.type === 'add_script') {
          packageJson.scripts = packageJson.scripts || {};
          packageJson.scripts[change.name] = change.command;
        } else if (change.type === 'add_dependency') {
          packageJson.dependencies = packageJson.dependencies || {};
          packageJson.dependencies[change.name] = change.version;
        }
      }
      
      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
      return { updated: packagePath, changes: changes.length };
    } catch (error) {
      throw new Error(`Failed to update package.json: ${error.message}`);
    }
  }

  /**
   * Apply file structure optimization
   */
  async applyFileStructureOptimization(changes, projectPath) {
    const results = [];
    
    for (const change of changes) {
      if (change.type === 'create_directory') {
        const dirPath = path.join(projectPath, change.path);
        await fs.mkdir(dirPath, { recursive: true });
        results.push({ created: dirPath });
      } else if (change.type === 'create_file') {
        const filePath = path.join(projectPath, change.path);
        await fs.writeFile(filePath, change.content || '', 'utf8');
        results.push({ created: filePath });
      }
    }
    
    return { changes: results };
  }

  /**
   * Apply documentation optimization
   */
  async applyDocumentationOptimization(changes, projectPath) {
    const results = [];
    
    for (const change of changes) {
      if (change.type === 'create_readme') {
        const readmePath = path.join(projectPath, 'README.md');
        await fs.writeFile(readmePath, change.content, 'utf8');
        results.push({ created: readmePath });
      } else if (change.type === 'update_documentation') {
        const docPath = path.join(projectPath, change.file);
        await fs.writeFile(docPath, change.content, 'utf8');
        results.push({ updated: docPath });
      }
    }
    
    return { changes: results };
  }
}

module.exports = CodeGenerator;