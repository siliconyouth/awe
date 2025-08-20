# AWE CLI Troubleshooting Guide

Comprehensive troubleshooting guide for common AWE CLI issues, error messages, and problem resolution strategies.

## Table of Contents

- [Quick Diagnosis](#quick-diagnosis)
- [Installation Issues](#installation-issues)
- [Command Failures](#command-failures)
- [Database Problems](#database-problems)
- [Network and Connectivity](#network-and-connectivity)
- [Performance Issues](#performance-issues)
- [Template and Scaffolding Problems](#template-and-scaffolding-problems)
- [Claude Code Integration Issues](#claude-code-integration-issues)
- [Debugging and Diagnostics](#debugging-and-diagnostics)
- [Common Error Messages](#common-error-messages)
- [Recovery Procedures](#recovery-procedures)
- [Getting Help](#getting-help)

## Quick Diagnosis

### Running Basic Diagnostics

```bash
# Check AWE CLI version
awe --version

# Test basic functionality
awe --help

# Run with debug mode
awe --debug analyze

# Check system requirements
node --version  # Should be >= 16.0.0
npm --version   # Should be >= 8.0.0

# Check AWE data directory
ls -la ~/.awe/
```

### Environment Check Script

```bash
#!/bin/bash
# awe-diagnostic.sh

echo "🔍 AWE CLI Diagnostic Report"
echo "=========================="

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "NOT INSTALLED")
echo "Node.js: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version 2>/dev/null || echo "NOT INSTALLED")
echo "NPM: $NPM_VERSION"

# Check AWE CLI installation
AWE_VERSION=$(awe --version 2>/dev/null || echo "NOT INSTALLED")
echo "AWE CLI: $AWE_VERSION"

# Check data directory
if [ -d ~/.awe ]; then
  echo "Data directory: ~/.awe (exists)"
  echo "Database: $([ -f ~/.awe/awe.db ] && echo "exists" || echo "missing")"
  echo "Logs: $([ -d ~/.awe/logs ] && echo "exists" || echo "missing")"
else
  echo "Data directory: ~/.awe (missing)"
fi

# Check permissions
if [ -w ~/.awe 2>/dev/null ]; then
  echo "Permissions: OK"
else
  echo "Permissions: Issues detected"
fi

# Check network connectivity
if curl -s --connect-timeout 5 https://github.com >/dev/null; then
  echo "Network: OK"
else
  echo "Network: Issues detected"
fi

echo "=========================="
echo "Run this script and share the output when reporting issues."
```

## Installation Issues

### NPM Installation Problems

**Error: `npm install -g @awe/claude-companion` fails**

**Solution 1: Permission Issues**
```bash
# On macOS/Linux - use sudo if needed
sudo npm install -g @awe/claude-companion

# Or configure npm to use a different directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
npm install -g @awe/claude-companion
```

**Solution 2: Node Version Issues**
```bash
# Update Node.js using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
npm install -g @awe/claude-companion
```

**Solution 3: Clear npm cache**
```bash
npm cache clean --force
npm install -g @awe/claude-companion
```

### Package Dependency Conflicts

**Error: `ERESOLVE unable to resolve dependency tree`**

```bash
# Clear npm cache and retry
npm cache clean --force
rm -rf ~/.npm
npm install -g @awe/claude-companion --force

# Alternative: Use different npm version
npm install -g npm@8
npm install -g @awe/claude-companion
```

### Platform-Specific Issues

**Windows Issues:**
```cmd
# Run as Administrator
npm install -g @awe/claude-companion

# If using WSL, ensure proper permissions
sudo chown -R $(whoami) ~/.npm
```

**macOS Issues:**
```bash
# If Xcode command line tools missing
xcode-select --install

# If using Homebrew-installed Node
brew uninstall node
brew install node@18
brew link node@18
```

## Command Failures

### Init Command Issues

**Error: `Failed to initialize project: ENOENT`**

**Diagnosis:**
```bash
# Check current directory permissions
ls -la .
pwd

# Check if directory is writable
touch test-file && rm test-file || echo "Directory not writable"
```

**Solutions:**
```bash
# Ensure you're in the correct directory
cd /path/to/your/project

# Fix permissions
chmod u+w .

# Run with force flag
awe init --force

# Debug mode for more information
awe --debug init
```

**Error: `Template not found`**

**Solutions:**
```bash
# Sync knowledge base first
awe sync

# List available templates
awe scaffold

# Use a known template
awe init -t react-web

# Check template name spelling
awe scaffold | grep -i react
```

### Analyze Command Issues

**Error: `Analysis failed: Project too large`**

**Solutions:**
```bash
# Exclude large directories
echo "node_modules/
dist/
.git/
*.log" > .awe-ignore

# Use custom ignore patterns
awe analyze --exclude "node_modules,dist,build"

# Analyze specific subdirectory
cd src && awe analyze
```

**Error: `Cannot read package.json`**

**Solutions:**
```bash
# Check if package.json exists and is valid
cat package.json | jq . || echo "Invalid JSON"

# Create minimal package.json if missing
echo '{"name": "my-project", "version": "1.0.0"}' > package.json

# Run from project root
cd /path/to/project/root
awe analyze
```

### Scaffold Command Issues

**Error: `Failed to create files: EACCES`**

**Solutions:**
```bash
# Check target directory permissions
ls -la /path/to/target

# Create directory with proper permissions
mkdir -p /path/to/target
chmod 755 /path/to/target

# Use different output directory
awe scaffold web-react -o ~/projects/my-app

# Run with appropriate permissions
sudo awe scaffold web-react -o /system/path
```

## Database Problems

### Database Corruption

**Error: `Database error: database disk image is malformed`**

**Solutions:**
```bash
# Backup existing database
cp ~/.awe/awe.db ~/.awe/awe.db.backup

# Reset database
rm ~/.awe/awe.db
awe sync  # Rebuilds database

# If backup is needed, restore from backup
cp ~/.awe/awe.db.backup ~/.awe/awe.db
```

### Database Lock Issues

**Error: `database is locked`**

**Solutions:**
```bash
# Check for other AWE processes
ps aux | grep awe

# Kill any stuck processes
pkill -f awe

# Remove lock file if exists
rm ~/.awe/awe.db-wal ~/.awe/awe.db-shm

# Restart AWE command
awe sync
```

### Database Permission Issues

**Error: `Permission denied: cannot open database`**

**Solutions:**
```bash
# Fix database file permissions
chmod 644 ~/.awe/awe.db
chmod 755 ~/.awe/

# Fix ownership
chown $(whoami):$(whoami) ~/.awe/awe.db

# Recreate with proper permissions
rm ~/.awe/awe.db
awe sync
```

### Database Schema Issues

**Error: `no such table: templates`**

**Solutions:**
```bash
# Force database recreation
rm ~/.awe/awe.db
awe sync --force

# Check database integrity
sqlite3 ~/.awe/awe.db "PRAGMA integrity_check;"

# Manual schema check
sqlite3 ~/.awe/awe.db ".schema"
```

## Network and Connectivity

### Sync Command Network Issues

**Error: `Network error: getaddrinfo ENOTFOUND`**

**Solutions:**
```bash
# Check internet connectivity
ping google.com

# Check DNS resolution
nslookup github.com

# Use different DNS servers
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# Retry with timeout
awe sync --timeout 60000
```

### Proxy and Firewall Issues

**Error: `connect ECONNREFUSED`**

**Solutions:**
```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Set environment variables
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# Disable SSL verification (not recommended for production)
npm config set strict-ssl false
```

### SSL Certificate Issues

**Error: `unable to verify the first certificate`**

**Solutions:**
```bash
# Update certificates
# On Ubuntu/Debian
sudo apt-get update && sudo apt-get install ca-certificates

# On macOS
brew install ca-certificates

# Temporary workaround (not recommended)
export NODE_TLS_REJECT_UNAUTHORIZED=0
awe sync
```

## Performance Issues

### Slow Analysis Performance

**Symptoms:** Analysis takes a very long time to complete

**Solutions:**
```bash
# Exclude large directories
echo "node_modules/
.git/
dist/
build/
coverage/" > .awe-ignore

# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
awe analyze

# Use incremental analysis
awe analyze --incremental

# Limit file count
awe analyze --max-files 1000
```

### Memory Issues

**Error: `JavaScript heap out of memory`**

**Solutions:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"

# Use streaming analysis
awe analyze --stream

# Process in smaller chunks
cd src && awe analyze
cd tests && awe analyze
```

### Disk Space Issues

**Error: `ENOSPC: no space left on device`**

**Solutions:**
```bash
# Check disk space
df -h

# Clean AWE cache
rm -rf ~/.awe/cache/
rm -rf ~/.awe/temp/

# Clean npm cache
npm cache clean --force

# Clean old logs
find ~/.awe/logs/ -name "*.log" -mtime +7 -delete
```

## Template and Scaffolding Problems

### Template Generation Failures

**Error: `Failed to generate template: Invalid template format`**

**Solutions:**
```bash
# Update knowledge base
awe sync --force

# Validate template
awe scaffold web-react --dry-run

# Use alternative template
awe scaffold nodejs-api

# Check available templates
awe scaffold | grep -E "web|react|node"
```

### Incomplete Scaffolding

**Symptoms:** Generated project missing files or has broken structure

**Solutions:**
```bash
# Regenerate with force flag
awe scaffold web-react -n my-app --force

# Check template integrity
awe sync --validate

# Manual verification
awe scaffold web-react --dry-run -n test

# Use verbose output
awe --debug scaffold web-react -n my-app
```

### Customization Issues

**Error: `Template customization failed`**

**Solutions:**
```bash
# Use default customization
awe scaffold web-react -n my-app -y

# Check customization options
awe scaffold web-react --help

# Manual customization
awe scaffold web-react -n my-app --dry-run
# Then manually edit generated files
```

## Claude Code Integration Issues

### CLAUDE.md Generation Problems

**Error: `Failed to create CLAUDE.md`**

**Solutions:**
```bash
# Check file permissions
touch CLAUDE.md && rm CLAUDE.md || echo "Cannot create files"

# Use force flag
awe init --force

# Generate in different location
awe init -o /tmp/test

# Manual creation
cat > CLAUDE.md << 'EOF'
# My Project

Basic Claude Code configuration.
EOF
```

### Hook Integration Issues

**Error: `Failed to set up Claude Code hooks`**

**Solutions:**
```bash
# Check .claude directory
mkdir -p .claude/hooks

# Verify hook permissions
chmod +x .claude/hooks/*

# Test hook execution
.claude/hooks/pre_session.sh

# Regenerate hooks
awe init --force
```

### Configuration Validation

**Error: `Invalid Claude Code configuration`**

**Solutions:**
```bash
# Validate configuration
awe analyze --validate-config

# Check CLAUDE.md syntax
cat CLAUDE.md | head -20

# Regenerate configuration
mv CLAUDE.md CLAUDE.md.backup
awe init --force
```

## Debugging and Diagnostics

### Enable Debug Mode

```bash
# Full debug output
awe --debug <command>

# Specific debug categories
export DEBUG=awe:*
awe <command>

# Debug specific modules
export DEBUG=awe:analyzer,awe:recommender
awe analyze
```

### Log Analysis

```bash
# Check recent logs
tail -f ~/.awe/logs/awe.log

# Error logs only
grep ERROR ~/.awe/logs/awe.log

# Search for specific errors
grep -i "database" ~/.awe/logs/awe.log

# Log rotation and cleanup
find ~/.awe/logs/ -name "*.log" -mtime +30 -delete
```

### Verbose Output

```bash
# Verbose analysis
awe analyze --verbose

# JSON output for parsing
awe analyze --json | jq '.analysis.classification'

# Save output for analysis
awe analyze --verbose > analysis-output.txt 2>&1
```

### Performance Profiling

```bash
# Time command execution
time awe analyze

# Profile with Node.js
node --prof $(which awe) analyze
node --prof-process isolate-*.log > profile.txt

# Memory usage monitoring
while true; do
  ps aux | grep awe | grep -v grep
  sleep 1
done
```

## Common Error Messages

### Error Code Reference

| Error Code | Message | Common Cause | Solution |
|------------|---------|--------------|----------|
| `ENOENT` | File or directory not found | Incorrect path | Check file path and permissions |
| `EACCES` | Permission denied | Insufficient permissions | Use `sudo` or fix permissions |
| `ENOTDIR` | Not a directory | Path points to file | Use correct directory path |
| `EMFILE` | Too many open files | System limit reached | Increase file descriptor limit |
| `ENOSPC` | No space left on device | Disk full | Free up disk space |
| `ECONNREFUSED` | Connection refused | Network/firewall issue | Check network connectivity |
| `TIMEOUT` | Request timeout | Slow network/server | Increase timeout settings |

### Specific Error Solutions

**Error: `AWE CLI Error: Command failed with exit code 1`**
```bash
# Run with debug mode
awe --debug <command>

# Check specific error in logs
grep -A 5 -B 5 "exit code 1" ~/.awe/logs/awe.log

# Try with minimal options
awe <command> --quiet
```

**Error: `Failed to parse package.json`**
```bash
# Validate JSON syntax
cat package.json | jq . || echo "Invalid JSON"

# Fix common JSON issues
sed -i 's/,\s*}/}/g' package.json  # Remove trailing commas

# Backup and recreate if needed
mv package.json package.json.backup
npm init -y
```

**Error: `Template engine error: Cannot read properties of undefined`**
```bash
# Update templates
awe sync --force

# Use different template
awe scaffold nodejs-api  # Instead of web-react

# Check template variables
awe scaffold web-react --dry-run -n test-app
```

## Recovery Procedures

### Complete Reset

```bash
#!/bin/bash
# complete-reset.sh

echo "🔄 Performing complete AWE CLI reset..."

# Backup existing data
if [ -d ~/.awe ]; then
  echo "📦 Backing up existing data..."
  tar -czf ~/.awe-backup-$(date +%Y%m%d_%H%M%S).tar.gz ~/.awe/
fi

# Remove AWE data directory
echo "🗑️  Removing AWE data directory..."
rm -rf ~/.awe/

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Reinstall AWE CLI
echo "📥 Reinstalling AWE CLI..."
npm uninstall -g @awe/claude-companion
npm install -g @awe/claude-companion

# Initialize fresh installation
echo "🚀 Initializing fresh installation..."
awe sync

echo "✅ Reset complete!"
```

### Selective Reset

```bash
# Reset only database
rm ~/.awe/awe.db
awe sync

# Reset only cache
rm -rf ~/.awe/cache/
rm -rf ~/.awe/temp/

# Reset only logs
rm -rf ~/.awe/logs/
mkdir -p ~/.awe/logs/

# Reset only templates
rm -rf ~/.awe/templates/
awe sync --force
```

### Backup and Restore

```bash
# Create backup
tar -czf awe-backup-$(date +%Y%m%d).tar.gz ~/.awe/

# Restore from backup
tar -xzf awe-backup-20240315.tar.gz -C ~/

# Verify backup integrity
tar -tzf awe-backup-20240315.tar.gz | head -10
```

### Project-Specific Recovery

```bash
# Reset project AWE configuration
rm CLAUDE.md
rm -rf .claude/
awe init

# Backup project before optimization
cp -r . ../project-backup/
awe optimize --dry-run  # Check what would change

# Restore project if optimization fails
rm -rf ./*
cp -r ../project-backup/* .
```

## Getting Help

### Self-Help Resources

1. **Check Documentation:**
   ```bash
   # Command-specific help
   awe <command> --help
   
   # General help
   awe --help
   
   # Read documentation
   cat $(npm root -g)/@awe/claude-companion/docs/README.md
   ```

2. **Search Known Issues:**
   ```bash
   # Search logs for similar issues
   grep -i "<error-keywords>" ~/.awe/logs/awe.log
   
   # Check GitHub issues
   # Visit: https://github.com/awe-team/claude-companion/issues
   ```

3. **Community Resources:**
   - GitHub Discussions: https://github.com/awe-team/claude-companion/discussions
   - Documentation Wiki: https://github.com/awe-team/claude-companion/wiki
   - Stack Overflow: Tag `awe-cli` or `claude-companion`

### Reporting Issues

When reporting issues, include:

1. **System Information:**
   ```bash
   # Run diagnostic script
   bash awe-diagnostic.sh > system-info.txt
   ```

2. **Error Details:**
   ```bash
   # Capture full error output
   awe --debug <failing-command> > error-output.txt 2>&1
   ```

3. **Reproduction Steps:**
   - Exact command that failed
   - Project structure (if relevant)
   - Expected vs actual behavior

4. **Log Files:**
   ```bash
   # Recent logs
   tail -100 ~/.awe/logs/awe.log > recent-logs.txt
   
   # Error logs
   grep ERROR ~/.awe/logs/awe.log > error-logs.txt
   ```

### Issue Template

```markdown
## Bug Report

**AWE CLI Version:** `awe --version`
**Node.js Version:** `node --version`
**Operating System:** [macOS/Windows/Linux + version]

**Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [etc.]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Error Output:**
```
[Paste error output here]
```

**Additional Context:**
[Any other relevant information]
```

### Emergency Contacts

For critical issues affecting production environments:

- **GitHub Issues**: https://github.com/awe-team/claude-companion/issues/new
- **Emergency Email**: support@awe-team.com (for production critical issues)
- **Community Discord**: [Link to Discord server]

### Professional Support

For enterprise users requiring dedicated support:

- **Enterprise Support**: enterprise@awe-team.com
- **Training and Consultation**: training@awe-team.com
- **Custom Development**: custom@awe-team.com

This troubleshooting guide should help resolve most common AWE CLI issues. For problems not covered here, don't hesitate to reach out to the community or file an issue on GitHub.