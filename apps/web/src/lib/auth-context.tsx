'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api, setToken, getToken } from '@/lib/api'

interface User {
  id: string
  region: string
  role?: string
  phone?: string
  email?: string
  displayName?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const profile = await api.getProfile()
      setUser(profile)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = (token: string, userData: User) => {
    setToken(token)
    setUser(userData)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
