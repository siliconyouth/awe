/**
 * Template Recommender - AI-powered recommendation engine
 * 
 * Provides intelligent template recommendations based on:
 * - Project analysis and characteristics
 * - Similarity matching with existing projects
 * - User preferences and historical data
 * - Community usage patterns
 */

const { getDatabase } = require('./database');
const { logger } = require('../utils/logger');

class TemplateRecommender {
  constructor(options = {}) {
    this.options = options;
    this.cache = new Map();
  }

  /**
   * Get template recommendations for a project
   * @param {Object} analysis - Project analysis results
   * @param {Object} context - Additional context
   * @returns {Array} Ranked recommendations
   */
  async recommend(analysis, context = {}) {
    logger.info('Generating template recommendations for:', analysis.classification.type);

    try {
      const db = getDatabase();
      
      // Get all available templates
      const templates = db.getTemplates();
      
      if (templates.length === 0) {
        logger.warn('No templates available for recommendations');
        return [];
      }

      // Score each template for this project
      const scoredTemplates = [];
      
      for (const template of templates) {
        const score = await this.scoreTemplate(template, analysis, context);
        if (score > 0) {
          scoredTemplates.push({
            ...template,
            score,
            reasoning: this.generateReasoning(template, analysis, score)
          });
        }
      }

      // Sort by score (highest first)
      scoredTemplates.sort((a, b) => b.score - a.score);

      // Add ranking and confidence
      const recommendations = scoredTemplates.slice(0, 5).map((template, index) => ({
        ...template,
        rank: index + 1,
        confidence: this.calculateConfidence(template.score, scoredTemplates)
      }));

      logger.debug('Generated recommendations:', {
        count: recommendations.length,
        topScore: recommendations[0]?.score || 0
      });

      return recommendations;
    } catch (error) {
      logger.error('Failed to generate recommendations:', error.message);
      return [];
    }
  }

  /**
   * Score a template against project analysis
   * @param {Object} template - Template to score
   * @param {Object} analysis - Project analysis
   * @param {Object} context - Additional context
   * @returns {number} Score (0-100)
   */
  async scoreTemplate(template, analysis, context) {
    let score = 0;
    const weights = {
      category: 30,
      language: 25,
      framework: 20,
      patterns: 15,
      usage: 10
    };

    try {
      // Category matching
      score += this.scoreCategoryMatch(template, analysis) * weights.category / 100;

      // Language matching
      score += this.scoreLanguageMatch(template, analysis) * weights.language / 100;

      // Framework matching
      score += this.scoreFrameworkMatch(template, analysis) * weights.framework / 100;

      // Pattern matching
      score += this.scorePatternMatch(template, analysis) * weights.patterns / 100;

      // Usage and community score
      score += this.scoreUsagePopularity(template) * weights.usage / 100;

      // Apply context modifiers
      score = this.applyContextModifiers(score, template, context);

      return Math.min(Math.max(score, 0), 100);
    } catch (error) {
      logger.error('Failed to score template:', error.message);
      return 0;
    }
  }

  /**
   * Score category matching
   */
  scoreCategoryMatch(template, analysis) {
    const projectType = analysis.classification.type;
    const templateCategory = template.category;

    // Direct category matches
    const categoryMap = {
      'web-app': ['web', 'frontend', 'react', 'vue', 'angular'],
      'full-stack': ['web', 'fullstack', 'react', 'vue', 'node'],
      'backend-service': ['backend', 'api', 'service', 'node', 'express'],
      'cli-tool': ['cli', 'tool', 'node', 'general'],
      'library': ['library', 'package', 'general'],
      'data-science': ['data-science', 'python', 'ml', 'jupyter'],
      'mobile-app': ['mobile', 'react-native', 'flutter'],
      'desktop-app': ['desktop', 'electron', 'tauri']
    };

    const matchingCategories = categoryMap[projectType] || ['general'];
    
    if (matchingCategories.includes(templateCategory)) {
      // Exact match gets highest score
      if (templateCategory === projectType) return 100;
      // Category group match gets good score
      return 80;
    }

    // General template is always a fallback option
    if (templateCategory === 'general') return 40;

    return 0;
  }

