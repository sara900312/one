# 🔐 دليل التكامل الشامل لنظام المصادقة و RLS

## 📋 نظرة عامة

هذا الدليل يوضح كيفية إنشاء نظام تسجيل دخول آمن للمديرين باستخدام React + Supabase JWT + Edge Functions + RLS.

---

## 🗂️ الملفات المنشأة

### **1. React Components**

- `src/pages/AdminLogin.tsx` - صفحة تسجيل دخول المديرين
- `src/components/admin/ProductCreator.tsx` - مكون إضافة المنتجات بآمان

### **2. Edge Function**

- `supabase/functions/secure-add-product/index.ts` - وظيفة آمنة لإضافة المنتجات

### **3. SQL Setup**

- `sql_rls_setup.sql` - سكريپت إعداد RLS والسياسات الأمنية

---

## 🔧 خطوات التنفيذ خطوة بخطوة

### **الخطوة 1: إعداد قاعدة البيانات**

```sql
-- قم بتشغيل محتوى ملف sql_rls_setup.sql في Supabase SQL Editor
-- هذا سيقوم بـ:
-- ✅ إنشاء جدول system_users
-- ✅ تفعيل RLS على جدولي products و system_users
-- ✅ إنشاء السياسات الأمنية
-- ✅ إنشاء دوال مساعدة للتحقق من الصلاحيات
```

### **الخطوة 2: إنشاء مستخدم مدير**

```bash
# في Supabase Dashboard:
# 1. اذهب إلى Authentication > Users
# 2. اضغط "Add user"
# 3. أدخل:
#    - Email: admin@example.com
#    - Password: كلمة مرور قوية
#    - Confirm Email: ✅
```

```sql
-- بعد إنشاء المستخدم، أضفه لجدول system_users
INSERT INTO public.system_users (id, email, role)
VALUES (
  'uuid-من-supabase-auth-dashboard', -- استبدل بالمعرف الصحيح
  'admin@example.com',
  'admin'
);
```

### **الخطوة 3: نشر Edge Function**

```bash
# في terminal مشروعك:
supabase login
supabase link --project-ref معرف-مشروعك

# نشر الوظيفة
supabase functions deploy secure-add-product

# تعيين متغيرات البيئة
supabase secrets set SUPABASE_URL=https://مشروعك.supabase.co
supabase secrets set SUPABASE_ANON_KEY=مفتاحك-anon
```

### **الخطوة 4: إضافة المكونات للتطبيق**

```tsx
// في App.tsx أو Router الخاص بك
import AdminLogin from '@/pages/AdminLogin'
import ProductCreator from '@/components/admin/ProductCreator'

// إضافة المسارات
<Route path="/admin-login" element={<AdminLogin />} />
<Route path="/admin/products" element={<ProductCreator />} />
```

---

## 🔄 كيفية عمل النظام

### **1. تسجيل الدخول (AdminLogin.tsx)**

```typescript
// 🔐 خطوات تسجيل الدخول:
// 1. المستخدم يدخل email/password
// 2. التحقق باستخدام supabase.auth.signInWithPassword()
// 3. التحقق من وجود المستخدم في system_users
// 4. التحقق من أن role = 'admin' أو 'assistant'
// 5. حفظ access_token و user_info في localStorage

const { data: authData } = await supabase.auth.signInWithPassword({
  email,
  password,
});

const { data: userData } = await supabase
  .from("system_users")
  .select("id, email, role")
  .eq("id", authData.user.id)
  .single();

localStorage.setItem(
  "supabase_auth_tokens",
  JSON.stringify({
    access_token: authData.session.access_token,
    refresh_token: authData.session.refresh_token,
  }),
);
```

### **2. إضافة المنتجات (ProductCreator.tsx)**

```typescript
// 📝 خطوات إضافة منتج:
// 1. قراءة access_token من localStorage
// 2. إرسال طلب POST إلى Edge Function
// 3. تمرير JWT token في Authorization header

const tokens = JSON.parse(localStorage.getItem("supabase_auth_tokens"));

fetch("/functions/v1/secure-add-product", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${tokens.access_token}`, // 🔑 المفتاح
    "Content-Type": "application/json",
  },
  body: JSON.stringify(productData),
});
```

### **3. Edge Function (secure-add-product)**

```typescript
// 🛡️ خطوات التحقق في Edge Function:
// 1. استخراج JWT من Authorization header
// 2. التحقق من صحة التوكن باستخدام supabase.auth.getUser()
// 3. التحقق من وجود المستخدم في system_users
// 4. التحقق من أن role = 'admin' أو 'assistant'
// 5. إدخال المنتج مع created_by = user.id

const token = req.headers.get("authorization")?.replace("Bearer ", "");
const {
  data: { user },
} = await supabase.auth.getUser(token);
const { data: userData } = await supabase
  .from("system_users")
  .select("role")
  .eq("id", user.id)
  .single();

// التحقق من الصلاحيات
if (!["admin", "assistant"].includes(userData.role)) {
  return error("غير مصرح لك");
}

