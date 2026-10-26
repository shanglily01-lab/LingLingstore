import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  async onModuleInit(): Promise<void> {
    await this.$connect()
    this.logger.log('Prisma 已连接到数据库')
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
    this.logger.log('Prisma 已断开数据库连接')
  }

  async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1 as ping`
  }
}
