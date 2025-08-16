# CLAUDE.md - AWE Workspace Engineering

## Project Overview
AWE (Awesome Workspace Engineering) is an intelligent AI-powered development companion specifically designed to enhance Claude Code workflows. Built with Claude Opus 4.1 and ultrathinking capabilities, AWE provides deep project analysis, optimization recommendations, and intelligent automation for modern development teams.

**🎯 Vision**: Industry-leading Claude Code optimization platform  
**🚀 Mission**: Transform development workflows through AI-powered intelligence  
**⚡ Current Status**: Production-ready with full AI integration

## Architecture

### Monorepo Structure
```
awe-workspace/
├── apps/
│   ├── cli/        # Command-line interface application
│   └── web/        # Next.js web application
├── packages/
│   ├── ai/         # AI integration and logic
│   ├── database/   # Database schemas and operations
│   └── shared/     # Shared utilities and types
```

### Key Components
- **CLI Application** (apps/cli): Advanced TypeScript CLI with 8+ AI-powered commands
- **Web Dashboard** (apps/web): Next.js 15 application with modern UI
- **AI Engine** (packages/ai): Claude Opus 4.1 integration with ultrathinking analysis
- **Database Layer** (packages/database): Prisma ORM with Supabase backend
- **Shared Utilities** (packages/shared): Type-safe utilities and constants

### AI-Powered Features
- **🧠 Deep Analysis**: Project scanning with intelligent insights
- **📝 Context Generation**: Automated CLAUDE.md creation
- **🎯 Smart Recommendations**: Performance and architecture optimization
- **🏗️ Template Engine**: AI-driven project scaffolding
- **📊 Analytics**: Usage tracking and performance metrics

## Technical Stack

### Core Technologies
- **Runtime**: Node.js 22+ (Node.js 24 recommended)
- **Package Manager**: pnpm 10.x
- **Build System**: Turborepo with advanced caching
- **Language**: TypeScript 5.7 with strict mode
- **Frontend**: Next.js 15 with App Router and Turbopack
- **Styling**: Tailwind CSS v4
- **AI Integration**: Anthropic SDK with Claude Opus 4.1
- **Database**: PostgreSQL with Prisma ORM
- **Backend**: Supabase with real-time capabilities

### Development Tools
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Formatting**: Prettier with Tailwind plugin
- **Build Orchestration**: Turborepo

## Development Workflows

### Setup
```bash
pnpm install    # Install dependencies
pnpm setup      # Initial setup (install + build)
```

### Common Commands
```bash
pnpm dev        # Start development servers
pnpm build      # Build all packages and apps
pnpm test       # Run tests
pnpm lint       # Lint code
pnpm type-check # Type check TypeScript
```

### Database Operations
```bash
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema changes
pnpm db:migrate   # Run migrations
```

## Configuration

### TypeScript
- Root `tsconfig.json` provides base configuration
- Each package/app has its own extended `tsconfig.json`
- Strict type checking enabled project-wide

### Build Configuration
- `turbo.json` defines the build pipeline
- `next.config.js` for Next.js configuration
- Workspace dependencies managed via pnpm

## Common Development Tasks

### Adding New Features
1. Identify target package/app
2. Update relevant TypeScript interfaces in shared
3. Implement feature logic
4. Add tests
5. Update documentation

### Package Management
- Use `pnpm add` for adding dependencies
- Specify workspace dependencies using `workspace:*`
- Keep shared dependencies in root `package.json`

### Testing Guidelines
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Test files co-located with source code

## Best Practices

### Code Organization
- Feature-based directory structure
- Clear separation of concerns
- Shared types in `packages/shared`
- Consistent file naming conventions

### TypeScript Usage
- Strict type checking enabled
- Interface-first development
- Proper type exports/imports
- Minimal use of `any`

### AI Integration Architecture
- **Claude Opus 4.1**: Latest model with ultrathinking capabilities
- **ClaudeAIService**: Centralized AI operations with type safety
- **ProjectScanner**: Intelligent codebase analysis and pattern recognition
- **Recommendation Engine**: AI-powered optimization suggestions
- **Context Engineering**: Automated CLAUDE.md generation
- **Offline Mode**: Graceful degradation when AI services unavailable
- **Rate Limiting**: Smart quota management and retry logic
- **Error Handling**: Comprehensive fallback mechanisms

## AI-Powered Development Assistance

AWE provides intelligent assistance in:

### Core Development
1. **TypeScript Excellence**: Advanced type definitions, interfaces, and generics
2. **Architecture Decisions**: Monorepo structure, dependency management, and scalability
3. **AI Integration**: Claude Opus patterns, prompt engineering, and response handling
4. **Performance Optimization**: Bundle analysis, caching strategies, and load optimization

### Advanced Capabilities
5. **Testing Strategies**: Unit, integration, and E2E testing with modern frameworks
6. **Security Implementation**: Authentication, authorization, and data protection
7. **Database Design**: Schema optimization, migration strategies, and query performance
8. **DevOps Integration**: CI/CD pipelines, monitoring, and deployment automation

### Specialized Features
9. **Context Engineering**: CLAUDE.md optimization for specific project needs
10. **Template Generation**: AI-powered project scaffolding and boilerplate creation
11. **Code Analysis**: Intelligent pattern recognition and refactoring suggestions
12. **Workflow Automation**: Custom development process optimization

## Project Standards

### Code Style
- Follow Prettier configuration
- Use TypeScript strict mode
- Implement proper error handling
- Write comprehensive documentation

### Git Workflow
- Feature branches from main
- Conventional commits
- PR reviews required
- CI checks must pass

### Documentation
- JSDoc for public APIs
- README for each package
- Keep CHANGELOG updated
- Document breaking changes

## Deployment

### Build Process
1. Type checking
2. Linting
3. Testing
4. Building packages
5. Building apps

### Environment Configuration
- Use `.env` files for configuration
- Separate configs for dev/staging/prod
- Secure handling of secrets

## Support and Resources

### Key Files
- `package.json`: Project configuration and scripts
- `turbo.json`: Build pipeline configuration
- `tsconfig.json`: TypeScript configuration
- `next.config.js`: Next.js configuration

### Important Links
- Project documentation
- API documentation
- Deployment guides
- Contributing guidelines

This document will be updated as the project evolves. For specific questions or clarifications, please reference the relevant section or ask for assistance.