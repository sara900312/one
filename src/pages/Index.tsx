import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const Index = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        navigate('/', { replace: true })
      } else {
        // User is not authenticated, redirect to login
        navigate('/login', { replace: true })
      }
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-ar">
          <h1 className="text-2xl font-bold mb-4">جاري التحميل...</h1>
          <p className="text-muted-foreground">يتم تحميل النظام</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center text-ar">
        <h1 className="text-2xl font-bold mb-4">نظام إدارة المنتجات والطلبات</h1>
        <p className="text-muted-foreground">جاري التوجيه...</p>
      </div>
    </div>
  )
}

export default Index
