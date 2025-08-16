#!/usr/bin/env node

/**
 * Fast environment variable loader with encryption support
 * Replacement for dotenvx with instant loading
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

class EnvLoader {
  constructor() {
    this.envCache = new Map();
  }

  /**
   * Load environment variables from file
   */
  loadEnv(envFile) {
    const filePath = path.resolve(envFile);
    
    // Check cache first
    if (this.envCache.has(filePath)) {
      return this.envCache.get(filePath);
    }

    if (!fs.existsSync(filePath)) {
      console.error(`Environment file not found: ${filePath}`);
      process.exit(1);
    }

    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = this.parseEnv(envContent);
    
    // Cache for fast subsequent loads
    this.envCache.set(filePath, envVars);
    
    return envVars;
  }

  /**
   * Parse .env file content
   */
  parseEnv(content) {
    const envVars = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) continue;
      
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[key.trim()] = value;
      }
    }
    
    return envVars;
  }

  /**
   * Run command with environment variables
   */
  run(envFile, command, args) {
    const envVars = this.loadEnv(envFile);
    
    // Merge with existing environment
    const env = { ...process.env, ...envVars };
    
    // Spawn the command
    const child = spawn(command, args, {
      env,
      stdio: 'inherit',
      shell: true
    });

    child.on('error', (error) => {
      console.error(`Failed to execute command: ${error.message}`);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  }

  /**
   * Encrypt environment file with modern crypto
   */
  encrypt(envFile, password) {
    const content = fs.readFileSync(envFile, 'utf8');
    
    // Use modern crypto with salt and IV
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Store salt, iv, and encrypted data
    const result = {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      data: encrypted,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(`${envFile}.encrypted`, JSON.stringify(result, null, 2));
    console.log(`✅ Encrypted environment saved to ${envFile}.encrypted`);
    console.log(`🔐 Keep your password safe - it cannot be recovered!`);
  }

  /**
   * Decrypt environment file with modern crypto
   */
  decrypt(encryptedFile, password) {
    const encryptedData = JSON.parse(fs.readFileSync(encryptedFile, 'utf8'));
    
    // Recreate key from password and salt
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      console.log(`✅ Decrypted successfully (encrypted on ${encryptedData.timestamp})`);
      return this.parseEnv(decrypted);
    } catch (error) {
      console.error('❌ Failed to decrypt - wrong password or corrupted file');
      process.exit(1);
    }
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
Usage: 
  env-loader <env-file> <command>
  env-loader encrypt <env-file> <password>
  env-loader decrypt <env-file.encrypted> <password> <command>

Examples:
  env-loader .env.local pnpm prisma migrate dev
  env-loader encrypt .env.local mypassword
  env-loader decrypt .env.local.encrypted mypassword pnpm dev
    `);
    process.exit(1);
  }

  const loader = new EnvLoader();
  
  if (args[0] === 'encrypt') {
    loader.encrypt(args[1], args[2]);
  } else if (args[0] === 'decrypt') {
    const envVars = loader.decrypt(args[1], args[2]);
    // Set environment and run command
    Object.assign(process.env, envVars);
    const command = args.slice(3).join(' ');
    require('child_process').execSync(command, { stdio: 'inherit' });
  } else {
    // Regular run
    const envFile = args[0];
    const command = args.slice(1).join(' ');
    loader.run(envFile, command, []);
  }
}

module.exports = EnvLoader;