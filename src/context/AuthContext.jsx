import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)      // { username, role, token }
  const [loading, setLoading] = useState(true)

  // On mount, check if token exists in localStorage and verify it
  useEffect(() => {
    const token = localStorage.getItem('vocabvault_token')
    if (token) {
      verifyToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (token) => {
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser({ username: data.username, role: data.role, token })
      } else {
        // Token expired or invalid
        localStorage.removeItem('vocabvault_token')
      }
    } catch (err) {
      localStorage.removeItem('vocabvault_token')
    }
    setLoading(false)
  }

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem('vocabvault_token', data.token)
      setUser({ username: data.username, role: data.role, token: data.token })
      return { success: true }
    } else {
      return { success: false, error: data.error }
    }
  }

  const logout = () => {
    localStorage.removeItem('vocabvault_token')
    setUser(null)
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
