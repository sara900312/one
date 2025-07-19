/**
 * خدمات معالجة الأخطاء المحسنة
 * Error handling utilities for better error display and management
 */

export interface FormattedError {
  message: string;
  technical: string;
  code?: string;
  type: "network" | "validation" | "server" | "auth" | "unknown";
}

/**
 * دالة لتنسيق الأخطاء وعرضها بشكل واضح
 * Format error objects into readable messages
 */
export function formatError(error: any): FormattedError {
  if (!error) {
    return {
      message: "خطأ غير معروف",
      technical: "Unknown error",
      type: "unknown",
    };
  }

  // Supabase errors
  if (error.code || error.hint || error.details) {
    const message = getArabicErrorMessage(error);
    return {
      message,
      technical: error.message || String(error),
      code: error.code,
      type: getErrorType(error),
    };
  }

  // Network errors
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return {
      message: "خطأ في الاتصال بالإنترنت",
      technical: error.message,
      type: "network",
    };
  }

  // HTTP errors
  if (error.status || error.response) {
    const status = error.status || error.response?.status;
    return {
      message: getHttpErrorMessage(status),
      technical: error.message || `HTTP ${status}`,
      code: String(status),
      type: "server",
    };
  }

  // Authentication errors
  if (error.message && error.message.includes("auth")) {
    return {
      message: "خطأ في المصادقة",
      technical: error.message,
      type: "auth",
    };
  }

  // General errors with message
  if (error.message) {
    return {
      message: getArabicErrorMessage(error),
      technical: error.message,
      type: "unknown",
    };
  }

  // Object errors - convert to JSON
  if (typeof error === "object") {
    try {
      const technical = JSON.stringify(error, null, 2);
      return {
        message: "حدث خطأ في النظام",
        technical,
        type: "unknown",
      };
    } catch {
      return {
        message: "حدث خطأ في النظام",
        technical: String(error),
        type: "unknown",
      };
    }
  }

  // Fallback for string errors
  return {
    message: String(error),
    technical: String(error),
    type: "unknown",
  };
}

/**
 * تحديد نوع الخطأ بناءً على محتواه
 * Determine error type based on error content
 */
function getErrorType(error: any): FormattedError["type"] {
  if (error.code) {
    // Supabase/PostgreSQL error codes
    if (error.code.startsWith("23")) return "validation"; // Constraint violations
    if (error.code.startsWith("42")) return "server"; // Syntax errors
    if (error.code.startsWith("53")) return "server"; // Resource errors
    if (["PGRST301", "PGRST302"].includes(error.code)) return "auth";
  }

  if (error.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes("network") || msg.includes("fetch")) return "network";
    if (msg.includes("auth") || msg.includes("unauthorized")) return "auth";
    if (msg.includes("validation") || msg.includes("invalid"))
      return "validation";
  }

  return "server";
}

/**
 * تحويل رموز HTTP إلى رسائل عربية مفهومة
 * Convert HTTP status codes to Arabic messages
 */
function getHttpErrorMessage(status: number): string {
  const httpMessages: Record<number, string> = {
    400: "بيانات غير صحيحة",
    401: "غير مصرح لك بالوصول",
    403: "ممنوع من الوصول",
    404: "المورد غير موجود",
    409: "تضارب في البيانات",
    422: "بيانات غير صالحة",
    429: "كثرة المحاولات - حاول لاحقاً",
    500: "خطأ في الخادم",
    502: "خطأ في البوابة",
    503: "الخدمة غير متاحة مؤقتاً",
    504: "انتهت مهلة الاتصال",
  };

  return httpMessages[status] || `خطأ HTTP ${status}`;
}

/**
 * تحويل أخطاء قاعدة البيانات إلى رسائل عربية
 * Convert database errors to Arabic messages
 */
