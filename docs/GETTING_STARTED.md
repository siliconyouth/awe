# AWE - Getting Started Guide

## 🚀 Quick Start

AWE (Awesome Workspace Engineering) is an AI-powered development companion for Claude Code optimization. This guide will help you get started quickly.

## Prerequisites

- **Node.js** 22+ (Node.js 24 recommended)
- **pnpm** 9.0+ (10.x recommended)
- **PostgreSQL** database (or Supabase account)
- **Anthropic API Key** for Claude AI features
- **Clerk Account** for authentication

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/awe.git
cd awe
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Copy the sample environment file and configure it:

```bash
cp .env.sample .env.local
```

Edit `.env.local` with your credentials:

```env
# Database (Supabase or local PostgreSQL)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Database Setup

Generate Prisma client and push schema:

```bash
pnpm db:generate
pnpm db:push
```

### 5. Build the Project

```bash
pnpm build
```

### 6. Start Development Server

```bash
pnpm dev
```

The web interface will be available at `http://localhost:3000`

## Using the CLI

### Installation (Local Development)

```bash
cd apps/cli
pnpm build
pnpm link --global
```

Now you can use the `awe` command globally:

```bash
awe --help
```

### Core Commands

#### Initialize a Project
```bash
awe init
```
Creates a CLAUDE.md file and AWE configuration for your project.

#### Analyze Your Codebase
```bash
awe analyze
```
Performs AI-powered analysis of your project with Claude Opus.

#### Get Recommendations
```bash
awe recommend
```
Receives AI-powered optimization recommendations.

#### Extract Patterns
```bash
awe patterns extract .
```
Extracts coding patterns from your codebase.

#### Manage Resources
```bash
# Import resources from GitHub
awe resources import https://github.com/user/repo

# Search resources
awe resources search "hooks"

# Create a collection
awe resources create-collection
```

## Using the Web Interface

### 1. Sign Up / Sign In

Navigate to `http://localhost:3000` and create an account or sign in.

### 2. Dashboard

Access your personalized dashboard at `/dashboard` to:
- View project analytics
- Access recent resources
- See recommendations

### 3. Resource Hub

Browse and manage resources at `/resources`:
- Search for patterns, hooks, agents, and templates
- Filter by type and tags
- Download or copy resources

### 4. Admin Panel

If you have admin access, visit `/admin` to:
- Manage all resources
- Create and edit collections
- Import from GitHub
- View system analytics

## API Usage

### Authentication

All API endpoints require authentication. Include your Clerk session token in requests:

```javascript
const response = await fetch('/api/resources', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`
  }
});
```

### Key Endpoints

#### List Resources
```http
GET /api/resources?type=pattern&search=react
```

#### Create Resource
```http
POST /api/resources
Content-Type: application/json

{
  "title": "React Hook Pattern",
  "content": "...",
  "type": "pattern"
}
```

#### Import from GitHub
```http
POST /api/resources/import/github
Content-Type: application/json

{
  "url": "https://github.com/user/repo",
  "options": {
    "type": "pattern",
    "autoTag": true
  }
}
```

## Features Overview

### 🤖 AI-Powered Analysis
- Project scanning with Claude Opus
- Pattern recognition
- Code quality assessment
- Optimization recommendations

### 📦 Resource Hub
- Curated patterns and templates
- Import from GitHub
- AI-powered tagging
- Quality scoring

### 📚 Collections
- Organize resources
- Export as ZIP/JSON/Markdown
- Share with team

### 🔍 Pattern Management
- Extract patterns from code
- Review and rate patterns
- Apply patterns to projects

### 🎯 Smart Recommendations
- Performance optimization
- Architecture improvements
- Security enhancements
- Best practices

## Configuration

### AWE Configuration File

Create `.awe/config.json` in your project:

```json
{
  "project": {
    "name": "My Project",
    "type": "web",
    "framework": "nextjs"
  },
  "analysis": {
    "exclude": ["node_modules", "dist", ".next"],
    "include": ["src", "app", "components"]
  },
  "ai": {
    "model": "claude-3-opus",
    "temperature": 0.7
  }
}
```

### CLAUDE.md File

AWE automatically generates a `CLAUDE.md` file with project context for Claude Code. You can customize it:

```markdown
# Project Context

## Overview
My awesome project built with Next.js and TypeScript.

## Key Patterns
- Use functional components
- Implement error boundaries
- Follow atomic design

## Conventions
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
```

## Troubleshooting

### Common Issues

#### Database Connection Error
- Verify DATABASE_URL in `.env.local`
- Ensure PostgreSQL is running
- Check network connectivity

#### API Key Issues
- Verify ANTHROPIC_API_KEY is correct
- Check API quota and limits
- Ensure key has proper permissions

#### Build Errors
- Run `pnpm clean` and rebuild
- Update dependencies: `pnpm update`
- Clear Next.js cache: `rm -rf .next`

#### Authentication Issues
- Verify Clerk keys are correct
- Check Clerk dashboard for configuration
- Ensure redirect URLs are configured

### Getting Help

- **Documentation**: Check `/docs` folder
- **Issues**: Report on GitHub Issues
- **Community**: Join our Discord
- **Email**: support@awe.dev

## Next Steps

1. **Explore CLI Commands**: Run `awe --help` to see all available commands
2. **Browse Resource Hub**: Find patterns and templates at `/resources`
3. **Read Documentation**: Check `/docs` for detailed guides
4. **Contribute**: Submit PRs with new resources or features

## License

AWE is open source under the MIT License. See LICENSE file for details.