/**
 * Ultra-Fast API Client with Request Batching & Concurrency
 * 
 * Performance Features:
 * - Request batching for similar operations
 * - Intelligent concurrency management
 * - Connection pooling and keep-alive
 * - Automatic retry with exponential backoff
 * - Response compression
 * - Request deduplication
 */

const fetch = require('node-fetch');
const pRetry = require('p-retry');
const PQueue = require('p-queue').default;
const crypto = require('crypto');
const { Agent } = require('https');
const { getCache } = require('./cache');

class HighPerformanceAPIClient {
  constructor(options = {}) {
    this.options = {
      // Base configuration
      baseUrl: options.baseUrl || process.env.AWE_SUPABASE_URL || process.env.SUPABASE_URL,
      apiKey: options.apiKey || process.env.AWE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
      
      // Connection pooling
      maxSockets: options.maxSockets || 50,
      keepAlive: options.keepAlive !== false,
      keepAliveMsecs: options.keepAliveMsecs || 30000,
      
      // Concurrency management
      concurrency: options.concurrency || 15,
      intervalCap: options.intervalCap || 100,
      interval: options.interval || 1000,
      
      // Request batching
      batchSize: options.batchSize || 10,
      batchTimeout: options.batchTimeout || 50, // 50ms batching window
      enableBatching: options.enableBatching !== false,
      
      // Retry configuration
      retries: options.retries || 3,
      retryMinTimeout: options.retryMinTimeout || 1000,
      retryMaxTimeout: options.retryMaxTimeout || 5000,
      retryFactor: options.retryFactor || 2,
      
      // Performance
      timeout: options.timeout || 30000,
      compression: options.compression !== false,
      
      // Caching
      cacheResponses: options.cacheResponses !== false,
      cacheTTL: options.cacheTTL || 300000, // 5 minutes
      
      ...options
    };

    // HTTP Agent with connection pooling
    this.agent = new Agent({
      keepAlive: this.options.keepAlive,
      keepAliveMsecs: this.options.keepAliveMsecs,
      maxSockets: this.options.maxSockets,
      maxFreeSockets: 10,
      timeout: this.options.timeout
    });

    // Request queue for concurrency control
    this.requestQueue = new PQueue({
      concurrency: this.options.concurrency,
      interval: this.options.interval,
      intervalCap: this.options.intervalCap
    });

    // Request batching
    this.batchQueues = new Map(); // endpoint -> batch queue
    this.batchTimers = new Map(); // endpoint -> timer
    
    // Request deduplication
    this.activeRequests = new Map(); // request hash -> promise
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      batchedRequests: 0,
      deduplicatedRequests: 0,
      avgResponseTime: 0,
      activeConnections: 0,
      queueSize: 0
    };