  /**
   * Score language matching
   */
  scoreLanguageMatch(template, analysis) {
    const primaryLanguage = analysis.languages.primary?.toLowerCase();
    if (!primaryLanguage) return 50; // Neutral score if no language detected

    // Extract language hints from template content and metadata
    const templateContent = template.content.toLowerCase();
    const templateName = template.name.toLowerCase();
    
    const languageKeywords = {
      'javascript': ['javascript', 'js', 'node', 'npm', 'react', 'vue', 'angular'],
      'typescript': ['typescript', 'ts', 'tsx', 'type'],
      'python': ['python', 'py', 'pip', 'django', 'flask', 'jupyter'],
      'rust': ['rust', 'cargo', 'rs'],
      'go': ['golang', 'go', 'mod'],
      'java': ['java', 'maven', 'gradle'],
      'c++': ['cpp', 'c++', 'cmake'],
      'c#': ['csharp', 'c#', 'dotnet'],
      'php': ['php', 'composer'],
      'ruby': ['ruby', 'gem', 'rails']
    };

    const keywords = languageKeywords[primaryLanguage] || [primaryLanguage];
    
    for (const keyword of keywords) {
      if (templateContent.includes(keyword) || templateName.includes(keyword)) {
        return 100; // Strong language match
      }
    }

    // Check for language families (e.g., JS/TS compatibility)
    const languageFamilies = {
      'javascript': ['typescript'],
      'typescript': ['javascript'],
      'c': ['c++'],
      'c++': ['c']
    };

    const familyLanguages = languageFamilies[primaryLanguage] || [];
    for (const familyLang of familyLanguages) {
      const familyKeywords = languageKeywords[familyLang] || [familyLang];
      for (const keyword of familyKeywords) {
        if (templateContent.includes(keyword) || templateName.includes(keyword)) {
          return 70; // Family language match
        }
      }
    }

    return 20; // No clear language match
  }

  /**
   * Score framework matching
   */
  scoreFrameworkMatch(template, analysis) {
    const detectedFrameworks = [
      ...analysis.frameworks.frontend,
      ...analysis.frameworks.backend,
      ...analysis.frameworks.detected
    ].map(f => f.toLowerCase());

    if (detectedFrameworks.length === 0) return 50; // Neutral if no frameworks

    const templateContent = template.content.toLowerCase();
    const templateName = template.name.toLowerCase();

    let bestMatch = 0;

    for (const framework of detectedFrameworks) {
      if (templateContent.includes(framework) || templateName.includes(framework)) {
        bestMatch = Math.max(bestMatch, 100); // Direct framework match
      }
    }

    // Check for framework families
    const frameworkFamilies = {
      'react': ['next.js', 'gatsby'],
      'vue': ['nuxt.js'],
      'express': ['fastify', 'koa'],
      'django': ['flask'],
      'rails': ['sinatra']
    };

    for (const framework of detectedFrameworks) {
      const relatedFrameworks = frameworkFamilies[framework] || [];
      for (const related of relatedFrameworks) {
        if (templateContent.includes(related) || templateName.includes(related)) {
          bestMatch = Math.max(bestMatch, 80); // Related framework match
        }
      }
    }

    return bestMatch;
  }

