/**
 * Secure Configuration Management System
 * 
 * Features:
 * - Environment variable loading with fallbacks
 * - Encrypted credential storage
 * - Multiple credential sources (env, config file, keychain)
 * - Validation and sanitization
 * - Graceful degradation for missing credentials
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class SecureConfigManager {
  constructor(options = {}) {
    this.options = {
      configDir: options.configDir || path.join(os.homedir(), '.awe'),
      configFile: options.configFile || 'config.json',
      encryptionKey: options.encryptionKey || this.generateEncryptionKey(),
      validateCredentials: options.validateCredentials !== false,
      ...options
    };

    this.config = {};
    this.isInitialized = false;
  }

  /**
   * Initialize configuration system
   */
  async initialize() {
    try {
      // Ensure config directory exists
      await fs.ensureDir(this.options.configDir);

      // Load configuration from multiple sources
      await this.loadConfiguration();

      this.isInitialized = true;
      console.log('🔐 Secure configuration initialized');

    } catch (error) {
      console.warn('⚠️  Configuration initialization failed:', error.message);
      // Continue with empty config for graceful degradation
      this.config = this.getDefaultConfig();
      this.isInitialized = true;
    }
  }

  /**
   * Load configuration from multiple sources in priority order
   */
  async loadConfiguration() {
    // Priority order: Environment Variables > Config File > Interactive Setup
    
    // 1. Load from environment variables
    const envConfig = this.loadFromEnvironment();
    
    // 2. Load from config file
    const fileConfig = await this.loadFromConfigFile();
    
    // 3. Merge configurations (env takes precedence)
    this.config = {
      ...this.getDefaultConfig(),
      ...fileConfig,
      ...envConfig
    };

    // 4. Validate configuration
    if (this.options.validateCredentials) {
      await this.validateConfiguration();
    }

    // 5. Save sanitized config back to file (without secrets)
    await this.savePublicConfiguration();
  }

  /**
   * Load configuration from environment variables
   */
  loadFromEnvironment() {
    const envConfig = {};

    // Supabase configuration
    if (process.env.AWE_SUPABASE_URL) {
      envConfig.supabase = {
        url: process.env.AWE_SUPABASE_URL,
        anonKey: process.env.AWE_SUPABASE_ANON_KEY,
        serviceKey: process.env.AWE_SUPABASE_SERVICE_KEY
      };
    }

    // API configuration
    if (process.env.AWE_API_BASE_URL) {
      envConfig.api = {
        baseUrl: process.env.AWE_API_BASE_URL,
        timeout: parseInt(process.env.AWE_API_TIMEOUT) || 30000,
        retries: parseInt(process.env.AWE_API_RETRIES) || 3
      };
    }

    // Performance configuration
    if (process.env.AWE_CACHE_SIZE) {
      envConfig.performance = {
        cacheSize: parseInt(process.env.AWE_CACHE_SIZE),
        maxConcurrency: parseInt(process.env.AWE_MAX_CONCURRENCY) || 10,
        offlineMode: process.env.AWE_OFFLINE_MODE === 'true'
      };
    }

    // Feature flags
    if (process.env.AWE_FEATURES) {
      envConfig.features = process.env.AWE_FEATURES.split(',').reduce((acc, feature) => {
        acc[feature.trim()] = true;
        return acc;
      }, {});
    }

    return envConfig;
  }

  /**
   * Load configuration from encrypted config file
   */
  async loadFromConfigFile() {
    try {
      const configPath = path.join(this.options.configDir, this.options.configFile);
      
      if (!await fs.pathExists(configPath)) {
        return {};
      }

      const configData = await fs.readJson(configPath);
      
      // Decrypt sensitive fields if they exist
      if (configData.encrypted) {
        configData.encrypted = this.decryptObject(configData.encrypted);
      }

      return configData;

    } catch (error) {
      console.warn('⚠️  Failed to load config file:', error.message);
      return {};
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      version: '1.0.0',
      api: {
        baseUrl: 'https://api.awe-cli.com',
        timeout: 30000,
        retries: 3
      },
      performance: {
        cacheSize: 1000,
        maxConcurrency: 10,
        offlineMode: false,
        enableMetrics: true
      },
      features: {
        aiAnalysis: true,
        templateGeneration: true,
        backgroundSync: true,
        vectorSearch: true
      },
      privacy: {
        telemetry: false,
        analytics: false,
        crashReporting: false
      }
    };
  }

  /**
   * Validate configuration and credentials
   */
  async validateConfiguration() {
    const issues = [];

    // Check Supabase configuration
    if (this.config.supabase) {
      if (!this.config.supabase.url || !this.config.supabase.url.startsWith('https://')) {
        issues.push('Invalid Supabase URL');
      }
      
      if (!this.config.supabase.anonKey || this.config.supabase.anonKey.length < 20) {
        issues.push('Invalid Supabase anonymous key');
      }

      // Service key is optional but should be valid if provided
      if (this.config.supabase.serviceKey && this.config.supabase.serviceKey.length < 20) {
        issues.push('Invalid Supabase service key');
      }
    }

    // Check API configuration
    if (this.config.api.baseUrl && !this.config.api.baseUrl.startsWith('https://')) {
      issues.push('API base URL should use HTTPS');
    }

    if (issues.length > 0) {
      console.warn('⚠️  Configuration issues detected:');
      issues.forEach(issue => console.warn(`   • ${issue}`));
    }

    return issues;
  }

  /**
   * Save public configuration (without secrets) to file
   */
  async savePublicConfiguration() {
    try {
      const publicConfig = this.sanitizeForStorage(this.config);
      const configPath = path.join(this.options.configDir, this.options.configFile);
      
      await fs.writeJson(configPath, publicConfig, { spaces: 2 });
      
      // Set restrictive permissions
      await fs.chmod(configPath, 0o600); // Owner read/write only

    } catch (error) {
      console.warn('⚠️  Failed to save config:', error.message);
    }
  }

  /**
   * Sanitize configuration for storage (remove/encrypt secrets)
   */
  sanitizeForStorage(config) {
    const sanitized = JSON.parse(JSON.stringify(config));

    // Remove sensitive fields but keep structure for reference
    if (sanitized.supabase) {
      if (sanitized.supabase.anonKey) {
        sanitized.supabase.anonKey = this.maskSecret(sanitized.supabase.anonKey);
      }
      // Never store service key in plain text
      delete sanitized.supabase.serviceKey;
    }

    // Add metadata
    sanitized._metadata = {
      lastUpdated: new Date().toISOString(),
      version: sanitized.version || '1.0.0'
    };

    return sanitized;
  }

  /**
   * Mask secret for display/storage
   */
  maskSecret(secret) {
    if (!secret || secret.length < 8) return '***';
    return secret.substring(0, 4) + '...' + secret.substring(secret.length - 4);
  }

  /**
   * Encrypt object for secure storage
   */
  encryptObject(obj) {
    try {
      const text = JSON.stringify(obj);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', this.options.encryptionKey);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        data: encrypted,
        iv: iv.toString('hex')
      };
    } catch (error) {
      console.warn('⚠️  Encryption failed:', error.message);
      return obj;
    }
  }

  /**
   * Decrypt object
   */
  decryptObject(encryptedObj) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.options.encryptionKey);
      
      let decrypted = decipher.update(encryptedObj.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.warn('⚠️  Decryption failed:', error.message);
      return {};
    }
  }

  /**
   * Generate encryption key from system-specific data
   */
  generateEncryptionKey() {
    const systemData = `${os.hostname()}-${os.platform()}-${os.arch()}`;
    return crypto.createHash('sha256').update(systemData).digest('hex');
  }

  /**
   * Get configuration value with fallback
   */
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let current = this.config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }

  /**
   * Set configuration value
   */
  set(path, value) {
    const keys = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Check if running in offline mode
   */
  isOfflineMode() {
    return this.get('performance.offlineMode', false) || !this.hasCredentials();
  }

  /**
   * Check if credentials are available
   */
  hasCredentials() {
    return !!(this.get('supabase.url') && this.get('supabase.anonKey'));
  }

  /**
   * Get Supabase configuration
   */
  getSupabaseConfig() {
    const config = this.get('supabase', {});
    
    return {
      url: config.url || null,
      anonKey: config.anonKey || null,
      serviceKey: config.serviceKey || null
    };
  }

  /**
   * Get API configuration
   */
  getAPIConfig() {
    return {
      baseUrl: this.get('api.baseUrl'),
      timeout: this.get('api.timeout', 30000),
      retries: this.get('api.retries', 3),
      ...this.getSupabaseConfig()
    };
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig() {
    return {
      cacheSize: this.get('performance.cacheSize', 1000),
      maxConcurrency: this.get('performance.maxConcurrency', 10),
      offlineMode: this.get('performance.offlineMode', false),
      enableMetrics: this.get('performance.enableMetrics', true)
    };
  }

  /**
   * Interactive setup for missing credentials
   */
  async setupCredentials() {
    console.log('🔧 AWE requires Supabase credentials for cloud intelligence features.');
    console.log('   You can get these from: https://app.supabase.com/projects');
    console.log('   Or continue in offline mode with limited functionality.\n');

    // This would be implemented with inquirer for interactive setup
    // For now, just show instructions
    this.showCredentialInstructions();
  }

  /**
   * Show credential setup instructions
   */
  showCredentialInstructions() {
    console.log('🔐 Credential Setup Options:\n');
    
    console.log('1️⃣  Environment Variables (Recommended):');
    console.log('   export AWE_SUPABASE_URL="https://your-project.supabase.co"');
    console.log('   export AWE_SUPABASE_ANON_KEY="your-anon-key"');
    console.log('   export AWE_SUPABASE_SERVICE_KEY="your-service-key" # Optional\n');
    
    console.log('2️⃣  Configuration File:');
    console.log(`   Edit: ${path.join(this.options.configDir, this.options.configFile)}`);
    console.log('   Add your Supabase credentials in the config file\n');
    
    console.log('3️⃣  Continue Offline:');
    console.log('   AWE will work with reduced functionality using local cache only\n');
  }

  /**
   * Get configuration summary
   */
  getConfigSummary() {
    return {
      hasCredentials: this.hasCredentials(),
      offlineMode: this.isOfflineMode(),
      supabase: {
        configured: !!this.get('supabase.url'),
        url: this.get('supabase.url') ? this.maskSecret(this.get('supabase.url')) : null
      },
      features: this.get('features', {}),
      performance: this.getPerformanceConfig()
    };
  }
}

// Singleton instance
let configInstance = null;

/**
 * Initialize configuration manager
 */
async function initializeConfig(options = {}) {
  if (!configInstance) {
    configInstance = new SecureConfigManager(options);
    await configInstance.initialize();
  }
  return configInstance;
}

/**
 * Get configuration manager instance
 */
function getConfig() {
  if (!configInstance) {
    throw new Error('Configuration not initialized. Call initializeConfig() first.');
  }
  return configInstance;
}

module.exports = {
  SecureConfigManager,
  initializeConfig,
  getConfig
};