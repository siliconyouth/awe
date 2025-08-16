/**
 * Ultra-Fast Multi-Level Caching System
 * 
 * Performance Targets:
 * - L1 Cache (Memory): <1ms
 * - L2 Cache (Local DB): <5ms
 * - L3 Cache (Disk): <10ms
 * - Cache Hit Rate: >85%
 */

const QuickLRU = require('quick-lru');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class IntelligentCacheSystem {
  constructor(options = {}) {
    this.options = {
      // Memory cache (L1)
      memorySize: options.memorySize || 1000,
      memoryTTL: options.memoryTTL || 300000, // 5 minutes
      
      // Local DB cache (L2) 
      dbCacheTTL: options.dbCacheTTL || 3600000, // 1 hour
      
      // Disk cache (L3)
      diskCacheDir: options.diskCacheDir || path.join(os.homedir(), '.awe', 'cache'),
      diskCacheTTL: options.diskCacheTTL || 86400000, // 24 hours
      diskCacheSize: options.diskCacheSize || 100, // Max files
      
      // Compression
      compressionThreshold: options.compressionThreshold || 1024, // 1KB
      enableCompression: options.enableCompression !== false,
      
      // Performance
      cleanupInterval: options.cleanupInterval || 900000, // 15 minutes
      maxConcurrentOps: options.maxConcurrentOps || 10,
      
      ...options
    };

    // L1: Ultra-fast memory cache (fallback to Map if QuickLRU fails)
    try {
      this.memoryCache = new QuickLRU({
        maxSize: this.options.memorySize,
        onEviction: (key, value) => {
          this.metrics.memoryEvictions++;
        }
      });
    } catch (error) {
      console.warn('⚠️  QuickLRU not available, using Map fallback');
      this.memoryCache = new Map();
    }

    // L2: Local database cache (handled by database.hybrid.js)
    this.dbCache = null; // Will be injected

    // L3: Disk cache
    this.diskCacheDir = this.options.diskCacheDir;
    this.diskCacheIndex = new Map(); // Track disk cache files

    // Operation queue for rate limiting
    this.operationQueue = [];
    this.activeOperations = 0;

    // Performance metrics
    this.metrics = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      l3Hits: 0,
      l3Misses: 0,
      memoryEvictions: 0,
      diskEvictions: 0,
      totalRequests: 0,
      compressionSaved: 0,
      avgResponseTime: 0
    };

    this.isInitialized = false;
  }

  /**
   * Initialize the caching system
   */
  async initialize(dbCache = null) {
    try {
      this.dbCache = dbCache;
      
      // Ensure disk cache directory exists
      await fs.ensureDir(this.diskCacheDir);
      
      // Load disk cache index
      await this.loadDiskCacheIndex();
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      this.isInitialized = true;
      console.log('🚀 Multi-level cache system initialized');
      
    } catch (error) {
      console.error('❌ Cache initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get value from cache (tries L1 -> L2 -> L3)
   */
  async get(key, namespace = 'default') {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const cacheKey = this.generateCacheKey(key, namespace);

      // L1: Memory cache (fastest)
      const memoryValue = this.memoryCache.get(cacheKey);
      if (memoryValue && !this.isExpired(memoryValue)) {
        this.metrics.l1Hits++;
        this.updateResponseTime(startTime);
        return memoryValue.data;
      }
      this.metrics.l1Misses++;

      // L2: Database cache
      if (this.dbCache) {
        const dbValue = await this.getFromDb(cacheKey);
        if (dbValue && !this.isExpired(dbValue)) {
          this.metrics.l2Hits++;
          
          // Promote to L1
          this.memoryCache.set(cacheKey, dbValue);
          
          this.updateResponseTime(startTime);
          return dbValue.data;
        }
        this.metrics.l2Misses++;
      }

      // L3: Disk cache
      const diskValue = await this.getFromDisk(cacheKey);
      if (diskValue && !this.isExpired(diskValue)) {
        this.metrics.l3Hits++;
        
        // Promote to L1 and L2
        this.memoryCache.set(cacheKey, diskValue);
        if (this.dbCache) {
          await this.saveToDb(cacheKey, diskValue);
        }
        
        this.updateResponseTime(startTime);
        return diskValue.data;
      }
      this.metrics.l3Misses++;

      return null;

    } catch (error) {
      console.warn('⚠️  Cache get failed:', error.message);
      return null;
    } finally {
      this.updateResponseTime(startTime);
    }
  }

  /**
   * Set value in all cache levels
   */
  async set(key, data, options = {}) {
    try {
      const cacheKey = this.generateCacheKey(key, options.namespace || 'default');
      const ttl = options.ttl || this.options.memoryTTL;
      const expiresAt = Date.now() + ttl;

      const cacheValue = {
        data,
        expiresAt,
        createdAt: Date.now(),
        size: this.estimateSize(data)
      };

      // Always set in L1 (memory)
      this.memoryCache.set(cacheKey, cacheValue);

      // Set in L2 (database) for persistence
      if (this.dbCache && options.persist !== false) {
        await this.saveToDb(cacheKey, cacheValue, ttl);
      }

      // Set in L3 (disk) for large or important data
      if (options.disk !== false && (cacheValue.size > 1024 || options.important)) {
        await this.saveToDisk(cacheKey, cacheValue);
      }

      return true;

    } catch (error) {
      console.warn('⚠️  Cache set failed:', error.message);
      return false;
    }
  }

  /**
   * Delete from all cache levels
   */
  async delete(key, namespace = 'default') {
    try {
      const cacheKey = this.generateCacheKey(key, namespace);

      // Delete from L1
      this.memoryCache.delete(cacheKey);

      // Delete from L2
      if (this.dbCache) {
        await this.deleteFromDb(cacheKey);
      }

      // Delete from L3
      await this.deleteFromDisk(cacheKey);

      return true;

    } catch (error) {
      console.warn('⚠️  Cache delete failed:', error.message);
      return false;
    }
  }

  /**
   * Clear specific namespace or all cache
   */
  async clear(namespace = null) {
    try {
      if (namespace) {
        // Clear specific namespace
        const prefix = `${namespace}:`;
        
        // Clear L1
        for (const key of this.memoryCache.keys()) {
          if (key.startsWith(prefix)) {
            this.memoryCache.delete(key);
          }
        }

        // Clear L2
        if (this.dbCache) {
          await this.clearDbNamespace(namespace);
        }

        // Clear L3
        await this.clearDiskNamespace(namespace);

      } else {
        // Clear all cache
        this.memoryCache.clear();
        
        if (this.dbCache) {
          await this.clearAllDb();
        }
        
        await this.clearAllDisk();
      }

      return true;

    } catch (error) {
      console.warn('⚠️  Cache clear failed:', error.message);
      return false;
    }
  }

  /**
   * Get from database cache
   */
  async getFromDb(cacheKey) {
    if (!this.dbCache) return null;

    try {
      const result = await this.dbCache.runLocalQuery(
        'SELECT * FROM analysis_cache WHERE content_hash = ? AND expires_at > strftime("%s", "now")',
        [cacheKey]
      );

      if (result && result.length > 0) {
        const row = result[0];
        return {
          data: JSON.parse(row.result),
          expiresAt: row.expires_at * 1000,
          createdAt: row.cached_at * 1000
        };
      }

      return null;
    } catch (error) {
      console.warn('⚠️  DB cache get failed:', error.message);
      return null;
    }
  }

  /**
   * Save to database cache
   */
  async saveToDb(cacheKey, cacheValue, ttl = this.options.dbCacheTTL) {
    if (!this.dbCache) return;

    try {
      const expiresAt = Math.floor((Date.now() + ttl) / 1000);
      
      await this.dbCache.runLocalQuery(`
        INSERT OR REPLACE INTO analysis_cache 
        (content_hash, analysis_type, result, expires_at)
        VALUES (?, ?, ?, ?)
      `, [
        cacheKey,
        'cache',
        JSON.stringify(cacheValue.data),
        expiresAt
      ]);

    } catch (error) {
      console.warn('⚠️  DB cache save failed:', error.message);
    }
  }

  /**
   * Get from disk cache
   */
  async getFromDisk(cacheKey) {
    try {
      const filePath = this.getDiskCachePath(cacheKey);
      
      if (!await fs.pathExists(filePath)) {
        return null;
      }

      const stats = await fs.stat(filePath);
      const indexEntry = this.diskCacheIndex.get(cacheKey);
      
      if (!indexEntry || stats.mtime.getTime() !== indexEntry.mtime) {
        // File was modified externally, remove from index
        this.diskCacheIndex.delete(cacheKey);
        return null;
      }

      let data = await fs.readFile(filePath);
      
      // Decompress if needed
      if (indexEntry.compressed) {
        data = await gunzip(data);
      }

      const cacheValue = JSON.parse(data.toString());
      
      // Check if expired
      if (this.isExpired(cacheValue)) {
        await this.deleteFromDisk(cacheKey);
        return null;
      }

      return cacheValue;

    } catch (error) {
      console.warn('⚠️  Disk cache get failed:', error.message);
      return null;
    }
  }

  /**
   * Save to disk cache
   */
  async saveToDisk(cacheKey, cacheValue) {
    return this.queueOperation(async () => {
      try {
        const filePath = this.getDiskCachePath(cacheKey);
        let data = Buffer.from(JSON.stringify(cacheValue));
        let compressed = false;

        // Compress large data
        if (this.options.enableCompression && data.length > this.options.compressionThreshold) {
          const originalSize = data.length;
          data = await gzip(data);
          compressed = true;
          this.metrics.compressionSaved += originalSize - data.length;
        }

        await fs.writeFile(filePath, data);
        const stats = await fs.stat(filePath);

        // Update index
        this.diskCacheIndex.set(cacheKey, {
          filePath,
          size: stats.size,
          mtime: stats.mtime.getTime(),
          compressed,
          expiresAt: cacheValue.expiresAt
        });

        // Cleanup if cache is too large
        await this.cleanupDiskCache();

      } catch (error) {
        console.warn('⚠️  Disk cache save failed:', error.message);
      }
    });
  }

  /**
   * Delete from disk cache
   */
  async deleteFromDisk(cacheKey) {
    try {
      const filePath = this.getDiskCachePath(cacheKey);
      
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
      
      this.diskCacheIndex.delete(cacheKey);
      this.metrics.diskEvictions++;

    } catch (error) {
      console.warn('⚠️  Disk cache delete failed:', error.message);
    }
  }

  /**
   * Generate cache key
   */
  generateCacheKey(key, namespace) {
    const keyString = typeof key === 'string' ? key : JSON.stringify(key);
    return `${namespace}:${crypto.createHash('md5').update(keyString).digest('hex')}`;
  }

  /**
   * Get disk cache file path
   */
  getDiskCachePath(cacheKey) {
    const hash = crypto.createHash('md5').update(cacheKey).digest('hex');
    const dir = path.join(this.diskCacheDir, hash.substring(0, 2));
    return path.join(dir, `${hash}.cache`);
  }

  /**
   * Load disk cache index
   */
  async loadDiskCacheIndex() {
    try {
      const indexPath = path.join(this.diskCacheDir, 'index.json');
      
      if (await fs.pathExists(indexPath)) {
        const indexData = await fs.readJson(indexPath);
        this.diskCacheIndex = new Map(Object.entries(indexData));
        console.log(`📊 Loaded ${this.diskCacheIndex.size} disk cache entries`);
      }
    } catch (error) {
      console.warn('⚠️  Failed to load disk cache index:', error.message);
      this.diskCacheIndex = new Map();
    }
  }

  /**
   * Save disk cache index
   */
  async saveDiskCacheIndex() {
    try {
      const indexPath = path.join(this.diskCacheDir, 'index.json');
      const indexData = Object.fromEntries(this.diskCacheIndex);
      await fs.writeJson(indexPath, indexData, { spaces: 0 });
    } catch (error) {
      console.warn('⚠️  Failed to save disk cache index:', error.message);
    }
  }

  /**
   * Queue operation to prevent too many concurrent disk operations
   */
  async queueOperation(operation) {
    return new Promise((resolve, reject) => {
      this.operationQueue.push({ operation, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process operation queue
   */
  async processQueue() {
    if (this.activeOperations >= this.options.maxConcurrentOps || this.operationQueue.length === 0) {
      return;
    }

    this.activeOperations++;
    const { operation, resolve, reject } = this.operationQueue.shift();

    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.activeOperations--;
      // Process next operation
      setTimeout(() => this.processQueue(), 0);
    }
  }

  /**
   * Check if cache value is expired
   */
  isExpired(cacheValue) {
    return Date.now() > cacheValue.expiresAt;
  }

  /**
   * Estimate data size in bytes
   */
  estimateSize(data) {
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  }

  /**
   * Update response time metrics
   */
  updateResponseTime(startTime) {
    const responseTime = Date.now() - startTime;
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime + responseTime) / 2;
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanup().catch(error => {
        console.warn('⚠️  Cache cleanup failed:', error.message);
      });
    }, this.options.cleanupInterval);
  }

  /**
   * Cleanup expired cache entries
   */
  async cleanup() {
    try {
      // Cleanup disk cache
      await this.cleanupDiskCache();
      
      // Save disk cache index
      await this.saveDiskCacheIndex();
      
      console.log('🧹 Cache cleanup completed');
    } catch (error) {
      console.warn('⚠️  Cache cleanup failed:', error.message);
    }
  }

  /**
   * Cleanup disk cache
   */
  async cleanupDiskCache() {
    const now = Date.now();
    const expiredKeys = [];
    let totalSize = 0;

    // Find expired entries
    for (const [key, entry] of this.diskCacheIndex) {
      if (entry.expiresAt < now) {
        expiredKeys.push(key);
      } else {
        totalSize += entry.size;
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      await this.deleteFromDisk(key);
    }

    // Remove oldest entries if cache is too large
    if (this.diskCacheIndex.size > this.options.diskCacheSize) {
      const entries = Array.from(this.diskCacheIndex.entries())
        .sort((a, b) => a[1].mtime - b[1].mtime);
      
      const excessCount = this.diskCacheIndex.size - this.options.diskCacheSize;
      
      for (let i = 0; i < excessCount; i++) {
        await this.deleteFromDisk(entries[i][0]);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalL1 = this.metrics.l1Hits + this.metrics.l1Misses;
    const totalL2 = this.metrics.l2Hits + this.metrics.l2Misses;
    const totalL3 = this.metrics.l3Hits + this.metrics.l3Misses;
    const total = this.metrics.totalRequests;

    return {
      // Hit rates
      l1HitRate: totalL1 > 0 ? this.metrics.l1Hits / totalL1 : 0,
      l2HitRate: totalL2 > 0 ? this.metrics.l2Hits / totalL2 : 0,
      l3HitRate: totalL3 > 0 ? this.metrics.l3Hits / totalL3 : 0,
      overallHitRate: total > 0 ? 
        (this.metrics.l1Hits + this.metrics.l2Hits + this.metrics.l3Hits) / total : 0,

      // Counts
      memoryEntries: this.memoryCache.size,
      diskEntries: this.diskCacheIndex.size,
      
      // Performance
      avgResponseTime: this.metrics.avgResponseTime,
      compressionSaved: this.metrics.compressionSaved,
      
      // Operations
      totalRequests: this.metrics.totalRequests,
      queueSize: this.operationQueue.length,
      activeOperations: this.activeOperations,
      
      // Raw metrics
      ...this.metrics
    };
  }

  /**
   * Close cache system
   */
  async close() {
    try {
      // Save disk cache index
      await this.saveDiskCacheIndex();
      
      // Clear memory
      this.memoryCache.clear();
      
      console.log('🔒 Cache system closed');
    } catch (error) {
      console.warn('⚠️  Cache close failed:', error.message);
    }
  }
}

// Singleton instance
let cacheInstance = null;

/**
 * Initialize cache system
 */
async function initializeCache(options = {}, dbCache = null) {
  if (!cacheInstance) {
    cacheInstance = new IntelligentCacheSystem(options);
    await cacheInstance.initialize(dbCache);
  }
  return cacheInstance;
}

/**
 * Get cache instance
 */
function getCache() {
  if (!cacheInstance) {
    throw new Error('Cache not initialized. Call initializeCache() first.');
  }
  return cacheInstance;
}

module.exports = {
  IntelligentCacheSystem,
  initializeCache,
  getCache
};