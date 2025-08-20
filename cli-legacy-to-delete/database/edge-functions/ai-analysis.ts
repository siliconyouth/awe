/**
 * Ultra-Fast AI Analysis Edge Function
 * Optimized for sub-100ms response times
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Response cache for identical requests
const responseCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 300000 // 5 minutes

interface AnalysisRequest {
  projectContext: {
    framework?: string
    language?: string
    packageJson?: any
    fileStructure?: string[]
    dependencies?: string[]
  }
  analysisType: 'quick' | 'deep' | 'security' | 'performance'
  options?: any
}

interface AnalysisResponse {
  recommendations: Array<{
    type: string
    priority: 'high' | 'medium' | 'low'
    description: string
    implementation: string
    confidence: number
  }>
  insights: {
    framework_analysis: any
    architecture_suggestions: any
    optimization_opportunities: any
  }
  confidence_score: number
  processing_time_ms: number
}

serve(async (req) => {
  const startTime = Date.now()
  
  try {
    // CORS headers for speed
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      )
    }

    const body: AnalysisRequest = await req.json()
    const { projectContext, analysisType, options = {} } = body

    // Generate cache key for identical requests
    const cacheKey = crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify({ projectContext, analysisType, options }))
    ).then(buffer => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join(''))

    const cacheKeyStr = await cacheKey

    // Check cache first (ultra-fast path)
    const cached = responseCache.get(cacheKeyStr)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(
        JSON.stringify({
          ...cached.data,
          cache_hit: true,
          processing_time_ms: Date.now() - startTime
        }),
        { headers: corsHeaders }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fast analysis based on type
    let analysis: AnalysisResponse

    switch (analysisType) {
      case 'quick':
        analysis = await performQuickAnalysis(supabase, projectContext)
        break
      case 'deep':
        analysis = await performDeepAnalysis(supabase, projectContext)
        break
      case 'security':
        analysis = await performSecurityAnalysis(supabase, projectContext)
        break
      case 'performance':
        analysis = await performPerformanceAnalysis(supabase, projectContext)
        break
      default:
        analysis = await performQuickAnalysis(supabase, projectContext)
    }

    analysis.processing_time_ms = Date.now() - startTime

    // Cache the response
    responseCache.set(cacheKeyStr, { data: analysis, timestamp: Date.now() })

    // Clean old cache entries (keep memory usage low)
    if (responseCache.size > 1000) {
      const oldEntries = Array.from(responseCache.entries())
        .filter(([_, entry]) => Date.now() - entry.timestamp > CACHE_TTL)
      oldEntries.forEach(([key]) => responseCache.delete(key))
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Analysis error:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Analysis failed',
        message: error.message,
        processing_time_ms: Date.now() - startTime
      }),
      { 
        status: 500, 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      }
    )
  }
})

/**
 * Ultra-fast quick analysis (<50ms target)
 */
async function performQuickAnalysis(supabase: any, context: any): Promise<AnalysisResponse> {
  const recommendations = []
  const insights = {
    framework_analysis: {},
    architecture_suggestions: {},
    optimization_opportunities: {}
  }

  // Detect framework and get cached recommendations
  const framework = detectFramework(context)
  
  if (framework) {
    // Get pre-computed framework recommendations (cached in DB)
    const { data: frameworkData } = await supabase
      .from('frameworks')
      .select('best_practices, latest_version')
      .eq('name', framework)
      .single()

    if (frameworkData) {
      insights.framework_analysis = {
        detected_framework: framework,
        latest_version: frameworkData.latest_version,
        best_practices: frameworkData.best_practices
      }

      // Add version check recommendation
      if (context.packageJson?.dependencies?.[framework]) {
        const currentVersion = context.packageJson.dependencies[framework]
        recommendations.push({
          type: 'version_update',
          priority: 'medium' as const,
          description: `Consider updating ${framework} to latest version`,
          implementation: `npm update ${framework}`,
          confidence: 0.9
        })
      }
    }
  }

  // Quick dependency analysis
  if (context.dependencies) {
    const outdatedDeps = await checkOutdatedDependencies(supabase, context.dependencies)
    if (outdatedDeps.length > 0) {
      recommendations.push({
        type: 'dependencies',
        priority: 'medium' as const,
        description: `${outdatedDeps.length} dependencies may need updates`,
        implementation: 'Run npm audit and npm update',
        confidence: 0.8
      })
    }
  }

  // File structure analysis
  if (context.fileStructure) {
    const structureInsights = analyzeFileStructure(context.fileStructure)
    insights.architecture_suggestions = structureInsights
    
    if (structureInsights.recommendations) {
      recommendations.push(...structureInsights.recommendations)
    }
  }

  return {
    recommendations,
    insights,
    confidence_score: recommendations.length > 0 ? 0.85 : 0.6,
    processing_time_ms: 0 // Will be set by caller
  }
}

/**
 * Deep analysis with AI recommendations
 */
async function performDeepAnalysis(supabase: any, context: any): Promise<AnalysisResponse> {
  // Start with quick analysis
  const quickAnalysis = await performQuickAnalysis(supabase, context)
  
  // Add deeper insights
  const deepInsights = await getDeepInsights(supabase, context)
  
  return {
    ...quickAnalysis,
    insights: {
      ...quickAnalysis.insights,
      ...deepInsights
    },
    confidence_score: 0.92
  }
}

/**
 * Security-focused analysis
 */
