# CLI Reference

Complete reference for all AWE CLI commands with examples and options.

## Global Options

```bash
awe [command] [options]

Global Options:
  -h, --help     Show help for command
  -v, --version  Show version number
  --verbose      Enable verbose logging
  --debug        Enable debug mode
  --offline      Force offline mode
```

## Commands Overview

| Command | Description | AI-Powered |
|---------|-------------|------------|
| [`init`](#awe-init) | Initialize project with intelligent context | ✅ |
| [`analyze`](#awe-analyze) | Deep project analysis with insights | ✅ |
| [`recommend`](#awe-recommend) | Get optimization recommendations | ✅ |
| [`scaffold`](#awe-scaffold) | AI-driven template generation | ✅ |
| [`config`](#awe-config) | Configuration management | ❌ |
| [`sync`](#awe-sync) | Synchronize with cloud services | ❌ |

---

## `awe init`

Initialize project with AI-generated CLAUDE.md and AWE configuration.

### Syntax
```bash
awe init [options]
```

### Options
- `-p, --path <path>` - Project path (default: current directory)
- `-f, --force` - Overwrite existing files
- `--memory` - Also create MEMORY.md file
- `--ai` - Use AI to generate intelligent context (default: true)
- `--template` - Use default template instead of AI generation

### Examples

```bash
# Initialize current project with AI
awe init --ai

# Initialize specific project
awe init --path /path/to/project --ai

# Force overwrite existing files
awe init --force --ai

# Create both CLAUDE.md and MEMORY.md
awe init --memory --ai

# Use template instead of AI
awe init --template
```

### Output

Creates:
- `CLAUDE.md` - Intelligent project context for Claude Code
- `MEMORY.md` - Project memory file (if --memory flag used)
- `.awe/config.json` - AWE configuration

### AI Features

When `--ai` is enabled:
- **Project Analysis**: Scans codebase for languages, frameworks, and patterns
- **Context Generation**: Creates tailored CLAUDE.md with project-specific guidance
- **Best Practices**: Includes relevant development guidelines and standards
- **Claude Integration**: Optimizes context for Claude Code workflows

---

## `awe analyze`

Perform deep project analysis with AI-powered insights and recommendations.

### Syntax
```bash
awe analyze [options]
```

### Options
- `-p, --path <path>` - Project path to analyze (default: current directory)
- `-d, --depth <depth>` - Analysis depth: `shallow`, `deep`, `comprehensive` (default: deep)
- `-o, --output <format>` - Output format: `json`, `table`, `summary` (default: summary)
- `--save` - Save analysis results to `.awe/analysis.json`
- `--ai` - Enable AI-powered analysis (default: true)
- `--focus <area>` - Focus on specific area: `performance`, `security`, `maintainability`

### Examples

```bash
# Basic project analysis
awe analyze

# Comprehensive analysis with JSON output
awe analyze --depth comprehensive --output json

# Focus on performance issues
awe analyze --focus performance

# Analyze specific project and save results
awe analyze --path /path/to/project --save

# Offline analysis without AI
awe analyze --ai false
```

### Analysis Depths

#### Shallow
- Basic file count and structure
- Language detection
- Framework identification
- ~5-10 seconds

#### Deep (Default)
- Code complexity analysis
- Dependency analysis
- Performance metrics
- Security scan basics
- ~30-60 seconds

#### Comprehensive
- Advanced pattern recognition
- Architecture analysis
- Detailed recommendations
- Performance profiling
- ~2-5 minutes

### Output Formats

#### Summary (Default)
```
📊 Project Analysis Summary
═══════════════════════════

Project: my-awesome-app
Type: Web Application
Languages: TypeScript (85%), JavaScript (15%)
Frameworks: React, Next.js, Tailwind CSS

📈 Metrics:
  Code Complexity: 7.2/10
  Maintainability: 8.5/10
  Test Coverage: 85%
  Performance Score: 92/100

🎯 Top Recommendations:
  1. [HIGH] Optimize bundle size (Impact: High, Effort: Medium)
  2. [MEDIUM] Add error boundaries (Impact: Medium, Effort: Low)
  3. [LOW] Update dependencies (Impact: Low, Effort: Low)
```

#### JSON
```json
{
  "project": {
    "name": "my-awesome-app",
    "type": "web-application",
    "path": "/path/to/project",
    "languages": [
      { "name": "TypeScript", "percentage": 85 },
      { "name": "JavaScript", "percentage": 15 }
    ],
    "frameworks": ["React", "Next.js", "Tailwind CSS"],
    "metrics": {
      "complexity": 7.2,
      "maintainability": 8.5,
      "testCoverage": 85,
      "performanceScore": 92
    }
  },
  "recommendations": [
    {
      "id": "bundle-optimization",
      "type": "performance",
      "priority": "high",
      "title": "Optimize bundle size",
      "description": "Current bundle size exceeds recommended limits",
      "impact": "high",
      "effort": "medium",
      "commands": ["npm run analyze", "webpack-bundle-analyzer"]
    }
  ]
}
```

---

## `awe recommend`

Generate AI-powered optimization recommendations for your project.

### Syntax
```bash
awe recommend [options]
```

### Options
- `-p, --path <path>` - Project path (default: current directory)
- `-t, --type <type>` - Recommendation type: `all`, `performance`, `security`, `maintainability`, `architecture`, `testing`, `documentation`
- `-o, --output <format>` - Output format: `json`, `table`, `summary` (default: summary)
- `--priority <level>` - Filter by priority: `critical`, `high`, `medium`, `low`
- `--save` - Save recommendations to `.awe/recommendations.json`
- `--ai` - Enable AI-powered recommendations (default: true)

### Examples

```bash
# All recommendations
awe recommend

# Performance-specific recommendations
awe recommend --type performance

# High priority recommendations only
awe recommend --priority high

# Security recommendations with JSON output
awe recommend --type security --output json

# Save recommendations for later review
awe recommend --save
```

### Recommendation Types

#### Performance
- Bundle size optimization
- Code splitting strategies
- Caching improvements
- Lazy loading opportunities
- Performance monitoring setup

#### Security
- Vulnerability detection
- Authentication improvements
- Data protection measures
- API security enhancements
- Dependency security updates

#### Maintainability
- Code organization improvements
- Documentation gaps
- Testing coverage
- Refactoring opportunities
- Technical debt reduction

#### Architecture
- Design pattern improvements
- Scalability enhancements
- Modularity optimizations
- Dependency management
- Service architecture

---

## `awe scaffold`

Generate project templates and boilerplate code with AI assistance.

### Syntax
```bash
awe scaffold [options]
```

### Options
- `-t, --type <type>` - Template type: `react-app`, `api-server`, `fullstack`, `library`
- `-n, --name <name>` - Project name
- `-p, --path <path>` - Output path (default: current directory)
- `--ai` - Use AI for intelligent template selection (default: true)
- `--typescript` - Use TypeScript templates
- `--framework <framework>` - Specific framework: `react`, `vue`, `svelte`, `express`, `fastify`

### Examples

```bash
# AI-powered template selection
awe scaffold --ai

# Specific React TypeScript app
awe scaffold --type react-app --typescript --name my-app

# Express API server
awe scaffold --type api-server --framework express --name my-api

# Full-stack application
awe scaffold --type fullstack --ai
```

### Template Types

#### React App
- Modern React setup with TypeScript
- Tailwind CSS configuration
- Testing framework (Jest/Vitest)
- Build optimization
- Development tools

#### API Server
- Express.js or Fastify setup
- Database integration (Prisma)
- Authentication middleware
- API documentation
- Testing setup

#### Full-Stack
- Complete application setup
- Frontend and backend integration
- Database configuration
- Deployment scripts
- CI/CD pipeline

---

## `awe config`

Manage AWE configuration and cloud service integration.

### Syntax
```bash
awe config [options]
```

### Options
- `--setup` - Interactive setup wizard
- `--show` - Display current configuration
- `--reset` - Reset to default configuration
- `--ai-status` - Check AI service status
- `--test-connection` - Test cloud service connections

### Examples

```bash
# Interactive setup
awe config --setup

# Show current configuration
awe config --show

# Test AI integration
awe config --ai-status

# Reset configuration
awe config --reset
```

---

## `awe sync`

Synchronize project data with cloud services and analytics.

### Syntax
```bash
awe sync [options]
```

### Options
- `--background` - Run synchronization in background
- `--force` - Force synchronization even if up-to-date
- `--analytics` - Sync analytics data only
- `--templates` - Sync template data only

### Examples

```bash
# Background sync
awe sync --background

# Force complete sync
awe sync --force

# Sync analytics only
awe sync --analytics
```

---

## Environment Variables

### Required
```bash
# AI Integration
ANTHROPIC_API_KEY="sk-ant-your-api-key"
```

### Optional
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Performance
AWE_CACHE_SIZE="1000"
AWE_MAX_CONCURRENCY="10"
AWE_API_TIMEOUT="30000"

# Debug
AWE_DEBUG="true"
AWE_LOG_LEVEL="debug"
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | Network error |
| 4 | AI service error |
| 5 | File system error |

## Common Usage Patterns

### Daily Development Workflow
```bash
# Morning: Analyze recent changes
awe analyze --focus performance

# Mid-day: Get recommendations for improvements
awe recommend --priority high

# Evening: Sync progress with team
awe sync --background
```

### New Project Setup
```bash
# 1. Initialize project
awe init --ai --memory

# 2. Analyze structure
awe analyze --depth comprehensive

# 3. Get initial recommendations
awe recommend --save

# 4. Configure for team
awe config --setup
```

### CI/CD Integration
```bash
# Analysis in pipeline
awe analyze --output json > analysis.json

# Check for critical issues
awe recommend --priority critical --output json | jq '.[] | select(.priority == "critical")'

# Fail build on critical security issues
awe recommend --type security --priority critical --output json | jq -e 'length == 0'
```

---

**💻 Master the AWE CLI for maximum development efficiency!**