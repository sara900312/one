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
import { ArabicTextarea } from "@/components/ui/arabic-textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { LogIn, Plus, User, LogOut } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

const AdminLoginAndProductManagement: React.FC = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "admin@example.com", // Default for demo
    password: "",
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    discount_amount: "",
    store_name: "",
    image_url_1: "",
    image_url_2: "",
    image_url_3: "",
    image_url_4: "",
  });

  const [productLoading, setProductLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load saved tokens on component mount
  useEffect(() => {
    const savedTokens = localStorage.getItem("admin_tokens");
    const savedUser = localStorage.getItem("admin_user");

    if (savedTokens && savedUser) {
      try {
        setTokens(JSON.parse(savedTokens));
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error loading saved auth data:", error);
        localStorage.removeItem("admin_tokens");
        localStorage.removeItem("admin_user");
      }
    }
  }, []);

  // Handle login form changes
  const handleLoginChange = (field: string, value: string) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle product form changes
  const handleProductChange = (field: string, value: string) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  // Login function
  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setMessage({ type: "error", text: "يرجى ملء جميع حقول تسجيل الدخول" });
      return;
    }

    setAuthLoading(true);
    setMessage(null);

    try {
      console.log("🔐 Attempting admin login...");

      const response = await fetch("/functions/v1/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Login successful");

        const authTokens: AuthTokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        };

        // Save to state
        setTokens(authTokens);
        setUser(data.user);
        setIsAuthenticated(true);

        // Save to localStorage
        localStorage.setItem("admin_tokens", JSON.stringify(authTokens));
        localStorage.setItem("admin_user", JSON.stringify(data.user));

        setMessage({
          type: "success",
          text: data.message || "تم تسجيل الدخول بنجاح",
        });
        toast.success("تم تسجيل الدخول بنجاح");

        // Clear password
        setLoginForm((prev) => ({ ...prev, password: "" }));
      } else {
        console.error("❌ Login failed:", data.error);
        setMessage({
          type: "error",
          text: data.error || "فشل في تسجيل الدخول",
        });
        toast.error(data.error || "فشل في تسجيل الدخول");
      }
    } catch (error) {
      console.error("🚨 Login error:", error);
      setMessage({ type: "error", text: "خطأ في الاتصال بالخادم" });
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    setTokens(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("admin_tokens");
    localStorage.removeItem("admin_user");
    setMessage({ type: "success", text: "تم تسجيل الخروج بنجاح" });
    toast.success("تم تسجيل الخروج بنجاح");
  };

  // Add product function
  const handleAddProduct = async () => {
    if (!tokens?.access_token) {
      setMessage({ type: "error", text: "يرجى تسجيل الدخول أولاً" });
      return;
    }

    if (!productForm.name || !productForm.price || !productForm.store_name) {
      setMessage({
        type: "error",
        text: "يرجى ملء الحقول المطلوبة: اسم المنتج، السعر، اسم المتجر",
      });
      return;
    }

    setProductLoading(true);
    setMessage(null);

    try {
      console.log("📝 Adding product...");

      const productData = {
        name: productForm.name,
        description: productForm.description || undefined,
        price: parseFloat(productForm.price) || 0,
        quantity: parseInt(productForm.quantity) || 0,
        discount_amount: parseFloat(productForm.discount_amount) || 0,
        store_name: productForm.store_name,
        image_url_1: productForm.image_url_1 || undefined,
        image_url_2: productForm.image_url_2 || undefined,
        image_url_3: productForm.image_url_3 || undefined,
        image_url_4: productForm.image_url_4 || undefined,
        status: "draft" as const,
      };

      console.log("📤 Sending product data with token:", {
        productName: productData.name,
        hasToken: !!tokens.access_token,
        userId: user?.id,
      });

      const response = await fetch("/functions/v1/add-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access_token}`, // 🔑 Important: Send token here
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Product added successfully:", data.data);
        setMessage({
          type: "success",
          text: data.message || "تم إضافة المنتج بنجاح",
        });
        toast.success(data.message || "تم إضافة المنتج بنجاح");

        // Reset product form
        setProductForm({
          name: "",
          description: "",
          price: "",
          quantity: "",
          discount_amount: "",
          store_name: "",
          image_url_1: "",
          image_url_2: "",
          image_url_3: "",
          image_url_4: "",
        });
      } else {
        console.error("❌ Add product failed:", data.error);
        setMessage({
          type: "error",
          text: data.error || "فشل في إضافة المنت��",
        });
        toast.error(data.error || "فشل في إضافة المنتج");
      }
    } catch (error) {
      console.error("🚨 Add product error:", error);
      setMessage({ type: "error", text: "خطأ في الاتصال بالخادم" });
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setProductLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ar mb-2">لوحة إدارة المنتجات</h1>
        <p className="text-gray-600 text-ar">
          تسجيل دخول المدير وإضافة المنتجات
        </p>
      </div>

      {/* Authentication Status */}
      {isAuthenticated && user && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                <span className="text-ar font-medium">
                  مرحباً، {user.email}
                </span>
                <span className="text-sm text-gray-600">({user.role})</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-ar"
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Login Section */}
      {!isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="text-ar flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              تسجيل دخول المدير
            </CardTitle>
            <CardDescription className="text-ar">
              قم بتسجيل الدخول للوصول إلى لوحة الإدارة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-ar">
                البريد الإلكتروني
              </Label>
              <ArabicInput
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) => handleLoginChange("email", e.target.value)}
                placeholder="admin@example.com"
                disabled={authLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-ar">
                كلمة المرور
              </Label>
              <ArabicInput
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => handleLoginChange("password", e.target.value)}
                placeholder="أدخل كلمة المرور"
                disabled={authLoading}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <Button
              onClick={handleLogin}
              disabled={authLoading}
              className="w-full text-ar"
            >
              {authLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product Management Section */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="text-ar flex items-center gap-2">
              <Plus className="w-5 h-5" />
              إضافة منتج جديد
            </CardTitle>
            <CardDescription className="text-ar">
              أضف منتج جديد إلى النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="product-name" className="text-ar">
                  اسم المنتج *
                </Label>
                <ArabicInput
                  id="product-name"
                  value={productForm.name}
                  onChange={(e) => handleProductChange("name", e.target.value)}
                  placeholder="أدخل اسم المنتج"
                  disabled={productLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-name" className="text-ar">
                  اسم المتجر *
                </Label>
                <ArabicInput
                  id="store-name"
                  value={productForm.store_name}
                  onChange={(e) =>
                    handleProductChange("store_name", e.target.value)
                  }
                  placeholder="أدخل اسم المتجر"
                  disabled={productLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-ar">
                  السعر *
                </Label>
                <ArabicInput
                  id="price"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => handleProductChange("price", e.target.value)}
                  placeholder="0.00"
                  disabled={productLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-ar">
                  الكمية
                </Label>
                <ArabicInput
                  id="quantity"
                  type="number"
                  value={productForm.quantity}
                  onChange={(e) =>
                    handleProductChange("quantity", e.target.value)
                  }
                  placeholder="0"
                  disabled={productLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount" className="text-ar">
                  مقدار الخصم
                </Label>
                <ArabicInput
                  id="discount"
                  type="number"
                  step="0.01"
                  value={productForm.discount_amount}
                  onChange={(e) =>
                    handleProductChange("discount_amount", e.target.value)
                  }
                  placeholder="0.00"
                  disabled={productLoading}
                />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="description" className="text-ar">
                الوصف
              </Label>
              <ArabicTextarea
                id="description"
                value={productForm.description}
                onChange={(e) =>
                  handleProductChange("description", e.target.value)
                }
                placeholder="أدخل وصف المنتج"
                disabled={productLoading}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="space-y-2">
                  <Label htmlFor={`image-${num}`} className="text-ar">
                    رابط الصورة {num}
                  </Label>
                  <ArabicInput
                    id={`image-${num}`}
                    type="url"
                    value={
                      productForm[
                        `image_url_${num}` as keyof typeof productForm
                      ]
                    }
                    onChange={(e) =>
                      handleProductChange(`image_url_${num}`, e.target.value)
                    }
                    placeholder={`رابط الصورة ${num}`}
                    disabled={productLoading}
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={handleAddProduct}
              disabled={
                productLoading ||
                !productForm.name ||
                !productForm.price ||
                !productForm.store_name
              }
              className="w-full text-ar"
            >
              {productLoading ? "جاري الإضافة..." : "إضافة المنتج"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Message Display */}
      {message && (
        <Alert
          className={
            message.type === "success"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <AlertDescription
            className={`text-ar ${message.type === "success" ? "text-green-800" : "text-red-800"}`}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Debug Info (Development only) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div>Authenticated: {isAuthenticated ? "Yes" : "No"}</div>
            <div>Has Token: {tokens?.access_token ? "Yes" : "No"}</div>
            <div>User ID: {user?.id || "N/A"}</div>
            <div>User Role: {user?.role || "N/A"}</div>
            <div>
              Token Preview:{" "}
              {tokens?.access_token
                ? `${tokens.access_token.substring(0, 20)}...`
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminLoginAndProductManagement;
