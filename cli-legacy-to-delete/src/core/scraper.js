const axios = require('axios');
const cheerio = require('cheerio');
const { getDatabase } = require('./database');
const logger = require('../utils/logger');

/**
 * Intelligent scraping pipeline for gathering Claude Code best practices,
 * templates, and patterns from various sources
 */
class IntelligentScraper {
  constructor() {
    this.db = getDatabase();
    this.rateLimiter = new Map(); // Simple rate limiting
    this.userAgent = 'AWE-Claude-Companion/1.0.0 (Educational/Research Purpose)';
  }

  /**
   * Main scraping orchestrator
   */
  async scrapeAll(sources = null) {
    const defaultSources = [
      'claude-docs',
      'github-patterns',
      'community-templates',
      'best-practices'
    ];

    const sourcesToScrape = sources || defaultSources;
    
    logger.info(`Starting intelligent scraping for sources: ${sourcesToScrape.join(', ')}`);
    
    const results = {};
    
    for (const source of sourcesToScrape) {
      try {
        await this.respectRateLimit(source);
        results[source] = await this.scrapeSource(source);
        logger.info(`✓ Completed scraping ${source}`);
      } catch (error) {
        logger.error(`✗ Failed to scrape ${source}:`, error.message);
        results[source] = { error: error.message };
      }
    }

    return results;
  }

  /**
   * Scrape specific source based on type
   */
  async scrapeSource(sourceType) {
    const scrapers = {
      'claude-docs': () => this.scrapeClaudeDocs(),
      'github-patterns': () => this.scrapeGitHubPatterns(),
      'community-templates': () => this.scrapeCommunityTemplates(),
      'best-practices': () => this.scrapeBestPractices()
    };

    const scraper = scrapers[sourceType];
    if (!scraper) {
      throw new Error(`Unknown source type: ${sourceType}`);
    }

    return await scraper();
  }

  /**
   * Scrape Claude documentation for best practices
   */
  async scrapeClaudeDocs() {
    const sources = [
      'https://docs.anthropic.com/en/docs/claude-code',
      'https://docs.anthropic.com/en/docs/claude-code/quickstart',
      'https://docs.anthropic.com/en/docs/claude-code/common-workflows'
    ];

    const patterns = [];
    
    for (const url of sources) {
      try {
        const content = await this.fetchWithRetry(url);
        const extracted = this.extractClaudePatterns(content, url);
        patterns.push(...extracted);
      } catch (error) {
        logger.warn(`Failed to scrape ${url}:`, error.message);
      }
    }

    await this.storePatterns(patterns, 'claude-docs');
    return { patterns: patterns.length, source: 'claude-docs' };
  }

  /**
   * Scrape GitHub for CLAUDE.md patterns and templates
   */
  async scrapeGitHubPatterns() {
    // Search for repositories with CLAUDE.md files
    const searchQueries = [
      'filename:CLAUDE.md',
      'filename:.claude.md',
      '"CLAUDE.md" in:file',
      'path:CLAUDE.md'
    ];

    const patterns = [];

    for (const query of searchQueries) {
      try {
        const repos = await this.searchGitHub(query);
        const repoPatterns = await this.extractGitHubPatterns(repos);
        patterns.push(...repoPatterns);
      } catch (error) {
        logger.warn(`GitHub search failed for query "${query}":`, error.message);
      }
    }

    await this.storePatterns(patterns, 'github-patterns');
    return { patterns: patterns.length, source: 'github-patterns' };
  }

  /**
   * Scrape community templates and configurations
   */
  async scrapeCommunityTemplates() {
    const sources = [
      {
        type: 'reddit',
        url: 'https://www.reddit.com/r/ClaudeAI/search.json?q=CLAUDE.md&sort=top&limit=50',
        parser: 'parseRedditTemplates'
      },
      {
        type: 'discord',
        url: 'https://discord.com/api/guilds/anthropic/search?content=CLAUDE.md',
        parser: 'parseDiscordTemplates'
      }
    ];

    const templates = [];

    for (const source of sources) {
      try {
        const content = await this.fetchWithRetry(source.url);
        const parsed = await this[source.parser](content);
        templates.push(...parsed);
      } catch (error) {
        logger.warn(`Failed to scrape ${source.type}:`, error.message);
      }
    }

    await this.storeTemplates(templates, 'community');
    return { templates: templates.length, source: 'community-templates' };
  }

