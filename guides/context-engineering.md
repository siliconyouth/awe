# Context Engineering Guide

> **Context Engineering** is the practice of strategically designing and managing the information flow to Claude Code to maximize effectiveness, efficiency, and accuracy of AI assistance.

## Table of Contents

1. [Understanding Context](#understanding-context)
2. [Context Optimization Strategies](#context-optimization-strategies)
3. [CLAUDE.md Best Practices](#claudemd-best-practices)
4. [Project Structure Guidelines](#project-structure-guidelines)
5. [Information Hierarchy](#information-hierarchy)
6. [Context Window Management](#context-window-management)
7. [Practical Examples](#practical-examples)
8. [Advanced Techniques](#advanced-techniques)

## Understanding Context

### What is Context in Claude Code?

Context is all the information Claude Code has access to when providing assistance:

- **CLAUDE.md** - Project-specific instructions and guidelines
- **File contents** - Code, documentation, configuration files
- **Project structure** - Directory layout and organization
- **Conversation history** - Previous interactions and decisions
- **Tool outputs** - Results from running commands, tests, builds

### Context Window Limitations

Claude Code has a finite context window. Understanding this helps optimize information delivery:

- **Token limits** - Each interaction has a maximum token count
- **Information decay** - Older context may be dropped as conversation continues
- **Priority matters** - More recent and relevant information takes precedence

## Context Optimization Strategies

### 1. Strategic Information Placement

```markdown
# CLAUDE.md Structure (Priority Order)

## CRITICAL INSTRUCTIONS (Always include)
- Core project requirements
- Non-negotiable constraints
- Critical workflows

## PROJECT CONTEXT (High priority)
- Tech stack and architecture
- Key patterns and conventions
- Important business logic

## REFERENCE INFORMATION (Medium priority)
- API documentation
- Configuration details
- Style guides

## SUPPLEMENTARY (Low priority)
- Background information
- Optional enhancements
- Future considerations
```

### 2. Information Density Optimization

**❌ Low-density context:**
```markdown
## About Our Project
This project is a web application that we built using React. We chose React because it's popular and has good community support. The project also uses TypeScript for type safety, which helps prevent bugs...
```

**✅ High-density context:**
```markdown
## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + HeadlessUI  
- **State**: Zustand + React Query
- **Testing**: Vitest + Testing Library
```

### 3. Just-in-Time Context Loading

Use tools to load context only when needed:

```bash
# Instead of loading all files in CLAUDE.md
# Use tool commands to load specific context

# When working on authentication:
grep -r "auth" src/ --include="*.ts"

# When debugging API issues:
find src/api -name "*.ts" | head -10
```

## CLAUDE.md Best Practices

### Essential Sections

#### 1. Project Identity
```markdown
# Project: [Name]
**Type**: [Web App / API / CLI Tool / Library]
**Primary Language**: [JavaScript/Python/etc.]
**Framework**: [React/Express/FastAPI/etc.]
```

#### 2. Critical Workflows
```markdown
## CRITICAL WORKFLOWS

### Development Workflow
1. Run `npm run dev` to start development server
2. Run `npm test` before committing
3. Use `npm run lint` to check code style

### Testing Requirements
- All new features must have tests
- Minimum 80% coverage required
- Integration tests for API endpoints
```

#### 3. Architecture Overview
```markdown
## Architecture

```
src/
├── components/     # Reusable UI components
├── pages/         # Page-level components  
├── hooks/         # Custom React hooks
├── utils/         # Pure utility functions
├── api/           # API layer and types
└── stores/        # Zustand stores
```

### File Organization Pattern
- Components: PascalCase (UserProfile.tsx)
- Hooks: camelCase with 'use' prefix (useUserData.ts)
- Utils: camelCase (formatDate.ts)
```

#### 4. Context Triggers
```markdown
## Context Loading Triggers

When working on:
- **Authentication**: Read src/auth/* and src/components/Auth/*
- **API Integration**: Read src/api/* and check network requests
- **UI Components**: Read src/components/* and Storybook stories
- **Database**: Read prisma/schema.prisma and src/db/*
```

### Anti-Patterns to Avoid

❌ **Verbose explanations**
```markdown
## Why We Use TypeScript
TypeScript is a superset of JavaScript that adds static type definitions. Types provide a way to describe the shape of an object, providing better documentation, and allowing TypeScript to validate that your code is working correctly...
```

✅ **Concise directives**
```markdown
## TypeScript Rules
- Strict mode enabled
- No `any` types allowed
- Interface over type aliases
- Use absolute imports (@/components)
```

## Project Structure Guidelines

### Optimal Directory Organization

```
project/
├── CLAUDE.md              # Context engineering
├── README.md              # Human documentation  
├── docs/                  # Detailed documentation
│   ├── api.md            # API documentation
│   ├── deployment.md     # Deployment guide
│   └── architecture.md   # System architecture
├── src/
│   ├── components/       # UI components
│   ├── pages/           # Application pages
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utilities
│   ├── types/           # Type definitions
│   └── __tests__/       # Test files
├── config/              # Configuration files
└── scripts/             # Build/utility scripts
```

### Context-Friendly Naming

**File Naming Conventions:**
- Use descriptive, unambiguous names
- Include context in filename when helpful
- Group related files with prefixes

```
# Good naming
UserProfile.component.tsx
UserProfile.test.tsx
UserProfile.stories.tsx
user.api.ts
user.types.ts

# Poor naming  
Profile.tsx
test.tsx
stories.tsx
api.ts
types.ts
```

## Information Hierarchy

### Context Priority Levels

#### Level 1: Critical (Always Available)
- Core business rules
- Security requirements
- API contracts
- Critical workflows

#### Level 2: Important (Frequently Accessed)
- Code conventions
- Architecture patterns
- Testing strategies
- Deployment procedures

#### Level 3: Reference (On-Demand)
- API documentation
- Style guides
- Configuration details
- Historical decisions

#### Level 4: Background (Rarely Needed)
- Technology rationales
- Alternative approaches considered
- Future enhancement ideas

### Dynamic Context Loading

```markdown
## Context Loading Strategy

### Automatic Loading
- Always load: CLAUDE.md, package.json, tsconfig.json
- On error: Load relevant test files and logs
- On API work: Load API schemas and examples

### Manual Loading Commands
```bash
# Load component context
find src/components -name "*User*" -type f

# Load test context  
find . -name "*.test.*" -path "*/user/*"

# Load configuration context
ls config/ && cat config/database.yml
```
```

## Context Window Management

### Conversation Strategies

#### 1. Context Refresh Patterns

**Periodic Refresh:**
```bash
# Every 10-15 interactions, refresh key context
cat CLAUDE.md
ls -la src/
git status
```

**Task-Based Refresh:**
```bash
# When switching tasks, load new context
grep -r "payment" src/ --include="*.ts" | head -10
find src/components -name "*Payment*"
```

#### 2. Context Compression Techniques

**Summarization:**
Instead of including full files, provide summaries:

```markdown
## Current Component Structure
- UserDashboard: Main dashboard with metrics (120 LOC)
- UserProfile: Profile management form (80 LOC)  
- UserSettings: Account settings page (95 LOC)
- Common patterns: Formik validation, React Query data fetching
```

**Reference Linking:**
```markdown
## Key Files
- User types: `src/types/user.ts` (interface definitions)
- User API: `src/api/user.ts` (CRUD operations)
- User store: `src/stores/userStore.ts` (Zustand state)

Use `Read [filename]` to load specific implementations.
```

### Context Optimization Tools

#### AWE CLI Integration
```bash
# Let AWE manage context automatically
awe analyze --context-optimization
awe recommend --context-strategy

# Generate context-optimized CLAUDE.md
awe optimize --context-focus
```

#### Custom Context Commands
```bash
# Create aliases for common context operations
alias ctx-user="find src -name '*user*' -o -name '*User*'"
alias ctx-api="ls src/api/ && head -5 src/api/*.ts"
alias ctx-fresh="cat CLAUDE.md && git status && npm run typecheck"
```

## Practical Examples

### Example 1: E-commerce Application

```markdown
# E-commerce Platform - Context Strategy

## Critical Context
- **Payment Processing**: Stripe integration, PCI compliance required
- **Inventory Management**: Real-time stock tracking, reservation system
- **User Authentication**: JWT tokens, role-based access (admin/customer)

## Context Loading Triggers
- **Product work**: Load `src/product/*`, `src/inventory/*`
- **Order work**: Load `src/order/*`, `src/payment/*`, `src/shipping/*`
- **Admin work**: Load `src/admin/*`, `src/analytics/*`

## Architecture Context
```
src/
├── product/           # Product catalog & search
├── cart/             # Shopping cart logic
├── order/            # Order processing
├── payment/          # Payment integration
├── user/             # User management
├── admin/            # Admin interface
└── shared/           # Common utilities
```

## API Context
- REST API: `/api/v1/*`
- GraphQL: `/graphql` for complex queries
- WebSocket: `/ws` for real-time updates
- Rate limiting: 100 req/min per user
```

### Example 2: React Component Library

```markdown
# Design System Library - Context Strategy

## Component Development Rules
- **Storybook**: Every component needs stories
- **Testing**: Unit + visual regression tests required
- **Props**: Strict TypeScript interfaces, no any types
- **Styling**: CSS Modules + design tokens only

## Context by Component Type
- **Layout**: Grid, Container, Stack → Focus on responsive behavior
- **Forms**: Input, Button, Select → Focus on validation & accessibility  
- **Data**: Table, List, Card → Focus on performance & virtualization
- **Feedback**: Modal, Toast, Alert → Focus on user experience

## Quick Context Commands
```bash
# Working on Button component
find . -name "*Button*" -o -name "*button*"
cat src/tokens/spacing.ts src/tokens/colors.ts

# Working on Form components  
ls src/components/forms/
cat src/hooks/useValidation.ts
```
```

### Example 3: API Service

```markdown
# Microservice API - Context Strategy

## Service Boundaries
- **User Service**: Authentication, profiles, preferences
- **Product Service**: Catalog, inventory, pricing
- **Order Service**: Order processing, fulfillment
- **Payment Service**: Payment processing, billing

## Context Loading by Domain
```bash
# User domain work
ls src/user/ && cat src/user/user.model.ts

# Product domain work  
ls src/product/ && cat src/product/product.schema.ts

# Cross-cutting concerns
cat src/middleware/ src/utils/ src/types/common.ts
```

## Database Context
- **PostgreSQL**: Main relational data
- **Redis**: Caching and sessions  
- **Elasticsearch**: Search functionality
- **Migrations**: Automatic via Prisma
```

## Advanced Techniques

### 1. Context Branching Strategy

Use Git branches to maintain context isolation:

```bash
# Feature-specific context
git checkout feature/payment-integration
# CLAUDE.md contains payment-specific context

git checkout feature/user-dashboard  
# CLAUDE.md contains dashboard-specific context

git checkout main
# CLAUDE.md contains general context
```

### 2. Multi-Layer Context Architecture

```markdown
## Context Layers

### Layer 1: Global (CLAUDE.md)
- Project identity and core rules
- Architecture overview
- Critical workflows

### Layer 2: Domain (domain/CONTEXT.md)
```
src/
├── user/
│   └── CONTEXT.md     # User domain context
├── product/ 
│   └── CONTEXT.md     # Product domain context
└── payment/
    └── CONTEXT.md     # Payment domain context
```

### Layer 3: Component (.component.md)
```
src/components/
├── UserProfile/
│   ├── UserProfile.tsx
│   ├── UserProfile.test.tsx
│   └── UserProfile.context.md    # Component-specific context
```
```

### 3. Context Analytics

Track context effectiveness:

```markdown
## Context Metrics
- **Context Loading Frequency**: Which files are accessed most?
- **Error Correlation**: Do certain context patterns reduce errors?
- **Performance Impact**: How does context size affect response time?
- **Accuracy Improvement**: Does better context improve code quality?
```

### 4. AI-Powered Context Optimization

```bash
# Use AI to optimize context
awe analyze --context-efficiency
awe recommend --context-compression
awe optimize --context-priority-ranking
```

## Context Engineering Checklist

### ✅ Pre-Project Setup
- [ ] Define project identity and scope
- [ ] Establish critical workflows  
- [ ] Design context loading strategy
- [ ] Create CLAUDE.md template
- [ ] Set up context refresh procedures

### ✅ During Development
- [ ] Update context for major architectural changes
- [ ] Optimize context when performance degrades
- [ ] Add context triggers for new domains
- [ ] Monitor context window usage
- [ ] Refresh stale context regularly

### ✅ Context Quality Assurance
- [ ] Test context with fresh conversations
- [ ] Verify critical information is always available
- [ ] Validate context loading commands work
- [ ] Check for context conflicts or contradictions
- [ ] Measure context effectiveness metrics

## Summary

Effective context engineering is crucial for maximizing Claude Code's effectiveness. By strategically organizing information, optimizing context density, and implementing smart loading strategies, you can ensure Claude Code has the right information at the right time to provide the best possible assistance.

**Key Principles:**
1. **Prioritize critical information** - Keep essential context always available
2. **Optimize information density** - More useful information in fewer tokens
3. **Load context dynamically** - Bring in specific context when needed
4. **Maintain context freshness** - Regular updates and refresh cycles
5. **Measure and iterate** - Track effectiveness and optimize continuously

The goal is to create a seamless information flow that enhances AI assistance while respecting context window limitations and cognitive load constraints.