-- 🔒 سكريبت SQL لتفعيل Row Level Security (RLS) على جدول products
-- وإنشاء السياسات الأمنية المناسبة

-- ==============================================================================
-- 1. إنشاء جدول system_users (إذا لم يكن موجوداً)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.system_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'assistant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة تعليق للجدول
COMMENT ON TABLE public.system_users IS 'جدول المستخدمين المصرح لهم بالنظام (مديرين ومساعدين)';
COMMENT ON COLUMN public.system_users.role IS 'دور المستخدم: admin (مدير) أو assistant (مساعد)';

-- ==============================================================================
-- 2. تفعيل RLS على الجداول
-- ==============================================================================

-- تفعيل RLS على جدول المنتجات
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على جدول المستخدمين
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. حذف السياسات القديمة (إذا كانت موجودة)
-- ==============================================================================

-- حذف سياسات جدول المنتجات
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;

-- حذف سياسات جدول المستخدمين
DROP POLICY IF EXISTS "system_users_select_policy" ON public.system_users;
DROP POLICY IF EXISTS "system_users_insert_policy" ON public.system_users;
DROP POLICY IF EXISTS "system_users_update_policy" ON public.system_users;

-- ==============================================================================
-- 4. إنشاء سياسات RLS لجدول products
-- ==============================================================================

-- سياسة الإدخال (INSERT) - السماح فقط للمديرين والمساعدين
CREATE POLICY "products_insert_policy" ON public.products
FOR INSERT
WITH CHECK (
  -- التأكد من أن المستخدم مصادق عليه
  auth.uid() IS NOT NULL 
  AND 
  -- التأكد من أن created_by يطابق المستخدم الحالي
  created_by = auth.uid()
  AND
  -- التأكد من أن المستخدم له دور admin أو assistant
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role IN ('admin', 'assistant')
  )
);

-- سياسة القراءة (SELECT) - عرض المنتجات حسب الصلاحيات
CREATE POLICY "products_select_policy" ON public.products
FOR SELECT
USING (
  -- المديرين يمكنهم رؤية كل المنتجات
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
  OR
  -- المساعدين يمكنهم رؤية منتجاتهم والمنتجات المنشورة
  (
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'assistant'
    )
    AND (created_by = auth.uid() OR status = 'published')
  )
  OR
  -- المتاجر يمكنها رؤية المنتجات المنشورة فقط
  (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = auth.uid()
      AND stores.is_active = true
    )
    AND status = 'published'
  )
  OR
  -- المنتجات المنشورة متاحة للعموم (اختياري)
  (status = 'published')
);

-- سياسة التحديث (UPDATE) - تعديل المنتجات
CREATE POLICY "products_update_policy" ON public.products
FOR UPDATE
USING (
  -- المديرين يمكنهم تعديل كل المنتجات
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
  OR
  -- المساعدين يمكنهم تعديل منتجاتهم فقط
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
  -- التأكد من عدم تغيير created_by إلا من قبل المديرين
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

-- سياسة الحذف (DELETE) - حذف المنتجات
CREATE POLICY "products_delete_policy" ON public.products
FOR DELETE
USING (
  -- المديرين يمكنهم حذف كل المنتجات
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
  OR
  -- المساعدين يمكنهم حذف منتجاتهم المسودة فقط
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

-- ==============================================================================
-- 5. إنشاء سياسات RLS لجدول system_users
-- ==============================================================================

-- سياسة القراءة - المستخدمين يمكنهم قراءة بياناتهم والمديرين يقرؤون ك�� شيء
CREATE POLICY "system_users_select_policy" ON public.system_users
FOR SELECT
USING (
  -- المستخدمين يمكنهم قراءة بياناتهم الخاصة
  auth.uid() = id
  OR
  -- المديرين يمكنهم قراءة بيانات كل المستخدمين
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
);

-- سياسة الإدخال - فقط المديرين يمكنهم إضافة مستخدمين جدد
CREATE POLICY "system_users_insert_policy" ON public.system_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
);

-- سياسة التحديث - المستخدمين يحدثون بياناتهم والمديرين يحدثون كل شيء
CREATE POLICY "system_users_update_policy" ON public.system_users
FOR UPDATE
USING (
  -- المستخدمين يمكنهم تحديث بياناتهم (عدا الدور)
  auth.uid() = id
  OR
  -- المديرين يمكنهم تحديث كل البيانات
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
)
WITH CHECK (
  -- منع المستخ��مين من تغيير دورهم (إلا المديرين)
  (auth.uid() = id AND role = OLD.role)
  OR
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid() 
    AND system_users.role = 'admin'
  )
);

