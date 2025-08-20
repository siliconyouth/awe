# 🚀 AWE Setup Guide

This guide will help you set up AWE (Awesome Workspace Engineering) CLI from scratch to production-ready state.

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js >= 16.0.0**
- **npm >= 8.0.0** 
- **Git** (for version control)
- **Supabase account** (free tier works)

## 🔧 Quick Setup (Automated)

### Option A: One-Command Setup
```bash
# Clone and setup everything automatically
git clone https://github.com/awe-team/claude-companion.git
cd claude-companion/cli
npm install
npm run setup
```

The setup wizard will:
- ✅ Check system requirements
- ✅ Guide you through Supabase configuration
- ✅ Create database schema automatically
- ✅ Configure environment variables
- ✅ Test everything works
- ✅ Validate performance targets

### Option B: Manual Setup

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Configure Supabase
1. Go to [Supabase](https://app.supabase.com)
2. Create a new project
3. Go to Settings > API
4. Copy your URL and keys

#### 3. Setup Environment
```bash
# Copy template
cp .env.sample .env

# Edit with your credentials
nano .env
```

Add your Supabase credentials:
```bash
AWE_SUPABASE_URL="https://your-project.supabase.co"
AWE_SUPABASE_ANON_KEY="your-anon-key"
AWE_SUPABASE_SERVICE_KEY="your-service-key"  # Optional
```

#### 4. Initialize Database
```bash
# Run database schema creation
npm run setup
```

#### 5. Validate Setup
```bash
# Test everything works
npm run validate
```

## 🔍 Validation

After setup, validate your installation:

```bash
# Full validation suite
npm run validate

# Quick status check
awe config --status

# Performance test
npm run benchmark:quick
```

Expected results:
- ✅ All environment variables configured
- ✅ Database connections working
- ✅ Performance targets met (<1ms cache, <5ms DB)
- ✅ All CLI commands functional

## 🚀 First Steps

Once setup is complete:

```bash
# Check configuration
awe config --status

# Initialize a project
awe init

# Analyze current project  
awe analyze

# Generate a new project
awe scaffold web-react

# Get AI recommendations
awe recommend
```

## 🛠️ Advanced Configuration

### Security Hardening
```bash
# Enable encryption
npm run encrypt

# Generate new keys
npm run genkey

# Security check
npm run security:check
```

### Performance Tuning
```bash
# Run full benchmark
npm run benchmark

# Monitor performance
awe config --performance
```

### Multi-Environment Setup
```bash
# Development
export NODE_ENV=development
awe config --validate

# Production
export NODE_ENV=production
export DOTENV_KEY="your-production-key"
awe config --validate
```

## 🔧 Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### "Database connection failed"
```bash
# Check credentials
awe config --validate

# Test connection
awe config --status
```

#### "Performance too slow"
```bash
# Check system resources
npm run benchmark

# Optimize cache
awe config --performance
```

#### "Permission denied"
```bash
# Fix file permissions
chmod 600 .env
chmod +x bin/awe.js
```

### Getting Help

1. **Check Status**: `awe config --status`
2. **Validate Setup**: `npm run validate`
3. **View Logs**: `awe --debug config --status`
4. **Reset Config**: `awe config --reset`

### Support Channels

- 📖 **Documentation**: `/docs` folder
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 📧 **Email**: support@awe-cli.com

## 📊 Performance Targets

After setup, you should see:

| Component | Target | Typical Performance |
|-----------|--------|-------------------|
| Memory Cache | <1ms | ~0.1ms |
| Local Database | <5ms | ~0.2ms |
| Template Search | <50ms | ~0.5ms |
| Cache Hit Rate | >85% | ~95% |

## 🔐 Security Checklist

- [ ] Environment variables configured
- [ ] File permissions set correctly (600)
- [ ] Service key secure (not in version control)
- [ ] Encryption enabled (dotenvx)
- [ ] Regular key rotation scheduled
- [ ] Audit logging enabled

## 🎯 Next Steps

Once setup is complete:

1. **Explore Features**:
   - Try all CLI commands
   - Test different project types
   - Experiment with AI features

2. **Customize Configuration**:
   - Adjust performance settings
   - Configure feature flags
   - Set up team environments

3. **Integrate with Workflow**:
   - Add to CI/CD pipeline
   - Create custom templates
   - Set up monitoring

4. **Stay Updated**:
   - Watch for updates
   - Read changelog
   - Join community

---

**🎉 Congratulations!** Your AWE CLI is now ready for high-performance Claude Code assistance!

For detailed usage instructions, see `docs/USER_GUIDE.md`.