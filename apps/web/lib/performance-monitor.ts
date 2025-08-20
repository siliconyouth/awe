/**
 * Performance Budget Monitoring System
 * Tracks and alerts on performance metrics exceeding defined budgets
 */

export interface PerformanceBudget {
  // Time metrics (in milliseconds)
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  tti?: number // Time to Interactive
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  
  // Size metrics (in bytes)
  bundleSize?: number
  imageSize?: number
  fontSize?: number
  cssSize?: number
  jsSize?: number
  
  // Count metrics
  requestCount?: number
  domNodes?: number
  imageCount?: number
  
  // Custom metrics
  apiResponseTime?: number
  dbQueryTime?: number
}

export interface PerformanceMetrics extends PerformanceBudget {
  timestamp: Date
  url: string
  userAgent?: string
}

class PerformanceMonitor {
  private budget: PerformanceBudget = {
    // Default budgets (can be customized)
    fcp: 1800, // 1.8s
    lcp: 2500, // 2.5s
    tti: 3800, // 3.8s
    fid: 100, // 100ms
    cls: 0.1, // 0.1
    bundleSize: 300000, // 300KB
    imageSize: 1000000, // 1MB total
    requestCount: 50,
    domNodes: 1500,
    apiResponseTime: 200, // 200ms
    dbQueryTime: 50, // 50ms
  }
  
  private violations: Array<{
    metric: string
    actual: number
    budget: number
    severity: 'warning' | 'error'
    timestamp: Date
  }> = []
  
  /**
   * Set custom performance budget
   */
  setBudget(budget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...budget }
  }
  
  /**
   * Get current budget
   */
  getBudget(): PerformanceBudget {
    return { ...this.budget }
  }
  
  /**
   * Measure Core Web Vitals
   */
  measureWebVitals(): Promise<Partial<PerformanceMetrics>> {
    return new Promise((resolve) => {
      const metrics: Partial<PerformanceMetrics> = {
        url: window.location.href,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
      }
      
      // Use Performance Observer API
      if ('PerformanceObserver' in window) {
        // Measure FCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fcp = entries.find(entry => entry.name === 'first-contentful-paint')
          if (fcp) {
            metrics.fcp = fcp.startTime
          }
        }).observe({ entryTypes: ['paint'] })
        
        // Measure LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          if (lastEntry) {
            metrics.lcp = lastEntry.startTime
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Measure FID
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const firstEntry = entries[0] as any
          if (firstEntry) {
            metrics.fid = firstEntry.processingStart - firstEntry.startTime
          }
        }).observe({ entryTypes: ['first-input'] })
        
        // Measure CLS
        let clsValue = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          metrics.cls = clsValue
        }).observe({ entryTypes: ['layout-shift'] })
      }
      
      // Measure resource sizes
      if ('performance' in window && 'getEntriesByType' in performance) {
        const resources = performance.getEntriesByType('resource')
        
        let jsSize = 0
        let cssSize = 0
        let imageSize = 0
        let fontSize = 0
        let imageCount = 0
        
        resources.forEach((resource: any) => {
          const size = resource.transferSize || 0
          
          if (resource.name.endsWith('.js') || resource.initiatorType === 'script') {
            jsSize += size
          } else if (resource.name.endsWith('.css') || resource.initiatorType === 'css') {
            cssSize += size
          } else if (resource.initiatorType === 'img') {
            imageSize += size
            imageCount++
          } else if (resource.name.match(/\.(woff|woff2|ttf|otf)/)) {
            fontSize += size
          }
        })
        
        metrics.jsSize = jsSize
        metrics.cssSize = cssSize
        metrics.imageSize = imageSize
        metrics.fontSize = fontSize
        metrics.imageCount = imageCount
        metrics.requestCount = resources.length
      }
      
      // Measure DOM nodes
      metrics.domNodes = document.getElementsByTagName('*').length
      
      // Wait a bit for all metrics to be collected
      setTimeout(() => resolve(metrics), 2000)
    })
  }
  
  /**
   * Check metrics against budget
   */
  checkBudget(metrics: Partial<PerformanceMetrics>): {
    passed: boolean
    violations: Array<{
      metric: string
      actual: number
      budget: number
      severity: 'warning' | 'error'
    }>
  } {
    const violations: Array<{
      metric: string
      actual: number
      budget: number
      severity: 'warning' | 'error'
    }> = []
    
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'number' && key in this.budget) {
        const budgetValue = this.budget[key as keyof PerformanceBudget]
        if (budgetValue && value > budgetValue) {
          const percentOver = ((value - budgetValue) / budgetValue) * 100
          violations.push({
            metric: key,
            actual: value,
            budget: budgetValue,
            severity: percentOver > 50 ? 'error' : 'warning',
          })
        }
      }
    })
    
    // Store violations
    violations.forEach(violation => {
      this.violations.push({
        ...violation,
        timestamp: new Date(),
      })
    })
    
    // Keep only last 100 violations
    if (this.violations.length > 100) {
      this.violations = this.violations.slice(-100)
    }
    
    return {
      passed: violations.length === 0,
      violations,
    }
  }
  
  /**
   * Send metrics to analytics
   */
  async reportMetrics(metrics: Partial<PerformanceMetrics>): Promise<void> {
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      })
    } catch (error) {
      console.error('Failed to report performance metrics:', error)
    }
  }
  
  /**
   * Get violation history
   */
  getViolations() {
    return [...this.violations]
  }
  
  /**
   * Clear violation history
   */
  clearViolations(): void {
    this.violations = []
  }
  
  /**
   * Auto-monitor and report
   */
  startAutoMonitoring(interval = 60000): () => void {
    const monitor = async () => {
      const metrics = await this.measureWebVitals()
      const { passed, violations } = this.checkBudget(metrics)
      
      if (!passed) {
        console.warn('Performance budget violations:', violations)
        
        // Send alert if critical violations
        const criticalViolations = violations.filter(v => v.severity === 'error')
        if (criticalViolations.length > 0) {
          this.sendAlert(criticalViolations)
        }
      }
      
      // Report metrics
      await this.reportMetrics(metrics)
    }
    
    // Initial measurement
    monitor()
    
    // Set up interval
    const intervalId = setInterval(monitor, interval)
    
    // Return cleanup function
    return () => clearInterval(intervalId)
  }
  
  /**
   * Send alert for critical violations
   */
  private sendAlert(violations: Array<any>): void {
    // Log to console
    console.error('🚨 Critical performance budget violations:', violations)
    
    // Could also send to error tracking service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage('Performance budget violations', {
        level: 'warning',
        extra: { violations },
      })
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for performance monitoring
import { useEffect, useState } from 'react'