-- ==============================================================================
-- 6. إنشاء دوال مساعدة للتحقق من الصلاحيات
-- ==============================================================================

-- دالة للحصول على دور المستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- التحقق من وجود المستخدم في جدول system_users
  SELECT role INTO user_role
  FROM public.system_users
  WHERE id = auth.uid();
  
  -- إذا لم يوجد في system_users، تحقق من جدول stores
  IF user_role IS NULL THEN
    SELECT 'store' INTO user_role
    FROM public.stores
    WHERE id = auth.uid()
    AND is_active = true;
  END IF;
  
  RETURN COALESCE(user_role, 'anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للتحقق من صلاحية إضافة المنتجات
CREATE OR REPLACE FUNCTION public.can_user_add_products()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.system_users
    WHERE id = auth.uid() 
    AND role IN ('admin', 'assistant')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 7. إنشاء trigger للتحقق من البيانات
-- ==============================================================================

-- دالة trigger للتحقق من صحة بيانات المنتج
CREATE OR REPLACE FUNCTION public.validate_product_data()
RETURNS TRIGGER AS $$
BEGIN
  -- التأكد من أن created_by موجود ويطابق المستخدم الحالي
  IF NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'created_by لا يمكن أن يكون فارغاً';
  END IF;
  
  IF NEW.created_by != auth.uid() THEN
    RAISE EXCEPTION 'created_by يجب أن يطابق معرف المستخدم الحالي';
  END IF;
  
  -- التأكد من صحة البيانات
  IF NEW.price < 0 THEN
    RAISE EXCEPTION 'السعر يجب أن يكون أكبر من أو يساوي صفر';
  END IF;
  
  IF NEW.quantity < 0 THEN
    RAISE EXCEPTION 'الكمية يجب أن تكون أكبر من أو تساوي صفر';
  END IF;
  
  IF NEW.discount_amount < 0 THEN
    RAISE EXCEPTION 'مقدار الخصم يجب أن يكون أك��ر من أو يساوي صفر';
  END IF;
  
  -- تعيين الأوقات تلقائياً
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  
  NEW.updated_at = NOW();
  
  -- تعيين حالة افتراضية
  IF NEW.status IS NULL THEN
    NEW.status = 'draft';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger
DROP TRIGGER IF EXISTS validate_product_trigger ON public.products;
CREATE TRIGGER validate_product_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.validate_product_data();

-- ==============================================================================
-- 8. منح الصلاحيات اللازمة
-- ==============================================================================

-- منح صلاحيات للمستخدمين المصادق عليهم
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.system_users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- منح صلاحيات محدودة للمستخدمين غير المصادق عليهم
GRANT SELECT ON public.products TO anon;

-- ==============================================================================
-- 9. إنشاء فهارس لتحسين الأداء
-- ==============================================================================

-- فهارس على جدول المنتجات
CREATE INDEX IF NOT EXISTS idx_products_created_by ON public.products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_store_name ON public.products(store_name);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);

-- فهارس على جدول المستخدمين
CREATE INDEX IF NOT EXISTS idx_system_users_role ON public.system_users(role);
CREATE INDEX IF NOT EXISTS idx_system_users_email ON public.system_users(email);