    this.cache = null;
  }

  /**
   * Initialize the API client
   */
  async initialize() {
    try {
      // Get cache instance
      this.cache = getCache();
      
      console.log('🚀 High-performance API client initialized');
    } catch (error) {
      console.warn('⚠️  API client cache not available, operating without cache');
    }
  }

  /**
   * Make API request with all optimizations
   */
  async request(endpoint, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const {
        method = 'GET',
        data = null,
        params = {},
        headers = {},
        cache = this.options.cacheResponses,
        batch = this.options.enableBatching,
        priority = 0,
        timeout = this.options.timeout,
        ...requestOptions
      } = options;

      // Build full request configuration
      const requestConfig = {
        endpoint,
        method: method.toUpperCase(),
        data,
        params,
        headers: this.buildHeaders(headers),
        timeout,
        ...requestOptions
      };

      // Try cache first for GET requests
      if (cache && method.toUpperCase() === 'GET') {
        const cacheKey = this.generateCacheKey(requestConfig);
        const cached = await this.getCachedResponse(cacheKey);
        if (cached) {
          this.metrics.cacheHits++;
          this.updateResponseTime(startTime);
          return cached;
        }
      }

      // Check for request deduplication
      const requestHash = this.generateRequestHash(requestConfig);
      if (this.activeRequests.has(requestHash)) {
        this.metrics.deduplicatedRequests++;
        return await this.activeRequests.get(requestHash);
      }

      // Create request promise
      const requestPromise = this.executeRequest(requestConfig, batch, priority);
      
      // Store for deduplication
      this.activeRequests.set(requestHash, requestPromise);

      try {
        const result = await requestPromise;
        
        // Cache successful GET responses
        if (cache && method.toUpperCase() === 'GET' && result) {
          const cacheKey = this.generateCacheKey(requestConfig);
          await this.cacheResponse(cacheKey, result);
        }

        this.metrics.successfulRequests++;
        return result;

      } finally {
        // Remove from active requests
        this.activeRequests.delete(requestHash);
        this.updateResponseTime(startTime);
      }

    } catch (error) {
      this.metrics.failedRequests++;
      this.updateResponseTime(startTime);
      throw error;
    }
  }

  /**
   * Execute request with batching and queue management
   */
  async executeRequest(requestConfig, enableBatching, priority) {
    // Check if request can be batched
    if (enableBatching && this.canBatch(requestConfig)) {
      return this.addToBatch(requestConfig);
    }

    // Execute individual request through queue
    return this.requestQueue.add(
      () => this.executeHttpRequest(requestConfig),
      { priority }
    );
  }

  /**
   * Execute HTTP request with retry logic
   */
  async executeHttpRequest(requestConfig) {
    return pRetry(async () => {
      const { endpoint, method, data, params, headers, timeout } = requestConfig;
      
      // Build URL
      const url = this.buildUrl(endpoint, params);
      
      // Build fetch options
      const fetchOptions = {
        method,
        headers,
        agent: this.agent,
        timeout,
        compress: this.options.compression
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
      }

      this.metrics.activeConnections++;

      try {
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.response = response;
          throw error;
        }

        // Parse response based on content type
        const contentType = response.headers.get('content-type') || '';
        let result;

        if (contentType.includes('application/json')) {
          result = await response.json();
        } else {
          result = await response.text();
        }

        return result;

      } finally {
        this.metrics.activeConnections--;
      }

    }, {
      retries: this.options.retries,
      minTimeout: this.options.retryMinTimeout,
      maxTimeout: this.options.retryMaxTimeout,
      factor: this.options.retryFactor,
      onFailedAttempt: (error) => {
        console.warn(`⚠️  Request attempt ${error.attemptNumber} failed: ${error.message}`);
      }
    });
  }

  /**
   * Check if request can be batched
   */
  canBatch(requestConfig) {
    const { method, endpoint } = requestConfig;
    
    // Only batch safe operations
    return method === 'GET' && 
           (endpoint.includes('/select') || endpoint.includes('/search'));
  }

  /**
   * Add request to batch queue
   */
  async addToBatch(requestConfig) {
    const batchKey = this.getBatchKey(requestConfig);
    
    if (!this.batchQueues.has(batchKey)) {
      this.batchQueues.set(batchKey, []);
    }

    const batchQueue = this.batchQueues.get(batchKey);
    
    return new Promise((resolve, reject) => {
      batchQueue.push({ requestConfig, resolve, reject });
      
      // Set timer to flush batch if not already set
      if (!this.batchTimers.has(batchKey)) {
        const timer = setTimeout(() => {
          this.flushBatch(batchKey);
        }, this.options.batchTimeout);
        
        this.batchTimers.set(batchKey, timer);
      }

      // Flush immediately if batch is full
      if (batchQueue.length >= this.options.batchSize) {
        this.flushBatch(batchKey);
      }
    });
  }

  /**
   * Flush batch requests
   */
  async flushBatch(batchKey) {
    const batchQueue = this.batchQueues.get(batchKey);
    const timer = this.batchTimers.get(batchKey);

    if (!batchQueue || batchQueue.length === 0) return;

    // Clear timer and queue
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }
    this.batchQueues.delete(batchKey);

    this.metrics.batchedRequests += batchQueue.length;

    try {
      // Execute batch request
      const batchResult = await this.executeBatchRequest(batchQueue);
      
      // Resolve individual promises
      batchQueue.forEach((item, index) => {
        item.resolve(batchResult[index]);
      });

    } catch (error) {
      // Reject all promises
      batchQueue.forEach(item => {
        item.reject(error);
      });
    }
  }

  /**
   * Execute batch request (simplified implementation)
   */
  async executeBatchRequest(batchQueue) {
    // For now, execute requests individually but concurrently
    // Real batching would combine multiple queries into one request
    const promises = batchQueue.map(item => 
      this.executeHttpRequest(item.requestConfig)
    );
    
    return Promise.all(promises);
  }

  /**
   * Get batch key for grouping similar requests
   */
  getBatchKey(requestConfig) {
    const { endpoint, method } = requestConfig;
    return `${method}:${endpoint.split('?')[0]}`;
  }

  /**
   * Build request headers
   */
  buildHeaders(customHeaders = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'apikey': this.options.apiKey,
      'Authorization': `Bearer ${this.options.apiKey}`,
      'Accept': 'application/json',
      'x-client-info': 'awe-cli/1.0.0'
    };

    if (this.options.compression) {
      defaultHeaders['Accept-Encoding'] = 'gzip, deflate';
    }

    return { ...defaultHeaders, ...customHeaders };
  }

  /**
   * Build URL with query parameters
   */
  buildUrl(endpoint, params = {}) {
    const baseUrl = this.options.baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    const url = new URL(`${baseUrl}${cleanEndpoint}`);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    
    return url.toString();
  }

  /**
   * Generate cache key for request
   */
  generateCacheKey(requestConfig) {
    const keyData = {
      endpoint: requestConfig.endpoint,
      method: requestConfig.method,
      params: requestConfig.params,
      data: requestConfig.data
    };
    
    return crypto
      .createHash('md5')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  /**
   * Generate request hash for deduplication
   */
  generateRequestHash(requestConfig) {
    return this.generateCacheKey(requestConfig);
  }

  /**
   * Get cached response
   */
  async getCachedResponse(cacheKey) {
    if (!this.cache) return null;
    
    try {
      return await this.cache.get(cacheKey, 'api-responses');
    } catch (error) {
      console.warn('⚠️  Cache get failed:', error.message);
      return null;
    }
  }

  /**
   * Cache response
   */
  async cacheResponse(cacheKey, response) {
    if (!this.cache) return;
    
    try {
      await this.cache.set(cacheKey, response, {
        namespace: 'api-responses',
        ttl: this.options.cacheTTL,
        persist: true
      });
    } catch (error) {
      console.warn('⚠️  Cache set failed:', error.message);
    }
  }

  /**
   * Update response time metrics
   */
  updateResponseTime(startTime) {
    const responseTime = Date.now() - startTime;
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime + responseTime) / 2;
    this.metrics.queueSize = this.requestQueue.size;
  }

  /**
   * Convenience methods for common operations
   */
  async get(endpoint, params = {}, options = {}) {
    return this.request(endpoint, { 
      method: 'GET', 
      params, 
      ...options 
    });
  }

  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { 
      method: 'POST', 
      data, 
      cache: false,
      ...options 
    });
  }

  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { 
      method: 'PUT', 
      data, 
      cache: false,
      ...options 
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { 
      method: 'DELETE', 
      cache: false,
      ...options 
    });
  }

  /**
   * Specialized methods for AWE operations
   */
  async searchTemplates(query, options = {}) {
    return this.get('/rest/v1/rpc/search_similar_templates', {
      query_text: query,
      match_threshold: options.threshold || 0.7,
      match_count: options.limit || 10
    }, { priority: 1 });
  }

  async analyzeProject(projectData, analysisType = 'quick') {
    return this.post('/functions/v1/ai-analysis', {
      projectContext: projectData,
      analysisType
    }, { 
      priority: 2,
      timeout: 60000, // Longer timeout for AI operations
      cache: true,
      cacheTTL: 1800000 // 30 minutes for analysis
    });
  }

  async generateTemplate(description, options = {}) {
    return this.post('/functions/v1/template-generator', {
      description,
      ...options
    }, { 
      priority: 2,
      timeout: 60000,
      cache: true,
      cacheTTL: 3600000 // 1 hour for templates
    });
  }

  async getFrameworkData(framework) {
    return this.get('/rest/v1/frameworks', {
      name: `eq.${framework}`
    }, { priority: 0 });
  }

  async getOptimizationRules(framework, type = 'performance') {
    return this.get('/rest/v1/optimization_rules', {
      framework: `eq.${framework}`,
      optimization_type: `eq.${type}`,
      order: 'impact_score.desc',
      limit: 10
    });
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const total = this.metrics.totalRequests;
    const successful = this.metrics.successfulRequests;
    
    return {
      ...this.metrics,
      successRate: total > 0 ? successful / total : 0,
      cacheHitRate: total > 0 ? this.metrics.cacheHits / total : 0,
      batchEfficiency: total > 0 ? this.metrics.batchedRequests / total : 0,
      deduplicationRate: total > 0 ? this.metrics.deduplicatedRequests / total : 0
    };
  }

  /**
   * Close API client and cleanup resources
   */
  async close() {
    try {
      // Clear all batch timers
      for (const timer of this.batchTimers.values()) {
        clearTimeout(timer);
      }
      this.batchTimers.clear();
      this.batchQueues.clear();

      // Clear active requests
      this.activeRequests.clear();

      // Destroy HTTP agent
      this.agent.destroy();

      console.log('🔒 API client closed');
    } catch (error) {
      console.warn('⚠️  API client close failed:', error.message);
    }
  }
}

// Singleton instance
let apiClientInstance = null;

/**
 * Initialize API client
 */
async function initializeAPIClient(options = {}) {
  if (!apiClientInstance) {
    apiClientInstance = new HighPerformanceAPIClient(options);
    await apiClientInstance.initialize();
  }
  return apiClientInstance;
}

/**
 * Get API client instance
 */
function getAPIClient() {
  if (!apiClientInstance) {
    throw new Error('API client not initialized. Call initializeAPIClient() first.');
  }
  return apiClientInstance;
}

module.exports = {
  HighPerformanceAPIClient,
  initializeAPIClient,
  getAPIClient
};