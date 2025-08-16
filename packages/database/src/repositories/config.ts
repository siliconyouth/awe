import type { PrismaClient } from '@prisma/client'

export class ConfigRepository {
  constructor(private prisma: PrismaClient) {}

  async findByUserId(userId: string) {
    return this.prisma.userConfig.findUnique({
      where: { userId }
    })
  }

  async set(userId: string, config: any) {
    return this.prisma.userConfig.upsert({
      where: { userId },
      update: { config },
      create: { userId, config }
    })
  }

  async delete(userId: string) {
    return this.prisma.userConfig.delete({
      where: { userId }
    })
  }
}