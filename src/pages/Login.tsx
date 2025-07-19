import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArabicInput } from '@/components/ui/arabic-input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return
    }

    setLoading(true)
    const result = await login(email, password)
    
    if (result.success) {
      toast.success('تم تسجيل الدخول بنجاح')
    } else {
      toast.error(result.error || 'فشل في تسجيل الدخول')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-ar">تسجيل الدخول</CardTitle>
          <CardDescription className="text-ar text-center">
            أدخل بياناتك للوصول إلى النظام
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              للمتاجر: استخدم اسم المستخدم وكلمة المرور الخاصة بمتجركم
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-ar">البريد الإلكتروني / اسم المستخدم</Label>
              <ArabicInput
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="أدخل البريد الإلكتروني أو اسم المستخدم للمتجر"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-ar">كلمة المرور</Label>
              <ArabicInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full text-ar" 
              disabled={loading}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage