import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArabicInput } from "@/components/ui/arabic-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogIn, User, Shield } from "lucide-react";

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

interface UserInfo {
  id: string;
  email: string;
  role: string;
}

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const navigate = useNavigate();

  // فحص إذا كان المستخدم مسجل دخول مسبقاً
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const savedTokens = localStorage.getItem("supabase_auth_tokens");
      const savedUser = localStorage.getItem("supabase_user_info");

      if (savedTokens && savedUser) {
        const tokens: AuthTokens = JSON.parse(savedTokens);
        const user: UserInfo = JSON.parse(savedUser);

        // التحقق من صحة التوكن
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser(tokens.access_token);

        if (!error && authUser) {
          setIsAuthenticated(true);
          setUserInfo(user);
          console.log("✅ المستخدم مسجل دخول مسبقاً:", user.email);
        } else {
          // إزالة البيانات المنتهية الصلاحية
          localStorage.removeItem("supabase_auth_tokens");
          localStorage.removeItem("supabase_user_info");
        }
      }
    } catch (error) {
      console.error("خطأ في فحص المصادقة المحفوظة:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setLoading(true);

    try {
      console.log("🔐 محاولة تسجيل الدخول للمستخدم:", email);

      // محاولة تسجيل الدخول باستخدام Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (authError) {
        console.error("⚠️ خطأ في المصادقة:", authError.message);

        let errorMessage = "فشل في تسجيل الدخول";
        if (authError.message.includes("Invalid login credentials")) {
          errorMessage = "بيانات تسجيل الدخول غير صحيحة";
        } else if (authError.message.includes("Email not confirmed")) {
          errorMessage = "يرجى تأكيد البريد الإلكتروني أولاً";
        }

        toast.error(errorMessage);
        return;
      }

      if (!authData.session || !authData.user) {
        toast.error("فشل في إنشاء جلسة المصادقة");
        return;
      }

      // التحقق من وجود المستخدم في جدول system_users
      const { data: userData, error: userError } = await supabase
        .from("system_users")
        .select("id, email, role")
        .eq("id", authData.user.id)
        .single();

      if (userError || !userData) {
        console.error("⚠️ المستخدم غير موجود في النظام:", userError?.message);

        // تسجيل الخروج من Supabase Auth
        await supabase.auth.signOut();

        toast.error(
          "غير مصرح لك بالدخول إلى هذا النظام. يجب أن تكون مديراً أو مساعداً",
        );
        return;
      }

      // التحقق من صلاحية الدور
      if (userData.role !== "admin" && userData.role !== "assistant") {
        console.error("⚠️ دور المستخدم غير صالح:", userData.role);

        await supabase.auth.signOut();

        toast.error(`غير مصرح لك بالدخول. دورك الحالي: ${userData.role}`);
        return;
      }

      // حفظ بيانات المصادقة في localStorage
      const authTokens: AuthTokens = {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      };

      const userInfo: UserInfo = {
        id: authData.user.id,
        email: authData.user.email || userData.email,
        role: userData.role,
      };

      localStorage.setItem("supabase_auth_tokens", JSON.stringify(authTokens));
      localStorage.setItem("supabase_user_info", JSON.stringify(userInfo));

      // تحديث الحالة
      setIsAuthenticated(true);
      setUserInfo(userInfo);

      console.log(
        "✅ تم تسجيل الدخول بنجاح للمستخدم:",
        userInfo.email,
        "بدور:",
        userInfo.role,
      );

      toast.success(`مرحباً ${userInfo.email} - تم تسجيل الدخول بنجاح`);

      // مسح كلمة المرور من النموذج
      setPassword("");
    } catch (error) {
      console.error("🚨 خطأ في تسجيل الدخول:", error);
      toast.error("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // تسجيل الخروج من Supabase
      await supabase.auth.signOut();

      // إزالة البيانات من localStorage
      localStorage.removeItem("supabase_auth_tokens");
      localStorage.removeItem("supabase_user_info");

      // تحديث الحالة
      setIsAuthenticated(false);
      setUserInfo(null);

      toast.success("تم تسجيل الخروج بنجاح");

      console.log("🚪 تم تسجيل الخروج");
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
      toast.error("حدث خطأ في تسجيل الخروج");
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  // إذا كان المستخدم مسجل دخول
  if (isAuthenticated && userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-ar flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-green-600" />
              مسجل دخول بنجاح
            </CardTitle>
            <CardDescription className="text-ar text-center">
              أهلاً وسهلاً بك في النظام
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <User className="w-4 h-4" />
              <AlertDescription className="text-ar">
                <div>
                  <strong>المستخدم:</strong> {userInfo.email}
                </div>
                <div>
                  <strong>الدور:</strong>{" "}
                  {userInfo.role === "admin" ? "مدير النظام" : "مساعد"}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={goToDashboard} className="flex-1 text-ar">
                الذهاب للوحة التحكم
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex-1 text-ar"
              >
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // نموذج تسجيل الدخول
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-ar flex items-center justify-center gap-2">
            <LogIn className="w-6 h-6" />
            تسجيل دخول المدير
          </CardTitle>
          <CardDescription className="text-ar text-center">
            أدخل بياناتك للوصول إلى لوحة الإدارة
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              مخصص للمديرين والمساعدين فقط
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-ar">
                البريد الإلكتروني
              </Label>
              <ArabicInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-ar">
                كلمة المرور
              </Label>
              <ArabicInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                disabled={loading}
                autoComplete="current-password"
                onKeyPress={(e) => e.key === "Enter" && handleLogin(e)}
              />
            </div>

            <Button
              type="submit"
              className="w-full text-ar"
              disabled={loading || !email || !password}
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
