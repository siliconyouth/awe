# AWE CLI Reference Guide

Complete reference documentation for all AWE CLI commands, options, and usage patterns.

## Table of Contents

- [Global Options](#global-options)
- [Core Commands](#core-commands)
  - [awe init](#awe-init)
  - [awe analyze](#awe-analyze)
  - [awe recommend](#awe-recommend)
  - [awe scaffold](#awe-scaffold)
  - [awe optimize](#awe-optimize)
  - [awe sync](#awe-sync)
  - [awe learn](#awe-learn)
  - [awe scrape](#awe-scrape)
- [Environment Variables](#environment-variables)
- [Exit Codes](#exit-codes)
- [Command Examples](#command-examples)

## Installation

```bash
npm install -g @awe/claude-companion
```

## Global Options

These options are available for all commands:

| Option | Description | Default |
|--------|-------------|---------|
| `-v, --version` | Display version number | - |
| `-h, --help` | Display help information | - |
| `-q, --quiet` | Suppress output messages | `false` |
| `-d, --debug` | Enable debug logging | `false` |

### Global Usage Examples

```bash
# Show version
awe --version

# Enable debug mode for any command
awe --debug analyze

# Run command quietly
awe --quiet sync
```

## Core Commands

### awe init

Initialize Claude Code configuration for the current project.

**Syntax:**
```bash
awe init [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-y, --yes` | Skip interactive prompts and use defaults | `false` |
| `-t, --template <name>` | Use specific template | Interactive selection |
| `--force` | Overwrite existing CLAUDE.md | `false` |

**Examples:**

```bash
# Interactive initialization
awe init

# Use defaults, no prompts
awe init -y

# Force overwrite existing CLAUDE.md
awe init --force

# Use specific template
awe init -t react-web

# Combine options
awe init -y -t nodejs-api --force
```

**What it does:**
1. Analyzes current project structure
2. Detects technologies and frameworks
3. Recommends suitable templates
4. Creates customized CLAUDE.md
5. Saves project data for future recommendations

**Output Files:**
- `CLAUDE.md` - Main Claude Code configuration

### awe analyze

Analyze project for optimization opportunities and Claude Code setup assessment.

**Syntax:**
```bash
awe analyze [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-v, --verbose` | Show detailed analysis | `false` |
| `-j, --json` | Output as JSON | `false` |
| `--save` | Save analysis results to database | `false` |

**Examples:**

```bash
# Standard analysis
awe analyze

# Verbose output with detailed information
awe analyze --verbose

# JSON output for scripting
awe analyze --json > analysis.json

# Save results to database
awe analyze --save

# Combine options
awe analyze --verbose --save
```

**Analysis Categories:**
- **Project Overview**: Type, size, complexity
- **Technology Stack**: Languages, frameworks, tools
- **Architecture & Patterns**: Design patterns, conventions
- **Claude Code Assessment**: Setup completeness, optimization score
- **Optimization Opportunities**: Performance, configuration improvements

**Sample JSON Output:**
```json
{
  "analysis": {
    "path": "/path/to/project",
    "classification": {
      "type": "web-application",
      "confidence": "high"
    },
    "languages": {
      "primary": "JavaScript",
      "detected": {
        "JavaScript": 45,
        "TypeScript": 12,
        "CSS": 8
      }
    },
    "frameworks": {
      "detected": ["React", "Express"],
      "frontend": ["React"],
      "backend": ["Express"]
    },
    "claudeCode": {
      "completeness": 75,
      "hasClaudeMd": true,
      "hasClaudeDir": false
    }
  },
  "optimizations": [
    {
      "title": "Add TypeScript configuration",
      "priority": "medium",
      "description": "Project would benefit from TypeScript setup",
      "impact": "Improved type safety and development experience"
    }
  ]
}
```

### awe recommend

Get AI-powered recommendations based on project analysis.

**Syntax:**
```bash
awe recommend [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --type <type>` | Recommendation type (templates, optimizations, tools) | `all` |
| `-j, --json` | Output as JSON | `false` |

**Examples:**

```bash
# Get all recommendations
awe recommend

# Get only template recommendations
awe recommend --type templates

# JSON output
awe recommend --json

# Get specific recommendation types
awe recommend --type optimizations
awe recommend --type tools
```

**Recommendation Types:**
- **Templates**: Suitable CLAUDE.md templates
- **Optimizations**: Performance and configuration improvements
- **Tools**: Suggested development tools and integrations

**Sample Output:**
```
🎯 AWE Recommendations

Based on your web-application project using JavaScript:

1. React TypeScript Template (high confidence)
   Modern React application with TypeScript, Vite, and testing setup
   Reasoning: Detected React framework with TypeScript files present
   Score: 92/100

2. Node.js API Template (medium confidence)
   Express.js API with TypeScript, testing, and documentation
   Reasoning: Express.js backend detected, would complement frontend
   Score: 78/100
```

### awe scaffold

Generate project scaffolds from proven patterns.

**Syntax:**
```bash
awe scaffold [pattern] [options]
```

**Arguments:**

| Argument | Description | Required |
|----------|-------------|----------|
| `pattern` | Scaffold pattern to use | No |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <dir>` | Output directory | `.` |
| `-n, --name <name>` | Project name | Directory name |
| `--dry-run` | Preview what would be created | `false` |
| `-f, --force` | Overwrite existing files | `false` |

**Available Patterns:**

| Pattern | Description |
|---------|-------------|
| `web-react` | React web application with TypeScript and Vite |
| `nodejs-api` | Node.js API service with Express and TypeScript |
| `python-data` | Python data science project with Jupyter |
| `frontend-spa` | Framework-agnostic single page application |
| `backend-service` | Language-agnostic backend microservice |
| `cli-tool` | Command-line application template |
| `library` | Reusable library/package template |
| `fullstack` | Complete frontend + backend application |

**Examples:**

```bash
# List available patterns
awe scaffold

# Create React project
awe scaffold web-react

# Create project in specific directory
awe scaffold nodejs-api -o ./my-api

# Set project name
awe scaffold web-react -n my-awesome-app

# Preview without creating files
awe scaffold python-data --dry-run

# Force overwrite existing files
awe scaffold cli-tool --force

# Complete example
awe scaffold web-react -n my-app -o ./projects/my-app --force
```

**Generated Files Example (web-react):**
```
my-app/
├── CLAUDE.md
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   └── HelloWorld.tsx
│   └── index.css
└── public/
    └── vite.svg
```

### awe optimize

Apply optimization recommendations automatically.

**Syntax:**
```bash
awe optimize [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--auto` | Apply all safe optimizations automatically | `false` |
| `--dry-run` | Show what would be changed without applying | `false` |

**Examples:**

```bash
# Interactive optimization selection
awe optimize

# Apply all safe optimizations automatically
awe optimize --auto

# Preview changes without applying
awe optimize --dry-run
```

**Optimization Categories:**
- **High Priority**: Critical performance or configuration issues
- **Medium Priority**: Helpful improvements with good impact
- **Low Priority**: Minor enhancements and polish

**Interactive Mode:**
```
⚡ AWE Project Optimization

Found 3 optimization opportunities:

1. HIGH Add TypeScript configuration
   Project would benefit from TypeScript setup
   Impact: Improved type safety and development experience

2. MEDIUM Configure ESLint rules
   Add comprehensive ESLint configuration for code quality
   Impact: Better code consistency and error detection

3. LOW Add Prettier configuration
   Standardize code formatting across the project
   Impact: Consistent code style

? Select optimizations to apply: (Use space to select)
❯◉ Add TypeScript configuration (high priority)
 ◉ Configure ESLint rules (medium priority)
 ◯ Add Prettier configuration (low priority)
```

### awe sync

Synchronize knowledge base with latest patterns and templates.

**Syntax:**
```bash
awe sync [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--force` | Force full resync | `false` |

**Examples:**

```bash
# Standard sync
awe sync

# Force complete resync
awe sync --force
```

**What it does:**
1. Updates local template database
2. Refreshes community patterns
3. Downloads latest best practices
4. Updates AI models and embeddings

**Sample Output:**
```
🔄 AWE Knowledge Base Sync

✅ Sync Results:
  Templates updated: 15
  Last sync: 12/15/2024, 2:30:45 PM

Knowledge base is up to date!
```

### awe learn

Manage learning system and view statistics.

**Syntax:**
```bash
awe learn [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--stats` | Show learning statistics | `false` |
| `--from-interaction` | Record learning from current interaction | `false` |

**Examples:**

```bash
# Show learning options
awe learn

# View learning statistics
awe learn --stats

# Record learning interaction
awe learn --from-interaction
```

**Learning Statistics Output:**
```
📊 AWE Learning Statistics

Total interactions: 127
Successful: 98
Positive feedback: 82

Most used templates:
  1. react-typescript (24 uses, 4.3 rating)
  2. nodejs-express (18 uses, 4.1 rating)
  3. python-fastapi (12 uses, 4.5 rating)

Learning system is active and improving recommendations.
```

### awe scrape

Intelligently gather Claude Code patterns and best practices.

**Syntax:**
```bash
awe scrape [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --sources <sources>` | Comma-separated list of sources | `all` |
| `-c, --categories <categories>` | Filter by categories | `all` |
| `-l, --limit <number>` | Limit items per source | `50` |
| `--dry-run` | Show what would be scraped | `false` |
| `--force` | Force re-scraping existing data | `false` |
| `--concurrent <number>` | Concurrent scraping tasks | `3` |
| `--output <format>` | Output format (json, table, summary) | `summary` |

**Available Sources:**
- `claude-docs`: Official Claude Code documentation
- `github-patterns`: Popular GitHub patterns and templates
- `community-templates`: Community-contributed templates
- `best-practices`: Curated best practices and guides

**Examples:**

```bash
# Scrape all sources
awe scrape

# Scrape specific sources
awe scrape -s claude-docs,github-patterns

# Limit items per source
awe scrape -l 25

# Filter by categories
awe scrape -c frontend,testing

# Preview what would be scraped
awe scrape --dry-run

# Force re-scraping with more concurrent tasks
awe scrape --force --concurrent 5

# Output as JSON
awe scrape --output json > scraped_data.json

# Complete example
awe scrape -s github-patterns -c frontend -l 30 --output table
```

**Sample Output:**
```
🔍 AWE Intelligent Scraper
Gathering Claude Code patterns and best practices...

🚀 Starting intelligent scraping...

✅ claude-docs:
   📋 8 patterns
   📄 12 templates
   💡 15 best practices

✅ github-patterns:
   📋 23 patterns
   📄 18 templates

📈 Summary:
   Successful sources: 2
   Failed sources: 0
   Total patterns: 31
   Total templates: 30

📊 Pattern Analysis
───────────────────────
📊 Most Common Pattern Categories:
   frontend: 12 patterns
   testing: 8 patterns
   configuration: 6 patterns

📈 Knowledge Base Metrics:
   Total patterns: 156
   Unique sources: 8
   Avg patterns per source: 19.5

✅ Scraping completed in 12.3s
```

## Environment Variables

Configure AWE CLI behavior using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `AWE_DATA_DIR` | Directory for AWE data storage | `~/.awe` |
| `AWE_LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` |
| `AWE_CACHE_TTL` | Cache time-to-live in seconds | `3600` |
| `AWE_API_TIMEOUT` | API request timeout in milliseconds | `30000` |
| `NODE_ENV` | Node environment (development, production) | `production` |
| `DEBUG` | Enable debug mode | `false` |

**Usage Examples:**

```bash
# Custom data directory
export AWE_DATA_DIR="/custom/path/.awe"

# Enable debug logging
export AWE_LOG_LEVEL="debug"

# Increase API timeout
export AWE_API_TIMEOUT="60000"

# Use environment variables with commands
AWE_LOG_LEVEL=debug awe analyze --verbose
```

## Exit Codes

AWE CLI uses standard exit codes to indicate command status:

| Code | Description |
|------|-------------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid command or arguments |
| `3` | File system error |
| `4` | Network error |
| `5` | Database error |
| `6` | Validation error |

## Command Examples

### Complete Workflow Examples

**New Project Setup:**
```bash
# Create new React project
awe scaffold web-react -n my-app -o ./projects

# Navigate to project
cd ./projects/my-app

# Initialize Claude Code configuration
awe init -y

# Analyze for optimizations
awe analyze --save

# Apply recommended optimizations
awe optimize --auto
```

**Existing Project Analysis:**
```bash
# Analyze current project
awe analyze --verbose --save

# Get recommendations
awe recommend

# Initialize with recommended template
awe init -t react-typescript

# Optimize configuration
awe optimize
```

**Maintenance and Updates:**
```bash
# Update knowledge base
awe sync

# Check learning statistics
awe learn --stats

# Gather latest patterns
awe scrape --force

# Re-analyze project with updated data
awe analyze --save
```

**Scripting and Automation:**
```bash
# JSON output for scripts
awe analyze --json | jq '.optimizations[] | select(.priority=="high")'

# Automated optimization
awe optimize --auto --quiet

# Batch processing
for dir in projects/*/; do
  (cd "$dir" && awe analyze --json >> "../analysis_results.json")
done
```

**Development Workflow:**
```bash
# Debug mode for troubleshooting
awe --debug analyze --verbose

# Dry run before making changes
awe scaffold web-react --dry-run
awe optimize --dry-run

# Force operations when needed
awe init --force
awe sync --force
awe scrape --force
```

### Integration Examples

**CI/CD Pipeline:**
```yaml
# .github/workflows/awe-analysis.yml
name: AWE Analysis
on: [push, pull_request]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install AWE CLI
        run: npm install -g @awe/claude-companion
      - name: Analyze Project
        run: awe analyze --json > analysis.json
      - name: Upload Analysis
        uses: actions/upload-artifact@v2
        with:
          name: awe-analysis
          path: analysis.json
```

**Package.json Scripts:**
```json
{
  "scripts": {
    "awe:analyze": "awe analyze --verbose",
    "awe:optimize": "awe optimize --auto",
    "awe:recommend": "awe recommend",
    "awe:sync": "awe sync",
    "setup": "awe init && npm install"
  }
}
```

**Pre-commit Hook:**
```bash
#!/bin/sh
# .git/hooks/pre-commit
awe analyze --quiet --json | jq -e '.optimizations | length == 0' || {
  echo "AWE found optimization opportunities. Run 'awe optimize' to fix them."
  exit 1
}
```

## Error Handling

AWE CLI provides helpful error messages and suggestions:

**Common Error Patterns:**

```bash
# File not found
❌ File or directory not found
Check that the path exists and you have permission to access it.

# Permission denied
❌ Permission denied
Check that you have the necessary permissions.

# Database error
❌ Database error
Try running with --debug for more information.
You may need to reset the database with: rm ~/.awe/awe.db

# Network error (for sync/scrape commands)
❌ Network error
Check your internet connection and try again.
```

**Debug Information:**
```bash
# Enable debug mode for detailed error information
awe --debug <command>

# View log files
cat ~/.awe/logs/awe.log
cat ~/.awe/logs/error.log
```

**Getting Help:**
```bash
# Command-specific help
awe <command> --help

# General help
awe --help

# Report issues
# GitHub: https://github.com/awe-team/claude-companion/issues
```

This completes the comprehensive CLI reference documentation. Each command includes detailed options, examples, and expected outputs to help users effectively utilize the AWE CLI tool.