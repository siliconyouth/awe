/**
 * AWE CLI - Main Module
 * 
 * Core module that exports the main functionality for programmatic use.
 * This allows the AWE CLI to be used as a library in addition to CLI usage.
 */

const ProjectAnalyzer = require('./core/analyzer');
const TemplateRecommender = require('./core/recommender');
const CodeGenerator = require('./core/generator');
const Database = require('./core/database');
const IntelligentScraper = require('./core/scraper');
const { logger } = require('./utils/logger');

class AWE {
  constructor(options = {}) {
    this.options = {
      quiet: false,
      debug: false,
      dataDir: options.dataDir || process.env.AWE_DATA_DIR || `${require('os').homedir()}/.awe`,
      ...options
    };

    this.analyzer = new ProjectAnalyzer(this.options);
    this.recommender = new TemplateRecommender(this.options);
    this.generator = new CodeGenerator(this.options);
    this.database = new Database(this.options);
    this.scraper = new IntelligentScraper(this.options);

    if (this.options.debug) {
      logger.level = 'debug';
    }
    if (this.options.quiet) {
      logger.level = 'error';
    }
  }

  /**
   * Initialize AWE for a project
   * @param {string} projectPath - Path to the project
   * @param {Object} options - Initialization options
   */
  async initialize(projectPath = process.cwd(), options = {}) {
    logger.info('Initializing AWE for project:', projectPath);
    
    try {
      // Analyze project structure
      const analysis = await this.analyzer.analyzeProject(projectPath);
      
      // Get template recommendations
      const recommendations = await this.recommender.recommend(analysis);
      
      // Generate configuration
      const config = await this.generator.generateConfig(analysis, recommendations, options);
      
      return {
        analysis,
        recommendations,
        config,
        success: true
      };
    } catch (error) {
      logger.error('Failed to initialize AWE:', error.message);
      return {
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Analyze a project for optimization opportunities
   * @param {string} projectPath - Path to the project
   */
  async analyze(projectPath = process.cwd()) {
    logger.info('Analyzing project:', projectPath);
    
    try {
      const analysis = await this.analyzer.analyzeProject(projectPath);
      const optimizations = await this.analyzer.findOptimizations(analysis);
      
      return {
        analysis,
        optimizations,
        success: true
      };
    } catch (error) {
      logger.error('Failed to analyze project:', error.message);
      return {
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Get recommendations for a project
   * @param {string} projectPath - Path to the project
   * @param {Object} context - Additional context for recommendations
   */
  async recommend(projectPath = process.cwd(), context = {}) {
    logger.info('Getting recommendations for project:', projectPath);
    
    try {
      const analysis = await this.analyzer.analyzeProject(projectPath);
      const recommendations = await this.recommender.recommend(analysis, context);
      
      return {
        recommendations,
        success: true
      };
    } catch (error) {
      logger.error('Failed to get recommendations:', error.message);
      return {
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Generate project scaffold
   * @param {string} pattern - Pattern to use for scaffolding
   * @param {string} targetPath - Target path for generation
   * @param {Object} options - Generation options
   */
  async scaffold(pattern, targetPath = process.cwd(), options = {}) {
    logger.info('Scaffolding project with pattern:', pattern);
    
    try {
      const result = await this.generator.scaffold(pattern, targetPath, options);
      
      return {
        result,
        success: true
      };
    } catch (error) {
      logger.error('Failed to scaffold project:', error.message);
      return {
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Sync knowledge base with latest patterns
   */
  async sync() {
    logger.info('Syncing knowledge base...');
    
    try {
      const result = await this.database.sync();
      
      return {
        result,
        success: true
      };
    } catch (error) {
      logger.error('Failed to sync knowledge base:', error.message);
      return {
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Learn from user interactions
   * @param {Object} interaction - Interaction data
   */
  async learn(interaction) {
    logger.debug('Learning from interaction:', interaction);
    
    try {
      const result = await this.database.recordInteraction(interaction);
      
      return {
        result,
        success: true
      };
    } catch (error) {
      logger.error('Failed to record learning data:', error.message);
      return {
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Optimize project configuration
   * @param {string} projectPath - Path to the project
   * @param {Object} options - Optimization options
   */
  async optimize(projectPath = process.cwd(), options = {}) {
    logger.info('Optimizing project:', projectPath);
    
    try {
      const analysis = await this.analyzer.analyzeProject(projectPath);
      const optimizations = await this.analyzer.findOptimizations(analysis);
      
      let appliedOptimizations = [];
      if (options.apply) {
        appliedOptimizations = await this.generator.applyOptimizations(
          projectPath, 
          optimizations, 
          options
        );
      }
      
      return {
        analysis,
        optimizations,
        applied: appliedOptimizations,
        success: true
      };
    } catch (error) {
      logger.error('Failed to optimize project:', error.message);
      return {
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Scrape and gather patterns from various sources
   * @param {Array} sources - Sources to scrape from
   * @param {Object} options - Scraping options
   */
  async scrape(sources = null, options = {}) {
    logger.info('Starting intelligent scraping...');
    
    try {
      const results = await this.scraper.scrapeAll(sources);
      
      return {
        results,
        success: true
      };
    } catch (error) {
      logger.error('Failed to scrape patterns:', error.message);
      return {
        error: error.message,
        success: false
      };
    }
  }
}

module.exports = AWE;