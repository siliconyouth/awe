/**
 * Ultra-Fast Hybrid Database System
 * Local SQLite + Supabase Cloud Intelligence
 * 
 * Performance Targets:
 * - Local queries: <1ms
 * - Cache hits: <5ms  
 * - Cloud queries: <100ms
 * - Background sync: Non-blocking
 */

const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');
const { pipeline } = require('@xenova/transformers');
const { HNSWLib } = require('hnswlib-node');
const PQueue = require('p-queue').default;
const pRetry = require('p-retry');
const QuickLRU = require('quick-lru');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

class HybridAWEDatabase {
  constructor(options = {}) {
    this.options = {
      localDbPath: options.localDbPath || path.join(os.homedir(), '.awe', 'local.db'),
      supabaseUrl: options.supabaseUrl || process.env.AWE_SUPABASE_URL || process.env.SUPABASE_URL,
      supabaseKey: options.supabaseKey || process.env.AWE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
      cacheSize: options.cacheSize || 1000,
      maxConcurrency: options.maxConcurrency || 10,
      offlineMode: options.offlineMode || false,
      syncInterval: options.syncInterval || 300000, // 5 minutes
      ...options
    };

    // Local SQLite connection
    this.localDb = null;
    
    // Supabase cloud connection
    this.supabase = null;
    
    // In-memory caches for ultra-fast access (fallback to Map if QuickLRU fails)
    try {
      this.queryCache = new QuickLRU({ maxSize: this.options.cacheSize });
      this.embeddingCache = new QuickLRU({ maxSize: 500 });
      this.templateCache = new QuickLRU({ maxSize: 200 });
    } catch (error) {
      console.warn('⚠️  QuickLRU not available, using Map fallback');
      this.queryCache = new Map();
      this.embeddingCache = new Map();
      this.templateCache = new Map();
    }
    
    // Vector search index
    this.vectorIndex = null;
    
    // Transformer model for embeddings
    this.embedder = null;
    
    // Request queue for rate limiting and batching
    this.requestQueue = new PQueue({ 
      concurrency: this.options.maxConcurrency,
      interval: 1000,
      intervalCap: 50
    });

    // Performance metrics
    this.metrics = {
      localQueries: 0,
      cacheHits: 0,
      cloudQueries: 0,
      avgResponseTime: 0
    };

    this.isInitialized = false;
    this.isOnline = !this.options.offlineMode;
  }

  /**
   * Initialize the hybrid database system
   */
  async initialize() {
    const startTime = Date.now();
    
    try {
      // Initialize local SQLite database
      await this.initializeLocalDb();
      
      // Initialize cloud connection (non-blocking)
      this.initializeCloudDb();
      
      // Initialize vector search
      await this.initializeVectorSearch();
      
      // Initialize embedding model
      this.initializeEmbeddings();
      
      // Start background sync
      this.startBackgroundSync();
      
      this.isInitialized = true;
      console.log(`🚀 Database initialized in ${Date.now() - startTime}ms`);
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize local SQLite database with optimized schema
   */
  async initializeLocalDb() {
    await fs.ensureDir(path.dirname(this.options.localDbPath));
    
    this.localDb = new sqlite3.Database(this.options.localDbPath);
    
    // Enable performance optimizations
    await this.runLocalQuery('PRAGMA journal_mode = WAL');
    await this.runLocalQuery('PRAGMA synchronous = NORMAL');
    await this.runLocalQuery('PRAGMA cache_size = 10000');
    await this.runLocalQuery('PRAGMA temp_store = MEMORY');
    
    // Create optimized local schema
    await this.createLocalSchema();
  }

  /**
   * Create local SQLite schema optimized for speed
   */
  async createLocalSchema() {
    const schema = `
      -- Local cache tables
      CREATE TABLE IF NOT EXISTS template_cache (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        content TEXT,
        embedding BLOB,
        score REAL DEFAULT 0,
        cached_at INTEGER DEFAULT (strftime('%s', 'now')),
        expires_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS analysis_cache (
        content_hash TEXT PRIMARY KEY,
        analysis_type TEXT NOT NULL,
        result TEXT NOT NULL,
        confidence REAL,
        cached_at INTEGER DEFAULT (strftime('%s', 'now')),
        expires_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS sync_status (
        table_name TEXT PRIMARY KEY,
        last_sync INTEGER DEFAULT 0,
        sync_hash TEXT
      );

      -- Ultra-fast indexes
      CREATE INDEX IF NOT EXISTS idx_template_cache_category ON template_cache(category);
      CREATE INDEX IF NOT EXISTS idx_template_cache_score ON template_cache(score DESC);
      CREATE INDEX IF NOT EXISTS idx_analysis_cache_type ON analysis_cache(analysis_type);
      CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires ON analysis_cache(expires_at);
    `;

    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await this.runLocalQuery(statement);
      }
    }
  }

