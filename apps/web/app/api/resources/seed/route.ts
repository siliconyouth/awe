import { NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { ResourceType } from '@awe/shared'

// Seed data - some sample resources
const sampleResources = [
  {
    title: "Next.js + TypeScript CLAUDE.md Template",
    description: "Comprehensive CLAUDE.md template for Next.js projects with TypeScript, includes project structure, conventions, and optimization tips",
    content: `# Project Context
This is a Next.js application using TypeScript...

## Project Structure
- /app - Next.js 15 app directory
- /components - React components
- /lib - Utility functions

## Conventions
- Use server components by default
- Client components only when needed
- Follow TypeScript strict mode`,
    type: "template",
    tags: ["nextjs", "typescript", "react", "claude-md"],
    author: "AWE Team"
  },
  {
    title: "Performance Optimization Hook",
    description: "Pre-commit hook that analyzes CLAUDE.md file size and suggests optimizations to reduce token usage",
    content: `#!/bin/bash
# Hook to optimize CLAUDE.md before commits
# Reduces token usage by removing redundant information`,
    type: "hook",
    tags: ["performance", "optimization", "git-hooks"],
    author: "community"
  },
  {
    title: "Test-Driven Development Command",
    description: "Slash command for Claude Code to follow TDD practices when writing new features",
    content: `/test-first
Description: Write tests before implementation
Usage: /test-first [feature-name]`,
    type: "command",
    tags: ["testing", "tdd", "slash-command"],
    author: "community"
  },
  {
    title: "Repository Pattern for TypeScript",
    description: "Clean architecture repository pattern implementation for TypeScript projects",
    content: `// Repository pattern example
interface Repository<T> {
  findAll(): Promise<T[]>
  findById(id: string): Promise<T | null>
  create(data: T): Promise<T>
  update(id: string, data: T): Promise<T>
  delete(id: string): Promise<void>
}`,
    type: "pattern",
    tags: ["patterns", "typescript", "architecture", "clean-code"],
    author: "community"
  },
  {
    title: "Debugging Large Codebases Guide",
    description: "Step-by-step guide for using Claude Code to debug issues in large codebases efficiently",
    content: `# Debugging Large Codebases with Claude Code

1. Start with context...
2. Use targeted searches...
3. Leverage Claude's analysis...`,
    type: "guide",
    tags: ["debugging", "large-projects", "best-practices"],
    author: "AWE Team"
  }
]

export async function POST() {
  try {
    // Check if we already have resources
    const existing = await prisma.resource.count()
    if (existing > 0) {
      return NextResponse.json({ 
        message: `Database already has ${existing} resources` 
      })
    }

    // Create sample resources
    for (const resource of sampleResources) {
      const slug = resource.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      
      const { title, type, tags, ...restResource } = resource
      
      await prisma.resource.create({
        data: {
          ...restResource,
          name: title,
          type: type as any,
          slug
          // Tags would need to be created separately as they are relations
        }
      })
    }

    return NextResponse.json({ 
      message: `Created ${sampleResources.length} sample resources` 
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed' }, { status: 500 })
  }
}