function getArabicErrorMessage(error: any): string {
  if (!error.code && !error.message) return "حدث خطأ غير متوقع";

  // Supabase/PostgreSQL specific errors
  const postgresqlMessages: Record<string, string> = {
    "23505": "البيانات موجودة مسبقاً",
    "23503": "البيانات المرجعية غير موجودة",
    "23502": "حقل مطلوب مفقود",
    "23514": "البيانات لا تتوافق مع القواعد المحددة",
    "42703": "عمود غير موجود",
    "42P01": "جدول غير موجود",
    PGRST301: "المورد غير موجود",
    PGRST302: "غير مصرح لك بهذا الإجراء",
  };

  if (error.code && postgresqlMessages[error.code]) {
    return postgresqlMessages[error.code];
  }

  // Check message content for common patterns
  if (error.message) {
    const msg = error.message.toLowerCase();

    if (msg.includes("unique") || msg.includes("duplicate")) {
      return "البيانات موجودة مسبقاً";
    }
    if (msg.includes("foreign key") || msg.includes("violates")) {
      return "البيانات المرجعية غير صحيحة";
    }
    if (msg.includes("not null") || msg.includes("required")) {
      return "حقل مطلوب مفقود";
    }
    if (msg.includes("permission") || msg.includes("unauthorized")) {
      return "غير مصرح لك بهذا الإجراء";
    }
    if (msg.includes("connection") || msg.includes("timeout")) {
      return "مشكلة في الاتصال";
    }
  }

  return "حدث خطأ في النظام";
}

/**
 * طباعة الخطأ في الكونسول بتنسيق واضح
 * Log error to console with clear formatting
 */
export function logError(operation: string, error: any, context?: any): void {
  const formatted = formatError(error);

  console.group(`❌ ${operation} Error`);
  console.error("Arabic Message:", formatted.message);
  console.error("Technical Details:", formatted.technical);
  if (formatted.code) {
    console.error("Error Code:", formatted.code);
  }
  console.error("Error Type:", formatted.type);
  if (context) {
    console.error("Context:", context);
  }
  console.groupEnd();
}

/**
 * معالجة شاملة للأخطاء مع العرض والتسجيل
 * Comprehensive error handling with display and logging
 */
export async function handleError(
  operation: string,
  error: any,
  options: {
    showToast?: boolean;
    logToConsole?: boolean;
    context?: any;
    fallbackMessage?: string;
  } = {},
): Promise<FormattedError> {
  const {
    showToast = true,
    logToConsole = true,
    context,
    fallbackMessage,
  } = options;

  const formatted = formatError(error);

  // Log to console if enabled
  if (logToConsole) {
    logError(operation, error, context);
  }

  // Show toast notification if enabled
  if (showToast && typeof window !== "undefined") {
    // Import toast dynamically to avoid SSR issues
    const { toast } = await import("sonner");
    const message = fallbackMessage || formatted.message;
    toast.error(message);
  }

  return formatted;
}

/**
 * دالة مساعدة لمعالجة أخطاء العمليات غير المتزامنة
 * Helper for handling async operation errors
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  options?: {
    showToast?: boolean;
    logToConsole?: boolean;
    context?: any;
    fallbackMessage?: string;
    retryCount?: number;
    retryDelay?: number;
  },
): Promise<{ data: T | null; error: FormattedError | null }> {
  const { retryCount = 0, retryDelay = 1000, ...errorOptions } = options || {};

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const data = await operation();
      return { data, error: null };
    } catch (error) {
      // If it's the last attempt or no retries specified, handle the error
      if (attempt === retryCount) {
        const formattedError = await handleError(
          operationName,
          error,
          errorOptions,
        );
        return { data: null, error: formattedError };
      }

      // Wait before retry (except for the last attempt)
      if (attempt < retryCount && retryDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  return { data: null, error: null };
}

/**
 * دالة للتحقق من صحة الاستجابة من API
 * Validate API response and handle errors
 */
export async function validateResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `HTTP ${response.status}` };
    }

    throw {
      status: response.status,
      message: errorData.message || `HTTP error ${response.status}`,
      ...errorData,
    };
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error("فشل في قراءة استجابة الخادم");
  }
}

/**
 * مثال على الاستخدام المطلوب - جلب المتاجر مع معالجة الأخطاء المحسنة
 * Example usage - fetch stores with improved error handling
 */
export async function fetchStoresExample() {
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
    // استخدام دالة formatError لتحويل الخطأ إلى نص قابل للقراءة
    const formattedErrorText = formatError(error);
    console.error("Fetch Stores Error:", formattedErrorText.technical);

    // عرض الخطأ للمستخدم
    if (typeof window !== "undefined") {
      alert(`خطأ في جلب المتاجر: ${formattedErrorText.message}`);
    }

    return null;
  }
}

/**
 * دالة مساعدة لطباعة أو إظهار الخطأ بشكل واضح (كما طلب المستخدم)
 * Helper function to print or display error clearly (as requested by user)
 */
export function formatErrorSimple(error: any): string {
  if (!error) return "Unknown error";

  // لو الخطأ يحتوي على خاصية message
  if (error.message) return error.message;

  // لو الخطأ هو رد من API مع JSON
  if (typeof error === "object") {
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }

  return String(error);
}