// إدخال المنتج
await supabase.from("products").insert({
  ...productData,
  created_by: user.id, // 🔑 ضروري لـ RLS
});
```

### **4. Row Level Security (RLS)**

```sql
-- 🔒 سياسة الإدخال:
-- فقط المستخدمين المصرح لهم يمكنهم إضافة منتجات
CREATE POLICY "products_insert_policy" ON public.products
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.system_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'assistant')
  )
);
```

---

## 🧪 اختبار النظام

### **1. اختبار قاعدة البيانات**

```sql
-- التحقق من إعداد RLS
SELECT * FROM public.test_rls_setup();

-- اختبار إضافة منتج (بعد تسجيل الدخول)
SELECT public.create_test_product();
```

### **2. اختبار Edge Function**

```bash
# احصل على JWT token من localStorage بعد تسجيل الدخول
curl -X POST https://مشروعك.supabase.co/functions/v1/secure-add-product \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "منتج تجريبي",
    "price": 100,
    "quantity": 5,
    "store_name": "متجر تجريبي"
  }'
```

### **3. اختبار من التطبيق**

```typescript
// في console المتصفح:
// 1. اذهب لصفحة /admin-login
// 2. سجل دخول بحساب المدير
// 3. اذهب لصفحة /admin/products
// 4. أضف منتج تجريبي
// 5. راقب Network tab و Console للتأكد من إرسال التوكن
```

---

## 🎯 الرسائل المتوقعة

### **✅ نجح تسجيل الدخول:**

```
"مرحباً admin@example.com - تم تسجيل الدخول بنجاح"
```

### **✅ نجح إضافة المنتج:**

```
{
  "success": true,
  "message": "تم إضافة المنتج \"اسم المنتج\" بنجاح",
  "data": { "id": "uuid", "name": "اسم المنتج", ... }
}
```

### **❌ فشل - غير مصرح:**

```
{
  "success": false,
  "error": "غير مصرح لك بإضافة منتجات. دورك الحالي: user. المطلوب: admin أو assistant"
}
```

### **❌ فشل - توكن غير صالح:**

```
{
  "success": false,
  "error": "رمز المصادقة غير صالح أو منتهي الصلاحية. يرجى تسجيل الدخول مرة أخرى"
}
```

---

## 🔧 استكشاف الأخطاء

### **مشكلة: "دورك anonymous"**

```sql
-- تحقق من المستخدم الحالي
SELECT auth.uid();

-- تحقق من جدول system_users
SELECT * FROM public.system_users WHERE id = auth.uid();
```

**الحل:**

```sql
-- أضف المستخدم لجدول system_users
INSERT INTO public.system_users (id, email, role)
VALUES (auth.uid(), 'email@example.com', 'admin');
```

### **مشكلة: "JWT token غير صالح"**

```javascript
// تحقق من التوكن في localStorage
const tokens = JSON.parse(localStorage.getItem("supabase_auth_tokens"));
console.log("Token:", tokens?.access_token);

// تحقق من انتهاء صلاحية التوكن
const payload = JSON.parse(atob(tokens.access_token.split(".")[1]));
console.log("Expires:", new Date(payload.exp * 1000));
```

**الحل:** تسجيل دخول جديد للحصول على توكن جديد

### **مشكلة: "انتهاك سياسة RLS"**

```sql
-- تحقق من السياسات
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'products';

-- تحقق من الصلاحيات
SELECT public.can_user_add_products();
```

---

## 📊 مخطط ال��دفق

```
المستخدم
    ↓ [البريد + كلمة المرور]
AdminLogin.tsx
    ↓ [supabase.auth.signInWithPassword()]
Supabase Auth
    ↓ [JWT Token]
system_users table
    ↓ [role = admin/assistant?]
localStorage
    ↓ [access_token محفوظ]
ProductCreator.tsx
    ↓ [POST + Authorization: Bearer token]
Edge Function
    ↓ [supabase.auth.getUser(token)]
JWT Verification
    ↓ [user.id]
RLS Policy Check
    ↓ [created_by = auth.uid()]
products table
    ↓ [INSERT successful]
✅ منتج مضاف بنجاح
```

---

## 🎉 النتيجة النهائية

بعد تطبيق هذا النظام، ستحصل على:

- ✅ **تسجيل دخول آمن** للمديرين والمساعدين فقط
- ✅ **JWT tokens محفوظة** في localStorage بشكل آمن
- ✅ **Edge Function محمية** بـ JWT authentication
- ✅ **RLS يعمل بشكل صحيح** مع auth.uid()
- ✅ **رسائل خطأ واضحة** بالعربية
- ✅ **حماية شاملة** على مستوى قاعدة البيانات والتطبيق

---

## 📞 الدعم

إذا واجهت أي مشاكل:

1. **راجع console المتصفح** للأخطاء
2. **افحص Network tab** للتأكد من إرسال التوكن
3. **شغل دوال SQL للتشخيص**
4. **تحقق من logs Edge Function** في Supabase Dashboard

### **أوامر مفيدة:**

```bash
# عرض logs Edge Function
supabase functions logs secure-add-product

# إعادة نشر الوظيفة
supabase functions deploy secure-add-product

# فحص متغيرات البيئة
supabase secrets list
```
