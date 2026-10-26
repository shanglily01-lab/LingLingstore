import { join } from 'path'
import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import type { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import { AppModule } from './app.module'
import type { Env } from './common/config/env.schema'

/** Prisma BigInt 字段在 JSON 响应中需可序列化（兜底，避免漏转换） */
if (!(BigInt.prototype as { toJSON?: () => string }).toJSON) {
  Object.defineProperty(BigInt.prototype, 'toJSON', {
    value: function (this: bigint) {
      return this.toString()
    },
    configurable: true,
  })
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  })

  const config = app.get(ConfigService<Env, true>)
  const port = config.get('API_PORT', { infer: true })
  const webOrigin = config.get('WEB_ORIGIN', { infer: true })

  app.use('/uploads', (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    next()
  })
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' })
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )
  app.enableCors({
    origin: [webOrigin],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  // 全局 ValidationPipe - 关闭 whitelist 以兼容无装饰器的接口
  // Phase 2 可逐步改为 DTO + class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  )

  await app.listen(port, '0.0.0.0')

  const logger = new Logger('Bootstrap')
  logger.log(`API listening on http://localhost:${port}`)
  logger.log(`CORS allowed origin: ${webOrigin}`)
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap')
  const message = error instanceof Error ? error.message : String(error)
  logger.error(`启动失败: ${message}`)
  if (error instanceof Error && error.stack) {
    logger.error(error.stack)
  }
  process.exit(1)
})