async function performSecurityAnalysis(supabase: any, context: any): Promise<AnalysisResponse> {
  const recommendations = []
  const insights = {
    framework_analysis: {},
    architecture_suggestions: {},
    optimization_opportunities: {},
    security_analysis: {}
  }

  // Check for security vulnerabilities in dependencies
  if (context.dependencies) {
    const { data: vulnData } = await supabase
      .from('security_vulnerabilities')
      .select('*')
      .in('package_name', context.dependencies.map((dep: string) => dep.split('@')[0]))

    if (vulnData && vulnData.length > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high' as const,
        description: `${vulnData.length} potential security vulnerabilities found`,
        implementation: 'Review and update vulnerable dependencies',
        confidence: 0.95
      })
      
      insights.security_analysis = {
        vulnerabilities: vulnData
      }
    }
  }

  // Framework-specific security checks
  const framework = detectFramework(context)
  if (framework) {
    const securityRules = await getSecurityRules(supabase, framework)
    recommendations.push(...securityRules)
  }

  return {
    recommendations,
    insights,
    confidence_score: 0.88,
    processing_time_ms: 0
  }
}

/**
 * Performance-focused analysis
 */
async function performPerformanceAnalysis(supabase: any, context: any): Promise<AnalysisResponse> {
  const recommendations = []
  const insights = {
    framework_analysis: {},
    architecture_suggestions: {},
    optimization_opportunities: {},
    performance_analysis: {}
  }

  // Get performance optimization rules
  const framework = detectFramework(context)
  if (framework) {
    const { data: perfRules } = await supabase
      .from('optimization_rules')
      .select('*')
      .eq('framework', framework)
      .eq('optimization_type', 'performance')
      .order('impact_score', { ascending: false })
      .limit(10)

    if (perfRules) {
      recommendations.push(...perfRules.map((rule: any) => ({
        type: 'performance',
        priority: rule.impact_score > 8 ? 'high' : 'medium' as const,
        description: rule.rule_name,
        implementation: rule.rule_logic.implementation || 'See documentation',
        confidence: rule.success_rate
      })))
      
      insights.performance_analysis = {
        optimization_rules: perfRules
      }
    }
  }

  // Bundle size analysis
  if (context.dependencies) {
    const bundleAnalysis = await analyzeBundleSize(context.dependencies)
    if (bundleAnalysis.recommendations) {
      recommendations.push(...bundleAnalysis.recommendations)
    }
    insights.optimization_opportunities = bundleAnalysis
  }

  return {
    recommendations,
    insights,
    confidence_score: 0.87,
    processing_time_ms: 0
  }
}

/**
 * Detect framework from project context
 */
function detectFramework(context: any): string | null {
  if (context.framework) return context.framework
  
  const deps = context.packageJson?.dependencies || {}
  const devDeps = context.packageJson?.devDependencies || {}
  const allDeps = { ...deps, ...devDeps }
  
  // Framework detection logic
  if (allDeps.react) return 'react'
  if (allDeps.vue) return 'vue'
  if (allDeps.angular) return 'angular'
  if (allDeps.next) return 'next.js'
  if (allDeps.nuxt) return 'nuxt.js'
  if (allDeps.express) return 'express'
  if (allDeps.fastify) return 'fastify'
  
  return null
}

/**
 * Analyze file structure for architecture insights
 */
function analyzeFileStructure(files: string[]) {
  const insights: any = {
    total_files: files.length,
    recommendations: []
  }
  
  // Check for common architectural patterns
  const hasComponents = files.some(f => f.includes('components'))
  const hasUtils = files.some(f => f.includes('utils') || f.includes('helpers'))
  const hasTests = files.some(f => f.includes('test') || f.includes('spec'))
  
  if (!hasTests) {
    insights.recommendations.push({
      type: 'testing',
      priority: 'high' as const,
      description: 'No test files detected - consider adding tests',
      implementation: 'Add test files and configure testing framework',
      confidence: 0.9
    })
  }
  
  if (!hasUtils && files.length > 10) {
    insights.recommendations.push({
      type: 'organization',
      priority: 'medium' as const,
      description: 'Consider organizing utility functions in utils/ directory',
      implementation: 'Create utils/ directory and move helper functions',
      confidence: 0.7
    })
  }
  
  return insights
}

/**
 * Check for outdated dependencies (simplified)
 */
async function checkOutdatedDependencies(supabase: any, deps: string[]): Promise<string[]> {
  // This would integrate with npm registry or vulnerability databases
  // For now, return empty array
  return []
}

/**
 * Get deep insights using AI analysis
 */
async function getDeepInsights(supabase: any, context: any) {
  // This would use AI models for deeper analysis
  // Placeholder implementation
  return {
    ai_recommendations: {
      patterns: 'Modern patterns detected',
      suggestions: 'Consider implementing error boundaries'
    }
  }
}

/**
 * Get security rules for framework
 */
async function getSecurityRules(supabase: any, framework: string) {
  const { data } = await supabase
    .from('security_rules')
    .select('*')
    .eq('framework', framework)
    .limit(5)
  
  return (data || []).map((rule: any) => ({
    type: 'security',
    priority: 'high' as const,
    description: rule.rule_name,
    implementation: rule.implementation,
    confidence: rule.confidence || 0.8
  }))
}

/**
 * Analyze bundle size and suggest optimizations
 */
async function analyzeBundleSize(dependencies: string[]) {
  // Placeholder - would analyze actual bundle sizes
  return {
    estimated_size: '2.5MB',
    recommendations: [{
      type: 'bundle_optimization',
      priority: 'medium' as const,
      description: 'Consider code splitting for large dependencies',
      implementation: 'Implement dynamic imports and lazy loading',
      confidence: 0.75
    }]
  }
}