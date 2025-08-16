# Quick Start Guide

Get AWE up and running in 5 minutes with this comprehensive quick start guide.

## Prerequisites

- **Node.js 22+** (Node.js 24 recommended)
- **pnpm 9+** (for workspace management)
- **Git** (for version control)
- **Anthropic API Key** (for AI features)

## Installation

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/awe.git
cd awe

# Install dependencies and build
pnpm install && pnpm setup
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.sample .env.local

# Edit with your credentials
nano .env.local
```

Required environment variables:
```bash
# AI Integration
ANTHROPIC_API_KEY="sk-ant-your-api-key"

# Database (Supabase)
DATABASE_URL="postgresql://postgres.project:password@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.project:password@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (optional)
pnpm db:push
```

## First Steps

### 1. Initialize Your Project

```bash
# Generate AI-powered CLAUDE.md for your project
dotenvx run --env-file=.env.local -- ./apps/cli/dist/bin/awe.js init --ai

# Or use the built CLI
pnpm build
./apps/cli/dist/bin/awe.js init --ai
```

### 2. Analyze Your Codebase

```bash
# Get comprehensive project insights
./apps/cli/dist/bin/awe.js analyze --depth comprehensive

# Quick analysis
./apps/cli/dist/bin/awe.js analyze
```

### 3. Get AI Recommendations

```bash
# Performance optimization suggestions
./apps/cli/dist/bin/awe.js recommend --type performance

# All recommendations
./apps/cli/dist/bin/awe.js recommend
```

### 4. Start Web Dashboard

```bash
# Start development server
pnpm dev

# Visit http://localhost:3000
```

## Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `awe init` | Initialize project with AI-generated context | `awe init --ai` |
| `awe analyze` | Deep project analysis with insights | `awe analyze --depth deep` |
| `awe recommend` | Get optimization recommendations | `awe recommend --type security` |
| `awe scaffold` | AI-driven template generation | `awe scaffold --ai` |
| `awe config` | Configure cloud features | `awe config --setup` |
| `awe sync` | Sync with cloud services | `awe sync --background` |

## Verification

Test your setup:

```bash
# Check CLI is working
./apps/cli/dist/bin/awe.js --version

# Test AI integration
./apps/cli/dist/bin/awe.js analyze --help

# Verify web app
curl http://localhost:3000/api/health
```

## Troubleshooting

### Common Issues

**1. Environment Variables Not Loading**
```bash
# Use dotenvx for reliable environment loading
npm install -g @dotenvx/dotenvx
dotenvx run --env-file=.env.local -- ./apps/cli/dist/bin/awe.js init
```

**2. Database Connection Failed**
- Check Supabase project is active (not paused)
- Verify DATABASE_URL and DIRECT_URL are correct
- AWE works in offline mode if database unavailable

**3. AI Features Not Working**
- Ensure ANTHROPIC_API_KEY is set correctly
- Check API key has sufficient credits
- Verify network connectivity to Anthropic API

**4. Build Errors**
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

## Next Steps

1. **Explore Features**: Try all CLI commands to understand capabilities
2. **Customize Context**: Edit generated CLAUDE.md for your specific needs
3. **Configure Team**: Set up shared configurations for team collaboration
4. **Deploy**: Follow [deployment guide](./deployment.md) for production setup
5. **Contribute**: Check [contributing guide](../README.md#contributing) to help improve AWE

## Support

- 📚 [Full Documentation](../README.md)
- 💬 [GitHub Discussions](https://github.com/your-org/awe/discussions)
- 🐛 [Report Issues](https://github.com/your-org/awe/issues)
- 📧 [Email Support](mailto:support@awe.dev)

---

**🎉 You're ready to revolutionize your Claude Code development workflow!**