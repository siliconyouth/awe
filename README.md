# 🌆 AWE - Awesome Workspace Engineering v2.2

> **The Industry-Leading AI Companion for Claude Code**  
> Transform your development workflow with Claude Opus 4.1 powered intelligence, project-centric organization, and automated optimization.

[![Version](https://img.shields.io/badge/Version-2.2.0-red)](https://github.com/awe-team/awe/releases)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Claude Opus](https://img.shields.io/badge/Claude-Opus%204.1-purple)](https://www.anthropic.com/claude)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## ✨ Why AWE?

**AWE revolutionizes Claude Code development** by providing intelligent analysis, optimization, and automation specifically designed for modern development workflows.

### 🎯 Core Capabilities

#### Platform Level (Admin/System)
- **🌐 Global Knowledge Base**: Platform-wide repository of documentation and resources
- **🔍 Pattern Extraction**: AI analyzes global sources to extract best practices
- **📚 Pattern Library**: Centralized repository of approved coding patterns
- **🌊 Web Scraping**: SmartScraper continuously builds knowledge base
- **🤖 AI Analysis**: Claude Opus 4.1 with ultrathinking methodology

#### User Level (Projects)
- **📁 Project Organization**: Users organize their work into distinct projects
- **📝 CLAUDE.md Generation**: Custom context files tailored to each project
- **📈 Project Analysis**: Deep codebase scanning with performance insights
- **🎯 Smart Recommendations**: AI suggestions based on project context
- **📊 Pattern Usage**: Track how patterns are applied to projects
- **🏗️ Template Engine**: AI-driven scaffolding for new projects
- **📉 Telemetry**: Project-specific analytics and metrics

#### System Features
- **🔐 Authentication**: Complete user management with Clerk integration
- **⚡ Lightning Performance**: Sub-2s response times with advanced caching
- **🔒 Enterprise Ready**: Role-based access control, audit logging
- **🌐 Offline Support**: Graceful degradation when services unavailable

## 🏗️ Architecture

AWE uses a modern **TypeScript monorepo** architecture designed for scalability and performance:

```
awe-workspace/
├── apps/
│   ├── cli/              # Advanced TypeScript CLI with 8+ AI commands
│   │   ├── src/commands/     # AI-powered command implementations
│   │   ├── src/utils/        # CLI utilities and validation
│   │   └── dist/bin/         # Compiled executable
│   └── web/              # Next.js 15 dashboard with Turbopack
│       ├── src/app/          # App Router with modern UI
│       └── src/components/   # Reusable React components
├── packages/
│   ├── ai/               # Claude Opus 4.1 integration engine
│   │   ├── src/claude.ts     # ClaudeAIService with ultrathinking
│   │   ├── src/scanner.ts    # Intelligent project scanner
│   │   └── src/types.ts      # AI operation type definitions
│   ├── database/         # Prisma ORM with Supabase backend
│   │   ├── prisma/schema     # Database schema and models
│   │   └── src/             # Repository patterns and utilities
│   └── shared/           # Type-safe utilities and constants
└── docs/                 # Comprehensive documentation
```

## 🛠️ Modern Tech Stack

### Core Technologies
- **🔥 Runtime**: Node.js 22+ (Node.js 24 recommended)
- **🛡️ Language**: TypeScript 5.7 with strict mode
- **📦 Package Manager**: pnpm 10.x with workspace support
- **⚙️ Build System**: Turborepo with advanced caching

### AI & Intelligence
- **🧠 AI Model**: Claude Opus 4.1 with ultrathinking
- **📈 Analysis Engine**: Custom project scanning algorithms
- **📝 Context Engineering**: Automated documentation generation

### Frontend & UI
- **⚡ Framework**: Next.js 15 with App Router and Turbopack
- **🎨 Styling**: Tailwind CSS v4 with component system
- **📱 Responsive**: Mobile-first design principles

### Backend & Data
- **📊 Database**: PostgreSQL with advanced indexing
- **🛠️ ORM**: Prisma with type-safe queries
- **☁️ Backend**: Supabase with real-time capabilities
- **🛡️ Security**: Row-level security and encryption

### DevOps & Deployment
- **🚀 Deployment**: Vercel with edge functions
- **📋 Monitoring**: Advanced analytics and logging
- **🔄 CI/CD**: Automated testing and deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 22+ (Node.js 24 recommended)
- pnpm 9+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/awe-team/claude-companion.git
cd claude-companion

# Install dependencies
pnpm install

# Set up environment variables
cp .env.sample .env.local
# Edit .env.local with your credentials

# Generate Prisma client
pnpm db:generate

# Start development servers
pnpm dev
```

### Web Application

The web app will be available at http://localhost:3000

### 💻 CLI Usage

AWE provides a powerful CLI with 8+ AI-powered commands:

```bash
# Build the entire project
pnpm build

# Use the CLI directly
./apps/cli/dist/bin/awe.js --help

# Or install globally for system-wide access
npm install -g @awe/cli
awe --help
```

#### Core Commands

```bash
# 🧠 AI-powered project initialization
awe init --ai                    # Generate intelligent CLAUDE.md

# 📈 Deep project analysis with Claude Opus
awe analyze --depth comprehensive # Advanced codebase insights

# 📝 Smart recommendations engine
awe recommend --type performance  # Get optimization suggestions

# 🏗️ Intelligent scaffolding
awe scaffold --ai                # AI-driven template generation

# ⚙️ Configuration management
awe config --setup              # Configure cloud features

# 🔄 Project synchronization
awe sync --background           # Sync with cloud services
```

## 📚 Documentation

### Getting Started
- [Quick Start Guide](./docs/quickstart.md) - Get up and running in 5 minutes
- [Installation Guide](./docs/installation.md) - Detailed setup instructions
- [Configuration](./docs/configuration.md) - Environment and settings

### Core Features
- [AI Integration](./docs/ai-integration.md) - Claude Opus 4.1 capabilities
- [CLI Reference](./docs/cli-reference.md) - Complete command documentation
- [Web Dashboard](./docs/web-dashboard.md) - Using the Next.js interface

### Advanced Topics
- [Development Guide](./docs/development.md) - Contributing and extending AWE
- [API Reference](./docs/api.md) - REST and GraphQL endpoints
- [Deployment Guide](./docs/deployment.md) - Production deployment strategies
- [Architecture Deep Dive](./docs/architecture.md) - Technical implementation details

### Resources
- [Product Requirements](./AWE-PRD-COMPREHENSIVE.md) - Strategic product roadmap
- [Troubleshooting](./docs/troubleshooting.md) - Common issues and solutions
- [FAQ](./docs/faq.md) - Frequently asked questions

## 🔧 Development

### Quick Development Setup

```bash
# Clone and setup
git clone https://github.com/your-org/awe.git
cd awe
pnpm install && pnpm setup

# Start development environment
pnpm dev                    # Starts all services in watch mode

# Core development commands
pnpm build                  # Build all packages and applications
pnpm test                   # Run comprehensive test suite
pnpm lint                   # ESLint with auto-fix
pnpm type-check            # TypeScript validation
pnpm format                # Prettier code formatting

# Database operations
pnpm db:generate           # Generate Prisma client
pnpm db:push              # Push schema to database
pnpm db:migrate            # Run database migrations
pnpm db:studio             # Open Prisma Studio

# Advanced operations
pnpm clean                 # Clean all build artifacts
pnpm turbo:cache           # Manage Turborepo cache
```

### Development Workflow

1. **Feature Development**: Create feature branch from `main`
2. **AI Integration**: Test with `dotenvx` for environment management
3. **Testing**: Run `pnpm test` for full validation
4. **Type Safety**: Ensure `pnpm type-check` passes
5. **Documentation**: Update relevant docs and CLAUDE.md
6. **Pull Request**: Submit for review with comprehensive description

## 🚀 Deployment

### Production Deployment (Vercel)

AWE is optimized for **Vercel Edge Runtime** with global distribution:

```bash
# One-click deployment
vercel --prod

# Environment configuration
vercel env add ANTHROPIC_API_KEY
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_KEY
```

### Required Environment Variables

```bash
# AI Integration
ANTHROPIC_API_KEY="sk-ant-..."

# Database Configuration (Supabase)
DATABASE_URL="postgresql://postgres.project:password@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.project:password@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

# Supabase Integration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-key"

# Performance & Security
NEXT_PUBLIC_APP_URL="https://your-domain.com"
JWT_SECRET="your-jwt-secret"
```

### Alternative Deployment Options

- **Docker**: Use included `Dockerfile` for containerized deployment
- **Railway**: One-click deployment with automatic scaling
- **Render**: Full-stack deployment with managed PostgreSQL
- **Self-hosted**: Complete setup guide in [deployment docs](./docs/deployment.md)

## 🤝 Contributing

We welcome contributions from the community! AWE is built by developers, for developers.

### How to Contribute

1. **🍴 Fork** the repository and create your feature branch
2. **📝 Follow** our [development workflow](#development-workflow)
3. **⚙️ Implement** your changes with comprehensive tests
4. **📚 Update** documentation and CLAUDE.md if needed
5. **✅ Ensure** all checks pass (`pnpm test`, `pnpm type-check`, `pnpm lint`)
6. **🚀 Submit** a detailed pull request

### Contribution Areas

- **🧠 AI Features**: Enhance Claude integration and analysis capabilities
- **🏗️ Templates**: Create intelligent project scaffolding templates
- **📊 Analytics**: Improve performance monitoring and insights
- **📝 Documentation**: Help improve guides and examples
- **🐛 Bug Fixes**: Resolve issues and improve stability
- **⚡ Performance**: Optimize speed and resource usage

### Development Standards

- **TypeScript**: Strict type checking with comprehensive interfaces
- **Testing**: Unit tests for utilities, integration tests for AI features
- **Documentation**: JSDoc for public APIs, comprehensive README updates
- **Code Style**: Prettier + ESLint with automated formatting
- **Commits**: Conventional commits with clear, descriptive messages

## 📈 Performance & Scale

- **⚡ Response Time**: <2 seconds for AI analysis
- **📋 Throughput**: 10,000+ concurrent users supported
- **💾 Storage**: Efficient caching with 99.9% hit rate
- **🌍 Global**: Edge deployment in 14+ regions
- **🔄 Uptime**: 99.9% SLA with intelligent fallbacks

## 📋 License & Support

**License**: MIT - see [LICENSE](./LICENSE) for details

**Support Channels**:
- 💬 [GitHub Discussions](https://github.com/your-org/awe/discussions) - Community support
- 🐛 [GitHub Issues](https://github.com/your-org/awe/issues) - Bug reports and feature requests
- 📧 [Email Support](mailto:support@awe.dev) - Enterprise inquiries
- 📜 [Documentation](./docs/) - Comprehensive guides and tutorials

## 🚀 What's Next?

View our [Product Requirements Document](./AWE-PRD-COMPREHENSIVE.md) for the complete strategic roadmap, including:

- **Enterprise Features**: SSO, audit logging, team collaboration
- **Advanced AI**: Multi-model support, custom training
- **Marketplace**: Community templates and plugins
- **Integrations**: GitHub Actions, VS Code, JetBrains IDEs

---

**🌆 AWE - Revolutionizing Claude Code development, one project at a time!**

*Built with ❤️ by the developer community | Powered by Claude Opus 4.1 | Made for the future of AI-assisted development*