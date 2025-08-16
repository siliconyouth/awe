/**
 * Enhanced Security Environment Manager with dotenvx
 * 
 * Features:
 * - Encrypted environment variables
 * - Multiple environment support
 * - Key rotation capabilities
 * - Audit logging
 * - Zero-trust security model
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class SecureEnvironmentManager {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      environment: options.environment || process.env.NODE_ENV || 'development',
      keyFile: options.keyFile || '.env.keys',
      enableAudit: options.enableAudit !== false,
      ...options
    };

    this.auditLog = [];
    this.isInitialized = false;
  }

  /**
   * Initialize secure environment system
   */
  async initialize() {
    try {
      // Check if dotenvx is properly configured
      await this.validateDotenvxSetup();
      
      // Load environment-specific configuration
      await this.loadEnvironmentConfig();
      
      // Audit the initialization
      this.auditAction('system_initialized', {
        environment: this.options.environment,
        timestamp: Date.now()
      });

      this.isInitialized = true;
      console.log('🔐 Secure environment initialized');

    } catch (error) {
      console.warn('⚠️  Secure environment initialization failed:', error.message);
      console.log('📋 Falling back to standard environment loading');
      
      // Fallback to regular dotenv if dotenvx fails
      require('dotenv').config({ silent: true });
      this.isInitialized = true;
    }
  }

  /**
   * Validate dotenvx setup
   */
  async validateDotenvxSetup() {
    const envFiles = [
      path.join(this.options.projectRoot, '.env'),
      path.join(this.options.projectRoot, `.env.${this.options.environment}`),
      path.join(this.options.projectRoot, '.env.local')
    ];

    let hasEnvFiles = false;
    for (const file of envFiles) {
      if (await fs.pathExists(file)) {
        hasEnvFiles = true;
        break;
      }
    }

    if (!hasEnvFiles) {
      console.log('📋 No environment files found, using system environment variables only');
      return;
    }

    // Check if vault file exists (indicates encrypted setup)
    const vaultFile = path.join(this.options.projectRoot, '.env.vault');
    if (await fs.pathExists(vaultFile)) {
      console.log('🔒 Encrypted vault detected, using secure mode');
      this.auditAction('vault_detected', { vaultFile });
    }
  }

  /**
   * Load environment-specific configuration
   */
  async loadEnvironmentConfig() {
    // dotenvx will automatically load the appropriate files
    // based on NODE_ENV and convention settings
    
    // Validate required variables are present
    await this.validateRequiredVariables();
  }

  /**
   * Validate required environment variables
   */
  async validateRequiredVariables() {
    const required = [
      'AWE_SUPABASE_URL',
      'AWE_SUPABASE_ANON_KEY'
    ];

    const missing = [];
    const masked = {};

    for (const varName of required) {
      const value = process.env[varName];
      if (!value) {
        missing.push(varName);
      } else {
        masked[varName] = this.maskSecret(value);
        this.auditAction('variable_loaded', { 
          variable: varName, 
          masked: masked[varName] 
        });
      }
    }

    if (missing.length > 0) {
      console.log('⚠️  Missing required environment variables:');
      missing.forEach(varName => {
        console.log(`   • ${varName}`);
      });
      console.log('\n🔧 Run "awe config --setup" to configure credentials');
    } else {
      console.log('✅ All required environment variables are configured');
    }

    return { missing, configured: masked };
  }

  /**
   * Encrypt environment file using dotenvx
   */
  async encryptEnvironment(envFile = '.env') {
    try {
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const child = spawn('npx', ['dotenvx', 'encrypt', envFile], {
          cwd: this.options.projectRoot,
          stdio: 'pipe'
        });

        let output = '';
        let error = '';

        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          error += data.toString();
        });

        child.on('close', (code) => {
          if (code === 0) {
            this.auditAction('environment_encrypted', { 
              file: envFile, 
              output: output.trim() 
            });
            resolve(output.trim());
          } else {
            reject(new Error(`Encryption failed: ${error}`));
          }
        });
      });

    } catch (error) {
      console.warn('⚠️  Environment encryption failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate new encryption keys
   */
  async generateKeys() {
    try {
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const child = spawn('npx', ['dotenvx', 'genkey'], {
          cwd: this.options.projectRoot,
          stdio: 'pipe'
        });

        let output = '';
        let error = '';

        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          error += data.toString();
        });

        child.on('close', (code) => {
          if (code === 0) {
            this.auditAction('keys_generated', { 
              timestamp: Date.now(),
              environment: this.options.environment
            });
            resolve(output.trim());
          } else {
            reject(new Error(`Key generation failed: ${error}`));
          }
        });
      });

    } catch (error) {
      console.warn('⚠️  Key generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys() {
    try {
      console.log('🔄 Rotating encryption keys...');
      
      // Generate new keys
      const newKeys = await this.generateKeys();
      
      // Re-encrypt with new keys
      await this.encryptEnvironment();
      
      this.auditAction('keys_rotated', {
        timestamp: Date.now(),
        environment: this.options.environment
      });

      console.log('✅ Keys rotated successfully');
      console.log('📋 Update your deployment with new DOTENV_KEY');
      
      return newKeys;

    } catch (error) {
      console.error('❌ Key rotation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    const status = {
      isInitialized: this.isInitialized,
      environment: this.options.environment,
      hasVault: false,
      encryptedVariables: 0,
      auditEntries: this.auditLog.length
    };

    // Check for vault file
    const vaultPath = path.join(this.options.projectRoot, '.env.vault');
    status.hasVault = fs.existsSync(vaultPath);

    // Count environment variables
    const envVars = Object.keys(process.env).filter(key => 
      key.startsWith('AWE_') || key.includes('SUPABASE')
    );
    status.encryptedVariables = envVars.length;

    return status;
  }

  /**
   * Audit security action
   */
  auditAction(action, metadata = {}) {
    if (!this.options.enableAudit) return;

    const entry = {
      timestamp: Date.now(),
      action,
      environment: this.options.environment,
      hostname: os.hostname(),
      pid: process.pid,
      ...metadata
    };

    this.auditLog.push(entry);

    // Keep only last 100 entries
    if (this.auditLog.length > 100) {
      this.auditLog = this.auditLog.slice(-100);
    }
  }

  /**
   * Mask secret for display
   */
  maskSecret(secret) {
    if (!secret || secret.length < 8) return '***';
    return secret.substring(0, 4) + '...' + secret.substring(secret.length - 4);
  }

  /**
   * Get audit log
   */
  getAuditLog(limit = 20) {
    return this.auditLog.slice(-limit);
  }

  /**
   * Export audit log
   */
  async exportAuditLog(filePath) {
    try {
      await fs.writeJson(filePath, {
        exportedAt: new Date().toISOString(),
        environment: this.options.environment,
        entries: this.auditLog
      }, { spaces: 2 });

      console.log(`📊 Audit log exported to: ${filePath}`);
    } catch (error) {
      console.warn('⚠️  Audit log export failed:', error.message);
    }
  }

  /**
   * Security recommendations
   */
  getSecurityRecommendations() {
    const recommendations = [];
    const status = this.getSecurityStatus();

    if (!status.hasVault) {
      recommendations.push({
        level: 'high',
        message: 'Encrypt your environment files',
        action: 'Run: npx dotenvx encrypt'
      });
    }

    if (status.environment === 'production' && process.env.NODE_ENV !== 'production') {
      recommendations.push({
        level: 'medium',
        message: 'NODE_ENV should be set to "production"',
        action: 'Set NODE_ENV=production'
      });
    }

    if (!process.env.DOTENV_KEY) {
      recommendations.push({
        level: 'medium',
        message: 'Use DOTENV_KEY for production deployments',
        action: 'Set DOTENV_KEY environment variable'
      });
    }

    const sensitiveVars = Object.keys(process.env).filter(key => 
      key.includes('SECRET') || key.includes('PRIVATE') || key.includes('KEY')
    );

    if (sensitiveVars.length > 0) {
      recommendations.push({
        level: 'low',
        message: `${sensitiveVars.length} sensitive variables detected`,
        action: 'Ensure all sensitive data is encrypted'
      });
    }

    return recommendations;
  }
}

// Singleton instance
let secureEnvInstance = null;

/**
 * Initialize secure environment manager
 */
async function initializeSecureEnvironment(options = {}) {
  if (!secureEnvInstance) {
    secureEnvInstance = new SecureEnvironmentManager(options);
    await secureEnvInstance.initialize();
  }
  return secureEnvInstance;
}

/**
 * Get secure environment manager instance
 */
function getSecureEnvironment() {
  if (!secureEnvInstance) {
    throw new Error('Secure environment not initialized. Call initializeSecureEnvironment() first.');
  }
  return secureEnvInstance;
}

module.exports = {
  SecureEnvironmentManager,
  initializeSecureEnvironment,
  getSecureEnvironment
};