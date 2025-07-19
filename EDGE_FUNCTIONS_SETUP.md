# 🚀 Edge Functions Setup Guide

## 📋 Overview

This guide sets up Supabase Edge Functions for admin authentication and product management with proper RLS (Row Level Security) integration.

## 🛠️ Prerequisites

1. **Supabase Project** with CLI installed
2. **Deno** runtime installed
3. **Admin user** created in Supabase Auth

---

## 🔧 Setup Steps

### 1. **Database Setup**

Run the SQL in `sql_setup_for_edge_functions.sql` in your Supabase SQL Editor:

```sql
-- This will create:
-- ✅ system_users table
-- ✅ RLS policies for products and system_users
-- ✅ Validation functions and triggers
-- ✅ Test functions for debugging
```

### 2. **Create Admin User**

In Supabase Auth Dashboard:

1. Go to **Authentication > Users**
2. Click **"Add user"**
3. Create user with:
   - Email: `admin@example.com`
   - Password: `your-secure-password`
   - Email confirmed: ✅

### 3. **Add Admin to system_users Table**

```sql
-- Replace UUID with your actual admin user ID from Auth Dashboard
INSERT INTO public.system_users (id, email, role)
VALUES (
  'your-admin-user-uuid-here', -- Get this from Auth Dashboard
  'admin@example.com',
  'admin'
);
```

### 4. **Deploy Edge Functions**

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the functions
supabase functions deploy admin-login
supabase functions deploy add-product
```

### 5. **Set Environment Variables**

In Supabase Dashboard > Edge Functions:

```bash
# Set secrets for your functions
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🔗 API Endpoints

### **Admin Login**

```
POST https://your-project.supabase.co/functions/v1/admin-login
```

**Request:**

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "user-uuid",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### **Add Product**

```
POST https://your-project.supabase.co/functions/v1/add-product
Authorization: Bearer your-access-token
```

**Request:**

```json
{
  "name": "منتج جديد",
  "description": "وصف المنتج",
  "price": 99.99,
  "quantity": 10,
  "discount_amount": 5.0,
  "store_name": "اسم المتجر",
  "status": "draft"
}
```

**Response:**

```json
{
  "success": true,
  "message": "تم إضافة المنتج بنجاح",
  "data": {
    "id": "product-uuid",
    "name": "منتج جديد",
    "created_by": "user-uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## 📱 Frontend Integration

### **Installation**

Add the component to your React app:

```tsx
import AdminLoginAndProductManagement from "@/components/admin/AdminLoginAndProductManagement";

function App() {
  return (
    <div>
      <AdminLoginAndProductManagement />
    </div>
  );
}
```

### **Environment Variables** (Frontend)

```env
# If using custom domain for Edge Functions
REACT_APP_EDGE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1
```

---

## 🧪 Testing

### **1. Database Tests**

```sql
-- Test current user info
SELECT public.get_current_user_info();

-- Test setup validation
SELECT * FROM public.test_edge_function_setup();

-- Test product creation (after authentication)
SELECT public.create_sample_product();
```

### **2. Edge Function Tests**

```bash
# Test admin login
curl -X POST https://your-project.supabase.co/functions/v1/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'

# Test add product (replace TOKEN with actual token)
curl -X POST https://your-project.supabase.co/functions/v1/add-product \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Test Product",
    "price": 100,
    "quantity": 5,
    "store_name": "Test Store"
  }'
```

### **3. Frontend Tests**

Open browser console and check:

- Login flow saves tokens to localStorage
- Product creation sends Authorization header
- Error messages are displayed properly

---

## 🔍 Troubleshooting

### **Common Issues:**

#### **1. "غير مصرح لك بالدخول كمدير نظام"**

```sql
-- Check if user exists in system_users
SELECT * FROM public.system_users WHERE email = 'admin@example.com';

-- Add user if missing
INSERT INTO public.system_users (id, email, role)
VALUES ('user-uuid', 'admin@example.com', 'admin');
```

#### **2. "انتهكت سياسة الأمان"**

```sql
-- Check current user authentication
SELECT auth.uid();

-- Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'products';
```

#### **3. "رمز المصادقة غير صالح"**

- Check token expiration
- Verify Authorization header format: `Bearer token`
- Check environment variables in Edge Functions

#### **4. CORS Issues**

- Ensure CORS headers are included in Edge Functions
- Check if preflight OPTIONS requests are handled

### **Debug Functions:**

```sql
-- Get comprehensive user info
SELECT public.get_current_user_info();

-- Test authentication flow
SELECT public.test_edge_function_setup();

-- Create test product
SELECT public.create_sample_product();
```

---

## 📊 Architecture Flow

```
Frontend (React)
    ↓ POST /admin-login
Edge Function (admin-login)
    ↓ Verify credentials
Supabase Auth + system_users table
    ↓ Return access_token
Frontend stores token
    ↓ POST /add-product + Authorization header
Edge Function (add-product)
    ↓ Verify token + Check permissions
Supabase Auth + RLS policies
    ↓ Insert product with created_by = auth.uid()
Database with RLS protection
```

---

## 🔐 Security Features

- ✅ **JWT Token Authentication** - Secure token-based auth
- ✅ **Row Level Security** - Database-level access control
- ✅ **Role-based Permissions** - Admin/Assistant role checking
- ✅ **CORS Protection** - Proper cross-origin handling
- ✅ **Input Validation** - Server-side data validation
- ✅ **Error Handling** - Comprehensive error responses

---

## 🎯 Expected Results

After successful setup:

1. **Admin can login** and receive access token
2. **Token is stored** in localStorage securely
3. **Product creation works** with proper RLS
4. **auth.uid() returns correct user** in database operations
5. **No more "anonymous role" errors**

---

## 📞 Support

If you encounter issues:

1. Check browser console for frontend errors
2. Check Supabase logs for Edge Function errors
3. Run SQL test functions for database issues
4. Verify environment variables are set correctly

### **Useful Commands:**

```bash
# View Edge Function logs
supabase functions logs admin-login
supabase functions logs add-product

# Check function status
supabase functions list

# Redeploy if needed
supabase functions deploy admin-login --no-verify-jwt
```