export function usePerformanceMonitoring(options?: {
  budget?: Partial<PerformanceBudget>
  autoReport?: boolean
  interval?: number
}) {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>()
  const [violations, setViolations] = useState<Array<any>>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  
  useEffect(() => {
    // Set custom budget if provided
    if (options?.budget) {
      performanceMonitor.setBudget(options.budget)
    }
    
    // Start monitoring
    setIsMonitoring(true)
    
    const measureAndCheck = async () => {
      const measured = await performanceMonitor.measureWebVitals()
      setMetrics(measured)
      
      const result = performanceMonitor.checkBudget(measured)
      setViolations(result.violations)
      
      if (options?.autoReport) {
        await performanceMonitor.reportMetrics(measured)
      }
    }
    
    measureAndCheck()
    
    // Set up auto-monitoring if interval provided
    let cleanup: (() => void) | undefined
    if (options?.interval) {
      cleanup = performanceMonitor.startAutoMonitoring(options.interval)
    }
    
    return () => {
      setIsMonitoring(false)
      cleanup?.()
    }
  }, [])
  
  return {
    metrics,
    violations,
    isMonitoring,
    budget: performanceMonitor.getBudget(),
  }
}

// Performance Analytics Dashboard Component
// TODO: Move to a .tsx file - These React components need to be in a .tsx file
/*
export function PerformanceDashboard() {
  const { metrics, violations, budget } = usePerformanceMonitoring({
    autoReport: true,
    interval: 30000, // Check every 30 seconds
  })
  
  if (!metrics) {
    return <div>Loading performance metrics...</div>
  }
  
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Performance Monitor</h2>
      
      // Violations Alert
      {violations.length > 0 && (
        <div className="p-4 bg-red-100 border border-red-400 rounded">
          <h3 className="font-bold text-red-800">Budget Violations</h3>
          <ul className="mt-2 space-y-1">
            {violations.map((v, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{v.metric}:</span>{' '}
                {v.actual}ms (budget: {v.budget}ms)
              </li>
            ))}
          </ul>
        </div>
      )}
      
      // Core Web Vitals
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="FCP"
          value={metrics.fcp}
          budget={budget.fcp}
          unit="ms"
        />
        <MetricCard
          title="LCP"
          value={metrics.lcp}
          budget={budget.lcp}
          unit="ms"
        />
        <MetricCard
          title="CLS"
          value={metrics.cls}
          budget={budget.cls}
          unit=""
        />
      </div>
      
      // Resource Sizes
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="JS Size"
          value={metrics.jsSize}
          budget={budget.jsSize}
          unit="KB"
          converter={(v) => Math.round(v / 1024)}
        />
        <MetricCard
          title="CSS Size"
          value={metrics.cssSize}
          budget={budget.cssSize}
          unit="KB"
          converter={(v) => Math.round(v / 1024)}
        />
        <MetricCard
          title="Images"
          value={metrics.imageSize}
          budget={budget.imageSize}
          unit="MB"
          converter={(v) => (v / 1024 / 1024).toFixed(1)}
        />
        <MetricCard
          title="Requests"
          value={metrics.requestCount}
          budget={budget.requestCount}
          unit=""
        />
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  budget,
  unit,
  converter = (v) => Math.round(v),
}: {
  title: string
  value?: number
  budget?: number
  unit: string
  converter?: (value: number) => number | string
}) {
  if (value === undefined) return null
  
  const displayValue = converter(value)
  const isOverBudget = budget && value > budget
  
  return (
    <div className={`p-3 rounded border ${isOverBudget ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
      <div className="text-sm text-gray-600">{title}</div>
      <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
        {displayValue}{unit}
      </div>
      {budget && (
        <div className="text-xs text-gray-500">
          Budget: {converter(budget)}{unit}
        </div>
      )}
    </div>
  )
}
*/