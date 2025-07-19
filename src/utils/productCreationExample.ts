/**
 * مثال شامل لإنشاء المنتجات مع معالجة صحيحة لـ RLS
 * Complete example for product creation with proper RLS handling
 */

import { supabase } from "@/integrations/supabase/client";
import {
  createProductSafely,
  verifyUserSession,
  checkUserPermissions,
} from "./authHelpers";
import { formatError } from "./errorHelpers";

/**
 * ✅ الطريقة الصحيحة لإنشاء منتج جديد
 * Correct way to create a new product
 */
export async function createProductCorrectly(productFormData: {
  name: string;
  description?: string;
  price: string | number;
  quantity: string | number;
  discount_amount?: string | number;
  store_name: string;
  image_url_1?: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
}) {
  try {
    // 1. التحقق من الصلاحيات أولاً
    const permissions = await checkUserPermissions();

    if (!permissions.canCreateProducts) {
      throw new Error(
        `غير مصرح لك بإنشاء منتجات. دورك الحالي: ${permissions.userRole}`,
      );
    }

    // 2. تنسيق البيانات
    const formattedData = {
      name: productFormData.name,
      description: productFormData.description || "",
      price:
        typeof productFormData.price === "string"
          ? parseFloat(productFormData.price) || 0
          : productFormData.price,
      quantity:
        typeof productFormData.quantity === "string"
          ? parseInt(productFormData.quantity) || 0
          : productFormData.quantity,
      discount_amount:
        typeof productFormData.discount_amount === "string"
          ? parseFloat(productFormData.discount_amount) || 0
          : productFormData.discount_amount || 0,
      store_name: productFormData.store_name,
      image_url_1: productFormData.image_url_1 || "",
      image_url_2: productFormData.image_url_2 || "",
      image_url_3: productFormData.image_url_3 || "",
      image_url_4: productFormData.image_url_4 || "",
      status: "draft" as const,
    };

    // 3. إنشاء المنتج باستخدام الدالة الآمنة
    const result = await createProductSafely(formattedData);

    if (result.success) {
      console.log("✅ تم إنشاء المنتج بنجاح:", result.data);
      return result;
    } else {
      console.error("❌ فشل في إنشاء المنتج:", result.error);
      throw new Error(result.error || "فشل في إنشاء المنتج");
    }
  } catch (error) {
    const formattedError = formatError(error);
    console.error("❌ خطأ في إنشاء المنتج:", formattedError);
    throw new Error(formattedError.message);
  }
}

/**
 * ✅ مثال لاستخدام Supabase auth مباشرة (طريقة بديلة)
 * Example using Supabase auth directly (alternative method)
 */
export async function createProductWithSupabaseAuth(productData: any) {
  try {
    // 1. الحصول على المستخدم الحالي من Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("المستخدم غير مصرح له بالدخول");
    }

    console.log("🔑 معرف المستخدم الحالي:", user.id);

    // 2. إعداد بيانات المنتج
    const newProduct = {
      name: productData.name,
      description: productData.description || null,
      price: parseFloat(productData.price) || 0,
      quantity: parseInt(productData.quantity) || 0,
      discount_amount: parseFloat(productData.discount_amount) || 0,
      store_name: productData.store_name,
      image_url_1: productData.image_url_1 || null,
      image_url_2: productData.image_url_2 || null,
      image_url_3: productData.image_url_3 || null,
      image_url_4: productData.image_url_4 || null,
      created_by: user.id, // 🔑 هذا هو المفتاح الأساسي
      status: "draft",
    };

    console.log("📝 بيانات المنتج المرسلة:", {
      name: newProduct.name,
      created_by: newProduct.created_by,
      status: newProduct.status,
    });

    // 3. إدخال المنتج
    const { data, error } = await supabase
      .from("products")
      .insert([newProduct])
      .select("*")
      .single();

    if (error) {
      console.error("❌ خطأ Supabase:", error);

      // معالجة أخطاء RLS المحددة
      if (error.message.includes("row-level security policy")) {
        throw new Error(
          "انتهكت سياسة الأمان: غير مصرح لك بإضافة منتجات. تأكد من تسجيل الدخول بحساب صالح.",
        );
      }

      if (error.message.includes("violates not-null constraint")) {
        throw new Error(
          "بيانات مطلوبة مفقودة. تأكد من ملء جميع الحقول المطلوبة.",
        );
      }

      throw new Error(formatError(error).message);
    }

    console.log("✅ تم إنشاء المنتج بنجاح:", data);
    return { success: true, data, message: "تم إضافة المنتج بنجاح" };
  } catch (error) {
    const formattedError = formatError(error);
    console.error("❌ خطأ في إنشاء المنتج:", formattedError);
    return { success: false, error: formattedError.message, data: null };
  }
}

