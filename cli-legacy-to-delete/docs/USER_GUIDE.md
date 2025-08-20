# AWE CLI User Guide

A comprehensive guide to using AWE CLI effectively for Claude Code project management, optimization, and development workflows.

## Table of Contents

- [Getting Started](#getting-started)
- [Common Workflows](#common-workflows)
- [Project Types and Templates](#project-types-and-templates)
- [Optimization Strategies](#optimization-strategies)
- [Integration Patterns](#integration-patterns)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)
- [Tips and Tricks](#tips-and-tricks)

## Getting Started

### Installation and Setup

1. **Install AWE CLI globally:**
   ```bash
   npm install -g @awe/claude-companion
   ```

2. **Verify installation:**
   ```bash
   awe --version
   # Should output: 0.1.0 (or current version)
   ```

3. **Initialize your first project:**
   ```bash
   cd your-project
   awe init
   ```

### First Steps

When you run AWE for the first time, it will:

1. **Analyze your project** to understand its structure and technologies
2. **Recommend templates** based on your project characteristics
3. **Create CLAUDE.md** with optimized configuration
4. **Set up the knowledge base** for future recommendations

**Example first run:**
```bash
$ awe init

🤖 AWE - Initializing Claude Code Configuration

📊 Project Analysis:
  Type: web-application
  Primary Language: JavaScript
  Frameworks: React, Express
  Files: 127
  Claude Code Setup: 25%

🎯 Recommended Templates:

1. React TypeScript Template (high confidence)
   Modern React app with TypeScript, Vite, and best practices
   Reasoning: Detected React framework with some TypeScript files

2. Full-stack JavaScript Template (medium confidence)
   Complete frontend + backend JavaScript application
   Reasoning: Both React frontend and Express backend detected

? Select a template: React TypeScript Template

⚙️ Template Customization:
? Project name: my-awesome-app
? Project description: Modern React application with TypeScript
? Include Feature Implementation System Guidelines? Yes
? Include Critical Workflow Requirements? No

✅ Project initialization complete!
📄 Created: CLAUDE.md
```

## Common Workflows

### 1. New Project Creation

**Scenario:** Starting a new project from scratch.

```bash
# Step 1: Create project scaffold
awe scaffold web-react -n my-new-app -o ./projects

# Step 2: Navigate to project
cd ./projects/my-new-app

# Step 3: Initialize Claude Code configuration
awe init -y

# Step 4: Install dependencies and start development
npm install
npm run dev
```

**What happens:**
- Creates complete project structure with best practices
- Sets up CLAUDE.md with project-specific configuration
- Includes development tools and scripts
- Ready for immediate development

### 2. Existing Project Optimization

**Scenario:** Improving an existing project's Claude Code setup.

```bash
# Step 1: Analyze current project
awe analyze --verbose --save

# Step 2: Get recommendations
awe recommend

# Step 3: Initialize with recommended template
awe init -t react-typescript

# Step 4: Apply optimizations
awe optimize

# Step 5: Verify improvements
awe analyze
```

**Expected outcomes:**
- Improved Claude Code completeness score
- Better project organization
- Optimized development workflow
- Enhanced AI assistance capabilities

### 3. Team Onboarding

**Scenario:** Setting up consistent development environment for team members.

```bash
# Step 1: Sync latest knowledge base
awe sync

# Step 2: Analyze project for team standards
awe analyze --save

# Step 3: Apply team optimizations
awe optimize --auto

# Step 4: Generate project documentation
awe recommend --type tools
```

**Team benefits:**
- Consistent Claude Code setup across team
- Standardized project structure
- Shared best practices
- Improved collaboration

### 4. Continuous Improvement

**Scenario:** Regular maintenance and improvement of project setup.

```bash
# Weekly maintenance script
#!/bin/bash

echo "🔄 AWE Weekly Maintenance"

# Update knowledge base
awe sync

# Analyze for new optimization opportunities
awe analyze --save

# Show recommendations
awe recommend

# Apply safe optimizations
awe optimize --auto

echo "✅ Maintenance complete"
```

### 5. Multi-Project Management

**Scenario:** Managing multiple projects with AWE.

```bash
# Batch analysis script
#!/bin/bash

projects=(
  "frontend-app"
  "backend-api"
  "mobile-app"
  "shared-components"
)

for project in "${projects[@]}"; do
  echo "Analyzing $project..."
  (cd "$project" && awe analyze --json) > "analysis-$project.json"
done

# Combine results
jq -s '.' analysis-*.json > combined-analysis.json
```

## Project Types and Templates

### Web Applications

**React Applications:**
```bash
# Modern React with TypeScript
awe scaffold web-react -n my-react-app

# Key features:
# - TypeScript configuration
# - Vite build system
# - Testing setup with Vitest
# - ESLint and Prettier
# - Tailwind CSS support
```

**Vue Applications:**
```bash
# Vue 3 with Composition API
awe scaffold web-vue -n my-vue-app

# Key features:
# - Vue 3 with Composition API
# - Vite build system
# - TypeScript support
# - Testing with Vue Test Utils
# - Pinia for state management
```

### Backend Services

**Node.js APIs:**
```bash
# Express.js API with TypeScript
awe scaffold nodejs-api -n my-api

# Key features:
# - Express.js with TypeScript
# - Database integration (PostgreSQL/MongoDB)
# - Authentication middleware
# - API documentation with Swagger
# - Docker configuration
```

**Python APIs:**
```bash
# FastAPI service
awe scaffold python-api -n my-python-api

# Key features:
# - FastAPI framework
# - Automatic API documentation
# - Database ORM (SQLAlchemy)
# - Authentication and authorization
# - Docker and pytest setup
```

### Data Science Projects

**Python Data Science:**
```bash
# Complete data science setup
awe scaffold python-data -n data-analysis

# Key features:
# - Jupyter notebook environment
# - Common data science libraries (pandas, numpy, matplotlib)
# - Data pipeline templates
# - Model training and evaluation
# - Reproducible research structure
```

### CLI Tools

**Command Line Applications:**
```bash
# CLI tool template
awe scaffold cli-tool -n my-cli

# Key features:
# - Argument parsing with Commander.js
# - Configuration management
# - Logging and error handling
# - Testing framework
# - Distribution setup
```

### Full-Stack Applications

**Complete Applications:**
```bash
# Full-stack with React + Node.js
awe scaffold fullstack -n my-fullstack-app

# Key features:
# - Frontend with React/TypeScript
# - Backend with Express.js
# - Shared type definitions
# - Database integration
# - Authentication system
# - Docker Compose setup
```

## Optimization Strategies

### Performance Optimizations

**1. Bundle Size Optimization:**
```bash
# Analyze bundle size issues
awe analyze --verbose

# Apply webpack/vite optimizations
awe optimize --auto

# Common optimizations applied:
# - Tree shaking configuration
# - Code splitting setup
# - Asset optimization
# - Import optimization
```

**2. Development Experience:**
```bash
# Optimize development workflow
awe recommend --type tools

# Common recommendations:
# - Hot module replacement
# - Fast refresh setup
# - Development server optimization
# - Build time improvements
```

### Code Quality Optimizations

**1. Linting and Formatting:**
```bash
# Apply code quality optimizations
awe optimize

# Common improvements:
# - ESLint configuration
# - Prettier setup
# - Pre-commit hooks
# - VS Code settings
```

**2. Testing Setup:**
```bash
# Optimize testing configuration
awe analyze

# Common suggestions:
# - Test runner configuration
# - Coverage reporting
# - Test utilities setup
# - Continuous integration
```

### Claude Code Specific Optimizations

**1. Context Window Optimization:**
```bash
# Analyze for context efficiency
awe analyze --save

# Optimization areas:
# - File organization for better context
# - Documentation structure
# - Code commenting strategies
# - Feature implementation guidelines
```

**2. AI Workflow Optimization:**
```bash
# Get AI workflow recommendations
awe recommend

# Common improvements:
# - Parallel task execution guidelines
# - Context optimization rules
# - Feature implementation patterns
# - Integration workflows
```

## Integration Patterns

### Git Integration

**Pre-commit Hooks:**
```bash
# Install pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Run AWE analysis before commit
awe analyze --quiet --json | jq -e '.optimizations | map(select(.priority=="high")) | length == 0' || {
  echo "High priority optimizations found. Run 'awe optimize' before committing."
  awe optimize --dry-run
  exit 1
}
EOF

chmod +x .git/hooks/pre-commit
```

**Post-checkout Hook:**
```bash
# Analyze project after checkout
cat > .git/hooks/post-checkout << 'EOF'
#!/bin/sh
# Check for optimization opportunities after branch switch
if [ "$3" = "1" ]; then  # Branch checkout
  echo "Checking project optimization status..."
  awe analyze --quiet
fi
EOF

chmod +x .git/hooks/post-checkout
```

### CI/CD Integration

**GitHub Actions:**
```yaml
# .github/workflows/awe-analysis.yml
name: AWE Project Analysis

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install AWE CLI
        run: npm install -g @awe/claude-companion
        
      - name: Analyze Project
        run: |
          awe analyze --json > awe-analysis.json
          echo "## AWE Analysis Results" >> $GITHUB_STEP_SUMMARY
          
      - name: Check High Priority Issues
        run: |
          HIGH_PRIORITY=$(cat awe-analysis.json | jq '.optimizations | map(select(.priority=="high")) | length')
          if [ "$HIGH_PRIORITY" -gt 0 ]; then
            echo "❌ Found $HIGH_PRIORITY high priority optimization(s)" >> $GITHUB_STEP_SUMMARY
            cat awe-analysis.json | jq -r '.optimizations[] | select(.priority=="high") | "- " + .title + ": " + .description' >> $GITHUB_STEP_SUMMARY
            exit 1
          else
            echo "✅ No high priority issues found" >> $GITHUB_STEP_SUMMARY
          fi
          
      - name: Upload Analysis
        uses: actions/upload-artifact@v3
        with:
          name: awe-analysis
          path: awe-analysis.json
```

**GitLab CI:**
```yaml
# .gitlab-ci.yml
awe_analysis:
  stage: test
  image: node:18-alpine
  before_script:
    - npm install -g @awe/claude-companion
  script:
    - awe analyze --json > awe-analysis.json
    - awe optimize --dry-run
  artifacts:
    reports:
      junit: awe-analysis.json
    paths:
      - awe-analysis.json
  only:
    - merge_requests
    - main
```

### Package.json Integration

**NPM Scripts:**
```json
{
  "scripts": {
    "awe:setup": "awe init && awe sync",
    "awe:analyze": "awe analyze --verbose",
    "awe:optimize": "awe optimize --auto",
    "awe:recommend": "awe recommend",
    "awe:maintenance": "awe sync && awe analyze --save && awe optimize --auto",
    "postinstall": "awe analyze --quiet",
    "pretest": "awe analyze --quiet --json | jq -e '.optimizations | map(select(.priority==\"high\")) | length == 0'"
  }
}
```

### VS Code Integration

**Settings Configuration:**
```json
// .vscode/settings.json
{
  "awe.autoAnalyze": true,
  "awe.showOptimizations": true,
  "awe.syncOnStartup": false,
  "tasks.runOn": "folderOpen",
  "python.defaultInterpreterPath": "./venv/bin/python"
}
```

**Tasks Configuration:**
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "AWE: Analyze Project",
      "type": "shell",
      "command": "awe",
      "args": ["analyze", "--verbose"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "AWE: Apply Optimizations",
      "type": "shell",
      "command": "awe",
      "args": ["optimize", "--auto"],
      "group": "build",
      "dependsOn": "AWE: Analyze Project"
    }
  ]
}
```

## Best Practices

### Project Organization

**1. File Structure:**
```
project/
├── CLAUDE.md              # Main Claude Code configuration
├── .claude/               # Claude Code specific files
│   ├── hooks/            # Event hooks
│   ├── agents/           # Custom agents
│   └── templates/        # Local templates
├── docs/                 # Project documentation
├── src/                  # Source code
└── tests/               # Test files
```

**2. CLAUDE.md Best Practices:**
```markdown
# Project Name

## Project Overview
- Clear, concise description
- Technology stack summary
- Key features and goals

## Development Guidelines
- Code style and conventions
- Architecture patterns
- Testing strategies

## Feature Implementation System Guidelines
- Parallel task execution rules
- Context optimization guidelines
- Integration patterns

## Environment Setup
- Prerequisites and dependencies
- Installation instructions
- Configuration requirements
```

### Template Customization

**1. Project-Specific Templates:**
```bash
# Create custom template
mkdir -p .claude/templates/my-custom-template

# Define template structure
cat > .claude/templates/my-custom-template/template.json << 'EOF'
{
  "name": "My Custom Template",
  "description": "Project-specific template",
  "category": "custom",
  "variables": {
    "projectName": "string",
    "description": "string",
    "features": "array"
  }
}
EOF

# Create template content
cat > .claude/templates/my-custom-template/CLAUDE.md << 'EOF'
# {{projectName}}

{{description}}

## Technology Stack
{{#each features}}
- {{this}}
{{/each}}
EOF
```

**2. Template Validation:**
```bash
# Validate custom templates
awe scaffold my-custom-template --dry-run

# Test template generation
awe scaffold my-custom-template -n test-project --dry-run
```

### Optimization Workflows

**1. Regular Maintenance:**
```bash
# Create maintenance script
cat > scripts/awe-maintenance.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 AWE Maintenance Starting..."

# Update knowledge base
echo "📚 Syncing knowledge base..."
awe sync

# Analyze project
echo "🔍 Analyzing project..."
awe analyze --save

# Get current score
CURRENT_SCORE=$(awe analyze --json | jq -r '.analysis.claudeCode.completeness')
echo "Current Claude Code score: $CURRENT_SCORE%"

# Apply safe optimizations
echo "⚡ Applying optimizations..."
awe optimize --auto

# Check improvement
NEW_SCORE=$(awe analyze --json | jq -r '.analysis.claudeCode.completeness')
echo "New Claude Code score: $NEW_SCORE%"

if [ "$NEW_SCORE" -gt "$CURRENT_SCORE" ]; then
  echo "✅ Improvement: +$((NEW_SCORE - CURRENT_SCORE))%"
else
  echo "ℹ️  No score improvement this time"
fi

echo "🎉 Maintenance complete!"
EOF

chmod +x scripts/awe-maintenance.sh
```

**2. Performance Monitoring:**
```bash
# Track optimization impact
cat > scripts/track-performance.sh << 'EOF'
#!/bin/bash

# Create performance log
PERF_LOG="awe-performance.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Get current metrics
METRICS=$(awe analyze --json | jq -r '{
  completeness: .analysis.claudeCode.completeness,
  files: .analysis.structure.totalFiles,
  optimizations: (.optimizations | length),
  high_priority: (.optimizations | map(select(.priority=="high")) | length)
}')

# Log metrics
echo "$TIMESTAMP: $METRICS" >> "$PERF_LOG"

# Show trend
echo "Performance trend (last 5 entries):"
tail -5 "$PERF_LOG"
EOF

chmod +x scripts/track-performance.sh
```

## Advanced Usage

### Custom Analysis Rules

**1. Project-Specific Analysis:**
```javascript
// .claude/analyzers/custom-analyzer.js
module.exports = {
  name: 'custom-project-analyzer',
  analyze: async (projectPath, analysis) => {
    // Custom analysis logic
    const customMetrics = {
      hasCustomConfig: await checkCustomConfig(projectPath),
      componentComplexity: await analyzeComponentComplexity(projectPath),
      testCoverage: await getTestCoverage(projectPath)
    };
    
    return {
      ...analysis,
      custom: customMetrics
    };
  }
};
```

**2. Custom Optimization Rules:**
```javascript
// .claude/optimizers/custom-optimizer.js
module.exports = {
  name: 'custom-optimizer',
  optimize: async (analysis) => {
    const optimizations = [];
    
    if (analysis.custom.componentComplexity > 10) {
      optimizations.push({
        title: 'Reduce component complexity',
        priority: 'high',
        description: 'Components are too complex, consider splitting',
        impact: 'Improved maintainability and testing'
      });
    }
    
    return optimizations;
  }
};
```

### Scripting and Automation

**1. Batch Operations:**
```bash
# Process multiple projects
#!/bin/bash

PROJECTS_DIR="./projects"
RESULTS_DIR="./awe-results"

mkdir -p "$RESULTS_DIR"

for project in "$PROJECTS_DIR"/*; do
  if [ -d "$project" ]; then
    PROJECT_NAME=$(basename "$project")
    echo "Processing $PROJECT_NAME..."
    
    cd "$project"
    
    # Analyze project
    awe analyze --json > "$RESULTS_DIR/$PROJECT_NAME-analysis.json"
    
    # Get recommendations
    awe recommend --json > "$RESULTS_DIR/$PROJECT_NAME-recommendations.json"
    
    # Apply safe optimizations
    awe optimize --auto --quiet
    
    cd - > /dev/null
  fi
done

# Generate summary report
node scripts/generate-summary-report.js "$RESULTS_DIR"
```

**2. Integration with External Tools:**
```bash
# Integrate with project management tools
#!/bin/bash

# Get high priority optimizations
HIGH_PRIORITY=$(awe analyze --json | jq -r '.optimizations[] | select(.priority=="high")')

if [ -n "$HIGH_PRIORITY" ]; then
  # Create Jira tickets for high priority items
  echo "$HIGH_PRIORITY" | jq -r '.title + ": " + .description' | while read -r line; do
    # Create Jira ticket via API
    curl -X POST \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $JIRA_TOKEN" \
      -d "{
        \"fields\": {
          \"project\": {\"key\": \"PROJ\"},
          \"summary\": \"AWE Optimization: $line\",
          \"description\": \"Identified by AWE CLI analysis\",
          \"issuetype\": {\"name\": \"Task\"}
        }
      }" \
      "$JIRA_URL/rest/api/2/issue/"
  done
fi
```

### Plugin Development

**1. Custom Commands:**
```javascript
// .claude/commands/deploy.js
const { Command } = require('commander');
const chalk = require('chalk');

const deployCommand = new Command('deploy')
  .description('Deploy project with AWE optimizations')
  .option('-e, --env <environment>', 'deployment environment', 'staging')
  .action(async (options) => {
    console.log(chalk.cyan('🚀 AWE Deploy Starting...'));
    
    // Pre-deployment analysis
    const analysis = await analyzeProject();
    
    // Check for high priority issues
    const highPriority = analysis.optimizations.filter(o => o.priority === 'high');
    if (highPriority.length > 0) {
      console.log(chalk.red('❌ High priority issues found, deployment blocked'));
      return;
    }
    
    // Apply optimizations
    await applyOptimizations();
    
    // Deploy
    await deployToEnvironment(options.env);
    
    console.log(chalk.green('✅ Deployment complete'));
  });

module.exports = deployCommand;
```

**2. Custom Templates:**
```javascript
// .claude/template-generators/microservice.js
module.exports = {
  name: 'microservice',
  description: 'Generate microservice boilerplate',
  
  generate: async (options) => {
    const files = [];
    
    // Generate service files
    files.push({
      path: 'src/app.js',
      content: generateAppFile(options)
    });
    
    files.push({
      path: 'src/routes/health.js',
      content: generateHealthRoute(options)
    });
    
    // Generate configuration
    files.push({
      path: 'CLAUDE.md',
      content: generateClaudeConfig(options)
    });
    
    return files;
  }
};
```

## Tips and Tricks

### Performance Tips

**1. Optimize Analysis Speed:**
```bash
# Use caching for faster analysis
export AWE_CACHE_TTL=7200  # 2 hours

# Analyze only changed files
awe analyze --incremental

# Use quiet mode for scripts
awe analyze --quiet --json
```

**2. Reduce Memory Usage:**
```bash
# Limit analysis scope for large projects
awe analyze --max-files 1000

# Use streaming for large datasets
awe scrape --stream --limit 100
```

### Workflow Optimization

**1. Smart Defaults:**
```bash
# Create alias for common operations
alias awe-quick="awe analyze --save && awe optimize --auto"
alias awe-setup="awe sync && awe init -y"
alias awe-maintenance="awe sync && awe analyze --save && awe recommend"

# Add to ~/.bashrc or ~/.zshrc
echo 'alias awe-quick="awe analyze --save && awe optimize --auto"' >> ~/.bashrc
```

**2. Project Templates:**
```bash
# Create project-specific AWE configuration
cat > .awerc << 'EOF'
{
  "analysis": {
    "excludePatterns": ["dist/", "node_modules/", "*.log"],
    "includeTests": true,
    "checkDependencies": true
  },
  "optimization": {
    "autoApply": ["low", "medium"],
    "requireConfirmation": ["high"],
    "skipPatterns": ["legacy/*"]
  },
  "templates": {
    "preferred": ["react-typescript", "nodejs-express"],
    "customPath": "./.claude/templates"
  }
}
EOF
```

### Debugging and Troubleshooting

**1. Debug Mode:**
```bash
# Enable comprehensive debugging
export DEBUG=awe:*
export AWE_LOG_LEVEL=debug

# Run command with debug output
awe --debug analyze --verbose

# Check log files
tail -f ~/.awe/logs/debug.log
```

**2. Validation and Testing:**
```bash
# Validate configuration before applying
awe optimize --dry-run --verbose

# Test template generation
awe scaffold web-react --dry-run -n test-project

# Verify knowledge base integrity
awe sync --validate
```

### Integration Tips

**1. IDE Integration:**
```json
// VS Code tasks for AWE
{
  "label": "AWE: Quick Analysis",
  "type": "shell",
  "command": "awe",
  "args": ["analyze", "--save"],
  "group": "build",
  "keyBinding": "ctrl+shift+a"
}
```

**2. Team Collaboration:**
```bash
# Share AWE configuration
cat > .awe-team-config << 'EOF'
# AWE Team Configuration
# Add to your shell profile for consistent team setup

export AWE_DATA_DIR="./team/.awe"
export AWE_LOG_LEVEL="info"
export AWE_CACHE_TTL="3600"

# Team aliases
alias team-analyze="awe analyze --save --verbose"
alias team-optimize="awe optimize --auto"
alias team-sync="awe sync && echo 'Team knowledge base updated'"
EOF

# Source for all team members
source .awe-team-config
```

This comprehensive user guide provides practical examples and workflows for effectively using AWE CLI in various development scenarios, from basic usage to advanced automation and team collaboration.