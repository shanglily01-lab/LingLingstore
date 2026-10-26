import { Global, Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { loadEnv } from './env.schema'

/**
 * 全局 ConfigModule. 在 AppModule 之前完成 env 校验.
 * 用 zod 替代 nest config 内置的 Joi 校验, 更类型友好.
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['../../.env', '.env'],
      validate: loadEnv,
    }),
  ],
  exports: [NestConfigModule],
})
export class AppConfigModule {}
