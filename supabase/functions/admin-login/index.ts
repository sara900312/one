import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  user?: any;
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
    const { email, password }: LoginRequest = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email and password are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("🔐 Attempting admin login for:", email);

    // Attempt to sign in with email/password
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (authError) {
      console.error("❌ Authentication failed:", authError.message);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            authError.message === "Invalid login credentials"
              ? "بيانات تسجيل الدخول غير صحيحة"
              : authError.message,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!authData.session || !authData.user) {
      console.error("❌ No session or user data returned");
      return new Response(
        JSON.stringify({ success: false, error: "فشل في إنشاء جلسة المصادقة" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if user has admin privileges
    const { data: userData, error: userError } = await supabase
      .from("system_users")
      .select("id, role, email")
      .eq("id", authData.user.id)
      .eq("role", "admin")
      .single();

    if (userError || !userData) {
      console.error(
        "❌ User not found in system_users or not admin:",
        userError?.message,
      );

      // Sign out the user since they're not authorized
      await supabase.auth.signOut();

      return new Response(
        JSON.stringify({
          success: false,
          error: "غير مصرح لك بالدخول كمدير نظام",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("✅ Admin login successful for user:", userData.email);

    const response: LoginResponse = {
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: userData.role,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("🚨 Server error in admin-login:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "خطأ في الخادم الداخلي",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