  /**
   * Score pattern matching
   */
  scorePatternMatch(template, analysis) {
    const projectPatterns = analysis.patterns.architecture;
    if (projectPatterns.length === 0) return 50;

    const templateContent = template.content.toLowerCase();
    let score = 0;

    const patternKeywords = {
      'mvc': ['mvc', 'model', 'view', 'controller'],
      'component-based': ['component', 'jsx', 'vue', 'react'],
      'microservices': ['microservice', 'service', 'api'],
      'monolithic': ['monolith', 'single'],
      'repository pattern': ['repository', 'dao', 'data access']
    };

    for (const pattern of projectPatterns) {
      const keywords = patternKeywords[pattern.toLowerCase()] || [pattern.toLowerCase()];
      for (const keyword of keywords) {
        if (templateContent.includes(keyword)) {
          score += 20;
          break;
        }
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Score based on usage and popularity
   */
  scoreUsagePopularity(template) {
    const usageCount = template.usage_count || 0;
    const rating = template.rating || 0;

    // Normalize usage count (assuming max useful count is 1000)
    const usageScore = Math.min(usageCount / 10, 50);
    
    // Rating score (0-5 scale to 0-50)
    const ratingScore = (rating / 5) * 50;

    return usageScore + ratingScore;
  }

  /**
   * Apply context modifiers to the score
   */
  applyContextModifiers(score, template, context) {
    let modifiedScore = score;

    // User preference modifiers
    if (context.preferredCategories) {
      if (context.preferredCategories.includes(template.category)) {
        modifiedScore *= 1.2; // 20% boost for preferred categories
      }
    }

    // Complexity preference
    if (context.complexity) {
      const templateComplexity = this.estimateTemplateComplexity(template);
      if (context.complexity === templateComplexity) {
        modifiedScore *= 1.1; // 10% boost for matching complexity
      }
    }

    // Team size considerations
    if (context.teamSize) {
      if (context.teamSize === 'small' && template.category === 'general') {
        modifiedScore *= 1.1; // Boost simple templates for small teams
      }
      if (context.teamSize === 'large' && template.content.includes('enterprise')) {
        modifiedScore *= 1.2; // Boost enterprise templates for large teams
      }
    }

    return Math.min(modifiedScore, 100);
  }

  /**
   * Estimate template complexity
   */
  estimateTemplateComplexity(template) {
    const content = template.content.toLowerCase();
    const complexityIndicators = {
      'simple': ['basic', 'simple', 'minimal', 'starter'],
      'moderate': ['standard', 'complete', 'full'],
      'complex': ['advanced', 'enterprise', 'comprehensive', 'production']
    };

    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      for (const indicator of indicators) {
        if (content.includes(indicator)) {
          return level;
        }
      }
    }

    return 'moderate'; // Default
  }

  /**
   * Calculate confidence based on score distribution
   */
  calculateConfidence(score, allScores) {
    if (allScores.length === 0) return 0;

    const topScore = allScores[0]?.score || 0;
    const avgScore = allScores.reduce((sum, t) => sum + t.score, 0) / allScores.length;

    // High confidence if this score is significantly above average
    if (score > avgScore * 1.5) return 'high';
    if (score > avgScore * 1.2) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable reasoning for recommendation
   */
  generateReasoning(template, analysis, score) {
    const reasons = [];

    // Category reasoning
    if (template.category === analysis.classification.type) {
      reasons.push(`Perfect match for ${analysis.classification.type} projects`);
    } else if (template.category === 'general') {
      reasons.push('Versatile template that works for any project type');
    }

    // Language reasoning
    const primaryLanguage = analysis.languages.primary;
    if (primaryLanguage && template.content.toLowerCase().includes(primaryLanguage.toLowerCase())) {
      reasons.push(`Optimized for ${primaryLanguage} development`);
    }

    // Framework reasoning
    const frameworks = [...analysis.frameworks.detected];
    for (const framework of frameworks.slice(0, 2)) {
      if (template.content.toLowerCase().includes(framework.toLowerCase())) {
        reasons.push(`Includes ${framework} best practices`);
      }
    }

    // Popularity reasoning
    if (template.usage_count > 10) {
      reasons.push('Popular choice with proven track record');
    }

    if (template.rating > 4) {
      reasons.push('Highly rated by the community');
    }

    // Score-based reasoning
    if (score > 80) {
      reasons.push('Excellent match for your project characteristics');
    } else if (score > 60) {
      reasons.push('Good match with minor customization needed');
    } else if (score > 40) {
      reasons.push('Decent starting point with some adaptation required');
    }

    return reasons.length > 0 ? reasons.join('. ') + '.' : 'General purpose template.';
  }

  /**
   * Get similar projects for collaborative filtering
   */
  async getSimilarProjects(analysis) {
    try {
      const db = getDatabase();
      
      // Simple similarity based on type and language
      // In a real implementation, this would use vector similarity
      const similarProjects = db.db.prepare(`
        SELECT * FROM projects 
        WHERE type = ? OR language = ?
        ORDER BY created_at DESC
        LIMIT 10
      `).all(analysis.classification.type, analysis.languages.primary);

      return similarProjects;
    } catch (error) {
      logger.error('Failed to get similar projects:', error.message);
      return [];
    }
  }

  /**
   * Learn from user feedback
   */
  async recordFeedback(templateId, projectPath, rating, feedback) {
    try {
      const db = getDatabase();
      
      // Record the interaction
      db.recordInteraction({
        sessionId: `feedback-${Date.now()}`,
        projectPath,
        action: 'template_feedback',
        context: { templateId, rating },
        result: { feedback },
        success: true,
        feedbackScore: rating
      });

      // Update template rating (simple average for now)
      const template = db.getTemplate(templateId);
      if (template) {
        const newRating = ((template.rating * template.usage_count) + rating) / (template.usage_count + 1);
        
        db.db.prepare(`
          UPDATE templates 
          SET rating = ?, usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newRating, templateId);
      }

      logger.info('Recorded template feedback:', { templateId, rating });
    } catch (error) {
      logger.error('Failed to record feedback:', error.message);
    }
  }
}

module.exports = TemplateRecommender;