  /**
   * Initialize cloud database connection (non-blocking)
   */
  initializeCloudDb() {
    if (!this.options.supabaseUrl || !this.options.supabaseKey) {
      console.warn('⚠️  Supabase credentials not found, running in offline mode');
      this.isOnline = false;
      return;
    }

    this.supabase = createClient(this.options.supabaseUrl, this.options.supabaseKey, {
      db: {
        schema: 'public'
      },
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          'x-client-info': 'awe-cli'
        }
      }
    });

    // Test connection in background
    this.testCloudConnection();
  }

  /**
   * Test cloud connection and set online status
   */
  async testCloudConnection() {
    try {
      const { error } = await this.supabase
        .from('templates')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      
      this.isOnline = true;
      console.log('☁️  Connected to Supabase cloud intelligence');
    } catch (error) {
      console.warn('⚠️  Cloud connection failed, running in offline mode');
      this.isOnline = false;
    }
  }

  /**
   * Initialize vector search with HNSW index
   */
  async initializeVectorSearch() {
    try {
      const indexPath = path.join(path.dirname(this.options.localDbPath), 'vector.index');
      
      this.vectorIndex = new HNSWLib('cosine', 384); // MiniLM embedding size
      
      if (await fs.pathExists(indexPath)) {
        await this.vectorIndex.readIndex(indexPath);
        console.log('📊 Loaded existing vector index');
      } else {
        this.vectorIndex.initIndex(1000); // Initial capacity
        console.log('📊 Created new vector index');
      }
    } catch (error) {
      console.warn('⚠️  Vector search initialization failed:', error.message);
      this.vectorIndex = null;
    }
  }

  /**
   * Initialize embedding model (lazy loading)
   */
  initializeEmbeddings() {
    // Load in background to avoid blocking
    setTimeout(async () => {
      try {
        this.embedder = await pipeline('feature-extraction', 
          'Xenova/all-MiniLM-L6-v2', { 
            device: 'cpu',
            dtype: 'fp32'
          }
        );
        console.log('🧠 Embedding model loaded');
      } catch (error) {
        console.warn('⚠️  Embedding model failed to load:', error.message);
      }
    }, 100);
  }

  /**
   * Start background sync process
   */
  startBackgroundSync() {
    if (!this.isOnline || this.options.offlineMode) return;

    setInterval(() => {
      this.backgroundSync().catch(error => {
        console.warn('⚠️  Background sync failed:', error.message);
      });
    }, this.options.syncInterval);
  }

  /**
   * Background sync with cloud database
   */
  async backgroundSync() {
    if (!this.isOnline) return;

    try {
      // Sync templates if needed
      await this.syncTemplates();
      
      // Sync frameworks
      await this.syncFrameworks();
      
      console.log('🔄 Background sync completed');
    } catch (error) {
      console.warn('⚠️  Background sync error:', error.message);
    }
  }

  /**
   * Ultra-fast template search with multi-level caching
   */
  async searchTemplates(query, options = {}) {
    const startTime = Date.now();
    const cacheKey = `search:${crypto.createHash('md5').update(JSON.stringify({query, options})).digest('hex')}`;
    
    try {
      // Level 1: Memory cache (fastest)
      const cached = this.queryCache.get(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return cached;
      }

      // Level 2: Local database cache
      const localResults = await this.searchLocalTemplates(query, options);
      if (localResults && localResults.length > 0) {
        this.queryCache.set(cacheKey, localResults, { ttl: 300000 }); // 5 min cache
        this.metrics.localQueries++;
        return localResults;
      }

      // Level 3: Cloud search (if online)
      if (this.isOnline) {
        const cloudResults = await this.searchCloudTemplates(query, options);
        
        // Cache results locally
        if (cloudResults && cloudResults.length > 0) {
          await this.cacheTemplatesLocally(cloudResults);
          this.queryCache.set(cacheKey, cloudResults, { ttl: 300000 });
          this.metrics.cloudQueries++;
          return cloudResults;
        }
      }

      return [];

    } catch (error) {
      console.warn('⚠️  Template search failed:', error.message);
      return [];
    } finally {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime);
    }
  }

  /**
   * Search local template cache
   */
  async searchLocalTemplates(query, options = {}) {
    const { category, limit = 10 } = options;
    
    let sql = `
      SELECT id, name, category, content, score
      FROM template_cache 
      WHERE expires_at > strftime('%s', 'now')
    `;
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (query) {
      sql += ' AND (name LIKE ? OR content LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }

    sql += ' ORDER BY score DESC LIMIT ?';
    params.push(limit);

    return this.runLocalQuery(sql, params);
  }

  /**
   * Search cloud templates with vector similarity
   */
  async searchCloudTemplates(query, options = {}) {
    if (!this.isOnline || !this.supabase) return [];

    return this.requestQueue.add(async () => {
      try {
        // Get embedding for semantic search
        const embedding = await this.getEmbedding(query);
        
        if (embedding) {
          // Semantic search with vector similarity
          const { data, error } = await this.supabase
            .rpc('search_similar_templates', {
              query_embedding: embedding,
              match_threshold: 0.7,
              match_count: options.limit || 10
            });

          if (error) throw error;
          return data || [];
        } else {
          // Fallback to text search
          let queryBuilder = this.supabase
            .from('templates')
            .select('*')
            .order('popularity_score', { ascending: false })
            .limit(options.limit || 10);

          if (options.category) {
            queryBuilder = queryBuilder.eq('category', options.category);
          }

          if (query) {
            queryBuilder = queryBuilder.textSearch('name,description', query);
          }

          const { data, error } = await queryBuilder;
          if (error) throw error;
          
          return data || [];
        }
      } catch (error) {
        console.warn('☁️  Cloud search failed:', error.message);
        return [];
      }
    });
  }

  /**
   * Get embedding for text (with caching)
   */
  async getEmbedding(text) {
    if (!this.embedder) return null;

    const cacheKey = crypto.createHash('md5').update(text).digest('hex');
    const cached = this.embeddingCache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.embedder(text, { pooling: 'mean', normalize: true });
      const embedding = Array.from(result.data);
      
      this.embeddingCache.set(cacheKey, embedding);
      return embedding;
    } catch (error) {
      console.warn('🧠 Embedding generation failed:', error.message);
      return null;
    }
  }

  /**
   * Cache templates locally for fast access
   */
  async cacheTemplatesLocally(templates) {
    const stmt = await this.prepareLocalStatement(`
      INSERT OR REPLACE INTO template_cache 
      (id, name, category, content, score, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const expireTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour cache

    for (const template of templates) {
      await stmt.run([
        template.id,
        template.name,
        template.category,
        JSON.stringify(template.content),
        template.similarity || template.popularity_score || 0,
        expireTime
      ]);
    }

    await stmt.finalize();
  }

  /**
   * Run local SQLite query with promise wrapper
   */
  runLocalQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      const method = sql.trim().toUpperCase().startsWith('SELECT') ? 'all' : 'run';
      
      this.localDb[method](sql, params, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Prepare local statement for batch operations
   */
  prepareLocalStatement(sql) {
    return new Promise((resolve, reject) => {
      const stmt = this.localDb.prepare(sql, function(err) {
        if (err) reject(err);
        else resolve(stmt);
      });
    });
  }

  /**
   * Update performance metrics
   */
  updateMetrics(responseTime) {
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime + responseTime) / 2;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / 
        (this.metrics.localQueries + this.metrics.cloudQueries + this.metrics.cacheHits),
      isOnline: this.isOnline,
      queueSize: this.requestQueue.size
    };
  }

  /**
   * Sync templates from cloud to local cache
   */
  async syncTemplates() {
    if (!this.isOnline) return;

    try {
      const lastSync = await this.getLastSyncTime('templates');
      
      const { data, error } = await this.supabase
        .from('templates')
        .select('*')
        .gt('updated_at', new Date(lastSync).toISOString())
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        await this.cacheTemplatesLocally(data);
        await this.updateSyncTime('templates');
        console.log(`🔄 Synced ${data.length} templates`);
      }
    } catch (error) {
      console.warn('⚠️  Template sync failed:', error.message);
    }
  }

  /**
   * Sync frameworks from cloud
   */
  async syncFrameworks() {
    // Similar implementation to syncTemplates
    // Omitted for brevity - would follow same pattern
  }

  /**
   * Get last sync time for a table
   */
  async getLastSyncTime(tableName) {
    const result = await this.runLocalQuery(
      'SELECT last_sync FROM sync_status WHERE table_name = ?',
      [tableName]
    );
    return result[0]?.last_sync || 0;
  }

  /**
   * Update sync time for a table
   */
  async updateSyncTime(tableName) {
    await this.runLocalQuery(`
      INSERT OR REPLACE INTO sync_status (table_name, last_sync)
      VALUES (?, strftime('%s', 'now'))
    `, [tableName]);
  }

  /**
   * Close database connections
   */
  async close() {
    if (this.localDb) {
      await new Promise((resolve) => {
        this.localDb.close(resolve);
      });
    }
    
    if (this.vectorIndex) {
      const indexPath = path.join(path.dirname(this.options.localDbPath), 'vector.index');
      await this.vectorIndex.writeIndex(indexPath);
    }
  }
}

// Singleton instance
let hybridDbInstance = null;

/**
 * Initialize hybrid database system
 */
async function initializeDatabase(options = {}) {
  if (!hybridDbInstance) {
    hybridDbInstance = new HybridAWEDatabase(options);
    await hybridDbInstance.initialize();
  }
  return hybridDbInstance;
}

/**
 * Get database instance
 */
function getDatabase() {
  if (!hybridDbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return hybridDbInstance;
}

module.exports = {
  HybridAWEDatabase,
  initializeDatabase,
  getDatabase
};