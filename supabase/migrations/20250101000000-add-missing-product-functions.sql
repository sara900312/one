-- Add the missing product functions

-- Function to add product manually
CREATE OR REPLACE FUNCTION public.add_product_manual(
  p_name text,
  p_description text DEFAULT NULL,
  p_price numeric DEFAULT 0,
  p_quantity integer DEFAULT 0,
  p_discount_amount numeric DEFAULT 0,
  p_store_name text,
  p_image_url_1 text DEFAULT NULL,
  p_image_url_2 text DEFAULT NULL,
  p_image_url_3 text DEFAULT NULL,
  p_image_url_4 text DEFAULT NULL,
  p_created_by uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_product_id uuid;
  v_discount_percentage numeric := 0;
  v_final_price numeric;
BEGIN
  -- Calculate discount percentage and final price
  IF p_price > 0 AND p_discount_amount > 0 THEN
    v_discount_percentage := (p_discount_amount / p_price) * 100;
    v_final_price := p_price - p_discount_amount;
  ELSE
    v_final_price := p_price;
  END IF;

  -- Insert the product
  INSERT INTO public.products (
    name,
    description,
    price,
    quantity,
    discount_amount,
    discount_percentage,
    final_price,
    store_name,
    image_url_1,
    image_url_2,
    image_url_3,
    image_url_4,
    status,
    created_by
  ) VALUES (
    p_name,
    p_description,
    p_price,
    p_quantity,
    p_discount_amount,
    v_discount_percentage,
    v_final_price,
    p_store_name,
    p_image_url_1,
    p_image_url_2,
    p_image_url_3,
    p_image_url_4,
    'draft'::product_status,
    p_created_by
  ) RETURNING id INTO v_product_id;

  -- Return success response
  RETURN json_build_object(
    'success', true,
    'message', 'تم إضافة المنتج بنجاح',
    'product_id', v_product_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    RETURN json_build_object(
      'success', false,
      'error', 'فشل في إضافة المنتج: ' || SQLERRM
    );
END;
$function$;

-- Function to add product using AI (simplified version)
CREATE OR REPLACE FUNCTION public.add_product_ai(
  p_ai_input text,
  p_created_by uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_product_id uuid;
  v_name text := 'منتج جديد';
  v_price numeric := 0;
  v_quantity integer := 1;
  v_store_name text := 'متجر افتراضي';
  v_description text := p_ai_input;
BEGIN
  -- Simple AI parsing (extract basic information)
  -- Look for price patterns (number followed by ريال, SR, etc.)
  v_price := COALESCE(
    (regexp_match(p_ai_input, '(\d+(?:\.\d+)?)\s*(?:ريال|SR|ر\.س)', 'i'))[1]::numeric,
    0
  );
  
  -- Look for quantity patterns
  v_quantity := COALESCE(
    (regexp_match(p_ai_input, '(\d+)\s*(?:قطع|قطعة|piece|pieces)', 'i'))[1]::integer,
    1
  );
  
  -- Extract product name (first few words before price or quantity)
  v_name := COALESCE(
    trim(split_part(split_part(p_ai_input, ' بسعر ', 1), ' متوفر ', 1)),
    'منتج جديد'
  );
  
  -- Extract store name (look for "متجر" keyword)
  v_store_name := COALESCE(
    trim((regexp_match(p_ai_input, 'متجر\s+([^،,]+)', 'i'))[1]),
    'متجر اف��راضي'
  );

  -- Insert the product
  INSERT INTO public.products (
    name,
    description,
    price,
    quantity,
    discount_amount,
    discount_percentage,
    final_price,
    store_name,
    status,
    created_by
  ) VALUES (
    v_name,
    v_description,
    v_price,
    v_quantity,
    0,
    0,
    v_price,
    v_store_name,
    'draft'::product_status,
    p_created_by
  ) RETURNING id INTO v_product_id;

  -- Return success response
  RETURN json_build_object(
    'success', true,
    'message', 'تم إضافة المنتج بنجاح باستخدام الذكاء الاصطناعي',
    'product_id', v_product_id,
    'parsed_data', json_build_object(
      'name', v_name,
      'price', v_price,
      'quantity', v_quantity,
      'store_name', v_store_name
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    RETURN json_build_object(
      'success', false,
      'error', 'فشل في إضافة المنتج: ' || SQLERRM
    );
END;
$function$;
