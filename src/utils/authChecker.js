/**
 * 🔍 دالة فحص صلاحية التوكن وبيانات المستخدم في localStorage
 * هذه الدالة تتحقق من وجود وصحة بيانات المصادقة المحفوظة
 */

function checkAuthData() {
  console.log("🔍 بدء فحص بيانات المصادقة في localStorage...\n");

  try {
    const tokens = localStorage.getItem("supabase_auth_tokens");
    const userInfo = localStorage.getItem("supabase_user_info");

    // فحص التوكنات
    console.log("📝 فحص التوكنات:");
    if (!tokens) {
      console.log("❌ توكن المصادقة غير موجود في localStorage.");
    } else {
      const parsedTokens = JSON.parse(tokens);
      console.log("✅ توكن المصادقة موجود:", parsedTokens);

      if (!parsedTokens.access_token) {
        console.log("❌ لا يوجد access_token داخل التوكنات.");
      } else {
        console.log("✅ access_token موجود.");

        // فحص انتهاء صلاحية التوكن
        try {
          const tokenPayload = JSON.parse(
            atob(parsedTokens.access_token.split(".")[1]),
          );
          const expirationDate = new Date(tokenPayload.exp * 1000);
          const now = new Date();

          console.log(
            `⏰ التوكن ينتهي في: ${expirationDate.toLocaleString("ar-SA")}`,
          );

          if (expirationDate > now) {
            const timeLeft = Math.round((expirationDate - now) / (1000 * 60)); // بالدقائق
            console.log(`✅ التوكن صالح لمدة ${timeLeft} دقيقة أخرى`);
          } else {
            console.log("❌ التوكن منتهي الصلاحية!");
          }

          // عرض معلومات إضافية من التوكن
          console.log(`👤 معرف المستخدم من التوكن: ${tokenPayload.sub}`);
          console.log(
            `📧 البريد الإلكتروني من التوكن: ${tokenPayload.email || "غير متاح"}`,
          );
        } catch (tokenError) {
          console.log("⚠️ خطأ في تحليل التوكن:", tokenError.message);
        }
      }

      if (!parsedTokens.refresh_token) {
        console.log("❌ لا يوجد refresh_token داخل التوكنات.");
      } else {
        console.log("✅ refresh_token موجود.");
      }
    }

    console.log("\n👤 فحص بيانات المستخدم:");
    // فحص بيانات المستخدم
    if (!userInfo) {
      console.log("❌ بيانات المستخدم غير موجودة في localStorage.");
    } else {
      const parsedUser = JSON.parse(userInfo);
      console.log("✅ بيانات المستخدم موجودة:", parsedUser);

      if (!parsedUser.id || !parsedUser.role) {
        console.log("❌ بيانات المستخدم ناقصة (id أو role).");
      } else {
        console.log(
          `✅ المستخدم له دور: ${parsedUser.role} ومعرف: ${parsedUser.id}`,
        );

        // التحقق من صحة الدور
        const validRoles = ["admin", "assistant", "store"];
        if (validRoles.includes(parsedUser.role)) {
          console.log(`✅ دور المستخدم صحيح: ${parsedUser.role}`);
        } else {
          console.log(`⚠️ دور المستخدم غير معروف: ${parsedUser.role}`);
        }
      }

      if (parsedUser.email) {
        console.log(`📧 البريد الإلكتروني: ${parsedUser.email}`);
      }
    }

    // ملخص الحالة
    console.log("\n📊 ملخص حالة المصادقة:");
    const hasValidTokens = tokens && JSON.parse(tokens).access_token;
    const hasValidUser =
      userInfo && JSON.parse(userInfo).id && JSON.parse(userInfo).role;

    if (hasValidTokens && hasValidUser) {
      console.log("🟢 الحالة: مسجل دخول بنجاح");
      console.log("✅ يمكن استخدام النظام بشكل طبيعي");
    } else if (hasValidTokens && !hasValidUser) {
      console.log("🟡 الحالة: توكن موجود لكن بيانات المستخدم ناقصة");
      console.log("⚠️ قد تحتاج لتسجيل الدخول مرة أخرى");
    } else if (!hasValidTokens && hasValidUser) {
      console.log("🟡 الحالة: بيانات المستخدم موجودة لكن التوكن مفقود");
      console.log("⚠️ يجب تسجيل الدخول مرة أخرى");
    } else {
      console.log("🔴 الحالة: غير مسجل دخول");
      console.log("❌ يجب تسجيل الدخول للوصول للنظام");
    }
  } catch (error) {
    console.error("🚨 خطأ في قراءة بيانات المصادقة من localStorage:", error);
    console.log("💡 نصيحة: تأكد من أن البيانات المحفوظة بتنسيق JSON صحيح");
  }

  console.log("\n🔧 لحذف بيانات المصادقة، استخدم:");
  console.log('localStorage.removeItem("supabase_auth_tokens")');
  console.log('localStorage.removeItem("supabase_user_info")');
}