-- ==============================================================================
-- 10. دوال للاختبار والتشخيص
-- ==============================================================================

-- دالة لاختبار إعدادات RLS
CREATE OR REPLACE FUNCTION public.test_rls_setup()
RETURNS TABLE (
  test_name TEXT,
  result TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Current User ID' as test_name,
    COALESCE(auth.uid()::text, 'NULL') as result,
    CASE WHEN auth.uid() IS NOT NULL THEN 'PASS' ELSE 'FAIL' END as status
  
  UNION ALL
  
  SELECT 
    'User Role' as test_name,
    public.get_current_user_role() as result,
    CASE WHEN public.get_current_user_role() != 'anonymous' THEN 'PASS' ELSE 'FAIL' END as status
  
  UNION ALL
  
  SELECT 
    'Can Add Products' as test_name,
    CASE WHEN public.can_user_add_products() THEN 'YES' ELSE 'NO' END as result,
    CASE WHEN public.can_user_add_products() THEN 'PASS' ELSE 'INFO' END as status
  
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

-- دالة لإنشاء منتج تجريبي (للاختبار)
CREATE OR REPLACE FUNCTION public.create_test_product()
RETURNS JSON AS $$
DECLARE
  result JSON;
  new_product_id UUID;
BEGIN
  -- التحقق من المصادقة والصلاحيات
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'المستخدم غير مصادق عليه');
  END IF;
  
  IF NOT public.can_user_add_products() THEN
    RETURN json_build_object('success', false, 'error', 'المستخدم لا يملك صلاحية إضافة منتجات');
  END IF;
  
  -- إضافة منتج تجريبي
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
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 11. إدخال مستخدم مدير تجريبي (تحديث هذا بالمعرف الصحيح)
-- ==============================================================================

-- ملاحظة: قم بتغيير UUID إلى معرف المستخدم الفعلي من Supabase Auth
-- يمكنك الحصول على المعرف من لوحة Supabase Auth Dashboard

/*
-- مثال لإدخال مستخدم مدير (استبدل بالمعرف الصحيح)
INSERT INTO public.system_users (id, email, role) 
VALUES (
  '12345678-1234-1234-1234-123456789abc', -- استبدل بمعرف المستخدم الفعلي
  'admin@example.com',
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

-- إدخال مساعد تجريبي
INSERT INTO public.system_users (id, email, role) 
VALUES (
  '87654321-4321-4321-4321-cba987654321', -- استبدل بمعرف المستخدم الفعلي
  'assistant@example.com',
  'assistant'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();
*/

-- ==============================================================================
-- 12. إتمام الإعداد
-- ==============================================================================

COMMIT;

-- ==============================================================================
-- 📋 دليل الاستخدام بعد تشغيل السكريبت:
-- ==============================================================================

/*
🔧 خطوات ما بعد التشغيل:

1. أضف مستخدمي�� في Supabase Auth Dashboard
2. أدخل بياناتهم في جدول system_users باستخدام:
   INSERT INTO public.system_users (id, email, role) VALUES ('uuid', 'email', 'admin');

3. اختبر الإعداد:
   SELECT * FROM public.test_rls_setup();

4. اختبر إضافة منتج:
   SELECT public.create_test_product();

5. انشر Edge Function:
   supabase functions deploy secure-add-product

6. اختبر من التطبيق أو من curl:
   curl -X POST your-project.supabase.co/functions/v1/secure-add-product \
     -H "Authorization: Bearer your-jwt-token" \
     -H "Content-Type: application/json" \
     -d '{"name":"منتج تجريبي","price":100,"store_name":"متجر تجريبي"}'

🎯 النتيجة المتوقعة:
✅ RLS مُفعَّل ويعمل بشكل صحيح
✅ فقط المديرين والمساعدين يمكنهم إضافة منتجات
✅ المستخدمين يرون منتجاتهم فقط (أو المنتجات المنشورة)
✅ JWT tokens تعمل بشكل صحيح مع Edge Functions
*/
