# AWE CLI - Intelligent Claude Code Companion

<div align="center">
  <img src="https://img.shields.io/npm/v/@awe/claude-companion" alt="npm version">
  <img src="https://img.shields.io/npm/dm/@awe/claude-companion" alt="npm downloads">
  <img src="https://img.shields.io/github/license/awe-team/claude-companion" alt="license">
  <img src="https://img.shields.io/node/v/@awe/claude-companion" alt="node version">
</div>

**AWE CLI** is an intelligent command-line companion that transforms your Claude Code development experience through AI-powered project analysis, optimization, and automated setup. Leverage machine learning to get context-aware recommendations, generate optimal project structures, and continuously improve your development workflows.

## ✨ Key Features

- 🔍 **Intelligent Project Analysis** - Deep code structure analysis with ML-powered pattern recognition
- 🎯 **AI-Powered Recommendations** - Context-aware template and optimization suggestions
- 🏗️ **Smart Project Scaffolding** - Generate production-ready project structures with best practices
- ⚡ **Automated Optimization** - Apply performance and configuration improvements automatically
- 🧠 **Continuous Learning** - Improves recommendations based on usage patterns and community feedback
- 📊 **Performance Analytics** - Track and monitor Claude Code effectiveness across projects
- 🔄 **Knowledge Base Sync** - Stay updated with latest patterns and community best practices
- 🌐 **Multi-Platform Support** - Works seamlessly across macOS, Linux, and Windows

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g @awe/claude-companion

# Verify installation
awe --version
```

### Basic Usage

```bash
# Initialize a new project with intelligent template selection
awe init

# Analyze your current project for optimization opportunities  
awe analyze

# Get AI-powered recommendations based on your project
awe recommend

# Apply safe optimizations automatically
awe optimize --auto

# Create a new project from proven patterns
awe scaffold web-react -n my-app

# Keep your knowledge base updated
awe sync
```

### Your First Project

```bash
# Create a new React project with optimal setup
awe scaffold web-react -n my-awesome-app
cd my-awesome-app

# Initialize Claude Code configuration
awe init -y

# Install dependencies and start development
npm install
npm run dev

# Analyze and optimize as you develop
awe analyze --save
awe optimize
```

## 📋 Command Overview

| Command | Description | Use Case |
|---------|-------------|----------|
| `awe init` | Initialize Claude Code configuration | Setting up new or existing projects |
| `awe analyze` | Deep project analysis and optimization detection | Understanding project health and opportunities |
| `awe recommend` | AI-powered template and tool recommendations | Getting context-aware suggestions |
| `awe scaffold` | Generate project structures from patterns | Creating new projects with best practices |
| `awe optimize` | Apply optimization recommendations | Improving project configuration and performance |
| `awe sync` | Update knowledge base with latest patterns | Staying current with community best practices |
| `awe learn` | Manage learning system and statistics | Understanding AI improvement and usage patterns |
| `awe scrape` | Intelligently gather patterns and templates | Expanding knowledge base with latest trends |

### Core Command Examples

**Project Initialization:**
```bash
awe init                    # Interactive setup with template selection
awe init -y                 # Quick setup with smart defaults
awe init -t react-web       # Use specific template
awe init --force            # Overwrite existing configuration
```

**Project Analysis:**
```bash
awe analyze                 # Standard analysis with recommendations
awe analyze --verbose       # Detailed analysis with explanations
awe analyze --json          # Machine-readable output
awe analyze --save          # Save results to knowledge base
```

**Smart Scaffolding:**
```bash
awe scaffold                # List all available patterns
awe scaffold web-react      # Create React application
awe scaffold nodejs-api     # Create Node.js API service
awe scaffold python-data    # Create data science project
awe scaffold --dry-run      # Preview what would be created
```

**Intelligent Optimization:**
```bash
awe optimize                # Interactive optimization selection
awe optimize --auto         # Apply all safe optimizations
awe optimize --dry-run      # Preview changes without applying
```

## 🎯 Project Templates

AWE includes production-ready templates for various project types:

### Web Applications
- **React TypeScript** - Modern React with Vite, TypeScript, and testing
- **Vue 3 Composition** - Vue 3 with TypeScript and Pinia
- **Angular Universal** - Full-stack Angular with SSR
- **Svelte Kit** - Modern Svelte with SvelteKit

### Backend Services  
- **Node.js Express** - RESTful API with TypeScript and testing
- **Python FastAPI** - Modern Python API with automatic documentation
- **Go Fiber** - High-performance Go web framework
- **Rust Actix** - Fast and safe web services

### Specialized Projects
- **Data Science** - Python with Jupyter, pandas, and ML libraries
- **CLI Tools** - Command-line applications with proper argument handling
- **Microservices** - Docker-ready service templates
- **Full-Stack** - Complete frontend + backend applications

### Enterprise Templates
- **Enterprise React** - Large-scale React applications with micro-frontends
- **Enterprise API** - Scalable API architecture with monitoring
- **Monorepo** - Multi-package repository setup with Nx/Lerna

## ⚙️ Configuration

### Environment Variables

```bash
# Customize AWE data directory
export AWE_DATA_DIR="/custom/path/.awe"

