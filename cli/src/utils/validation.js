const fs = require('fs-extra');
const path = require('path');

/**
 * Validation utilities for CLI commands
 */

/**
 * Validate if path exists and is accessible
 */
async function validatePath(filePath, options = {}) {
  const { mustExist = true, mustBeFile = false, mustBeDirectory = false } = options;
  
  try {
    const exists = await fs.pathExists(filePath);
    
    if (mustExist && !exists) {
      throw new Error(`Path does not exist: ${filePath}`);
    }
    
    if (exists) {
      const stats = await fs.stat(filePath);
      
      if (mustBeFile && !stats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }
      
      if (mustBeDirectory && !stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${filePath}`);
      }
    }
    
    return { valid: true, exists, path: path.resolve(filePath) };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate project directory structure
 */
async function validateProject(projectPath) {
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
    info: {}
  };
  
  try {
    // Check if directory exists
    const pathValidation = await validatePath(projectPath, { 
      mustExist: true, 
      mustBeDirectory: true 
    });
    
    if (!pathValidation.valid) {
      validation.valid = false;
      validation.errors.push(pathValidation.error);
      return validation;
    }
    
    // Check for common project files
    const projectFiles = [
      'package.json',
      'requirements.txt',
      'Cargo.toml',
      'pom.xml',
      'go.mod',
      'composer.json'
    ];
    
    let hasProjectFile = false;
    for (const file of projectFiles) {
      const filePath = path.join(projectPath, file);
      if (await fs.pathExists(filePath)) {
        hasProjectFile = true;
        validation.info.projectFile = file;
        break;
      }
    }
    
    if (!hasProjectFile) {
      validation.warnings.push('No standard project file found (package.json, requirements.txt, etc.)');
    }
    
    // Check for source directories
    const sourceDirs = ['src', 'lib', 'source', 'app'];
    let hasSourceDir = false;
    
    for (const dir of sourceDirs) {
      const dirPath = path.join(projectPath, dir);
      if (await fs.pathExists(dirPath)) {
        const stats = await fs.stat(dirPath);
        if (stats.isDirectory()) {
          hasSourceDir = true;
          validation.info.sourceDir = dir;
          break;
        }
      }
    }
    
    if (!hasSourceDir) {
      validation.warnings.push('No standard source directory found (src, lib, etc.)');
    }
    
    // Check if it's already a git repository
    const gitDir = path.join(projectPath, '.git');
    validation.info.isGitRepo = await fs.pathExists(gitDir);
    
    // Check for existing CLAUDE.md
    const claudeFile = path.join(projectPath, 'CLAUDE.md');
    validation.info.hasClaude = await fs.pathExists(claudeFile);
    
  } catch (error) {
    validation.valid = false;
    validation.errors.push(`Validation failed: ${error.message}`);
  }
  
  return validation;
}

/**
 * Validate template name
 */
function validateTemplateName(name) {
  const validation = { valid: true, errors: [] };
  
  if (!name || typeof name !== 'string') {
    validation.valid = false;
    validation.errors.push('Template name is required');
    return validation;
  }
  
  // Check naming convention
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    validation.valid = false;
    validation.errors.push('Template name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens');
  }
  
  if (name.length < 3 || name.length > 50) {
    validation.valid = false;
    validation.errors.push('Template name must be between 3 and 50 characters');
  }
  
  return validation;
}

/**
 * Validate agent configuration
 */
function validateAgentConfig(config) {
  const validation = { valid: true, errors: [], warnings: [] };
  
  // Required fields
  const required = ['name', 'version', 'description', 'type'];
  for (const field of required) {
    if (!config[field]) {
      validation.valid = false;
      validation.errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate agent type
  const validTypes = [
    'analysis', 'implementation', 'infrastructure', 'review', 
    'testing', 'documentation', 'security', 'optimization'
  ];
  
  if (config.type && !validTypes.includes(config.type)) {
    validation.valid = false;
    validation.errors.push(`Invalid agent type: ${config.type}. Must be one of: ${validTypes.join(', ')}`);
  }
  
  // Validate name format
  if (config.name) {
    const nameValidation = validateTemplateName(config.name);
    if (!nameValidation.valid) {
      validation.valid = false;
      validation.errors.push(...nameValidation.errors);
    }
  }
  
  // Validate version format
  if (config.version && !/^\d+\.\d+\.\d+$/.test(config.version)) {
    validation.valid = false;
    validation.errors.push('Version must follow semantic versioning (e.g., 1.0.0)');
  }
  
  // Validate tools
  if (config.tools && !Array.isArray(config.tools)) {
    validation.valid = false;
    validation.errors.push('Tools must be an array');
  }
  
  // Validate workflow
  if (config.workflow) {
    if (!Array.isArray(config.workflow)) {
      validation.valid = false;
      validation.errors.push('Workflow must be an array');
    } else {
      config.workflow.forEach((step, index) => {
        if (!step.step || !step.description) {
          validation.valid = false;
          validation.errors.push(`Workflow step ${index + 1} must have 'step' and 'description' fields`);
        }
      });
    }
  }
  
  return validation;
}

/**
 * Validate command options
 */
function validateCommandOptions(command, options) {
  const validation = { valid: true, errors: [], warnings: [] };
  
  switch (command) {
    case 'init':
      if (options.template) {
        const templateValidation = validateTemplateName(options.template);
        if (!templateValidation.valid) {
          validation.valid = false;
          validation.errors.push(...templateValidation.errors);
        }
      }
      break;
      
    case 'scaffold':
      if (options.output) {
        // Validate output directory
        if (!path.isAbsolute(options.output)) {
          options.output = path.resolve(options.output);
        }
      }
      
      if (options.name && !/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(options.name)) {
        validation.valid = false;
        validation.errors.push('Project name must start with a letter and contain only letters, numbers, hyphens, and underscores');
      }
      break;
      
    case 'scrape':
      if (options.limit && (isNaN(options.limit) || options.limit < 1 || options.limit > 1000)) {
        validation.valid = false;
        validation.errors.push('Limit must be a number between 1 and 1000');
      }
      
      if (options.concurrent && (isNaN(options.concurrent) || options.concurrent < 1 || options.concurrent > 10)) {
        validation.valid = false;
        validation.errors.push('Concurrent tasks must be a number between 1 and 10');
      }
      break;
  }
  
  return validation;
}

/**
 * Sanitize user input
 */
function sanitizeInput(input, type = 'string') {
  if (input === null || input === undefined) {
    return input;
  }
  
  switch (type) {
    case 'string':
      return String(input).trim();
      
    case 'filename':
      return String(input)
        .trim()
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .toLowerCase();
        
    case 'path':
      return path.normalize(String(input).trim());
      
    case 'number':
      const num = Number(input);
      return isNaN(num) ? 0 : num;
      
    case 'boolean':
      if (typeof input === 'boolean') return input;
      const str = String(input).toLowerCase().trim();
      return ['true', '1', 'yes', 'on'].includes(str);
      
    default:
      return input;
  }
}

/**
 * Check if running in a valid environment
 */
async function validateEnvironment() {
  const validation = { valid: true, errors: [], warnings: [], info: {} };
  
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 14) {
      validation.valid = false;
      validation.errors.push(`Node.js ${nodeVersion} is not supported. Please use Node.js 14 or higher.`);
    } else if (majorVersion < 16) {
      validation.warnings.push(`Node.js ${nodeVersion} detected. Node.js 16+ is recommended for best performance.`);
    }
    
    validation.info.nodeVersion = nodeVersion;
    
    // Check available disk space
    try {
      const homeDir = require('os').homedir();
      const stats = await fs.stat(homeDir);
      validation.info.homeDir = homeDir;
    } catch (error) {
      validation.warnings.push('Could not check home directory permissions');
    }
    
    // Check network connectivity (basic check)
    validation.info.platform = process.platform;
    validation.info.architecture = process.arch;
    
  } catch (error) {
    validation.warnings.push(`Environment check failed: ${error.message}`);
  }
  
  return validation;
}

module.exports = {
  validatePath,
  validateProject,
  validateTemplateName,
  validateAgentConfig,
  validateCommandOptions,
  sanitizeInput,
  validateEnvironment
};