  /**
   * Scrape best practices from various sources
   */
  async scrapeBestPractices() {
    const sources = [
      'https://github.com/anthropics/claude-code/wiki',
      'https://stackoverflow.com/questions/tagged/claude-code',
      'https://dev.to/search?q=claude%20code'
    ];

    const practices = [];

    for (const url of sources) {
      try {
        const content = await this.fetchWithRetry(url);
        const extracted = this.extractBestPractices(content, url);
        practices.push(...extracted);
      } catch (error) {
        logger.warn(`Failed to scrape best practices from ${url}:`, error.message);
      }
    }

    await this.storeBestPractices(practices);
    return { practices: practices.length, source: 'best-practices' };
  }

  /**
   * Extract Claude-specific patterns from documentation
   */
  extractClaudePatterns(html, sourceUrl) {
    const $ = cheerio.load(html);
    const patterns = [];

    // Extract code blocks with CLAUDE.md content
    $('pre code, .highlight code').each((i, elem) => {
      const code = $(elem).text();
      if (this.isClaudePattern(code)) {
        patterns.push({
          type: 'claude-pattern',
          content: code,
          source: sourceUrl,
          extracted_at: new Date().toISOString(),
          category: this.categorizePattern(code)
        });
      }
    });

    // Extract best practice recommendations
    $('h2, h3').each((i, elem) => {
      const heading = $(elem).text();
      const content = $(elem).nextUntil('h2, h3').text();
      
      if (this.isBestPracticeHeading(heading)) {
        patterns.push({
          type: 'best-practice',
          title: heading,
          content: content,
          source: sourceUrl,
          extracted_at: new Date().toISOString()
        });
      }
    });

    return patterns;
  }

  /**
   * Search GitHub for repositories with CLAUDE.md files
   */
  async searchGitHub(query) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=20`;
    
    try {
      const response = await this.fetchWithRetry(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': this.userAgent
        }
      });

      const data = JSON.parse(response);
      return data.items || [];
    } catch (error) {
      logger.error('GitHub search failed:', error.message);
      return [];
    }
  }

  /**
   * Extract patterns from GitHub repositories
   */
  async extractGitHubPatterns(repos) {
    const patterns = [];

    for (const repo of repos.slice(0, 10)) { // Limit to top 10 repos
      try {
        const claudeFile = await this.fetchGitHubFile(repo, 'CLAUDE.md');
        if (claudeFile) {
          patterns.push({
            type: 'github-template',
            content: claudeFile,
            source: repo.html_url,
            repository: repo.full_name,
            stars: repo.stargazers_count,
            language: repo.language,
            extracted_at: new Date().toISOString(),
            category: this.categorizeByLanguage(repo.language)
          });
        }
      } catch (error) {
        logger.warn(`Failed to extract from ${repo.full_name}:`, error.message);
      }
    }

    return patterns;
  }

  /**
   * Fetch CLAUDE.md file from a GitHub repository
   */
  async fetchGitHubFile(repo, filename) {
    const url = `https://api.github.com/repos/${repo.full_name}/contents/${filename}`;
    
