/**
 * دوال مساعدة للتحقق من المصادقة وإنشاء المنتجات
 * Helper functions for authentication and product creation
 */

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatError, handleError } from "./errorHelpers";

/**
 * التحقق من معرف المستخدم الحالي
 * Get current user ID safely
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    // محاولة الحصول على المستخدم من Supabase auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      return user.id;
    }

    // محاولة الحصول على المستخدم من useAuth hook
    // (هذا يتطلب استخدام الدالة داخل component)
    return null;
  } catch (error) {
    console.error("خطأ في الحصول على معرف المستخدم:", formatError(error));
    return null;
  }
}

/**
 * التحقق من جلسة المستخدم وإعادة معرفه
 * Verify user session and return user ID
 */
export async function verifyUserSession(): Promise<{
  userId: string | null;
  isAuthenticated: boolean;
}> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("خطأ في جلسة المستخدم:", formatError(error));
      return { userId: null, isAuthenticated: false };
    }

    if (session?.user?.id) {
      return { userId: session.user.id, isAuthenticated: true };
    }

    return { userId: null, isAuthenticated: false };
  } catch (error) {
    console.error("خطأ في التحقق من الجلسة:", formatError(error));
    return { userId: null, isAuthenticated: false };
  }
}

/**
 * إنشاء منتج جديد مع التأكد من تعيين created_by بشكل صحيح
 * Create new product ensuring created_by is set correctly
 */
export async function createProductSafely(productData: {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  discount_amount?: number;
  store_name: string;
  image_url_1?: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
  status?: "draft" | "published";
}) {
  try {
    // 1. التحقق من المصادقة
    const { userId, isAuthenticated } = await verifyUserSession();

    if (!isAuthenticated || !userId) {
      throw new Error("المستخدم غير مصرح له بالدخول");
    }

    // 2. إعداد بيانات المنتج مع created_by
    const productPayload = {
      name: productData.name,
      description: productData.description || null,
      price: productData.price,
      quantity: productData.quantity,
      discount_amount: productData.discount_amount || 0,
      store_name: productData.store_name,
      image_url_1: productData.image_url_1 || null,
      image_url_2: productData.image_url_2 || null,
      image_url_3: productData.image_url_3 || null,
      image_url_4: productData.image_url_4 || null,
      status: productData.status || "draft",
      created_by: userId, // 🔑 المفتاح الأساسي - تعيين معرف المستخدم
      created_at: new Date().toISOString(),
    };

    console.log("🔄 محاولة إنشاء منتج:", {
      productName: productPayload.name,
      userId: productPayload.created_by,
      status: productPayload.status,
    });

    // 3. إدخال المنتج في قاعدة البيانات
    const { data, error } = await supabase
      .from("products")
      .insert([productPayload])
      .select("*")
      .single();

    if (error) {
      console.error("❌ خطأ في إدخال المنتج:", {
        error: formatError(error),
        productData: productPayload,
        userId,
      });

      // معالجة أخطاء RLS المحددة
      if (error.message?.includes("row-level security policy")) {
        throw new Error(
          "غير مصرح لك بإضافة منتجات. يرجى التأكد من تسجيل الدخول بحساب صالح.",
        );
      }

      throw error;
    }

    console.log("✅ تم إنشاء المنتج بنجاح:", data);
    return { success: true, data, message: "تم إضافة المنتج بنجاح" };
  } catch (error) {
    const formattedError = formatError(error);
    console.error("❌ فشل في إنشاء المنتج:", formattedError);

    return {
      success: false,
      error: formattedError.message,
      data: null,
    };
  }
}

/**
 * التح��ق من صلاحيات المستخدم
 * Check user permissions
 */