/**
 * دالة مساعدة لحذف بيانات المصادقة
 */
function clearAuthData() {
  localStorage.removeItem("supabase_auth_tokens");
  localStorage.removeItem("supabase_user_info");
  console.log("🗑️ تم حذف جميع بيانات المصادقة من localStorage");
}

/**
 * دالة للتحقق السريع من حالة تسجيل الدخول
 */
function isLoggedIn() {
  try {
    const tokens = localStorage.getItem("supabase_auth_tokens");
    const userInfo = localStorage.getItem("supabase_user_info");

    if (!tokens || !userInfo) return false;

    const parsedTokens = JSON.parse(tokens);
    const parsedUser = JSON.parse(userInfo);

    const hasValidToken = parsedTokens.access_token;
    const hasValidUser = parsedUser.id && parsedUser.role;

    // فحص انتهاء صلاحية التوكن
    if (hasValidToken) {
      try {
        const tokenPayload = JSON.parse(
          atob(parsedTokens.access_token.split(".")[1]),
        );
        const expirationDate = new Date(tokenPayload.exp * 1000);
        const now = new Date();

        if (expirationDate <= now) {
          console.log("⚠️ التوكن منتهي الصلاحية");
          return false;
        }
      } catch {
        return false;
      }
    }

    return hasValidToken && hasValidUser;
  } catch {
    return false;
  }
}

/**
 * دالة للحصول على معلومات المستخدم الحالي
 */
function getCurrentUser() {
  try {
    const userInfo = localStorage.getItem("supabase_user_info");
    if (!userInfo) return null;

    const parsedUser = JSON.parse(userInfo);
    return parsedUser;
  } catch {
    return null;
  }
}

/**
 * دالة للحصول على التوكن الحالي
 */
function getCurrentToken() {
  try {
    const tokens = localStorage.getItem("supabase_auth_tokens");
    if (!tokens) return null;

    const parsedTokens = JSON.parse(tokens);
    return parsedTokens.access_token;
  } catch {
    return null;
  }
}

// تصدير الدوال للاستخدام في أماكن أخرى
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    checkAuthData,
    clearAuthData,
    isLoggedIn,
    getCurrentUser,
    getCurrentToken,
  };
}

// جعل الدوال متاحة في window للاستخدام في console
if (typeof window !== "undefined") {
  window.checkAuthData = checkAuthData;
  window.clearAuthData = clearAuthData;
  window.isLoggedIn = isLoggedIn;
  window.getCurrentUser = getCurrentUser;
  window.getCurrentToken = getCurrentToken;
}

// تشغيل الفحص تلقائياً إذا تم تحميل الملف مباشرة
console.log("🔧 دوال فحص المصادقة محملة. استخدم:");
console.log("• checkAuthData() - فحص شامل للبيانات");
console.log("• isLoggedIn() - فحص سريع لحالة تسجيل الدخول");
console.log("• getCurrentUser() - الحصول على بيانات المستخدم");
console.log("• getCurrentToken() - الحصول على التوكن");
console.log("• clearAuthData() - حذف بيانات المصادقة");
