/**
 * أمثلة عملية على تحسين معالجة الأخطاء
 * Practical examples of improved error handling
 *
 * هذا الملف يوضح الطرق المحسنة لمعالجة الأخطاء بدلاً من عرض [object Object]
 * This file demonstrates improved error handling methods instead of showing [object Object]
 */

import {
  formatError,
  formatErrorSimple,
  handleError,
  logError,
} from "./errorHelpers";
import { supabase } from "@/integrations/supabase/client";

/**
 * ❌ الطريقة القديمة - تظهر [object Object]
 * OLD WAY - Shows [object Object]
 */
export async function fetchStoresOldWay() {
  try {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Fetch Stores Error:", error); // ❌ يظهر [object Object]
      return;
    }

    return data;
  } catch (error) {
    console.error("Fetch Stores Error:", error); // ❌ يظهر [object Object]
  }
}

/**
 * ✅ الطريقة الجديدة المحسنة - تظهر رسائل واضحة
 * NEW IMPROVED WAY - Shows clear messages
 */
export async function fetchStoresNewWay() {
  try {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("is_active", true);

    if (error) {
      // ✅ استخدام formatErrorSimple للحصول على نص واضح
      console.error("Fetch Stores Error:", formatErrorSimple(error));

      // ✅ أو استخدام handleError للمعالجة الكاملة
      await handleError("جلب المتاجر", error, {
        context: { operation: "fetch_active_stores" },
        fallbackMessage: "فشل في تحميل المتاجر",
      });
      return;
    }

    return data;
  } catch (error) {
    // ✅ معالجة محسنة للأخطاء العامة
    const formatted = formatError(error);
    console.error("Fetch Stores Error:", formatted.technical);
    console.error("User Message:", formatted.message);
  }
}

/**
 * ✅ مثال كامل لجلب المنتجات مع معالجة الأخطاء
 * Complete example for fetching products with error handling
 */
export async function fetchProductsWithErrorHandling(userId: string) {
  try {
    const { data, error } = await supabase.rpc("get_products", {
      p_user_id: userId,
    });

    if (error) {
      // ✅ رسالة خطأ واضحة بدلاً من [object Object]
      const errorMessage = formatErrorSimple(error);
      console.error("Products Fetch Error:", errorMessage);

      // ✅ عرض الخطأ للمستخدم بوضوح
      if (typeof window !== "undefined") {
        alert(`خطأ في جلب المنتجات: ${errorMessage}`);
      }

      return [];
    }

    console.log("Products fetched successfully:", data?.length || 0, "items");
    return data || [];
  } catch (error) {
    // ✅ معالجة الأخطاء غير المتوقعة
    const formatted = formatError(error);

    console.group("❌ خطأ في جلب المنتجات");
    console.error("الرسالة العربية:", formatted.message);
    console.error("التفاصيل التقنية:", formatted.technical);
    console.error("نوع الخطأ:", formatted.type);
    console.error("معرف المستخدم:", userId);
    console.groupEnd();

    return [];
  }
}

/**
 * ✅ مثال على إضافة منتج مع معالجة أخطاء شاملة
 * Example of adding a product with comprehensive error handling
 */
export async function addProductWithErrorHandling(
  productData: any,
  userId: string,
) {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert({
        ...productData,
        created_by: userId,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      // ✅ تحليل نوع الخطأ وعرض رسالة مناسبة
      const formatted = formatError(error);

      // طباعة واضحة في الكونسول
      logError("إضافة منتج", error, { productData, userId });

      // رسالة مفهومة للمستخدم
      const userMessage = formatted.message || "فشل في إضافة المنتج";

      if (typeof window !== "undefined") {
        alert(`خطأ في إضافة المنتج: ${userMessage}`);
      }

      return { success: false, error: userMessage };
    }

    console.log("✅ تم إضافة المنتج بنجاح:", data.name);
    return { success: true, data };
  } catch (error) {
    // ✅ معالجة الأخطاء العامة مع سياق كامل
    await handleError("إضافة منتج", error, {
      context: {
        productName: productData.name,
        userId,
        operation: "insert_product",
      },
      fallbackMessage: "حدث خطأ غير متوقع أثناء إضافة المنتج",
    });

    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

/**
 * ✅ مثال على معالجة أخطاء HTTP مع fetch
 * Example of handling HTTP errors with fetch
 */
export async function fetchWithProperErrorHandling(url: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      // ✅ محاولة قراءة رسالة الخطأ من الاستجابة
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }

      const errorMessage =
        errorData?.message || `HTTP error ${response.status}`;
      console.error("API Error:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // ✅ تحويل الخطأ إلى نص واضح
    const errorText = formatErrorSimple(error);
    console.error("Fetch Error Details:", errorText);

    // عرض خطأ واضح للمستخدم
    if (typeof window !== "undefined") {
      alert(`خطأ في الطلب: ${errorText}`);
    }

    throw error;
  }
}

/**
 * ✅ مثال مبسط لمعالجة الأخطاء (حسب طلب المستخدم)
 * Simplified example for error handling (as requested by user)
 */
export function simpleErrorHandling() {
  // دالة مساعدة لتحويل الخطأ إلى نص قابل للقراءة
  function formatError(error: any): string {
    if (!error) return "Unknown error";
    if (error.message) return error.message;
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }

  // مثال على الاستخدام
  async function fetchStores() {
    try {
      const response = await fetch("/api/stores");
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error ${response.status}`);
      }
      const stores = await response.json();
      console.log("Stores fetched:", stores);
      return stores;
    } catch (error) {
      console.error("Fetch Stores Error:", formatError(error));
      alert(`خطأ في جلب المتاجر: ${formatError(error)}`);
    }
  }

  return { formatError, fetchStores };
}

/**
 * 🔧 اختبار معالجة الأخطاء
 * Test error handling
 */
export async function testErrorHandling() {
  console.group("🧪 اختبار معالجة الأخطاء");

  // اختبار خطأ عادي
  const normalError = new Error("رسالة خطأ عادية");
  console.log("خطأ عادي:", formatErrorSimple(normalError));

  // اختبار كائن خطأ
  const objectError = {
    code: "23505",
    message: "duplicate key value",
    details: "Key already exists",
  };
  console.log("كائن خطأ:", formatErrorSimple(objectError));

  // اختبار خطأ undefined
  console.log("خطأ undefined:", formatErrorSimple(undefined));

  console.groupEnd();
}

// تشغيل الاختبار عند تحميل الملف (في بيئة التطوير فقط)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // يمكن استدعاء testErrorHandling() لاختبار معالجة الأخطاء
  // testErrorHandling();
}
