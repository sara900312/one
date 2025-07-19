-- 🔧 إصلاح سياسات Row Level Security لجدول products
-- SQL Script to fix RLS policies for products table

-- 1. التأكد من تفعيل RLS على الجدول
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. حذف جميع السياسات القديمة المحتملة
DROP POLICY IF EXISTS "Allow insert for owner" ON public.products;
DROP POLICY IF EXISTS "Product access policy" ON public.products;
DROP POLICY IF EXISTS "Allow users to insert products" ON public.products;
DROP POLICY IF EXISTS "Allow users to view products" ON public.products;
DROP POLICY IF EXISTS "Allow users to update products" ON public.products;
DROP POLICY IF EXISTS "Allow users to delete products" ON public.products;

-- 3. إنشاء سياسة INSERT - السماح بالإدخال فقط إذا كان created_by = auth.uid()
CREATE POLICY "products_insert_policy" ON public.products
FOR INSERT
WITH CHECK (
  -- التأكد من أن المستخدم مصرح له بالدخول
  auth.uid() IS NOT NULL 
  AND 
  -- التأكد من أن created_by يطابق معرف المستخدم الحالي
  created_by = auth.uid()
);

-- 4. إنشاء سياسة SELECT - عرض المنتجات حسب الصلاحيات
CREATE POLICY "products_select_policy" ON public.products
FOR SELECT
USING (
  -- Admin يمكنه رؤية كل شيء
  (
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  )
  OR
  -- Assistant يمكنه رؤية منتجاته المنشورة والمسودات
  (
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'assistant'
    )
    AND (created_by = auth.uid() OR status = 'published')
  )
  OR
  -- Store users يمكنهم رؤية المنتجات المنشورة فقط
  (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = auth.uid()
      AND stores.is_active = true
    )
    AND status = 'published'
  )
  OR
  -- المنتجات المنشورة متاحة للجميع
  (status = 'published')
);

-- 5. إنشاء سياسة UPDATE - تحديث المنتجات
CREATE POLICY "products_update_policy" ON public.products
FOR UPDATE
USING (
  -- Admin يمكنه تعديل كل شيء
  (
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  )
  OR
  -- Assistant يمكنه تعديل منتجاته فقط
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
  -- عند التحديث، يجب أن يبقى created_by كما هو أو يكون المستخدم admin
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

-- 6. إنشاء سياسة DELETE - حذف المنتجات
CREATE POLICY "products_delete_policy" ON public.products
FOR DELETE
USING (
  -- Admin يمكنه حذف كل شيء
  (
    EXISTS (
      SELECT 1 FROM public.system_users
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  )
  OR
  -- Assistant يمكنه حذف منتجاته المسودة فقط
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

-- 7. إنشاء دالة مساعدة للتحقق من صحة البيانات قبل الإدخال
CREATE OR REPLACE FUNCTION public.validate_product_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- التأكد من أن created_by موجود
  IF NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'created_by لا يمكن أن يكون فارغاً';
  END IF;
  
  -- التأكد من أن created_by يطابق المستخدم الحالي
  IF NEW.created_by != auth.uid() THEN
    RAISE EXCEPTION 'created_by يجب أن يطابق معرف المستخدم الحالي';
  END IF;
  
  -- تعيين الوقت الحالي للإنشاء إذا لم يكن موجوداً
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  
  -- تعيين حالة افتراضية إذا لم تكن موجودة
  IF NEW.status IS NULL THEN
    NEW.status = 'draft';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. إنشاء trigger للتحقق من البيانات قبل الإدخال
DROP TRIGGER IF EXISTS validate_product_insert_trigger ON public.products;
CREATE TRIGGER validate_product_insert_trigger
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.validate_product_insert();

-- 9. إنشاء دالة للتحقق من صحة المستخدم الحالي
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

-- 10. اختبار السياسات - تشغيل هذه الاستعلامات للتحقق
-- (تشغيل هذه الأجزاء بعد تسجيل الدخول كمستخدم صالح)

/*
-- اختبار 1: التحقق من المستخدم الحالي
SELECT auth.uid() as current_user_id, public.get_current_user_role() as user_role;

-- اختبار 2: محاولة إدخال منتج (يجب أن ينجح)
INSERT INTO public.products (
  name, 
  price, 
  quantity, 
  store_name, 
  created_by, 
  status
) VALUES (
  'منتج تجريبي', 
  100, 
  10, 
  'متجر تجريبي', 
  auth.uid(), 
  'draft'
);

-- اختبار 3: عرض المنتجات (يجب أن تظهر حسب الصلاحيات)
SELECT id, name, status, created_by, created_at 
FROM public.products 
ORDER BY created_at DESC 
LIMIT 5;
*/

-- 11. عرض السياسات الحالية للتأكد من تطبيقها
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products' 
ORDER BY policyname;

-- 12. منح الصلاحيات اللازمة
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.products TO anon;

-- 13. نصائح للتشخيص
/*
إذا كنت لا تزال تواجه مشاكل، جرب:

1. التأكد من أن المستخدم مسجل دخول:
   SELECT auth.uid();

2. التأكد من وجود المستخدم في الجداول المناسبة:
   SELECT * FROM public.system_users WHERE id = auth.uid();
   SELECT * FROM public.stores WHERE id = auth.uid();

3. تشغيل الإدخال يدوياً مع تسجيل مفصل:
   SET log_statement = 'all';
   INSERT INTO public.products (...) VALUES (...);

4. فحص رسائل الخطأ في logs:
   SELECT * FROM pg_stat_activity WHERE query LIKE '%products%';
*/
