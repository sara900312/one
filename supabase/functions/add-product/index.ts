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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Extract authorization token from header
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      console.error("❌ No authorization token provided");
      return new Response(
        JSON.stringify({
          success: false,
          error: "غير مصرح: لم يتم توفير رمز المصادقة",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client with the provided token
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

    // Verify the token and get user info
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ Invalid token or user not found:", userError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "رمز المصادقة غير صالح أو منتهي الصلاحية",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("🔑 Authenticated user:", user.email, "ID:", user.id);

    // Check if user has permission to create products
    const { data: userData, error: permissionError } = await supabase
      .from("system_users")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (permissionError || !userData) {
      console.error(
        "❌ User not found in system_users:",
        permissionError?.message,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "المستخدم غير موجود في النظام",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (userData.role !== "admin" && userData.role !== "assistant") {
      console.error(
        "❌ User does not have permission to create products. Role:",
        userData.role,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: `غير مصرح لك بإضافة منتجات. دورك الحالي: ${userData.role}`,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse product data from request
    const productData: ProductRequest = await req.json();

    // Validate required fields
    if (!productData.name || !productData.price || !productData.store_name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "الحقول المطلوبة مفقودة: name, price, store_name",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Prepare product payload
    const productPayload = {
      name: productData.name,
      description: productData.description || null,
      price: Number(productData.price),
      quantity: Number(productData.quantity) || 0,
      discount_amount: Number(productData.discount_amount) || 0,
      store_name: productData.store_name,
      image_url_1: productData.image_url_1 || null,
      image_url_2: productData.image_url_2 || null,
      image_url_3: productData.image_url_3 || null,
      image_url_4: productData.image_url_4 || null,
      status: productData.status || "draft",
      created_by: user.id, // This is crucial for RLS
      created_at: new Date().toISOString(),
    };

    console.log("📝 Creating product:", {
      name: productPayload.name,
      created_by: productPayload.created_by,
      user_role: userData.role,
    });

    // Insert product into database
    const { data, error } = await supabase
      .from("products")
      .insert([productPayload])
      .select("*")
      .single();

    if (error) {
      console.error("❌ Database error:", error);

      let errorMessage = "خطأ في إضافة المنتج";

      if (error.message.includes("row-level security policy")) {
        errorMessage = "انتهكت سياسة الأمان: غير مصرح لك بإضافة منتجات";
      } else if (error.message.includes("duplicate key")) {
        errorMessage = "منتج بهذا الاسم موجود مسبقاً";
      } else if (error.message.includes("violates not-null constraint")) {
        errorMessage = "بيانات مطلوبة مفقودة";
      } else if (error.code) {
        // Map PostgreSQL error codes to Arabic
        switch (error.code) {
          case "23505":
            errorMessage = "البيانات موجودة مسبقاً";
            break;
          case "23503":
            errorMessage = "البيانات المرجعية غير صحيحة";
            break;
          case "23502":
            errorMessage = "حقل مطلوب مفقود";
            break;
          default:
            errorMessage = `خطأ في قاعدة البيانات: ${error.message}`;
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("✅ Product created successfully:", data.id);

    const response: ProductResponse = {
      success: true,
      message: "تم إضافة المنتج بنجاح",
      data: data,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("🚨 Server error in add-product:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "خطأ في الخادم الداخلي",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
