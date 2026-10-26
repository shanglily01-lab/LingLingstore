import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),

  DATABASE_URL: z.string().url().describe('Postgres 连接串'),
  REDIS_URL: z.string().url().describe('Redis 连接串'),

  WEB_ORIGIN: z.string().url().describe('前端来源 origin, 用于 CORS'),

  JWT_SECRET: z.string().min(1).describe('JWT 签名密钥'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  OTP_MOCK_MODE: z
    .string()
    .default('true')
    .transform((v) => v === 'true' || v === '1'),

  PAYMENT_MOCK_MODE: z
    .string()
    .default('true')
    .transform((v) => v === 'true' || v === '1'),

  ALIPAY_APP_ID: z.string().optional().default(''),
  WECHAT_MCH_ID: z.string().optional().default(''),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  PAYPAL_CLIENT_ID: z.string().optional().default(''),

  ALIYUN_SMS_ACCESS_KEY_ID: z.string().optional().default(''),
  ALIYUN_SMS_ACCESS_KEY_SECRET: z.string().optional().default(''),
  ALIYUN_SMS_SIGN_NAME: z.string().optional().default(''),
})

export type Env = z.infer<typeof envSchema>

export function loadEnv(rawEnv: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(rawEnv)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`环境变量校验失败:\n${issues}\n请检查 .env 文件或部署环境变量配置.`)
  }
  return parsed.data
}
