import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as data from '../lib/data'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    data
      .getSessionUser()
      .then((u) => {
        if (alive) setUser(u)
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false)
      })
    const unsub = data.onAuthChange((u) => setUser(u))
    return () => {
      alive = false
      if (typeof unsub === 'function') unsub()
    }
  }, [])

  const signUp = useCallback((email, password) => data.signUp(email, password), [])
  const signIn = useCallback((email, password) => data.signIn(email, password), [])
  const signOut = useCallback(async () => {
    await data.signOut()
    setUser(null)
  }, [])
  const resetPassword = useCallback((email) => data.resetPassword(email), [])
  const updatePassword = useCallback((password) => data.updatePassword(password), [])

  return (
    <AuthContext.Provider
      value={{ user, loading, signUp, signIn, signOut, resetPassword, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
