'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Smartphone, Lock } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { AuthShell } from '@/components/auth-shell'
import { btnPrimaryLg, inputLg, label, link } from '@/components/ui/stitch'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [phone, setPhone] = useState('13800138000')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.login({ phone, password })
      login(res.accessToken, res.user)
      toast.success('登录成功')
      router.push('/')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="登录"
      subtitle="欢迎回到 LingLing store。探索全球精选商品。"
      footer={
        <p className="text-center text-body-md text-on-surface-variant">
          还没有账号？{' '}
          <Link href="/register" className={link + ' font-bold'}>
            立即注册
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={label} htmlFor="phone">
            手机号码
          </label>
          <div className="relative">
            <Smartphone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant/50" />
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputLg + ' pl-12'}
              placeholder="输入您的手机号"
              required
            />
          </div>
        </div>

        <div>
          <label className={label} htmlFor="password">
            密码
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant/50" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputLg + ' pl-12'}
              placeholder="输入您的密码"
              required
            />
          </div>
        </div>

        <p className="text-xs text-on-surface-variant">测试账号: 13800138000 / 123456</p>

        <button type="submit" disabled={loading} className={btnPrimaryLg}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </AuthShell>
  )
}
