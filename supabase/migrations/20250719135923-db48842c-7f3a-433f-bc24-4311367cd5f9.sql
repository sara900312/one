-- Drop and recreate functions with correct return types

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_orders_detailed();
DROP FUNCTION IF EXISTS public.get_products(uuid);

-- Add missing customer_city column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_city TEXT;

-- Recreate get_orders_detailed function
CREATE OR REPLACE FUNCTION public.get_orders_detailed()
RETURNS TABLE(
  id uuid,
  customer_name text,
  customer_phone text,
  customer_address text,
  customer_code text,
  notes text,
  quantity integer,
  product_id uuid,
  product_name text,
  total_amount numeric,
  status text,
  assigned_store uuid,
  assigned_store_name text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) 
LANGUAGE sql 
SECURITY DEFINER
AS $function$
  SELECT 
    o.id,
    o.customer_name,
    o.customer_phone,
    o.customer_address,
    o.customer_code,
    o.notes,
    o.quantity,
    o.product_id,
    o.product_name,
    o.total_amount,
    o.status::text,
    o.assigned_store_id as assigned_store,
    s.name as assigned_store_name,
    o.created_at,
    o.updated_at
  FROM public.orders o
  LEFT JOIN public.stores s ON s.id = o.assigned_store_id
  ORDER BY o.created_at DESC;
$function$;

-- Recreate get_products function with proper column references
CREATE OR REPLACE FUNCTION public.get_products(p_user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  price numeric,
  discount_amount numeric,
  discount_percentage numeric,
  final_price numeric,
  quantity integer,
  store_name text,
  image_url_1 text,
  image_url_2 text,
  image_url_3 text,
  image_url_4 text,
  status text,
  created_at timestamp with time zone,
  can_edit boolean
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
    user_role_check user_role;
BEGIN
    -- Get user role
    SELECT su.role INTO user_role_check FROM public.system_users su WHERE su.id = p_user_id;
    
    RETURN QUERY
    SELECT 
        prod.id,
        prod.name,
        prod.description,
        prod.price,
        prod.discount_amount,
        prod.discount_percentage,
        prod.final_price,
        prod.quantity,
        prod.store_name,
        prod.image_url_1,
        prod.image_url_2,
        prod.image_url_3,
        prod.image_url_4,
        prod.status::text,
        prod.created_at,
        CASE 
            WHEN user_role_check = 'admin' THEN true
            WHEN user_role_check = 'assistant' AND prod.created_by = p_user_id AND prod.status = 'draft' THEN true
            ELSE false
        END as can_edit
    FROM public.products prod
    WHERE 
        CASE 
            WHEN user_role_check = 'admin' THEN true
            WHEN user_role_check = 'assistant' THEN prod.created_by = p_user_id OR prod.status = 'published'
            ELSE prod.status = 'published'
        END
    ORDER BY prod.created_at DESC;
END;
$function$;

-- Add store authentication function for store login
CREATE OR REPLACE FUNCTION public.authenticate_store_user(p_username text, p_password text)
RETURNS TABLE(store_id uuid, store_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name
    FROM public.stores s
    WHERE s.username = p_username 
    AND s.password_hash = crypt(p_password, s.password_hash)
    AND s.is_active = true;
END;
$function$;