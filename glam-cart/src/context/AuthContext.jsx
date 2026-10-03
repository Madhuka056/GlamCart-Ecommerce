import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest('/auth/me')
      setUser(data.user)
      return data.user
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const login = async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setUser(data.user)
    return data.user
  }

  const register = async (name, email, password) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      window.location.reload()
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}