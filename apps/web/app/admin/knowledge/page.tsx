'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SourceManager } from '@/components/knowledge/source-manager'
import { ReviewDashboard } from '@/components/knowledge/review-dashboard'
import { PatternExplorer } from '@/components/knowledge/pattern-explorer'
import { ChangeAnalytics } from '@/components/knowledge/change-analytics'

export default function KnowledgeAdmin() {
  const [activeTab, setActiveTab] = useState('sources')

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Knowledge Monitoring System</h1>
        <p className="text-muted-foreground mt-2">
          Monitor web sources, track changes, and extract patterns for AWE
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="review">Review Queue</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-6">
          <SourceManager />
        </TabsContent>

        <TabsContent value="review" className="mt-6">
          <ReviewDashboard />
        </TabsContent>

        <TabsContent value="patterns" className="mt-6">
          <PatternExplorer />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ChangeAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}