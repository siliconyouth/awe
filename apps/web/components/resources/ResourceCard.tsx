'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download } from 'lucide-react'

interface ResourceCardProps {
  resource: {
    id: string
    title: string
    description: string
    type: string
    tags: string[]
    author: string
    downloads: number
  }
  onClick?: () => void
}

const typeColors: Record<string, string> = {
  template: 'bg-blue-500/10 text-blue-600',
  command: 'bg-green-500/10 text-green-600',
  pattern: 'bg-purple-500/10 text-purple-600',
  guide: 'bg-orange-500/10 text-orange-600',
  hook: 'bg-red-500/10 text-red-600'
}

export function ResourceCard({ resource, onClick }: ResourceCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <Badge className={typeColors[resource.type] || 'bg-gray-500/10 text-gray-600'}>
            {resource.type}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Download className="h-3 w-3" />
            {resource.downloads}
          </div>
        </div>
        <CardTitle className="text-lg mt-2">{resource.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {resource.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {resource.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {resource.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{resource.tags.length - 3}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          by {resource.author}
        </p>
      </CardContent>
    </Card>
  )
}