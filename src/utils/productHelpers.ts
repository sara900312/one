import { supabase } from "@/integrations/supabase/client";
import { ApiResponse } from "@/types/database";
import { formatError, logError } from "@/utils/errorHelpers";

interface AddProductManualParams {
  p_name: string;
  p_description?: string | null;
  p_price: number;
  p_quantity: number;
  p_discount_amount: number;
  p_store_name: string;
  p_image_url_1?: string | null;
  p_image_url_2?: string | null;
  p_image_url_3?: string | null;
  p_image_url_4?: string | null;
  p_created_by: string;
}

interface AddProductAIParams {
  p_ai_input: string;
  p_created_by: string;
}

export const addProductManual = async (
  params: AddProductManualParams,
): Promise<ApiResponse> => {
  try {
    // Insert the product directly into the products table
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: params.p_name,
        description: params.p_description,
        price: params.p_price,
        quantity: params.p_quantity,
        discount_amount: params.p_discount_amount,
        store_name: params.p_store_name,
        image_url_1: params.p_image_url_1,
        image_url_2: params.p_image_url_2,
        image_url_3: params.p_image_url_3,
        image_url_4: params.p_image_url_4,
        status: "draft" as const,
        created_by: params.p_created_by,
      })
      .select()
      .single();

    if (error) {
      const formattedError = formatError(error);
      logError("إضافة منتج يدوي", error, { params });
      return {
        success: false,
        error: formattedError.message || "فشل في إضافة المنتج",
      };
    }

    return {
      success: true,
      message: "تم إضافة المنتج بنجاح",
      data: data,
    };
  } catch (error) {
    const formattedError = formatError(error);
    logError("إضافة منتج يدوي - خطأ عام", error, { params });
    return {
      success: false,
      error: formattedError.message || "حدث خطأ غير متوقع أثناء إضافة المنتج",
    };
  }
};

export const addProductAI = async (
  params: AddProductAIParams,
): Promise<ApiResponse> => {
  try {
    // Simple AI parsing (extract basic information)
    const aiInput = params.p_ai_input;

    // Look for price patterns (number followed by ريال, SR, etc.)
    const priceMatch = aiInput.match(/(\d+(?:\.\d+)?)\s*(?:ريال|SR|ر\.س)/i);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

    // Look for quantity patterns
    const quantityMatch = aiInput.match(/(\d+)\s*(?:قطع|قطعة|piece|pieces)/i);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

    // Extract product name (first few words before price or quantity)
    let name = aiInput.split(" بسعر ")[0].split(" متوفر ")[0].trim();
    if (!name || name.length < 2) {
      name = "منتج جديد";
    }

    // Extract store name (look for "متجر" keyword)
    const storeMatch = aiInput.match(/متجر\s+([^،,]+)/i);
    const storeName = storeMatch ? storeMatch[1].trim() : "متجر افتراضي";

    // Insert the product directly into the products table
    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        description: aiInput,
        price,
        quantity,
        discount_amount: 0,
        store_name: storeName,
        status: "draft" as const,
        created_by: params.p_created_by,
      })
      .select()
      .single();

    if (error) {
      const formattedError = formatError(error);
      logError("إضافة منتج بالذكاء الاصطناعي", error, {
        params,
        parsedData: { name, price, quantity, storeName },
      });
      return {
        success: false,
        error: formattedError.message || "فشل في إضافة المنتج",
      };
    }

    return {
      success: true,
      message: "تم إضافة المنتج بنجاح باستخدام الذكاء الاصطناعي",
      data: {
        ...data,
        parsed_data: {
          name,
          price,
          quantity,
          store_name: storeName,
        },
      },
    };
  } catch (error) {
    const formattedError = formatError(error);
    logError("إضافة منتج بالذكاء الاصطناعي - خطأ عام", error, { params });
    return {
      success: false,
      error:
        formattedError.message ||
        "حدث خطأ غير متوقع أثناء معالجة المنتج بالذكاء الاصطناعي",
    };
  }
};
