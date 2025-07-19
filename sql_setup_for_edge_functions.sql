-- 🔧 SQL Setup for Edge Functions Authentication
-- Run this in Supabase SQL Editor

-- 1. Ensure RLS is enabled on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Create or update system_users table for admin authentication
CREATE TABLE IF NOT EXISTS public.system_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'assistant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on system_users
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for system_users
DROP POLICY IF EXISTS "system_users_select_policy" ON public.system_users;
CREATE POLICY "system_users_select_policy" ON public.system_users
FOR SELECT
USING (
  -- Users can read their own data
  auth.uid() = id
  OR
  -- Admins can read all data
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "system_users_insert_policy" ON public.system_users;
CREATE POLICY "system_users_insert_policy" ON public.system_users
FOR INSERT
WITH CHECK (
  -- Only admins can create new system users
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "system_users_update_policy" ON public.system_users;
CREATE POLICY "system_users_update_policy" ON public.system_users
FOR UPDATE
USING (
  -- Users can update their own data (except role)
  auth.uid() = id
  OR
  -- Admins can update all data
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
)
WITH CHECK (
  -- Prevent users from changing their own role (only admins can)
  (auth.uid() = id AND role = OLD.role)
  OR
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
);

-- 4. Updated RLS policies for products table
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
CREATE POLICY "products_insert_policy" ON public.products
FOR INSERT
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL 
  AND 
  -- created_by must match the authenticated user
  created_by = auth.uid()
  AND
  -- User must be admin or assistant
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role IN ('admin', 'assistant')
  )
);

DROP POLICY IF EXISTS "products_select_policy" ON public.products;
CREATE POLICY "products_select_policy" ON public.products
FOR SELECT
USING (
  -- Admin can see everything
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
  OR
  -- Assistant can see their own products and published products
  (
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'assistant'
    )
    AND (created_by = auth.uid() OR status = 'published')
  )
  OR
  -- Store users can see published products
  (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = auth.uid()
      AND stores.is_active = true
    )
    AND status = 'published'
  )
  OR
  -- Public can see published products (if you want public access)
  (status = 'published')
);

DROP POLICY IF EXISTS "products_update_policy" ON public.products;
CREATE POLICY "products_update_policy" ON public.products
FOR UPDATE
USING (
  -- Admin can update everything
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
  OR
  -- Assistant can update their own products
  (
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'assistant'
    )
    AND created_by = auth.uid()
  )
)
WITH CHECK (
  -- Ensure created_by doesn't change unless admin
  (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
CREATE POLICY "products_delete_policy" ON public.products
FOR DELETE
USING (
  -- Admin can delete everything
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
  OR
  -- Assistant can delete their own draft products
  (
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'assistant'
    )
    AND created_by = auth.uid()
    AND status = 'draft'
  )
);

-- 5. Insert sample admin user (UPDATE WITH YOUR ACTUAL ADMIN USER ID)
-- First, create a user in Supabase Auth Dashboard, then run this with the actual UUID

-- Example (replace with your actual admin user ID):
/*
INSERT INTO public.system_users (id, email, role) 
VALUES (
  '12345678-1234-1234-1234-123456789012', -- Replace with actual admin user UUID
  'admin@example.com',
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();
*/

-- 6. Create function to validate Edge Function authentication
CREATE OR REPLACE FUNCTION public.validate_edge_function_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure created_by is set and matches authenticated user
  IF NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'created_by cannot be null';
  END IF;
  
  IF NEW.created_by != auth.uid() THEN
    RAISE EXCEPTION 'created_by must match authenticated user';
  END IF;
  
  -- Set timestamps
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for products validation
DROP TRIGGER IF EXISTS validate_products_edge_auth ON public.products;
CREATE TRIGGER validate_products_edge_auth
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.validate_edge_function_auth();

-- 8. Grant necessary permissions
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.system_users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- For anon users (limited access)
GRANT SELECT ON public.products TO anon;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_created_by ON public.products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_store_name ON public.products(store_name);
CREATE INDEX IF NOT EXISTS idx_system_users_role ON public.system_users(role);
CREATE INDEX IF NOT EXISTS idx_system_users_email ON public.system_users(email);

-- 10. Function to get current user info (useful for debugging)
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'auth_uid', auth.uid(),
    'is_authenticated', CASE WHEN auth.uid() IS NOT NULL THEN true ELSE false END,
    'user_role', (
      SELECT role FROM public.system_users 
      WHERE id = auth.uid()
    ),
    'user_email', (
      SELECT email FROM public.system_users 
      WHERE id = auth.uid()
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Test functions
CREATE OR REPLACE FUNCTION public.test_edge_function_setup()
RETURNS TABLE (
  test_name TEXT,
  result TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Auth UID' as test_name,
    COALESCE(auth.uid()::text, 'NULL') as result,
    CASE WHEN auth.uid() IS NOT NULL THEN 'PASS' ELSE 'FAIL' END as status
  
  UNION ALL
  
  SELECT 
    'User Role' as test_name,
    COALESCE((SELECT role FROM public.system_users WHERE id = auth.uid()), 'NOT_FOUND') as result,
    CASE WHEN EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid()) THEN 'PASS' ELSE 'FAIL' END as status
  
  UNION ALL
  
  SELECT 
    'RLS Enabled - Products' as test_name,
    CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'products') THEN 'ENABLED' ELSE 'DISABLED' END as result,
    CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'products') THEN 'PASS' ELSE 'FAIL' END as status
  
  UNION ALL
  
  SELECT 
    'RLS Enabled - System Users' as test_name,
    CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'system_users') THEN 'ENABLED' ELSE 'DISABLED' END as result,
    CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'system_users') THEN 'PASS' ELSE 'FAIL' END as status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage of test function:
-- SELECT * FROM public.test_edge_function_setup();

-- Example usage of user info function:
-- SELECT public.get_current_user_info();

-- 12. Create sample products function (for testing)
CREATE OR REPLACE FUNCTION public.create_sample_product()
RETURNS JSON AS $$
DECLARE
  result JSON;
  new_product_id UUID;
BEGIN
  -- Check if user is authenticated and has permission
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('error', 'User not authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.system_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'assistant')
  ) THEN
    RETURN json_build_object('error', 'User does not have permission to create products');
  END IF;
  
  -- Insert sample product
  INSERT INTO public.products (
    name,
    description,
    price,
    quantity,
    discount_amount,
    store_name,
    status,
    created_by
  ) VALUES (
    'منتج تجريبي ' || extract(epoch from now()),
    'هذا منتج تجريبي تم إنشاؤه لاختبار النظام',
    99.99,
    10,
    5.00,
    'متجر تجريبي',
    'draft',
    auth.uid()
  ) RETURNING id INTO new_product_id;
  
  RETURN json_build_object(
    'success', true,
    'product_id', new_product_id,
    'message', 'تم إنشاء المنتج التجريبي بنجاح'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'error', SQLERRM,
    'success', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage: SELECT public.create_sample_product();

COMMIT;

-- 📋 Post-Setup Checklist:
/*
1. Create admin user in Supabase Auth Dashboard
2. Update the INSERT statement above with the actual admin user UUID
3. Set environment variables in Edge Functions:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY  
   - SUPABASE_SERVICE_ROLE_KEY
4. Deploy Edge Functions to Supabase
5. Test the authentication flow
6. Verify RLS policies are working correctly

Test commands after setup:
- SELECT public.get_current_user_info();
- SELECT * FROM public.test_edge_function_setup();
- SELECT public.create_sample_product();
*/
