import type { PrismaClient } from '@prisma/client'

export class AnalysisRepository {
  constructor(private prisma: PrismaClient) {}

  async findByKey(key: string) {
    return this.prisma.analysisCache.findUnique({
      where: { key }
    })
  }

  async set(key: string, data: any, expiresAt: Date) {
    return this.prisma.analysisCache.upsert({
      where: { key },
      update: { data, expiresAt },
      create: { key, data, expiresAt }
    })
  }

  async delete(key: string) {
    return this.prisma.analysisCache.delete({
      where: { key }
    })
  }

  async cleanup() {
    return this.prisma.analysisCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
  }
}