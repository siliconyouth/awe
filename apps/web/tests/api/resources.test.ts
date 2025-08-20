import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '@/app/api/resources/route'
import { GET as GET_RESOURCE, PUT, DELETE } from '@/app/api/resources/[id]/route'
import { NextRequest } from 'next/server'

// Mock Prisma
vi.mock('@awe/database', () => ({
  prisma: {
    resource: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn()
    },
    tag: {
      findMany: vi.fn(),
      upsert: vi.fn()
    },
    resourceTag: {
      create: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn()
    }
  }
}))

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-id' }))
}))

describe('Resources API', () => {
  describe('GET /api/resources', () => {
    it('should return resources list', async () => {
      const mockResources = [
        {
          id: '1',
          title: 'Test Resource',
          type: 'pattern',
          content: 'test content',
          createdAt: new Date()
        }
      ]
      
      const { prisma } = await import('@awe/database')
      vi.mocked(prisma.resource.findMany).mockResolvedValue(mockResources as any)
      
      const request = new NextRequest('http://localhost:3000/api/resources')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual(mockResources)
      expect(prisma.resource.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    })
    
    it('should filter resources by type', async () => {
      const { prisma } = await import('@awe/database')
      vi.mocked(prisma.resource.findMany).mockResolvedValue([])
      
      const request = new NextRequest('http://localhost:3000/api/resources?type=hook')
      await GET(request)
      
      expect(prisma.resource.findMany).toHaveBeenCalledWith({
        where: { type: 'hook' },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    })
    
    it('should search resources', async () => {
      const { prisma } = await import('@awe/database')
      vi.mocked(prisma.resource.findMany).mockResolvedValue([])
      
      const request = new NextRequest('http://localhost:3000/api/resources?search=test')
      await GET(request)
      
      expect(prisma.resource.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
            { tags: { has: 'test' } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    })
  })
  
  describe('POST /api/resources', () => {
    it('should create a new resource', async () => {
      const newResource = {
        title: 'New Resource',
        content: 'Resource content',
        type: 'pattern'
      }
      
      const { prisma } = await import('@awe/database')
      vi.mocked(prisma.resource.create).mockResolvedValue({
        id: 'new-id',
        ...newResource,
        slug: 'new-resource',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)
      
      const request = new NextRequest('http://localhost:3000/api/resources', {
        method: 'POST',
        body: JSON.stringify(newResource)
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('id', 'new-id')
      expect(prisma.resource.create).toHaveBeenCalled()
    })
  })
  
  describe('GET /api/resources/[id]', () => {
    it('should return a single resource', async () => {
      const mockResource = {
        id: 'test-id',
        title: 'Test Resource',
        content: 'Content',
        type: 'pattern'
      }
      
      const { prisma } = await import('@awe/database')
      vi.mocked(prisma.resource.findUnique).mockResolvedValue(mockResource as any)
      
      const request = new NextRequest('http://localhost:3000/api/resources/test-id')
      const context = { params: Promise.resolve({ id: 'test-id' }) }
      
      const response = await GET_RESOURCE(request, context)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual(mockResource)
      expect(prisma.resource.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: expect.any(Object)
      })
    })
    
    it('should return 404 for non-existent resource', async () => {
      const { prisma } = await import('@awe/database')
      vi.mocked(prisma.resource.findUnique).mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/resources/invalid-id')
      const context = { params: Promise.resolve({ id: 'invalid-id' }) }
      
      const response = await GET_RESOURCE(request, context)
      
      expect(response.status).toBe(404)
    })
  })
  
  describe('PUT /api/resources/[id]', () => {
    it('should update a resource', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      }
      
      const { prisma } = await import('@awe/database')
      vi.mocked(prisma.resource.update).mockResolvedValue({
        id: 'test-id',
        ...updateData
      } as any)
      
      const request = new NextRequest('http://localhost:3000/api/resources/test-id', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const context = { params: Promise.resolve({ id: 'test-id' }) }
      
      const response = await PUT(request, context)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('title', 'Updated Title')
      expect(prisma.resource.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: expect.objectContaining(updateData)
      })
    })
  })
  
  describe('DELETE /api/resources/[id]', () => {
    it('should delete a resource', async () => {
      const { prisma } = await import('@awe/database')
      vi.mocked(prisma.resource.delete).mockResolvedValue({ id: 'test-id' } as any)
      
      const request = new NextRequest('http://localhost:3000/api/resources/test-id', {
        method: 'DELETE'
      })
      const context = { params: Promise.resolve({ id: 'test-id' }) }
      
      const response = await DELETE(request, context)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(prisma.resource.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      })
    })
  })
})