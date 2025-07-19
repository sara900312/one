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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, CheckCircle, AlertCircle, Info } from "lucide-react";

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

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  quantity: string;
  discount_amount: string;
  store_name: string;
  image_url_1: string;
  image_url_2: string;
  image_url_3: string;
  image_url_4: string;
  status: "draft" | "published";
}

const ProductCreator: React.FC = () => {
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
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
    status: "draft",
  });

  // تحميل بيانات المصادقة عند بدء المكون
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = () => {
    try {
      const savedTokens = localStorage.getItem("supabase_auth_tokens");
      const savedUser = localStorage.getItem("supabase_user_info");

      if (savedTokens && savedUser) {
        setTokens(JSON.parse(savedTokens));
        setUserInfo(JSON.parse(savedUser));
        console.log("✅ تم تحميل بيانات المصادقة من localStorage");
      } else {
        setMessage({
          type: "info",
          text: "يرجى تسجيل الدخول أولاً للتمكن من إضافة المنتجات",
        });
      }
    } catch (error) {
      console.error("خطأ في تحميل بيانات المصادقة:", error);
      setMessage({
        type: "error",
        text: "خطأ في تحميل بيانات المصادقة المحفوظة",
      });
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "اسم المنتج مطلوب" });
      return false;
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      setMessage({
        type: "error",
        text: "يرجى إدخال سعر صحيح (أكبر من أو يساوي صفر)",
      });
      return false;
    }

    if (!formData.store_name.trim()) {
      setMessage({ type: "error", text: "اسم المتجر مطلوب" });
      return false;
    }

    if (formData.quantity && parseInt(formData.quantity) < 0) {
      setMessage({
        type: "error",
        text: "الكمية يجب أن تكون أكبر من أو تساوي صفر",
      });
      return false;
    }

    if (formData.discount_amount && parseFloat(formData.discount_amount) < 0) {
      setMessage({
        type: "error",
        text: "مقدار الخصم يجب أن يكون أكبر من أو يساوي صفر",
      });
      return false;
    }

    return true;
  };

  const createProduct = async () => {
    if (!tokens?.access_token) {
      setMessage({
        type: "error",
        text: "رمز المصادقة غير موجود. يرجى تسجيل الدخول مرة أخرى",
      });
      return;
    }

    if (!userInfo) {
      setMessage({ type: "error", text: "معلومات المستخدم غير موجودة" });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // إعداد بيانات المنتج
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity) || 0,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        store_name: formData.store_name.trim(),
        image_url_1: formData.image_url_1.trim() || undefined,
        image_url_2: formData.image_url_2.trim() || undefined,
        image_url_3: formData.image_url_3.trim() || undefined,
        image_url_4: formData.image_url_4.trim() || undefined,
        status: formData.status,
      };

      console.log("📤 إرسال طلب إضافة منتج:", {
        productName: productData.name,
        price: productData.price,
        storeName: productData.store_name,
        userRole: userInfo.role,
        hasToken: !!tokens.access_token,
      });

      // إرسال الطلب إلى Edge Function
      const response = await fetch("/functions/v1/secure-add-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access_token}`, // 🔑 هنا التوكن المهم
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("✅ تم إضافة المنتج بنجاح:", result.data);

        setMessage({
          type: "success",
          text: result.message || "تم إضافة المنتج بنجاح",
        });

        toast.success(result.message || "تم إضافة المنتج بنجاح");

        // إعادة تعيين النموذج
        setFormData({
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
          status: "draft",
        });
      } else {
        console.error("❌ فشل في إضافة المنتج:", result.error);

        setMessage({
          type: "error",
          text: result.error || "فشل في إضافة المنتج",
        });

        toast.error(result.error || "فشل في إضافة المنتج");
      }
    } catch (error) {
      console.error("🚨 خطأ في الاتصال:", error);

      setMessage({
        type: "error",
        text: "خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى",
      });

      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
      status: "draft",
    });
    setMessage(null);
  };

  // إذا لم يكن المستخدم مسجل دخول
  if (!tokens || !userInfo) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-ar flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            مطلوب تسجيل الدخول
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-200 bg-amber-50">
            <Info className="w-4 h-4" />
            <AlertDescription className="text-ar">
              يجب تسجيل الدخول كمدير أو مساعد لتتمكن من إضافة المنتجات. يرجى
              الذهاب إلى صفحة تسجيل الدخول أولاً.
            </AlertDescription>
          </Alert>
          <Button
            onClick={loadAuthData}
            className="mt-4 text-ar"
            variant="outline"
          >
            إعادة فحص حالة تسجيل الدخول
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* معلومات المستخدم */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span className="text-ar font-medium">
              مسجل دخول: {userInfo.email} (
              {userInfo.role === "admin" ? "مدير" : "مساعد"})
            </span>
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة المنتج */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ar flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة منتج جديد
          </CardTitle>
          <CardDescription className="text-ar">
            استخدم هذا النموذج لإضافة منتج جديد بشكل آمن باستخدام JWT
            authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* الحقول الأساسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-ar">
                اسم المنتج *
              </Label>
              <ArabicInput
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="أدخل اسم المنتج"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_name" className="text-ar">
                اسم المتجر *
              </Label>
              <ArabicInput
                id="store_name"
                value={formData.store_name}
                onChange={(e) =>
                  handleInputChange("store_name", e.target.value)
                }
                placeholder="أدخل اسم المتجر"
                disabled={loading}
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
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-ar">
                الكمية
              </Label>
              <ArabicInput
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="0"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_amount" className="text-ar">
                مقدار الخصم
              </Label>
              <ArabicInput
                id="discount_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.discount_amount}
                onChange={(e) =>
                  handleInputChange("discount_amount", e.target.value)
                }
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-ar">
                الحالة
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: "draft" | "published") =>
                  handleInputChange("status", value)
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="published">منشور</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-ar">
              الوصف
            </Label>
            <ArabicTextarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="أدخل وصف المنتج (اختياري)"
              disabled={loading}
              rows={3}
            />
          </div>

          {/* روابط الصور */}
          <div className="space-y-4">
            <Label className="text-ar font-medium">
              روابط الصور (اختيارية)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="space-y-2">
                  <Label
                    htmlFor={`image_url_${num}`}
                    className="text-ar text-sm"
                  >
                    رابط الصورة {num}
                  </Label>
                  <ArabicInput
                    id={`image_url_${num}`}
                    type="url"
                    value={
                      formData[`image_url_${num}` as keyof ProductFormData]
                    }
                    onChange={(e) =>
                      handleInputChange(
                        `image_url_${num}` as keyof ProductFormData,
                        e.target.value,
                      )
                    }
                    placeholder={`https://example.com/image${num}.jpg`}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={createProduct}
              disabled={
                loading ||
                !formData.name ||
                !formData.price ||
                !formData.store_name
              }
              className="flex-1 text-ar"
            >
              {loading ? "جاري الإضافة..." : "إضافة المنتج"}
            </Button>

            <Button
              onClick={resetForm}
              variant="outline"
              disabled={loading}
              className="text-ar"
            >
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* عرض الرسائل */}
      {message && (
        <Alert
          className={
            message.type === "success"
              ? "border-green-200 bg-green-50"
              : message.type === "error"
                ? "border-red-200 bg-red-50"
                : "border-blue-200 bg-blue-50"
          }
        >
          <AlertDescription
            className={`text-ar ${
              message.type === "success"
                ? "text-green-800"
                : message.type === "error"
                  ? "text-red-800"
                  : "text-blue-800"
            }`}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* معلومات تطوير */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm">معلومات التطوير</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>معرف المستخدم: {userInfo?.id}</div>
            <div>دور المستخدم: {userInfo?.role}</div>
            <div>يحتوي على توكن: {tokens?.access_token ? "نعم" : "لا"}</div>
            <div>
              معاينة التوكن:{" "}
              {tokens?.access_token
                ? `${tokens.access_token.substring(0, 20)}...`
                : "غير متاح"}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductCreator;
