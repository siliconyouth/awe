/**
 * Resource Card Component
 * Displays a resource summary in a card format
 */

'use client'

import { useState } from 'react'
import { 
  Download, 
  Star, 
  Eye, 
  Copy, 
  Share2, 
  MoreVertical,
  Code,
  FileText,
  Settings,
  Zap,
  Terminal,
  Workflow,
  BookOpen,
  Puzzle,
  Link
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Resource, ResourceType, TagCategory } from '@awe/shared'

interface ResourceCardProps {
  resource: Resource
  onView?: (resource: Resource) => void
  onDownload?: (resource: Resource) => void
  onShare?: (resource: Resource) => void
  onApply?: (resource: Resource) => void
  className?: string
  showActions?: boolean
  compact?: boolean
}

const resourceIcons: Record<ResourceType, React.ElementType> = {
  [ResourceType.PATTERN]: Code,
  [ResourceType.TEMPLATE]: FileText,
  [ResourceType.HOOK]: Settings,
  [ResourceType.AGENT]: Zap,
  [ResourceType.SNIPPET]: Terminal,
  [ResourceType.COMMAND]: Terminal,
  [ResourceType.WORKFLOW]: Workflow,
  [ResourceType.KNOWLEDGE]: BookOpen,
  [ResourceType.CONFIGURATION]: Settings,
  [ResourceType.INTEGRATION]: Link,
}

const categoryColors: Record<string, string> = {
  'LANGUAGE': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'FRAMEWORK': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'DOMAIN': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'PURPOSE': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'DIFFICULTY': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
}

export function ResourceCard({
  resource,
  onView,
  onDownload,
  onShare,
  onApply,
  className,
  showActions = true,
  compact = false
}: ResourceCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const Icon = resourceIcons[resource.type] || Puzzle

  const handleAction = (action: 'view' | 'download' | 'share' | 'apply') => {
    switch (action) {
      case 'view':
        onView?.(resource)
        break
      case 'download':
        onDownload?.(resource)
        break
      case 'share':
        onShare?.(resource)
        break
      case 'apply':
        onApply?.(resource)
        break
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const primaryTags = resource.tags
    ?.filter(rt => rt.tagType === 'PRIMARY')
    .slice(0, 3)

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-lg',
        isHovered && 'ring-2 ring-primary/20',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className={cn(compact && 'pb-3')}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              'bg-gradient-to-br from-primary/10 to-primary/5'
            )}>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base line-clamp-1">
                {resource.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {resource.type.toLowerCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  v{resource.version}
                </span>
                {resource.status === 'DEPRECATED' && (
                  <Badge variant="destructive" className="text-xs">
                    Deprecated
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAction('view')}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('download')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('apply')}>
                  <Copy className="mr-2 h-4 w-4" />
                  Apply to Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction('share')}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn(compact && 'pb-3')}>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {resource.description}
        </p>

        {/* Tags */}
        {primaryTags && primaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {primaryTags.map((rt) => (
              <Badge
                key={rt.id}
                variant="secondary"
                className={cn(
                  'text-xs',
                  rt.tag && categoryColors[rt.tag.category]
                )}
              >
                {rt.tag?.name}
              </Badge>
            ))}
            {resource.tags && resource.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{resource.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Quality Score */}
        {!compact && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Quality Score</span>
              <span className="font-medium">{resource.quality}%</span>
            </div>
            <Progress value={resource.quality} className="h-1.5" />
          </div>
        )}
      </CardContent>

      <CardFooter className={cn('pt-0', compact && 'pb-3')}>
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {resource.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span>{resource.rating.toFixed(1)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{formatNumber(resource.usageCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              <span>{formatNumber(resource.downloads)}</span>
            </div>
          </div>
          {showActions && !compact && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleAction('apply')}
              className="h-7 px-3 text-xs"
            >
              Apply
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}