# Set logging level
export AWE_LOG_LEVEL="debug"

# Configure cache duration
export AWE_CACHE_TTL="3600"

# Set API timeouts
export AWE_API_TIMEOUT="30000"
```

### Configuration File

Create `awe.config.js` in your project root:

```javascript
module.exports = {
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
    customPath: './.awe/templates',
    preferred: ['react-typescript', 'nodejs-express']
  }
};
```

## 🔗 Claude Code Integration

AWE seamlessly integrates with Claude Code to enhance your AI development workflow:

### Automated Workflow Integration

```json
// .claude/hooks.json
{
  "pre_session": "awe analyze --silent --save",
  "post_tool_use": "awe learn --from-interaction",
  "pre_feature": "awe recommend --context-aware",
  "post_optimization": "awe sync --quiet"
}
```

### Context-Aware Features

- **Intelligent Context Management** - Optimizes context window usage based on project structure
- **Automatic Analysis** - Analyzes projects when Claude Code starts
- **Smart Recommendations** - Provides context-aware suggestions during development
- **Performance Tracking** - Monitors Claude Code effectiveness across sessions

### Feature Implementation Guidelines

AWE can generate Feature Implementation System Guidelines in your CLAUDE.md:

```markdown
## Feature Implementation System Guidelines

### Parallel Feature Implementation Workflow
1. **Component**: Create main component file
2. **Styles**: Create component styles/CSS  
3. **Tests**: Create test files
4. **Types**: Create type definitions
5. **Hooks**: Create custom hooks/utilities
6. **Integration**: Update routing, imports, exports
7. **Remaining**: Update configs, docs, package.json
```

## 🤖 AI and Machine Learning

AWE leverages advanced AI techniques for intelligent project analysis:

### Core AI Capabilities

- **🎯 Pattern Recognition** - ML-powered identification of project types and architectures
- **🔍 Similarity Matching** - Vector embeddings for finding similar projects and solutions  
- **👥 Collaborative Filtering** - Community usage patterns and collective intelligence
- **📊 Content-Based Filtering** - Feature-based matching and compatibility scoring
- **📈 Continuous Learning** - Improves recommendations through feedback and usage analytics

### Machine Learning Models

- **Project Classification** - Gradient boosting ensemble for project type detection
- **Template Recommendation** - Hybrid filtering with confidence scoring
- **Optimization Prediction** - Success probability estimation for optimizations
- **Pattern Extraction** - NLP and code analysis for architectural pattern detection

### Knowledge Base

AWE maintains a comprehensive knowledge base with:

- **Templates & Patterns** - Curated collection of proven project structures
- **Community Insights** - Aggregated usage statistics and success metrics
- **Best Practices** - Expert-validated configuration recommendations
- **Performance Metrics** - Real-world effectiveness data

## 📚 Documentation

Comprehensive documentation is available:

- **[CLI Reference](./docs/CLI_REFERENCE.md)** - Complete command documentation with examples
- **[User Guide](./docs/USER_GUIDE.md)** - Workflows, best practices, and integration patterns  
- **[API Reference](./docs/API_REFERENCE.md)** - Programmatic usage and extension development
- **[Architecture](./docs/architecture.md)** - Technical architecture and AI system design
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Problem solving and debugging guide

## 🛠️ Development and API

### Programmatic Usage

AWE can be used as a library in your Node.js applications:

```javascript
const AWE = require('@awe/claude-companion');