/**
 * 🔧 دالة للتشخيص والاختبار
 * Diagnostic and testing function
 */
export async function testProductCreation() {
  console.group("🧪 اختبار إنشاء المنتجات");

  try {
    // 1. فحص المصادقة
    const { userId, isAuthenticated } = await verifyUserSession();
    console.log("حالة المصادقة:", isAuthenticated ? "مصرح" : "غير مصرح");
    console.log("معرف المستخدم:", userId || "غير متاح");

    if (!isAuthenticated) {
      console.error("❌ فشل الاختبار: المستخدم غير مصرح له");
      return;
    }

    // 2. فحص الصلاحيات
    const permissions = await checkUserPermissions();
    console.log("صلاحيات المستخدم:", permissions);

    if (!permissions.canCreateProducts) {
      console.error("❌ فشل الاختبار: المستخدم لا يملك صلاحية إنشاء منتجات");
      return;
    }

    // 3. اختبار إنشاء منتج تجريبي
    const testProduct = {
      name: "منتج تجريبي " + Date.now(),
      description: "هذا منتج تجريبي لاختبار النظام",
      price: 99.99,
      quantity: 10,
      discount_amount: 5,
      store_name: "متجر تجريبي",
    };

    console.log("🔄 إنشاء منتج تجريبي...");
    const result = await createProductSafely(testProduct);

    if (result.success) {
      console.log("✅ نجح الاختبار: تم إنشاء المنتج التجريبي");

      // حذف المنتج التجريبي
      if (result.data?.id) {
        await supabase.from("products").delete().eq("id", result.data.id);
        console.log("🗑️ تم حذف المنتج التجريبي");
      }
    } else {
      console.error("❌ فشل الاختبار:", result.error);
    }
  } catch (error) {
    console.error("❌ خطأ في الاختبار:", formatError(error));
  }

  console.groupEnd();
}

/**
 * 📋 دالة لتحديث المكونات الموجودة
 * Function to update existing components
 */
export const productCreationBestPractices = {
  // ✅ الطريقة الصحيحة في React component
  correctReactImplementation: `
// في مكون React:
import { useAuth } from '@/hooks/useAuth';
import { createProductSafely } from '@/utils/authHelpers';

function AddProductComponent() {
  const { user } = useAuth();
  
  const handleSubmit = async (formData) => {
    // التحقق من المصادقة
    if (!user?.id) {
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }
    
    try {
      const result = await createProductSafely(formData);
      
      if (result.success) {
        toast.success('تم إضافة المنتج بنجاح');
        // إعادة تعيين النموذج أو تحديث القائمة
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('حدث خطأ في إضافة المنتج');
    }
  };
}
  `,

  // ❌ الأخطاء الشائعة
  commonMistakes: `
// ❌ لا تفعل هذا:
// 1. عدم تعيين created_by
const productWithoutCreator = { name: 'منت��', price: 100 };

// 2. تعيين created_by خاطئ
const productWithWrongCreator = { 
  name: 'منتج', 
  created_by: 'some-random-id' 
};

// 3. عدم التحقق من المصادقة
await supabase.from('products').insert(product); // بدون تحقق
  `,

  // ✅ الطريقة الصحيحة
  correctImplementation: `
// ✅ افعل هذا:
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('غير مصرح');

const product = {
  name: 'منتج جديد',
  price: 100,
  created_by: user.id // ✅ صحيح
};

const { data, error } = await supabase
  .from('products')
  .insert([product]);
  `,
};

// تصدير دالة الاختبار للاستخدام في console
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // يمكن استدعاء testProductCreation() في console المتصفح
  (window as any).testProductCreation = testProductCreation;
  console.log(
    "💡 يمكنك تشغيل testProductCreation() في console لاختبار إنشاء المنتجات",
  );
}
