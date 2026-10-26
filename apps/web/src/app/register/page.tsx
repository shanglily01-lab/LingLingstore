'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { AuthShell } from '@/components/auth-shell'
import { btnGhost, btnPrimaryLg, inputLg, label, link } from '@/components/ui/stitch'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [region, setRegion] = useState<'CN' | 'OVERSEAS'>('CN')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)

  const handleSendOtp = async () => {
    const target = region === 'CN' ? { phone } : { email }
    if (!phone && !email) {
      toast.error('请输入手机号或邮箱')
      return
    }
    setSendingOtp(true)
    try {
      await api.sendOtp(target)
      toast.success('验证码已发送（Mock: 123456）')
      setOtpSent(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '发送失败')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.register({
        region,
        phone: region === 'CN' ? phone : undefined,
        email: region === 'OVERSEAS' ? email : undefined,
        password,
        countryCode: region === 'CN' ? 'CN' : 'US',
        otp,
      })
      login(res.accessToken, res.user)
      toast.success('注册成功')
      router.push('/')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="注册"
      subtitle="加入 LingLing store，开启跨境购物之旅。"
      footer={
        <p className="text-center text-body-md text-on-surface-variant">
          已有账号？{' '}
          <Link href="/login" className={link + ' font-bold'}>
            去登录
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={label}>注册区域</label>
          <div className="mt-2 flex gap-2">
            {(['CN', 'OVERSEAS'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={clsx(
                  'flex-1 rounded-lg border px-3 py-2.5 text-label-sm font-medium transition-colors',
                  region === r
                    ? 'border-secondary bg-surface-container-low text-secondary'
                    : 'border-outline-variant/30 text-on-surface-variant',
                )}
              >
                {r === 'CN' ? '中国大陆' : '海外'}
              </button>
            ))}
          </div>
        </div>

        {region === 'CN' ? (
          <div>
            <label className={label} htmlFor="phone">
              手机号
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputLg}
              placeholder="请输入手机号"
              required
            />
          </div>
        ) : (
          <div>
            <label className={label} htmlFor="email">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputLg}
              placeholder="请输入邮箱"
              required
            />
          </div>
        )}

        <div>
          <label className={label} htmlFor="password">
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputLg}
            placeholder="至少 6 位密码"
            minLength={6}
            required
          />
        </div>

        <div>
          <label className={label} htmlFor="otp">
            验证码
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={inputLg + ' mt-0 flex-1'}
              placeholder="请输入验证码"
              required
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp}
              className={btnGhost + ' shrink-0 self-end'}
            >
              {sendingOtp ? '…' : otpSent ? '重发' : '发送'}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className={btnPrimaryLg}>
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
    </AuthShell>
  )
}
