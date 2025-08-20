# AWE CLI API Reference

Complete reference for using AWE CLI programmatically as a Node.js library and through its internal APIs.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Core Classes](#core-classes)
- [API Methods](#api-methods)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Event System](#event-system)
- [Extending AWE](#extending-awe)
- [Examples](#examples)

## Installation

### As a Library

```bash
npm install @awe/claude-companion
```

### For Development

```bash
git clone https://github.com/awe-team/claude-companion
cd claude-companion/cli
npm install
```

## Basic Usage

### Simple API Usage

```javascript
const AWE = require('@awe/claude-companion');

// Create AWE instance
const awe = new AWE({
  quiet: false,
  debug: false,
  dataDir: '/custom/path/.awe'
});

// Initialize and analyze project
async function analyzeProject() {
  try {
    const result = await awe.initialize('./my-project');
    console.log('Analysis:', result.analysis);
    console.log('Recommendations:', result.recommendations);
  } catch (error) {
    console.error('Analysis failed:', error.message);
  }
}

analyzeProject();
```

### Promise-based API

```javascript
const AWE = require('@awe/claude-companion');

const awe = new AWE();

// Chain operations
awe.analyze('./project')
  .then(result => {
    if (result.success) {
      console.log('Project type:', result.analysis.classification.type);
      return awe.recommend('./project');
    }
    throw new Error(result.error);
  })
  .then(recommendations => {
    console.log('Top recommendation:', recommendations.recommendations[0]);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### Async/Await API

```javascript
const AWE = require('@awe/claude-companion');

async function fullWorkflow() {
  const awe = new AWE({ debug: true });
  
  try {
    // Analyze project
    const analysis = await awe.analyze('./my-project');
    
    // Get recommendations
    const recommendations = await awe.recommend('./my-project');
    
    // Generate scaffold if needed
    if (analysis.analysis.claudeCode.completeness < 50) {
      await awe.scaffold('react-web', './my-project');
    }
    
    // Apply optimizations
    const optimizations = await awe.optimize('./my-project', { apply: true });
    
    return {
      analysis: analysis.analysis,
      recommendations: recommendations.recommendations,
      optimizations: optimizations.applied
    };
  } catch (error) {
    console.error('Workflow failed:', error);
    throw error;
  }
}
```

## Core Classes

### AWE Main Class

The primary interface for all AWE functionality.

```javascript
class AWE {
  constructor(options = {})
  
  // Core methods
  async initialize(projectPath, options)
  async analyze(projectPath)
  async recommend(projectPath, context)
  async scaffold(pattern, targetPath, options)
  async optimize(projectPath, options)
  async sync()
  async learn(interaction)
  async scrape(sources, options)
}
```

**Constructor Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `quiet` | boolean | `false` | Suppress output messages |
| `debug` | boolean | `false` | Enable debug logging |
| `dataDir` | string | `~/.awe` | Data directory path |

### ProjectAnalyzer Class

Handles project analysis and classification.

```javascript
const { ProjectAnalyzer } = require('@awe/claude-companion/src/core/analyzer');

const analyzer = new ProjectAnalyzer();

// Analyze project structure
const analysis = await analyzer.analyzeProject('./project');

// Find optimization opportunities
const optimizations = await analyzer.findOptimizations(analysis);

// Classify project type
const classification = analyzer.classifyProject(analysis);
```

### TemplateRecommender Class

Provides AI-powered template recommendations.

```javascript
const { TemplateRecommender } = require('@awe/claude-companion/src/core/recommender');

const recommender = new TemplateRecommender();

// Get recommendations
const recommendations = await recommender.recommend(analysis, context);

// Score specific template
const score = await recommender.scoreTemplate(template, analysis);
```

### Database Class

Manages the AWE knowledge base and storage.

```javascript
const { getDatabase } = require('@awe/claude-companion/src/core/database');

const db = getDatabase();

// Template operations
const templates = db.getTemplates();
const template = db.getTemplate('react-typescript');
db.saveTemplate(templateData);

// Project operations
db.saveProject(projectData);
const projects = db.getProjects();

// Learning operations
db.recordInteraction(interactionData);
const stats = db.getLearningStats();
```

## API Methods

### AWE.initialize(projectPath, options)

Initialize AWE for a project with comprehensive setup.

**Parameters:**
- `projectPath` (string): Path to the project directory
- `options` (object): Initialization options

**Returns:** Promise&lt;Object&gt;

```javascript
const result = await awe.initialize('./my-project', {
  template: 'react-typescript',
  force: true,
  includeWorkflow: true
});

// Result structure
{
  analysis: {
    path: '/path/to/project',
    classification: { type: 'web-application', confidence: 'high' },
    languages: { primary: 'JavaScript' },
    frameworks: { detected: ['React'] }
  },
  recommendations: [
    {
      name: 'React TypeScript Template',
      score: 92,
      confidence: 'high'
    }
  ],
  config: {
    claudeMdPath: '/path/to/CLAUDE.md',
    content: '# Project Configuration...'
  },
  success: true
}
```

### AWE.analyze(projectPath)

Perform comprehensive project analysis.

**Parameters:**
- `projectPath` (string): Path to the project directory

**Returns:** Promise&lt;Object&gt;

```javascript
const result = await awe.analyze('./my-project');

// Result structure
{
  analysis: {
    structure: {
      totalFiles: 127,
      totalSize: 1024000,
      depth: 5
    },
    dependencies: {
      packageManager: 'npm',
      dependencies: ['react', 'express'],
      devDependencies: ['jest', 'eslint']
    },
    claudeCode: {
      completeness: 75,
      hasClaudeMd: true,
      hasClaudeDir: false
    }
  },
  optimizations: [
    {
      title: 'Add TypeScript configuration',
      priority: 'medium',
      impact: 'Improved type safety'
    }
  ],
  success: true
}
```

### AWE.recommend(projectPath, context)

Get AI-powered recommendations.

**Parameters:**
- `projectPath` (string): Path to the project directory
- `context` (object): Additional context for recommendations

**Returns:** Promise&lt;Object&gt;

```javascript
const result = await awe.recommend('./my-project', {
  features: ['authentication', 'database'],
  target: 'production'
});

// Result structure
{
  recommendations: [
    {
      name: 'React TypeScript Template',
      category: 'template',
      score: 92,
      confidence: 'high',
      reasoning: 'Detected React with TypeScript files'
    }
  ],
  success: true
}
```

### AWE.scaffold(pattern, targetPath, options)

Generate project scaffolds from patterns.

**Parameters:**
- `pattern` (string): Scaffold pattern name
- `targetPath` (string): Target directory path
- `options` (object): Generation options

**Returns:** Promise&lt;Object&gt;

```javascript
const result = await awe.scaffold('web-react', './new-project', {
  name: 'my-app',
  typescript: true,
  styling: 'tailwind'
});

// Result structure
{
  result: {
    files: [
      'package.json',
      'src/App.tsx',
      'src/main.tsx'
    ],
    instructions: [
      'Run npm install',
      'Run npm run dev'
    ]
  },
  success: true
}
```

### AWE.optimize(projectPath, options)

Apply optimization recommendations.

**Parameters:**
- `projectPath` (string): Path to the project directory
- `options` (object): Optimization options

**Returns:** Promise&lt;Object&gt;

```javascript
const result = await awe.optimize('./my-project', {
  apply: true,
  priorities: ['high', 'medium'],
  dryRun: false
});

// Result structure
{
  analysis: { /* analysis results */ },
  optimizations: [
    {
      title: 'Add ESLint configuration',
      priority: 'medium',
      applied: true
    }
  ],
  applied: [
    {
      title: 'Add ESLint configuration',
      changes: ['Created .eslintrc.js', 'Updated package.json']
    }
  ],
  success: true
}
```

### AWE.sync()

Synchronize knowledge base with latest patterns.

**Returns:** Promise&lt;Object&gt;

```javascript
const result = await awe.sync();

// Result structure
{
  result: {
    templatesUpdated: 15,
    patternsUpdated: 23,
    lastSync: '2024-12-15T14:30:00Z'
  },
  success: true
}
```

### AWE.scrape(sources, options)

Intelligently scrape patterns and templates.

**Parameters:**
- `sources` (array): Array of source names to scrape
- `options` (object): Scraping options

**Returns:** Promise&lt;Object&gt;

```javascript
const result = await awe.scrape(['github-patterns', 'claude-docs'], {
  limit: 50,
  categories: ['frontend', 'testing']
});

// Result structure
{
  results: {
    'github-patterns': {
      patterns: 15,
      templates: 8,
      practices: 12
    },
    'claude-docs': {
      patterns: 23,
      templates: 5,
      practices: 18
    }
  },
  success: true
}
```

## Configuration

### Environment Variables

Configure AWE behavior through environment variables:

```javascript
// Set configuration programmatically
process.env.AWE_DATA_DIR = '/custom/path/.awe';
process.env.AWE_LOG_LEVEL = 'debug';
process.env.AWE_CACHE_TTL = '7200';

const awe = new AWE(); // Will use environment variables
```

### Configuration File

Create a configuration file for persistent settings:

```javascript
// awe.config.js
module.exports = {
  dataDir: '/custom/path/.awe',
  debug: false,
  quiet: false,
  analysis: {
    excludePatterns: ['node_modules', 'dist', '*.log'],
    includeTests: true,
    maxFiles: 1000
  },
  optimization: {
    autoApply: ['low', 'medium'],
    requireConfirmation: ['high']
  },
  templates: {
    customPath: './.claude/templates',
    preferred: ['react-typescript', 'nodejs-express']
  },
  scraping: {
    concurrent: 3,
    timeout: 30000,
    retries: 2
  }
};
```

```javascript
// Load configuration
const config = require('./awe.config.js');
const awe = new AWE(config);
```

### Runtime Configuration

```javascript
const awe = new AWE({
  // Core options
  quiet: false,
  debug: true,
  dataDir: './custom-awe-data',
  
  // Analysis options
  analysis: {
    excludePatterns: ['dist/', 'node_modules/'],
    includeHidden: false,
    maxDepth: 10
  },
  
  // Optimization options
  optimization: {
    autoApply: true,
    priorities: ['high', 'medium'],
    backupOriginal: true
  },
  
  // Template options
  templates: {
    customPath: './.awe/templates',
    allowOverride: true
  }
});
```

## Error Handling

### Error Types

AWE uses specific error types for different failure scenarios:

```javascript
const { AWEError, AnalysisError, TemplateError, DatabaseError } = require('@awe/claude-companion/src/utils/errors');

try {
  await awe.analyze('./project');
} catch (error) {
  if (error instanceof AnalysisError) {
    console.error('Analysis failed:', error.message);
    console.error('Project path:', error.projectPath);
  } else if (error instanceof TemplateError) {
    console.error('Template error:', error.message);
    console.error('Template name:', error.templateName);
  } else if (error instanceof DatabaseError) {
    console.error('Database error:', error.message);
    console.error('Query:', error.query);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Error Handling Patterns

**1. Graceful Degradation:**
```javascript
async function robustAnalysis(projectPath) {
  try {
    return await awe.analyze(projectPath);
  } catch (error) {
    if (error instanceof AnalysisError) {
      // Return partial analysis
      return {
        analysis: error.partialAnalysis || {},
        optimizations: [],
        success: false,
        error: error.message
      };
    }
    throw error; // Re-throw unexpected errors
  }
}
```

**2. Retry Logic:**
```javascript
async function analyzeWithRetry(projectPath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await awe.analyze(projectPath);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      if (error.code === 'TEMPORARY_FAILURE') {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      throw error; // Don't retry for permanent failures
    }
  }
}
```

**3. Validation:**
```javascript
const { validateProjectPath, validateTemplate } = require('@awe/claude-companion/src/utils/validation');

async function safeScaffold(pattern, targetPath, options) {
  // Validate inputs
  const pathValidation = await validateProjectPath(targetPath);
  if (!pathValidation.valid) {
    throw new Error(`Invalid path: ${pathValidation.errors.join(', ')}`);
  }
  
  const templateValidation = validateTemplate(pattern);
  if (!templateValidation.valid) {
    throw new Error(`Invalid template: ${templateValidation.errors.join(', ')}`);
  }
  
  return await awe.scaffold(pattern, targetPath, options);
}
```

## Event System

AWE provides an event system for monitoring operations and extending functionality:

### Basic Event Handling

```javascript
const { EventEmitter } = require('events');

// AWE extends EventEmitter
const awe = new AWE();

// Listen for analysis events
awe.on('analysis:start', (projectPath) => {
  console.log('Starting analysis for:', projectPath);
});

awe.on('analysis:complete', (result) => {
  console.log('Analysis complete:', result.analysis.classification);
});

awe.on('analysis:error', (error) => {
  console.error('Analysis failed:', error.message);
});

// Listen for optimization events
awe.on('optimization:applied', (optimization) => {
  console.log('Applied optimization:', optimization.title);
});
```

### Available Events

| Event | Description | Data |
|-------|-------------|------|
| `analysis:start` | Analysis started | `{ projectPath }` |
| `analysis:progress` | Analysis progress | `{ stage, progress }` |
| `analysis:complete` | Analysis completed | `{ analysis, optimizations }` |
| `analysis:error` | Analysis failed | `{ error, projectPath }` |
| `optimization:start` | Optimization started | `{ projectPath, optimizations }` |
| `optimization:applied` | Optimization applied | `{ optimization, changes }` |
| `optimization:complete` | All optimizations complete | `{ applied, skipped }` |
| `template:loaded` | Template loaded | `{ template }` |
| `template:applied` | Template applied | `{ template, targetPath }` |
| `sync:start` | Sync started | `{ sources }` |
| `sync:progress` | Sync progress | `{ source, progress }` |
| `sync:complete` | Sync completed | `{ updated, total }` |

### Custom Event Handlers

```javascript
class CustomAWE extends AWE {
  constructor(options) {
    super(options);
    this.setupCustomHandlers();
  }
  
  setupCustomHandlers() {
    this.on('analysis:complete', this.onAnalysisComplete.bind(this));
    this.on('optimization:applied', this.onOptimizationApplied.bind(this));
  }
  
  async onAnalysisComplete(result) {
    // Custom logic after analysis
    if (result.analysis.claudeCode.completeness < 50) {
      console.log('Low Claude Code score detected, suggesting improvements...');
      await this.recommend(result.analysis.path);
    }
  }
  
  async onOptimizationApplied(data) {
    // Track optimization impact
    await this.trackOptimization(data.optimization, data.changes);
  }
  
  async trackOptimization(optimization, changes) {
    // Custom tracking logic
    const metrics = {
      timestamp: new Date().toISOString(),
      optimization: optimization.title,
      impact: optimization.impact,
      changes: changes.length
    };
    
    // Save to custom analytics
    await this.saveAnalytics(metrics);
  }
}
```

## Extending AWE

### Custom Analyzers

```javascript
// custom-analyzer.js
class CustomAnalyzer {
  constructor(options = {}) {
    this.options = options;
  }
  
  async analyze(projectPath) {
    // Custom analysis logic
    const customMetrics = await this.calculateCustomMetrics(projectPath);
    
    return {
      type: 'custom',
      metrics: customMetrics,
      recommendations: this.generateRecommendations(customMetrics)
    };
  }
  
  async calculateCustomMetrics(projectPath) {
    // Implementation specific to your needs
    return {
      complexity: await this.calculateComplexity(projectPath),
      maintainability: await this.calculateMaintainability(projectPath),
      performance: await this.calculatePerformance(projectPath)
    };
  }
}

// Register custom analyzer
const awe = new AWE();
awe.registerAnalyzer(new CustomAnalyzer());
```

### Custom Templates

```javascript
// custom-template-generator.js
class CustomTemplateGenerator {
  constructor() {
    this.name = 'my-custom-template';
    this.description = 'Custom project template';
  }
  
  async generate(targetPath, options) {
    const files = [];
    
    // Generate custom files
    files.push({
      path: 'custom-config.json',
      content: JSON.stringify(options.config, null, 2)
    });
    
    files.push({
      path: 'CLAUDE.md',
      content: this.generateClaudeConfig(options)
    });
    
    return {
      files,
      instructions: [
        'Custom setup complete',
        'Run npm install',
        'Configure your environment'
      ]
    };
  }
  
  generateClaudeConfig(options) {
    return `# ${options.name}

${options.description}

## Custom Configuration
Generated with custom template generator.

## Features
${options.features.map(f => `- ${f}`).join('\n')}
`;
  }
}

// Register custom template
const awe = new AWE();
awe.registerTemplate(new CustomTemplateGenerator());
```

### Plugin System

```javascript
// plugin-interface.js
class AWEPlugin {
  constructor(name, version) {
    this.name = name;
    this.version = version;
  }
  
  // Called when plugin is loaded
  async initialize(awe) {
    this.awe = awe;
  }
  
  // Called during analysis phase
  async analyze(projectPath, analysis) {
    return analysis; // Return modified analysis
  }
  
  // Called during optimization phase
  async optimize(projectPath, optimizations) {
    return optimizations; // Return modified optimizations
  }
  
  // Called during template selection
  async recommend(analysis, recommendations) {
    return recommendations; // Return modified recommendations
  }
}

// Example plugin
class TypeScriptPlugin extends AWEPlugin {
  constructor() {
    super('typescript-plugin', '1.0.0');
  }
  
  async analyze(projectPath, analysis) {
    // Add TypeScript-specific analysis
    const tsConfig = await this.findTsConfig(projectPath);
    
    analysis.typescript = {
      hasConfig: !!tsConfig,
      strict: tsConfig?.compilerOptions?.strict || false,
      target: tsConfig?.compilerOptions?.target || 'es5'
    };
    
    return analysis;
  }
  
  async optimize(projectPath, optimizations) {
    // Add TypeScript-specific optimizations
    if (!analysis.typescript.hasConfig) {
      optimizations.push({
        title: 'Add TypeScript configuration',
        priority: 'medium',
        description: 'Create tsconfig.json for better type checking',
        plugin: this.name
      });
    }
    
    return optimizations;
  }
}

// Load plugin
const awe = new AWE();
awe.loadPlugin(new TypeScriptPlugin());
```

## Examples

### Complete Project Setup

```javascript
const AWE = require('@awe/claude-companion');

async function setupNewProject() {
  const awe = new AWE({ debug: true });
  
  try {
    // Step 1: Create project scaffold
    console.log('Creating project scaffold...');
    await awe.scaffold('web-react', './my-new-app', {
      name: 'my-new-app',
      typescript: true,
      styling: 'tailwind'
    });
    
    // Step 2: Initialize Claude Code configuration
    console.log('Initializing Claude Code...');
    const initResult = await awe.initialize('./my-new-app');
    
    // Step 3: Apply optimizations
    console.log('Applying optimizations...');
    await awe.optimize('./my-new-app', { apply: true });
    
    // Step 4: Get final analysis
    console.log('Final analysis...');
    const finalAnalysis = await awe.analyze('./my-new-app');
    
    console.log('Setup complete!');
    console.log('Claude Code completeness:', finalAnalysis.analysis.claudeCode.completeness + '%');
    
    return {
      projectPath: './my-new-app',
      completeness: finalAnalysis.analysis.claudeCode.completeness,
      optimizations: finalAnalysis.optimizations.length
    };
    
  } catch (error) {
    console.error('Setup failed:', error.message);
    throw error;
  }
}

setupNewProject()
  .then(result => console.log('Project setup result:', result))
  .catch(error => console.error('Setup error:', error));
```

### Batch Project Analysis

```javascript
const AWE = require('@awe/claude-companion');
const fs = require('fs-extra');
const path = require('path');

async function batchAnalyzeProjects(projectsDir) {
  const awe = new AWE({ quiet: true });
  const results = [];
  
  // Get all project directories
  const projects = await fs.readdir(projectsDir);
  
  for (const project of projects) {
    const projectPath = path.join(projectsDir, project);
    const stat = await fs.stat(projectPath);
    
    if (stat.isDirectory()) {
      try {
        console.log(`Analyzing ${project}...`);
        
        const analysis = await awe.analyze(projectPath);
        const recommendations = await awe.recommend(projectPath);
        
        results.push({
          name: project,
          path: projectPath,
          type: analysis.analysis.classification.type,
          completeness: analysis.analysis.claudeCode.completeness,
          optimizations: analysis.optimizations.length,
          highPriorityIssues: analysis.optimizations.filter(o => o.priority === 'high').length,
          recommendations: recommendations.recommendations.slice(0, 3)
        });
        
      } catch (error) {
        console.error(`Failed to analyze ${project}:`, error.message);
        results.push({
          name: project,
          path: projectPath,
          error: error.message
        });
      }
    }
  }
  
  return results;
}

// Generate report
async function generateProjectReport(projectsDir) {
  const results = await batchAnalyzeProjects(projectsDir);
  
  // Create summary
  const summary = {
    totalProjects: results.length,
    successful: results.filter(r => !r.error).length,
    failed: results.filter(r => r.error).length,
    averageCompleteness: results
      .filter(r => !r.error)
      .reduce((sum, r) => sum + r.completeness, 0) / results.filter(r => !r.error).length,
    totalOptimizations: results
      .filter(r => !r.error)
      .reduce((sum, r) => sum + r.optimizations, 0)
  };
  
  // Save report
  const report = {
    summary,
    projects: results,
    generatedAt: new Date().toISOString()
  };
  
  await fs.writeJson('./project-analysis-report.json', report, { spaces: 2 });
  
  console.log('Report generated: project-analysis-report.json');
  console.log('Summary:', summary);
  
  return report;
}

// Usage
generateProjectReport('./projects')
  .then(report => console.log('Analysis complete'))
  .catch(error => console.error('Report generation failed:', error));
```

### Custom Integration

```javascript
const AWE = require('@awe/claude-companion');

class ProjectManager {
  constructor() {
    this.awe = new AWE({ debug: false });
    this.projects = new Map();
  }
  
  async addProject(name, path) {
    try {
      // Analyze project
      const analysis = await this.awe.analyze(path);
      
      // Get recommendations
      const recommendations = await this.awe.recommend(path);
      
      // Store project data
      this.projects.set(name, {
        path,
        analysis: analysis.analysis,
        recommendations: recommendations.recommendations,
        lastAnalyzed: new Date(),
        status: this.calculateStatus(analysis.analysis)
      });
      
      console.log(`Project ${name} added successfully`);
      return this.projects.get(name);
      
    } catch (error) {
      console.error(`Failed to add project ${name}:`, error.message);
      throw error;
    }
  }
  
  async optimizeProject(name) {
    const project = this.projects.get(name);
    if (!project) {
      throw new Error(`Project ${name} not found`);
    }
    
    try {
      const result = await this.awe.optimize(project.path, { apply: true });
      
      // Update project data
      project.lastOptimized = new Date();
      project.appliedOptimizations = result.applied;
      
      // Re-analyze to get updated metrics
      const updatedAnalysis = await this.awe.analyze(project.path);
      project.analysis = updatedAnalysis.analysis;
      project.status = this.calculateStatus(updatedAnalysis.analysis);
      
      return result;
      
    } catch (error) {
      console.error(`Failed to optimize project ${name}:`, error.message);
      throw error;
    }
  }
  
  calculateStatus(analysis) {
    const completeness = analysis.claudeCode.completeness;
    
    if (completeness >= 80) return 'excellent';
    if (completeness >= 60) return 'good';
    if (completeness >= 40) return 'fair';
    return 'needs-work';
  }
  
  getProjectSummary() {
    const projects = Array.from(this.projects.values());
    
    return {
      total: projects.length,
      byStatus: {
        excellent: projects.filter(p => p.status === 'excellent').length,
        good: projects.filter(p => p.status === 'good').length,
        fair: projects.filter(p => p.status === 'fair').length,
        needsWork: projects.filter(p => p.status === 'needs-work').length
      },
      averageCompleteness: projects.reduce((sum, p) => sum + p.analysis.claudeCode.completeness, 0) / projects.length
    };
  }
  
  async syncAll() {
    console.log('Syncing AWE knowledge base...');
    await this.awe.sync();
    
    console.log('Re-analyzing all projects...');
    for (const [name, project] of this.projects) {
      try {
        const analysis = await this.awe.analyze(project.path);
        project.analysis = analysis.analysis;
        project.status = this.calculateStatus(analysis.analysis);
        project.lastAnalyzed = new Date();
      } catch (error) {
        console.error(`Failed to re-analyze ${name}:`, error.message);
      }
    }
  }
}

// Usage example
async function manageProjects() {
  const manager = new ProjectManager();
  
  // Add projects
  await manager.addProject('frontend', './projects/frontend');
  await manager.addProject('backend', './projects/backend');
  await manager.addProject('mobile', './projects/mobile');
  
  // Get summary
  console.log('Project summary:', manager.getProjectSummary());
  
  // Optimize projects that need work
  for (const [name, project] of manager.projects) {
    if (project.status === 'needs-work') {
      console.log(`Optimizing ${name}...`);
      await manager.optimizeProject(name);
    }
  }
  
  // Sync and re-analyze
  await manager.syncAll();
  
  console.log('Final summary:', manager.getProjectSummary());
}

manageProjects()
  .then(() => console.log('Project management complete'))
  .catch(error => console.error('Management failed:', error));
```

This comprehensive API reference provides all the necessary information for developers to integrate AWE CLI into their applications and extend its functionality for custom use cases.