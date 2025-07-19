import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ProductRequest {
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
}

interface ProductResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

Deno.serve(async (req) => {
  // معا��جة طلبات CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "طريقة الطلب غير مدعومة. يُسمح بـ POST فقط",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // استخراج JWT token من Authorization header
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      console.error("❌ لم يتم توفير رمز المصادقة");
      return new Response(
        JSON.stringify({
          success: false,
          error: "غير مصرح: يجب توفير رمز المصادقة في Authorization header",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // الحصول على متغيرات البيئة
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("متغ��رات البيئة مفقودة");
      return new Response(
        JSON.stringify({
          success: false,
          error: "خطأ في إعداد الخادم",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // إنشاء عميل Supabase مع JWT token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("🔑 التحقق من صحة JWT token...");

    // التحقق من صحة التوكن والحصول على معلومات المستخدم
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ JWT token غير صالح:", userError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "رمز المصادقة غير صالح أو منتهي الصلاحية. يرجى تسجيل الدخول مرة أخرى",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      "✅ تم التحقق من JWT بنجاح للمستخدم:",
      user.email,
      "ID:",
      user.id,
    );

    // التحقق من صلاحيات المستخدم في جدول system_users
    const { data: userData, error: permissionError } = await supabase
      .from("system_users")
      .select("id, email, role")
      .eq("id", user.id)
      .single();

    if (permissionError || !userData) {
      console.error(
        "❌ المستخدم غير موجود في system_users:",
        permissionError?.message,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "المستخدم غير موجود في النظام أو غير مصرح له بالوصول",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // التحقق من أن دور المستخدم مسموح له بإضافة المنتجات
    if (userData.role !== "admin" && userData.role !== "assistant") {
      console.error(
        "❌ دور المستخدم غير مصرح له بإضافة منتجات. الدور:",
        userData.role,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: `غير مصرح لك بإضافة منتجات. دورك الحالي: ${userData.role}. المطلوب: admin أو assistant`,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      "🛡️ تم التحقق من الصلاحيات بنجاح. دور المستخدم:",
      userData.role,
    );

    // قراءة بيانات المنتج من طلب HTTP
    const productData: ProductRequest = await req.json();

    // التحقق من الحقول المطلوبة
    if (
      !productData.name ||
      productData.price === undefined ||
      !productData.store_name
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "الحقول المطلوبة مفقودة: name (اسم المنتج), price (السعر), store_name (اسم المتجر)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // التحقق من صحة البيانات
    if (productData.price < 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "السعر يجب أن يكون أكبر من أو يساوي صفر",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (productData.quantity !== undefined && productData.quantity < 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "الكمية يجب أن تكون أكبر من أو تساوي صفر",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // إعداد بيانات المنتج للإدخال
    const productPayload = {
      name: productData.name.trim(),
      description: productData.description?.trim() || null,
      price: Number(productData.price),
      quantity: Number(productData.quantity) || 0,
      discount_amount: Number(productData.discount_amount) || 0,
      store_name: productData.store_name.trim(),
      image_url_1: productData.image_url_1?.trim() || null,
      image_url_2: productData.image_url_2?.trim() || null,
      image_url_3: productData.image_url_3?.trim() || null,
      image_url_4: productData.image_url_4?.trim() || null,
      status: productData.status || "draft",
      created_by: user.id, // هذا ضروري لـ RLS
      created_at: new Date().toISOString(),
    };

    console.log("📝 إضافة منتج جديد:", {
      name: productPayload.name,
      price: productPayload.price,
      store_name: productPayload.store_name,
      created_by: productPayload.created_by,
      user_role: userData.role,
    });

    // إدخال المنتج في قاعدة البيانات
    const { data, error } = await supabase
      .from("products")
      .insert([productPayload])
      .select("*")
      .single();

    if (error) {
      console.error("❌ خطأ في قاعدة البيانات:", error);

      let errorMessage = "خطأ في إضافة المنتج إلى قاعدة البيانات";

      // ترجمة أخطاء قاعدة البيانات الشائعة
      if (error.message.includes("row-level security policy")) {
        errorMessage =
          "انتهاك سياسة الأمان: غير مصرح لك بإضافة منتجات بهذه البيانات";
      } else if (error.message.includes("duplicate key")) {
        errorMessage = "منتج بهذا الاسم موجود مسبقاً في نفس المتجر";
      } else if (error.message.includes("violates not-null constraint")) {
        errorMessage = "بيانات مطلوبة مفقودة أو غير صحيحة";
      } else if (error.message.includes("violates check constraint")) {
        errorMessage = "البيانات المدخلة لا تتوافق مع قواعد التحقق";
      } else if (error.code) {
        // ترجمة رموز أخطاء PostgreSQL
        switch (error.code) {
          case "23505":
            errorMessage = "البيانات موجودة مسبقاً (مفتاح مكرر)";
            break;
          case "23503":
            errorMessage = "البيانات المرجعية غير صحيحة";
            break;
          case "23502":
            errorMessage = "حقل مطلوب مفقود";
            break;
          case "23514":
            errorMessage = "البيانات لا تتوافق مع القواعد المحددة";
            break;
          default:
            errorMessage = `خطأ في قاعدة البيانات (${error.code}): ${error.message}`;
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          technical_details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("✅ تم إضافة المنتج بنجاح:", data.id, "الاسم:", data.name);

    const response: ProductResponse = {
      success: true,
      message: `تم إضافة المنتج "${data.name}" بنجاح`,
      data: {
        id: data.id,
        name: data.name,
        price: data.price,
        store_name: data.store_name,
        status: data.status,
        created_by: data.created_by,
        created_at: data.created_at,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("🚨 خطأ في الخادم:", error);

    let errorMessage = "خطأ داخلي في الخادم";

    if (error instanceof SyntaxError) {
      errorMessage = "بيانات JSON غير صحيحة في الطلب";
    } else if (error.message?.includes("fetch")) {
      errorMessage = "خطأ في الاتصال بقاعدة البيانات";
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        technical_details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
