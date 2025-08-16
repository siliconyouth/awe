/**
 * Constants shared across AWE workspace
 */

export const AWE_VERSION = '1.0.0'

export const DEFAULT_CONFIG = {
  CACHE_SIZE: 1000,
  MAX_CONCURRENCY: 10,
  API_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  PERFORMANCE_TARGETS: {
    CACHE_HIT_RATE: 0.85,
    DATABASE_QUERY_TIME: 5, // ms
    MEMORY_CACHE_TIME: 1, // ms
    TEMPLATE_SEARCH_TIME: 50, // ms
  },
} as const

export const SUPPORTED_FILE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx',
  '.py', '.java', '.cs', '.go', '.rs',
  '.php', '.rb', '.swift', '.kt', '.dart',
  '.html', '.css', '.scss', '.sass', '.less',
  '.json', '.yaml', '.yml', '.toml', '.xml',
  '.md', '.mdx', '.txt', '.env',
  '.sql', '.prisma', '.graphql',
] as const

export const FRAMEWORK_TEMPLATES = {
  'next.js': ['web-app', 'api'],
  'react': ['web-app', 'library'],
  'vue': ['web-app'],
  'svelte': ['web-app'],
  'angular': ['web-app'],
  'express': ['api'],
  'fastify': ['api'],
  'nest.js': ['api'],
} as const

export const CLAUDE_MD_TEMPLATE = `# Project Context

## Overview
Brief description of what this project does and its main purpose.

## Architecture
High-level architecture and key design decisions.

## Key Files
- \`src/\` - Main source code
- \`tests/\` - Test files
- \`docs/\` - Documentation

## Development
Instructions for running, testing, and building the project.

## Context for Claude
Specific information that helps Claude understand this codebase better.
`

export const MEMORY_FILE_TEMPLATE = `# Claude Memory

## Project Understanding
Key insights about this project that should be remembered across sessions.

## Patterns
Common patterns and conventions used in this codebase.

## Decisions
Important architectural and design decisions made.

## Learnings
Things learned during development that should inform future work.
`

export const GITIGNORE_TEMPLATE = `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.lcov

# Next.js
.next/
out/

# Build outputs
dist/
build/

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
pnpm-debug.log*
lerna-debug.log*

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Temporary files
*.tmp
*.temp
.cache/

# AWE specific
.awe/
awe.db
`

export const API_ENDPOINTS = {
  PROJECTS: '/api/projects',
  TEMPLATES: '/api/templates',
  ANALYSIS: '/api/analysis',
  RECOMMENDATIONS: '/api/recommendations',
  CONFIG: '/api/config',
} as const

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const

export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const

export const TELEMETRY_EVENTS = {
  PROJECT_ANALYZED: 'project_analyzed',
  TEMPLATE_GENERATED: 'template_generated',
  RECOMMENDATION_APPLIED: 'recommendation_applied',
  CONFIG_UPDATED: 'config_updated',
  ERROR_OCCURRED: 'error_occurred',
} as const