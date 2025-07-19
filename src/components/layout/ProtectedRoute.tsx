import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/database'
import LoginPage from '@/pages/Login'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-ar text-lg">جاري التحميل...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-ar text-lg text-destructive">
          ليس لديك صلاحية للوصول إلى هذه الصفحة
        </div>
      </div>
    )
  }

  return <>{children}</>
}