export async function checkUserPermissions(): Promise<{
  canCreateProducts: boolean;
  canViewProducts: boolean;
  canEditProducts: boolean;
  userRole: string;
}> {
  try {
    const { userId, isAuthenticated } = await verifyUserSession();

    if (!isAuthenticated || !userId) {
      return {
        canCreateProducts: false,
        canViewProducts: false,
        canEditProducts: false,
        userRole: "anonymous",
      };
    }

    // التحقق من دور المستخدم في system_users
    const { data: systemUser } = await supabase
      .from("system_users")
      .select("role")
      .eq("id", userId)
      .single();

    if (systemUser?.role) {
      const isAdmin = systemUser.role === "admin";
      const isAssistant = systemUser.role === "assistant";

      return {
        canCreateProducts: isAdmin || isAssistant,
        canViewProducts: true,
        canEditProducts: isAdmin || isAssistant,
        userRole: systemUser.role,
      };
    }

    // التحقق من المتاجر
    const { data: store } = await supabase
      .from("stores")
      .select("id, is_active")
      .eq("id", userId)
      .single();

    if (store?.is_active) {
      return {
        canCreateProducts: false, // المتاجر لا تنشئ منتجات
        canViewProducts: true,
        canEditProducts: false,
        userRole: "store",
      };
    }

    return {
      canCreateProducts: false,
      canViewProducts: true,
      canEditProducts: false,
      userRole: "user",
    };
  } catch (error) {
    console.error("خطأ في فحص الصلاحيات:", formatError(error));
    return {
      canCreateProducts: false,
      canViewProducts: false,
      canEditProducts: false,
      userRole: "error",
    };
  }
}

/**
 * دالة للتشخيص - فحص حالة المصادقة
 * Diagnostic function - check authentication status
 */
export async function diagnoseAuthIssues(): Promise<void> {
  console.group("🔍 تشخيص مشاكل المصادقة");

  try {
    // 1. فحص الجلسة
    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log("جلسة Supabase:", session ? "موجودة" : "غير موجودة");
    console.log("معرف المستخدم من الجلسة:", session?.user?.id || "غير متاح");

    // 2. فحص المستخدم الحالي
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("المستخدم الحالي:", user ? "موجود" : "غير موجود");
    console.log("معرف المستخدم:", user?.id || "غير متاح");

    // 3. فحص localStorage
    const authToken = localStorage.getItem("auth_token");
    const authUser = localStorage.getItem("auth_user");
    console.log("Token في localStorage:", authToken ? "موجود" : "غير موجود");
    console.log(
      "بيانات المستخدم في localStorage:",
      authUser ? "موجودة" : "غير موجودة",
    );

    if (authUser) {
      try {
        const parsedUser = JSON.parse(authUser);
        console.log(
          "معرف المستخدم من localStorage:",
          parsedUser?.id || "غير متاح",
        );
      } catch {
        console.log("خطأ في تحليل بيانات المستخدم من localStorage");
      }
    }

    // 4. اختبار استعلام بسيط
    const { data, error } = await supabase
      .from("products")
      .select("count(*)")
      .limit(1);

    console.log("اختبار استعلام قاعدة البيانات:", error ? "فشل" : "نجح");
    if (error) {
      console.error("خطأ الاستعلام:", formatError(error));
    }

    // 5. فحص الصلاحيات
    const permissions = await checkUserPermissions();
    console.log("صلاحيات المستخدم:", permissions);
  } catch (error) {
    console.error("خطأ في التشخيص:", formatError(error));
  }

  console.groupEnd();
}

/**
 * Hook مخصص للتحقق من المصادقة والصلاحيات
 * Custom hook for authentication and permissions
 */
export function useAuthenticationCheck() {
  const { user } = useAuth();

  const checkAndCreateProduct = async (productData: any) => {
    // التأكد من وجود المستخدم من useAuth
    if (!user?.id) {
      throw new Error("المستخدم غير مصرح له بالدخول - يرجى تسجيل الدخول أولاً");
    }

    // استخدام معرف المستخدم من useAuth
    const productWithCreator = {
      ...productData,
      created_by: user.id,
    };

    return await createProductSafely(productWithCreator);
  };

  return {
    user,
    isAuthenticated: !!user?.id,
    checkAndCreateProduct,
    diagnose: diagnoseAuthIssues,
  };
}
