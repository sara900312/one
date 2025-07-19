# 🔐 دليل إصلاح مشاكل Row Level Security (RLS)

## 📋 المشكلة

```
"new row violates row-level security policy for table 'products'"
```

**الرسالة بالعربية:** "البيانات المرجعية غير صحيحة"

---

## 🛠️ الحلول الشاملة

### 1. **إصلاح قاعدة البيانات (SQL)**

#### تشغيل الملف `fix_products_rls_policies.sql`:

```bash
# في Supabase SQL Editor، قم بتشغيل محتوى الملف:
# fix_products_rls_policies.sql
```

#### أو تشغيل الأمر المختصر:

```sql
-- إصلاح سريع لسياسة RLS
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;

CREATE POLICY "products_insert_policy" ON public.products
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
);
```

### 2. **إصلاح الفرونت إند (Frontend)**

#### ✅ الطريقة الصحيحة:

```javascript
import { supabase } from "@/integrations/supabase/client";
import { createProductSafely } from "@/utils/authHelpers";

// الطريقة المحسنة
const handleAddProduct = async (formData) => {
  try {
    // التحقق من المصادقة
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("يرجى تسجيل الدخول أولاً");
    }

    // إعداد بيانات المنتج
    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      discount_amount: parseFloat(formData.discount_amount) || 0,
      store_name: formData.store_name,
      created_by: user.id, // 🔑 المفتاح الأساسي
      status: "draft",
    };

    console.log("🔄 إرسال بيانات المنتج:", {
      name: productData.name,
      created_by: productData.created_by,
    });

    // إدخال المنتج
    const { data, error } = await supabase
      .from("products")
      .insert([productData])
      .select("*")
      .single();

    if (error) {
      console.error("❌ خطأ في إدخال المنتج:", error);

      if (error.message.includes("row-level security policy")) {
        throw new Error(
          "غير مصرح لك بإضافة منتجات. يرجى التأكد من تسجيل الدخول.",
        );
      }

      throw error;
    }

    console.log("✅ تم إضافة المنتج بنجاح:", data);
    return { success: true, data };
  } catch (error) {
    console.error("❌ فشل في إضافة المنتج:", error);
    throw error;
  }
};
```

#### ❌ الأخطاء الشائعة:

```javascript
// ❌ لا تفعل هذا:
const wrongProduct = {
  name: "منتج",
  price: 100,
  // created_by مفقود ❌
};

// ❌ أو هذا:
const wrongProduct2 = {
  name: "منتج",
  price: 100,
  created_by: "wrong-id", // معرف خاطئ ❌
};
```

---

## 🔍 خطوات التشخيص

### 1. **فحص المصادقة**

```javascript
// في console المتصفح:
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("المستخدم الحالي:", user);
console.log("معرف المستخدم:", user?.id);
```

### 2. **فحص الصلاحيات**

```sql
-- في Supabase SQL Editor:
SELECT auth.uid() as current_user_id;

SELECT * FROM public.system_users WHERE id = auth.uid();
SELECT * FROM public.stores WHERE id = auth.uid();
```

### 3. **فحص السياسات**

```sql
-- عرض السياسات الحالية
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'products';
```

### 4. **اختبار الإدخال يدوياً**

```sql
-- اختبار إدخال منتج يدوياً
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
```

---

## 🚀 دوال مساعدة محسنة

### استخدام دوال المساعدة الجديدة:

```javascript
import {
  createProductSafely,
  checkUserPermissions,
  verifyUserSession,
} from "@/utils/authHelpers";

// فحص الصلاحيات
const permissions = await checkUserPermissions();
console.log("صلاحياتي:", permissions);

// إنشاء منتج آمن
const result = await createProductSafely(productData);
if (result.success) {
  console.log("✅ نجح!");
} else {
  console.error("❌", result.error);
}
```

---

## 🔧 إعدادات إضافية

### 1. **تفعيل RLS** (إذا لم يكن مفعلاً):

```sql
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
```

### 2. **منح الصلاحيات**:

```sql
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.products TO anon;
```

### 3. **إنشاء فهارس للأداء**:

```sql
CREATE INDEX IF NOT EXISTS idx_products_created_by
ON public.products(created_by);

CREATE INDEX IF NOT EXISTS idx_products_status
ON public.products(status);
```

---

## 📊 اختبار النظام

### في console المتصفح:

```javascript
// تشغيل اختبار شامل
import { testProductCreation } from "@/utils/productCreationExample";
await testProductCreation();

// أو اختبار التشخيص
import { diagnoseAuthIssues } from "@/utils/authHelpers";
await diagnoseAuthIssues();
```

---

## 🎯 قائمة التحقق

- [ ] ✅ تم تشغيل `fix_products_rls_policies.sql`
- [ ] ✅ تم التأكد من تفعيل RLS على جدول products
- [ ] ✅ الفرونت إند يرسل `created_by = user.id`
- [ ] ✅ المستخدم مسجل دخول ومصرح له
- [ ] ✅ تم اختبار إنشاء منتج تجريبي
- [ ] ✅ السياسات تستخدم `auth.uid()` بدلاً من `app.current_user_id`
- [ ] ✅ تم فحص الصلاحيات والأدوار

---

## 📞 الدعم

إذا استم��ت المشكلة:

1. **تحقق من logs Supabase** في Dashboard
2. **شغل دوال التشخيص** المتوفرة
3. **تأكد من إعدادات المشروع** في Supabase
4. **راجع الـ Migration History** للتأكد من تطبيق التحديثات

---

## 🎉 النتيجة المتوقعة

بعد تطبيق الحلول، يجب أن تحصل على:

```javascript
// في console:
✅ تم إنشاء المنتج بنجاح: {
  id: "uuid-here",
  name: "منتج جديد",
  created_by: "user-id-here",
  status: "draft",
  created_at: "2024-01-01T00:00:00Z"
}
```

بدلاً من:

```
❌ new row violates row-level security policy for table 'products'
```
