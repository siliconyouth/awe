/**
 * Logger utility for AWE CLI
 * 
 * Provides structured logging with different levels and formatting
 */

const winston = require('winston');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');

// Ensure logs directory exists
const logsDir = path.join(process.env.AWE_DATA_DIR || `${require('os').homedir()}/.awe`, 'logs');
fs.ensureDirSync(logsDir);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    
    switch (level) {
      case 'error':
        return `${chalk.gray(timestamp)} ${chalk.red('✖')} ${chalk.red(message)}${metaStr}`;
      case 'warn':
        return `${chalk.gray(timestamp)} ${chalk.yellow('⚠')} ${chalk.yellow(message)}${metaStr}`;
      case 'info':
        return `${chalk.gray(timestamp)} ${chalk.blue('ℹ')} ${message}${metaStr}`;
      case 'debug':
        return `${chalk.gray(timestamp)} ${chalk.gray('◦')} ${chalk.gray(message)}${metaStr}`;
      default:
        return `${chalk.gray(timestamp)} ${message}${metaStr}`;
    }
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: consoleFormat,
      level: 'info'
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'awe.log'),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Separate file for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3
    })
  ]
});

// Add stream interface for libraries that expect it
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = { logger };