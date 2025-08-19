'use client'

import { PatternRecommendations } from '../../../components/patterns/pattern-recommendations'
import { Sparkles } from 'lucide-react'

export default function RecommendationsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          AI-Powered Recommendations
        </h1>
        <p className="text-gray-600 mt-2">
          Get intelligent pattern recommendations based on your project context and code
        </p>
      </div>

      <PatternRecommendations />
    </div>
  )
}