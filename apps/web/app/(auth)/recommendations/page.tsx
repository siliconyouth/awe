'use client'

import { PatternRecommendations } from '../../../components/patterns/pattern-recommendations'
import { PageContainer } from '../../../components/layout/page-container'
import { PageHeader } from '../../../components/layout/page-header'
import { designSystem, cn } from '../../../lib/design-system'
import { Sparkles, Zap, TrendingUp, Brain } from 'lucide-react'

export default function RecommendationsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="AI-Powered Recommendations"
        description="Get intelligent pattern recommendations based on your project context and code analysis"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Recommendations' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium",
              "bg-gradient-to-r from-purple-100 to-pink-100",
              "dark:from-purple-900/20 dark:to-pink-900/20",
              "text-purple-700 dark:text-purple-300",
              "flex items-center gap-1.5"
            )}>
              <Brain className="h-3 w-3" />
              AI Powered
            </div>
          </div>
        }
      />

      <div className={cn(designSystem.animations.fadeIn)}>
        <PatternRecommendations />
      </div>
    </PageContainer>
  )
}