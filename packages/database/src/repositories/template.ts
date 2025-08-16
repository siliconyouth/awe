import type { PrismaClient } from '@prisma/client'

export class TemplateRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.template.findMany()
  }

  async findById(id: string) {
    return this.prisma.template.findUnique({
      where: { id }
    })
  }

  async findByCategory(category: string) {
    return this.prisma.template.findMany({
      where: { category }
    })
  }

  async create(data: any) {
    return this.prisma.template.create({ data })
  }

  async update(id: string, data: any) {
    return this.prisma.template.update({
      where: { id },
      data
    })
  }

  async delete(id: string) {
    return this.prisma.template.delete({
      where: { id }
    })
  }
}