import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { AuthUser } from '@/types/database'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const useAuthProvider = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('auth_user')
      
      if (token && userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      // First try to authenticate as regular user (admin/assistant)
      const { data: userData, error: userError } = await supabase.rpc('authenticate_user', {
        p_email: email,
        p_password: password
      })

      if (!userError && userData && userData.length > 0) {
        const user = userData[0]
        const authUser: AuthUser = {
          id: user.user_id,
          role: user.user_role,
          store_id: user.store_id
        }
        
        localStorage.setItem('auth_token', 'authenticated')
        localStorage.setItem('auth_user', JSON.stringify(authUser))
        setUser(authUser)
        return { success: true }
      }

      // If regular user auth failed, try store authentication
      const { data: storeData, error: storeError } = await supabase.rpc('authenticate_store_user', {
        p_username: email,
        p_password: password
      })

      if (!storeError && storeData && storeData.length > 0) {
        const store = storeData[0]
        const authUser: AuthUser = {
          id: store.store_id,
          role: 'store',
          store_id: store.store_id,
          store_name: store.store_name
        }
        
        localStorage.setItem('auth_token', 'authenticated')
        localStorage.setItem('auth_user', JSON.stringify(authUser))
        setUser(authUser)
        return { success: true }
      }

      return { success: false, error: 'بيانات تسجيل الدخول غير صحيحة' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setUser(null)
  }

  return {
    user,
    loading,
    login,
    logout
  }
}

export { AuthContext }