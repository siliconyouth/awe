import type { PrismaClient } from '@prisma/client'

export class ProjectRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.project.findMany({
      include: {
        dependencies: true,
        recommendations: true,
        templates: true
      }
    })
  }

  async findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        dependencies: true,
        recommendations: true,
        templates: true
      }
    })
  }

  async create(data: any) {
    return this.prisma.project.create({
      data,
      include: {
        dependencies: true,
        recommendations: true,
        templates: true
      }
    })
  }

  async update(id: string, data: any) {
    return this.prisma.project.update({
      where: { id },
      data,
      include: {
        dependencies: true,
        recommendations: true,
        templates: true
      }
    })
  }

  async delete(id: string) {
    return this.prisma.project.delete({
      where: { id }
    })
  }
}