# 🔐 AWE Security Guide

This document outlines security best practices for using AWE CLI and protecting your credentials.

## 🔑 Credential Management

### Recommended: Environment Variables

The most secure way to provide credentials is through environment variables:

```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
export AWE_SUPABASE_URL="https://your-project.supabase.co"
export AWE_SUPABASE_ANON_KEY="your-anon-key"
export AWE_SUPABASE_SERVICE_KEY="your-service-key"  # Optional
```

### Alternative: Configuration File

AWE stores configuration in `~/.awe/config.json` with:
- ✅ Restricted file permissions (600 - owner only)
- ✅ Sensitive data masked in storage
- ✅ Service keys never stored in plain text
- ✅ Automatic encryption for sensitive fields

### Interactive Setup

Use the secure configuration wizard:

```bash
awe config --setup
```

This provides:
- ✅ Input validation
- ✅ Connection testing
- ✅ Secure storage
- ✅ Clear instructions

## 🛡️ Security Features

### 1. Credential Protection
- **Environment variables**: Highest security priority
- **Masked display**: Keys shown as `abc...xyz` format
- **No logging**: Credentials never appear in logs
- **File permissions**: Config files restricted to owner only

### 2. Connection Security
- **HTTPS only**: All API connections use TLS
- **Certificate validation**: SSL certificates verified
- **Timeout protection**: Requests timeout to prevent hanging
- **Retry limits**: Prevents excessive retry attempts

### 3. Local Storage Security
- **SQLite encryption**: Local database can be encrypted
- **Cache isolation**: Cache data segregated by user
- **Temp file cleanup**: Temporary files securely deleted
- **Memory clearing**: Sensitive data cleared from memory

### 4. Network Security
- **Rate limiting**: Built-in request rate limiting
- **Connection pooling**: Secure connection reuse
- **Request signing**: API requests properly authenticated
- **Offline mode**: Full functionality without network

## ⚠️ Security Warnings

### Service Role Key
The Supabase service role key has **admin privileges**:
- ❌ **Never commit to version control**
- ❌ **Never share or expose publicly**
- ❌ **Only use in secure environments**
- ✅ Store in environment variables only
- ✅ Rotate regularly (monthly recommended)

### Anonymous Key
The anonymous key is safe for client-side use but:
- ✅ Can be committed to version control
- ✅ Safe for public repositories
- ⚠️  Has limited permissions only
- ⚠️  Should still be rotated periodically

## 🔧 Configuration Options

### Offline Mode
For maximum security, run AWE in offline mode:

```bash
export AWE_OFFLINE_MODE=true
```

This:
- ✅ Disables all network requests
- ✅ Uses only local cache and database
- ✅ No credentials required
- ❌ Reduced functionality (no AI features)

### Debug Mode
When debugging, avoid sensitive data:

```bash
export AWE_DEBUG=true
export AWE_LOG_LEVEL=debug
```

**Note**: Debug logs never contain credentials, but may show request patterns.

## 🔍 Security Validation

### Check Configuration Status
```bash
awe config --status
```

Displays:
- ✅ Whether credentials are configured
- ✅ Connection status
- ✅ Security settings
- ✅ Feature availability

### Validate Configuration
```bash
awe config --validate
```

Performs:
- ✅ Credential format validation
- ✅ Connection testing
- ✅ Permission checking
- ✅ Security recommendations

## 🚨 Incident Response

### If Credentials Are Compromised

1. **Immediate Actions**:
   ```bash
   # Reset configuration
   awe config --reset
   
   # Clear environment variables
   unset AWE_SUPABASE_URL
   unset AWE_SUPABASE_ANON_KEY
   unset AWE_SUPABASE_SERVICE_KEY
   ```

2. **Supabase Console**:
   - Regenerate API keys
   - Review access logs
   - Update RLS policies
   - Audit database permissions

3. **Local Cleanup**:
   ```bash
   # Remove config directory
   rm -rf ~/.awe
   
   # Clear shell history if needed
   history -c
   ```

### If System Is Compromised

1. **Audit Access**:
   - Check Supabase access logs
   - Review project activity
   - Verify database integrity

2. **Rotate Everything**:
   - Generate new API keys
   - Update environment variables
   - Restart AWE configuration

## 📋 Security Checklist

### Initial Setup
- [ ] Use environment variables for credentials
- [ ] Verify HTTPS URLs only
- [ ] Test connection with `awe config --validate`
- [ ] Set appropriate file permissions
- [ ] Enable only required features

### Ongoing Security
- [ ] Rotate service keys monthly
- [ ] Monitor Supabase access logs
- [ ] Keep AWE updated
- [ ] Review configuration periodically
- [ ] Use offline mode when possible

### Team Environments
- [ ] Use separate projects for dev/staging/prod
- [ ] Limit service key access
- [ ] Document credential management
- [ ] Train team on security practices
- [ ] Implement key rotation schedule

## 🔗 Additional Resources

- [Supabase Security Guide](https://supabase.com/docs/guides/auth/managing-user-data)
- [Environment Variable Best Practices](https://12factor.net/config)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

## 📞 Support

For security-related questions or concerns:
- GitHub Issues: Report security issues privately
- Documentation: Check latest security updates
- Community: Security best practices discussion

---

**Remember**: Security is a shared responsibility. While AWE provides secure defaults and practices, proper credential management and operational security depend on following these guidelines.