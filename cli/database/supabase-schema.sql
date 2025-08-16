-- AWE Ultra-Fast Supabase Schema
-- Optimized for speed with proper indexing and partitioning

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Templates table with vector embeddings for semantic search
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL,
  embedding vector(384), -- MiniLM embeddings for speed
  tags TEXT[],
  framework TEXT,
  language TEXT,
  popularity_score FLOAT DEFAULT 0,
  effectiveness_score FLOAT DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hyper-fast indexes for common queries
CREATE INDEX CONCURRENTLY idx_templates_category ON templates(category);
CREATE INDEX CONCURRENTLY idx_templates_framework ON templates(framework);
CREATE INDEX CONCURRENTLY idx_templates_language ON templates(language);
CREATE INDEX CONCURRENTLY idx_templates_popularity ON templates(popularity_score DESC);
CREATE INDEX CONCURRENTLY idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX CONCURRENTLY idx_templates_embedding ON templates USING ivfflat (embedding vector_cosine_ops);

-- Patterns table for code patterns and best practices
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  code_snippet TEXT,
  embedding vector(384),
  framework TEXT,
  use_case TEXT,
  difficulty_level TEXT,
  effectiveness_score FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast pattern lookup indexes
CREATE INDEX CONCURRENTLY idx_patterns_type ON patterns(pattern_type);
CREATE INDEX CONCURRENTLY idx_patterns_framework ON patterns(framework);
CREATE INDEX CONCURRENTLY idx_patterns_usecase ON patterns(use_case);
CREATE INDEX CONCURRENTLY idx_patterns_embedding ON patterns USING ivfflat (embedding vector_cosine_ops);

-- Framework intelligence for real-time updates
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  latest_version TEXT,
  release_date DATE,
  popularity_trend FLOAT,
  best_practices JSONB,
  migration_guides JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Framework index for lightning-fast lookups
CREATE INDEX CONCURRENTLY idx_frameworks_name ON frameworks(name);
CREATE INDEX CONCURRENTLY idx_frameworks_popularity ON frameworks(popularity_trend DESC);

-- AI analysis cache for ultra-fast repeated queries
CREATE TABLE analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash TEXT NOT NULL UNIQUE,
  analysis_type TEXT NOT NULL,
  input_context JSONB,
  ai_response JSONB NOT NULL,
  confidence_score FLOAT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache indexes for sub-millisecond lookups
CREATE INDEX CONCURRENTLY idx_analysis_cache_hash ON analysis_cache(content_hash);
CREATE INDEX CONCURRENTLY idx_analysis_cache_type ON analysis_cache(analysis_type);
CREATE INDEX CONCURRENTLY idx_analysis_cache_expires ON analysis_cache(expires_at);

-- Technology trends for smart recommendations
CREATE TABLE tech_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technology TEXT NOT NULL,
  trend_score FLOAT NOT NULL,
  growth_rate FLOAT,
  github_stars INTEGER,
  npm_downloads INTEGER,
  job_postings INTEGER,
  week_ending DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trends indexes for fast time-series queries
CREATE INDEX CONCURRENTLY idx_tech_trends_technology ON tech_trends(technology);
CREATE INDEX CONCURRENTLY idx_tech_trends_week ON tech_trends(week_ending DESC);
CREATE INDEX CONCURRENTLY idx_tech_trends_score ON tech_trends(trend_score DESC);

-- Performance optimization table
CREATE TABLE optimization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  framework TEXT,
  file_pattern TEXT,
  optimization_type TEXT NOT NULL,
  rule_logic JSONB NOT NULL,
  impact_score FLOAT DEFAULT 0,
  success_rate FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimization indexes
CREATE INDEX CONCURRENTLY idx_optimization_framework ON optimization_rules(framework);
CREATE INDEX CONCURRENTLY idx_optimization_type ON optimization_rules(optimization_type);
CREATE INDEX CONCURRENTLY idx_optimization_impact ON optimization_rules(impact_score DESC);

-- Request performance tracking
CREATE TABLE api_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  cache_hit BOOLEAN DEFAULT FALSE,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance monitoring indexes
CREATE INDEX CONCURRENTLY idx_api_performance_endpoint ON api_performance(endpoint);
CREATE INDEX CONCURRENTLY idx_api_performance_time ON api_performance(created_at DESC);

-- Partitioning for performance logs (monthly partitions)
SELECT partman.create_parent(
  p_parent_table => 'public.api_performance',
  p_control => 'created_at',
  p_type => 'range',
  p_interval => 'monthly'
);

-- Row Level Security (RLS) policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_rules ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (since we only use public data)
CREATE POLICY "Allow public read access" ON templates FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON patterns FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON frameworks FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON analysis_cache FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON tech_trends FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON optimization_rules FOR SELECT USING (true);

-- Functions for ultra-fast similarity search
CREATE OR REPLACE FUNCTION search_similar_templates(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  description text,
  content jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.category,
    t.description,
    t.content,
    1 - (t.embedding <=> query_embedding) as similarity
  FROM templates t
  WHERE 1 - (t.embedding <=> query_embedding) > match_threshold
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function for intelligent cache cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM analysis_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Automatic cache cleanup every hour
SELECT cron.schedule('cleanup-cache', '0 * * * *', 'SELECT cleanup_expired_cache();');

-- Performance optimization settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements,pg_cron';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;