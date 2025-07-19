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
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { ApiResponse } from "@/types/database";
import { handleError, logError } from "@/utils/errorHelpers";

interface CreateStoreProps {
  onStoreCreated: () => void;
}

const CreateStore: React.FC<CreateStoreProps> = ({ onStoreCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    owner_email: "",
    phone: "",
    address: "",
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

    if (!formData.name || !formData.username || !formData.password) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }

    if (!user?.id) {
      toast.error("خطأ في المصادقة");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("create_store", {
        p_name: formData.name,
        p_username: formData.username,
        p_password: formData.password,
        p_owner_email: formData.owner_email || null,
        p_phone: formData.phone || null,
        p_address: formData.address || null,
        p_created_by: user.id,
      });

      if (error) {
        await handleError("إنشاء المتجر", error, {
          context: { storeName: formData.name, username: formData.username },
          fallbackMessage: "فشل في إنشاء المتجر",
        });
        return;
      }

      const response = data as ApiResponse;
      if (response?.success) {
        toast.success(response.message || "تم إنشاء المتجر بنجاح");
        setFormData({
          name: "",
          username: "",
          password: "",
          owner_email: "",
          phone: "",
          address: "",
        });
        onStoreCreated();
      } else {
        await handleError(
          "إنشاء المتجر",
          { message: response?.error },
          {
            context: { response },
            fallbackMessage: "فشل في إنشاء المتجر",
          },
        );
      }
    } catch (error) {
      await handleError("إنشاء المتجر", error, {
        context: { formData: { ...formData, password: "[HIDDEN]" } },
        fallbackMessage: "حدث خطأ غير متوقع أثناء إنشاء المتجر",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-ar flex items-center gap-2">
          <Store className="w-5 h-5" />
          إنشاء متجر جديد
        </CardTitle>
        <CardDescription className="text-ar">
          أضف متجر جديد للنظام
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-ar">
                اسم المتجر *
              </Label>
              <ArabicInput
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="أدخل اسم المتجر"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-ar">
                اسم المستخدم *
              </Label>
              <ArabicInput
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="أدخل اسم المستخدم"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-ar">
                كلمة المرور *
              </Label>
              <ArabicInput
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="أدخل كلمة المرور"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_email" className="text-ar">
                البريد الإلكتروني
              </Label>
              <ArabicInput
                id="owner_email"
                type="email"
                value={formData.owner_email}
                onChange={(e) =>
                  handleInputChange("owner_email", e.target.value)
                }
                placeholder="أدخل البريد الإلكتروني"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-ar">
                رقم الهاتف
              </Label>
              <ArabicInput
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="أدخل رقم الهاتف"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-ar">
                العنوان
              </Label>
              <ArabicInput
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="أدخل العنوان"
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full text-ar"
            disabled={
              loading ||
              !formData.name ||
              !formData.username ||
              !formData.password
            }
          >
            {loading ? "جاري الإنشاء..." : "إنشاء المتجر"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateStore;
