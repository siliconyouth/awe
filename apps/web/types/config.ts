/**
 * Configuration Types for AWE System
 */

import type { LucideIcon } from 'lucide-react'

export interface ConfigSection {
  id: string
  title: string
  icon: LucideIcon
  description: string
}

export interface AppConfig {
  name?: string
  version?: string
  debug?: boolean
  logging?: {
    level?: 'error' | 'warn' | 'info' | 'debug' | 'trace'
    format?: 'json' | 'pretty'
  }
  metrics?: {
    enabled?: boolean
  }
}

export interface ScraperEngineConfig {
  defaultEngine?: 'auto' | 'playwright' | 'puppeteer' | 'cheerio'
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface ScraperRateLimitConfig {
  enabled?: boolean
  default?: {
    requests?: number
    window?: number
  }
}

export interface ScraperProxyConfig {
  enabled?: boolean
  rotation?: {
    enabled?: boolean
  }
}

export interface ScraperConfig {
  engine?: ScraperEngineConfig
  rateLimit?: ScraperRateLimitConfig
  proxy?: ScraperProxyConfig
}

export interface KnowledgeMonitoringConfig {
  enabled?: boolean
  intervals?: {
    hourly?: number
    daily?: number
  }
}

export interface KnowledgeModerationConfig {
  enabled?: boolean
  provider?: 'anthropic' | 'openai' | 'custom'
}

export interface KnowledgeProcessingConfig {
  enrichment?: {
    enabled?: boolean
  }
  transformation?: {
    toMarkdown?: boolean
  }
}

export interface KnowledgeConfig {
  monitoring?: KnowledgeMonitoringConfig
  moderation?: KnowledgeModerationConfig
  processing?: KnowledgeProcessingConfig
}

export interface ApiCorsConfig {
  enabled?: boolean
  origins?: string[]
}

export interface ApiRateLimitConfig {
  enabled?: boolean
  maxRequests?: number
  windowMs?: number
}

export interface ApiConfig {
  port?: number
  timeout?: {
    request?: number
  }
  cors?: ApiCorsConfig
  rateLimit?: ApiRateLimitConfig
}

export interface AuthClerkConfig {
  signInUrl?: string
  signUpUrl?: string
  afterSignInUrl?: string
  afterSignUpUrl?: string
}

export interface AuthSessionConfig {
  maxAge?: number
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
  httpOnly?: boolean
}

export interface AuthConfig {
  provider?: 'clerk' | 'auth0' | 'supabase' | 'custom'
  clerk?: AuthClerkConfig
  session?: AuthSessionConfig
}

export interface FeaturesConfig {
  flags?: Record<string, boolean>
}

export interface SystemConfig {
  app?: AppConfig
  scraper?: ScraperConfig
  knowledge?: KnowledgeConfig
  api?: ApiConfig
  auth?: AuthConfig
  features?: FeaturesConfig
}

export interface ConfigSectionProps {
  config?: unknown
  onChange: (path: string, value: unknown) => void
}

export interface AppConfigSectionProps {
  config?: AppConfig
  onChange: (path: string, value: unknown) => void
}

export interface ScraperConfigSectionProps {
  config?: ScraperConfig
  onChange: (path: string, value: unknown) => void
}

export interface KnowledgeConfigSectionProps {
  config?: KnowledgeConfig
  onChange: (path: string, value: unknown) => void
}

export interface ApiConfigSectionProps {
  config?: ApiConfig
  onChange: (path: string, value: unknown) => void
}

export interface AuthConfigSectionProps {
  config?: AuthConfig
  onChange: (path: string, value: unknown) => void
}

export interface FeaturesConfigSectionProps {
  config?: FeaturesConfig
  onChange: (path: string, value: unknown) => void
}