    try {
      const response = await this.fetchWithRetry(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': this.userAgent
        }
      });

      const data = JSON.parse(response);
      if (data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
    } catch (error) {
      // File not found or other error
      return null;
    }

    return null;
  }

  /**
   * Parse Reddit templates and discussions
   */
  async parseRedditTemplates(jsonContent) {
    const data = JSON.parse(jsonContent);
    const templates = [];

    if (data.data && data.data.children) {
      for (const post of data.data.children) {
        const postData = post.data;
        if (this.containsClaudeTemplate(postData.selftext || postData.title)) {
          templates.push({
            type: 'reddit-template',
            title: postData.title,
            content: postData.selftext,
            source: `https://reddit.com${postData.permalink}`,
            score: postData.score,
            extracted_at: new Date().toISOString()
          });
        }
      }
    }

    return templates;
  }

  /**
   * Parse Discord templates (placeholder - Discord API requires special permissions)
   */
  async parseDiscordTemplates(content) {
    // Note: Real Discord scraping would require bot permissions and special handling
    logger.info('Discord scraping not implemented - requires special API access');
    return [];
  }

  /**
   * Extract best practices from various sources
   */
  extractBestPractices(html, sourceUrl) {
    const $ = cheerio.load(html);
    const practices = [];

    // Look for specific patterns that indicate best practices
    $('li, p').each((i, elem) => {
      const text = $(elem).text().trim();
      if (this.isBestPracticeText(text)) {
        practices.push({
          type: 'best-practice',
          content: text,
          source: sourceUrl,
          extracted_at: new Date().toISOString(),
          category: this.categorizeBestPractice(text)
        });
      }
    });

    return practices;
  }

  /**
   * Store patterns in database
   */
  async storePatterns(patterns, source) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO patterns 
      (id, type, content, source, category, metadata, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const pattern of patterns) {
      const id = this.generatePatternId(pattern);
      stmt.run(
        id,
        pattern.type,
        pattern.content,
        pattern.source,
        pattern.category || 'general',
        JSON.stringify(pattern),
        pattern.extracted_at
      );
    }

    logger.info(`Stored ${patterns.length} patterns from ${source}`);
  }

  /**
   * Store templates in database
   */
  async storeTemplates(templates, source) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO templates 
      (id, name, category, content, source, metadata, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const template of templates) {
      const id = this.generateTemplateId(template);
      stmt.run(
        id,
        template.title || 'Community Template',
        template.category || 'community',
        template.content,
        template.source,
        JSON.stringify(template),
        template.extracted_at
      );
    }

    logger.info(`Stored ${templates.length} templates from ${source}`);
  }

  /**
   * Store best practices in database
   */
  async storeBestPractices(practices) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO best_practices 
      (id, title, content, source, category, created_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const practice of practices) {
      const id = this.generatePracticeId(practice);
      stmt.run(
        id,
        practice.title || practice.content.substring(0, 50),
        practice.content,
        practice.source,
        practice.category || 'general',
        practice.extracted_at
      );
    }

    logger.info(`Stored ${practices.length} best practices`);
  }

  /**
   * Utility methods
   */
  
  async fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          ...options,
          timeout: 10000,
          headers: {
            'User-Agent': this.userAgent,
            ...options.headers
          }
        });
        return response.data;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        await this.delay(1000 * attempt); // Exponential backoff
      }
    }
  }

  async respectRateLimit(source) {
    const lastRequest = this.rateLimiter.get(source);
    const now = Date.now();
    const minInterval = 2000; // 2 seconds between requests

    if (lastRequest && (now - lastRequest) < minInterval) {
      const waitTime = minInterval - (now - lastRequest);
      await this.delay(waitTime);
    }

    this.rateLimiter.set(source, Date.now());
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isClaudePattern(text) {
    const claudeIndicators = [
      'CLAUDE.md',
      '## Instructions',
      '## Context',
      '## Guidelines',
      'claude code',
      'anthropic'
    ];
    
    return claudeIndicators.some(indicator => 
      text.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  categorizePattern(content) {
    if (content.includes('React') || content.includes('frontend')) return 'frontend';
    if (content.includes('API') || content.includes('backend')) return 'backend';
    if (content.includes('test') || content.includes('testing')) return 'testing';
    if (content.includes('deploy') || content.includes('devops')) return 'devops';
    return 'general';
  }

  categorizeByLanguage(language) {
    const languageMap = {
      'JavaScript': 'frontend',
      'TypeScript': 'frontend',
      'Python': 'backend',
      'Java': 'backend',
      'Go': 'backend',
      'Rust': 'systems',
      'C++': 'systems'
    };
    
    return languageMap[language] || 'general';
  }

  isBestPracticeHeading(heading) {
    const practiceIndicators = [
      'best practice',
      'guidelines',
      'recommendations',
      'tips',
      'patterns',
      'conventions'
    ];
    
    return practiceIndicators.some(indicator =>
      heading.toLowerCase().includes(indicator)
    );
  }

  containsClaudeTemplate(text) {
    return text && (
      text.includes('CLAUDE.md') ||
      text.includes('claude code') ||
      text.includes('## Instructions') ||
      text.includes('## Context')
    );
  }

  isBestPracticeText(text) {
    const indicators = [
      'should always',
      'must never',
      'recommended',
      'best practice',
      'avoid',
      'use instead',
      'prefer'
    ];
    
    return text.length > 20 && text.length < 500 &&
           indicators.some(indicator => text.toLowerCase().includes(indicator));
  }

  categorizeBestPractice(text) {
    if (text.toLowerCase().includes('security')) return 'security';
    if (text.toLowerCase().includes('performance')) return 'performance';
    if (text.toLowerCase().includes('test')) return 'testing';
    if (text.toLowerCase().includes('code')) return 'coding';
    return 'general';
  }

  generatePatternId(pattern) {
    const crypto = require('crypto');
    return crypto.createHash('md5')
      .update(pattern.content + pattern.source)
      .digest('hex');
  }

  generateTemplateId(template) {
    const crypto = require('crypto');
    return crypto.createHash('md5')
      .update(template.content + template.source)
      .digest('hex');
  }

  generatePracticeId(practice) {
    const crypto = require('crypto');
    return crypto.createHash('md5')
      .update(practice.content + practice.source)
      .digest('hex');
  }
}

module.exports = IntelligentScraper;