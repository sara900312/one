export type UserRole = 'admin' | 'assistant' | 'store'
export type OrderStatus = 'pending' | 'assigned' | 'delivered' | 'returned'
export type ProductStatus = 'draft' | 'published'

export interface SystemUser {
  id: string
  email: string
  password_hash: string
  role: UserRole
  store_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  name: string
  username: string
  password_hash: string
  owner_email?: string
  phone?: string
  address?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  discount_amount: number
  discount_percentage?: number
  final_price?: number
  quantity: number
  store_name: string
  image_url_1?: string
  image_url_2?: string
  image_url_3?: string
  image_url_4?: string
  status: ProductStatus
  created_by?: string
  published_by?: string
  published_at?: string
  created_at: string
  updated_at: string
  can_edit?: boolean
}

export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  customer_city?: string
  customer_code?: string
  notes?: string
  total_amount: number
  quantity?: number
  product_price?: number
  status: OrderStatus | string
  assigned_store?: string
  assigned_store_id?: string
  assigned_store_name?: string
  store_name?: string
  product_id?: string
  product_name?: string
  order_code?: string
  assigned_at?: string
  delivered_at?: string
  returned_at?: string
  created_at: string
  updated_at: string
}

export interface OrderStatistics {
  total_orders: number
  pending_orders: number
  assigned_orders: number
  delivered_orders: number
  returned_orders: number
}

export interface AuthUser {
  id: string
  role: UserRole
  store_id?: string
  store_name?: string
}

export interface ApiResponse {
  success: boolean
  message?: string
  error?: string
  [key: string]: any
}