const awe = new AWE({
  debug: false,
  dataDir: './custom-awe-data'
});

// Complete project workflow
async function setupProject() {
  // Analyze existing project
  const analysis = await awe.analyze('./my-project');
  
  // Get AI recommendations  
  const recommendations = await awe.recommend('./my-project');
  
  // Apply optimizations
  const optimizations = await awe.optimize('./my-project', { 
    apply: true 
  });
  
  return { analysis, recommendations, optimizations };
}
```

### Development Setup

```bash
# Clone repository
git clone https://github.com/awe-team/claude-companion
cd claude-companion/cli

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
npm run test:coverage
npm run test:watch

# Lint and format
npm run lint
npm run lint:fix
```

### Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Add tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🚀 Roadmap

### Upcoming Features

- **🌐 Web Dashboard** - Browser-based project management and analytics
- **🔌 IDE Extensions** - VS Code, JetBrains, and Vim integrations  
- **🤝 Team Collaboration** - Shared knowledge bases and team analytics
- **🔒 Enterprise Features** - SSO, audit logs, and custom deployment
- **🧠 Advanced AI** - GPT integration for code generation and refactoring
- **📱 Mobile App** - Project monitoring and remote optimization

### Integration Roadmap

- **CI/CD Platforms** - GitHub Actions, GitLab CI, Jenkins plugins
- **Project Management** - Jira, Linear, Asana integration  
- **Monitoring Tools** - DataDog, New Relic, Grafana dashboards
- **Cloud Platforms** - AWS, GCP, Azure deployment automation

## 🐛 Troubleshooting

### Quick Fixes

```bash
# Reset AWE completely
rm -rf ~/.awe && awe sync

# Update to latest version
npm update -g @awe/claude-companion

# Run diagnostics
awe --debug analyze --verbose

# Check system requirements
node --version  # >= 16.0.0
npm --version   # >= 8.0.0
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Database locked | `rm ~/.awe/awe.db && awe sync` |
| Template not found | `awe sync --force` |
| Analysis fails | `awe analyze --verbose --debug` |
| Permission denied | `sudo chown -R $(whoami) ~/.awe` |
| Network timeout | `awe sync --timeout 60000` |

See [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) for comprehensive problem-solving.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support and Community

### Getting Help

- **🐛 Bug Reports** - [GitHub Issues](https://github.com/awe-team/claude-companion/issues)
- **💬 Discussions** - [GitHub Discussions](https://github.com/awe-team/claude-companion/discussions)  
- **📖 Documentation** - [Project Wiki](https://github.com/awe-team/claude-companion/wiki)
- **💼 Enterprise Support** - enterprise@awe-team.com

### Community

- **Discord** - [Join our Discord](https://discord.gg/awe-community)
- **Twitter** - [@AWETeamDev](https://twitter.com/AWETeamDev)
- **Blog** - [AWE Team Blog](https://blog.awe-team.com)

---

<div align="center">

**Made with ❤️ by the AWE Team**

[Website](https://awe-team.com) • [Documentation](./docs/) • [Community](https://discord.gg/awe-community) • [Changelog](CHANGELOG.md)

</div>