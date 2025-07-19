import React, { useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { addProductManual } from "@/utils/productHelpers";
import { handleError } from "@/utils/errorHelpers";
import { checkUserPermissions } from "@/utils/authHelpers";

interface AddProductManualProps {
  onProductAdded: () => void;
}

const AddProductManual: React.FC<AddProductManualProps> = ({
  onProductAdded,
}) => {
  const [formData, setFormData] = useState({
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
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. فحص الحقول المطلوبة
    if (!formData.name || !formData.price || !formData.store_name) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }

    // 2. فحص المصادقة
    if (!user?.id) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return;
    }

    // 3. فحص الصلاحيات
    try {
      const permissions = await checkUserPermissions();
      if (!permissions.canCreateProducts) {
        toast.error(
          `غير مصرح لك بإضافة منتجات. دورك الحالي: ${permissions.userRole}`,
        );
        return;
      }
    } catch (error) {
      console.error("خطأ في فحص الصلاحيات:", error);
      toast.error("خطأ في التحقق من الصلاحيات");
      return;
    }

    setLoading(true);
    console.log("📝 محاولة إضافة منتج:", {
      productName: formData.name,
      userId: user.id,
      storeName: formData.store_name,
    });

    try {
      const response = await addProductManual({
        p_name: formData.name,
        p_description: formData.description || null,
        p_price: parseFloat(formData.price) || 0,
        p_quantity: parseInt(formData.quantity) || 0,
        p_discount_amount: parseFloat(formData.discount_amount) || 0,
        p_store_name: formData.store_name,
        p_image_url_1: formData.image_url_1 || null,
        p_image_url_2: formData.image_url_2 || null,
        p_image_url_3: formData.image_url_3 || null,
        p_image_url_4: formData.image_url_4 || null,
        p_created_by: user.id,
      });

      if (response?.success) {
        toast.success(response.message || "تم إضافة المنتج بنجاح");
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
        });
        onProductAdded();
      } else {
        await handleError(
          "إضافة منتج يدوي",
          { message: response?.error },
          {
            context: {
              productName: formData.name,
              storeName: formData.store_name,
            },
            fallbackMessage: "فشل في إضافة المنتج",
          },
        );
      }
    } catch (error) {
      await handleError("إضافة منتج يدوي", error, {
        context: {
          formData: {
            ...formData,
            // Remove sensitive data from logs
            price: formData.price ? "SET" : "EMPTY",
            quantity: formData.quantity ? "SET" : "EMPTY",
          },
        },
        fallbackMessage: "حدث خطأ غير متوقع أثناء إضافة المنتج",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-ar flex items-center gap-2">
          <Plus className="w-5 h-5" />
          إضافة منتج يدوياً
        </CardTitle>
        <CardDescription className="text-ar">
          املأ بيانات المنتج بالتفصيل
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="أدخل السعر"
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
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="أدخل الكمية"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_amount" className="text-ar">
                مقدار التخفيض
              </Label>
              <ArabicInput
                id="discount_amount"
                type="number"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) =>
                  handleInputChange("discount_amount", e.target.value)
                }
                placeholder="أدخل مقدار التخفيض"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-ar">
              الوصف
            </Label>
            <ArabicTextarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="أدخل وصف المنتج"
              disabled={loading}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-ar">روابط الصور</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="space-y-2">
                  <Label htmlFor={`image_url_${num}`} className="text-ar">
                    رابط الصورة {num}
                  </Label>
                  <ArabicInput
                    id={`image_url_${num}`}
                    type="url"
                    value={
                      formData[`image_url_${num}` as keyof typeof formData]
                    }
                    onChange={(e) =>
                      handleInputChange(`image_url_${num}`, e.target.value)
                    }
                    placeholder={`أدخل رابط الصورة ${num}`}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full text-ar"
            disabled={
              loading ||
              !formData.name ||
              !formData.price ||
              !formData.store_name
            }
          >
            {loading ? "جاري الإضافة..." : "إضافة المنتج"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddProductManual;
