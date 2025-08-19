/**
 * Tag Selector Component
 * Multi-select tag component with categories and search
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, ChevronsUpDown, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tag, TagCategory } from '@awe/shared'

interface TagSelectorProps {
  tags: Tag[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  categories?: TagCategory[]
  className?: string
}

const categoryColors: Record<string, string> = {
  [TagCategory.LANGUAGE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [TagCategory.FRAMEWORK]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [TagCategory.DOMAIN]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [TagCategory.PURPOSE]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [TagCategory.DIFFICULTY]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [TagCategory.QUALITY]: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  [TagCategory.COMPATIBILITY]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  [TagCategory.VERSION]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  [TagCategory.FEATURE]: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  [TagCategory.CUSTOM]: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
}

export function TagSelector({
  tags,
  selectedTags,
  onTagsChange,
  placeholder = 'Select tags...',
  maxTags,
  categories,
  className
}: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Group tags by category
  const groupedTags = useMemo(() => {
    const groups: Partial<Record<TagCategory, Tag[]>> = {}
    
    tags.forEach(tag => {
      if (tag.category && (!categories || categories.includes(tag.category as TagCategory))) {
        const category = tag.category as TagCategory
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category]!.push(tag)
      }
    })

    return groups
  }, [tags, categories])

  // Filter tags based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedTags

    const filtered: Partial<Record<TagCategory, Tag[]>> = {}
    
    Object.entries(groupedTags).forEach(([category, categoryTags]) => {
      if (!categoryTags) return
      const matchingTags = categoryTags.filter(tag =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      if (matchingTags.length > 0) {
        filtered[category as TagCategory] = matchingTags
      }
    })

    return filtered
  }, [groupedTags, searchQuery])

  const handleToggleTag = (tagId: string) => {
    const isSelected = selectedTags.includes(tagId)
    
    if (isSelected) {
      onTagsChange(selectedTags.filter(id => id !== tagId))
    } else {
      if (maxTags && selectedTags.length >= maxTags) {
        return // Max tags reached
      }
      onTagsChange([...selectedTags, tagId])
    }
  }

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(id => id !== tagId))
  }

  const selectedTagObjects = tags.filter(tag => selectedTags.includes(tag.id))

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedTags.length > 0
                ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <ScrollArea className="h-72">
              {Object.entries(filteredGroups).length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No tags found
                </div>
              ) : (
                Object.entries(filteredGroups).map(([category, categoryTags]) => (
                  <CommandGroup key={category} heading={category.replace(/_/g, ' ')}>
                    {categoryTags && categoryTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.id)
                      const isDisabled = !isSelected && maxTags && selectedTags.length >= maxTags

                      return (
                        <CommandItem
                          key={tag.id}
                          value={tag.id}
                          onSelect={() => handleToggleTag(tag.id)}
                          disabled={isDisabled ? true : undefined}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}
                            >
                              <Check className={cn("h-4 w-4")} />
                            </div>
                            <span className={isDisabled ? 'opacity-50' : ''}>
                              {tag.name}
                            </span>
                            {tag.usageCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({tag.usageCount})
                              </span>
                            )}
                          </div>
                          {tag.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {tag.description}
                            </span>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                ))
              )}
            </ScrollArea>
            {maxTags && (
              <div className="border-t p-2 text-center text-xs text-muted-foreground">
                {selectedTags.length} / {maxTags} tags selected
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {/* Display selected tags */}
      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTagObjects.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className={cn(
                'pr-1',
                tag.category && categoryColors[tag.category as string]
              )}
            >
              {tag.name}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 hover:bg-transparent"
                onClick={() => handleRemoveTag(tag.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}