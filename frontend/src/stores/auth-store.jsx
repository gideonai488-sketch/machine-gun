import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API_URL = import.meta.env.VITE_BACKEND_URL || ''

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('mg_token')
      if (!token) { setLoading(false); return }

      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        localStorage.removeItem('mg_token')
      }
    } catch (err) {
      console.error('Auth check failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('mg_token', token)
      window.history.replaceState({}, '', window.location.pathname)
      fetchUser()
    }
  }, [fetchUser])

  function loginWithGithub() {
    window.location.href = `${API_URL}/api/auth/github`
  }

  function logout() {
    localStorage.removeItem('mg_token')
    setUser(null)
  }

  function getToken() {
    return localStorage.getItem('mg_token')
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGithub, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
