import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Order, Store, ApiResponse } from '@/types/database'
import { toast } from 'sonner'
import { ShoppingBag, MapPin, Phone, User, Package, Store as StoreIcon } from 'lucide-react'

interface OrdersListProps {
  refreshTrigger: number
}

const OrdersList: React.FC<OrdersListProps> = ({ refreshTrigger }) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [assigningOrders, setAssigningOrders] = useState<Set<string>>(new Set())
  const { user } = useAuth()

  useEffect(() => {
    fetchOrders()
    if (user?.role === 'admin') {
      fetchStores()
    }
  }, [refreshTrigger, user])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_orders_detailed')

      if (error) {
        console.error('Fetch Orders Error:', error)
        toast.error('فشل في تحميل الطلبات')
        return
      }

      // Filter orders based on user role
      let filteredOrders = data || []
      if (user?.role === 'store' && user.store_id) {
        filteredOrders = filteredOrders.filter(order => order.assigned_store === user.store_id)
      }

      setOrders(filteredOrders as Order[])
    } catch (error) {
      console.error('Fetch Orders Error:', error)
      toast.error('حدث خطأ في تحميل الطلبات')
    } finally {
      setLoading(false)
    }
  }

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)

      if (error) {
        console.error('Fetch Stores Error:', error)
        return
      }

      setStores(data || [])
    } catch (error) {
      console.error('Fetch Stores Error:', error)
    }
  }

  const handleAssignOrder = async (orderId: string, storeId: string) => {
    if (!user?.id) return

    setAssigningOrders(prev => new Set(prev).add(orderId))

    try {
      const { data, error } = await supabase.rpc('assign_order_to_store', {
        p_order_id: orderId,
        p_store_id: storeId,
        p_assigned_by: user.id
      })

      if (error) {
        console.error('Assign Order Error:', error)
        toast.error('فشل في تعيين الطلب')
        return
      }

      const response = data as unknown as ApiResponse
      if (response?.success) {
        toast.success(response.message || 'تم تعيين الطلب بنجاح')
        fetchOrders()
      } else {
        toast.error(response?.error || 'فشل في تعيين الطلب')
      }
    } catch (error) {
      console.error('Assign Order Error:', error)
      toast.error('حدث خطأ في تعيين الطلب')
    } finally {
      setAssigningOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'delivered' | 'returned') => {
    if (!user?.store_id) return

    try {
      const { data, error } = await supabase.rpc('update_order_status', {
        order_id_param: orderId,
        new_status: newStatus,
        updated_by_store_id: user.store_id
      })

      if (error) {
        console.error('Update Order Status Error:', error)
        toast.error('فشل في تحديث حالة الطلب')
        return
      }

      const response = data as unknown as ApiResponse
      if (response?.success) {
        toast.success(response.message || 'تم تحديث حالة الطلب بنجاح')
        fetchOrders()
      } else {
        toast.error(response?.error || 'فشل في تحديث حالة الطلب')
      }
    } catch (error) {
      console.error('Update Order Status Error:', error)
      toast.error('حدث خطأ في تحديث حالة الطلب')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning'
      case 'assigned':
        return 'bg-info'
      case 'delivered':
        return 'bg-success'
      case 'returned':
        return 'bg-destructive'
      default:
        return 'bg-muted'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'معلق'
      case 'assigned':
        return 'معين'
      case 'delivered':
        return 'مسلم'
      case 'returned':
        return 'مرجع'
      default:
        return 'غير محدد'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-ar">جاري تحميل الطلبات...</div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-ar flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          قائمة الطلبات ({orders.length})
        </CardTitle>
        <CardDescription className="text-ar">
          جميع الطلبات حسب صلاحياتك
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-ar">
            لا توجد طلبات متاحة
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" />
                        <span className="font-semibold text-ar">{order.customer_name}</span>
                        {order.customer_code && (
                          <Badge variant="outline" className="text-xs">
                            {order.customer_code}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-ar">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{order.customer_phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{order.customer_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>{order.product_name} (الكمية: {order.quantity})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">المبلغ الإجمالي: {order.total_amount.toLocaleString('ar-SA')} ريال</span>
                        </div>
                      </div>
                      
                      {order.assigned_store_name && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-ar">
                          <StoreIcon className="w-4 h-4" />
                          <span>المتجر: {order.assigned_store_name}</span>
                        </div>
                      )}
                      
                      {order.notes && (
                        <div className="mt-2 text-sm text-muted-foreground text-ar">
                          <span className="font-medium">ملاحظات: </span>
                          {order.notes}
                        </div>
                      )}
                    </div>
                    
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    {/* Admin can assign orders to stores */}
                    {user?.role === 'admin' && order.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Select 
                          onValueChange={(storeId) => handleAssignOrder(order.id, storeId)}
                          disabled={assigningOrders.has(order.id)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="تعيين إلى متجر" />
                          </SelectTrigger>
                          <SelectContent>
                            {stores.map((store) => (
                              <SelectItem key={store.id} value={store.id}>
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {/* Store can update order status */}
                    {user?.role === 'store' && order.status === 'assigned' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                          className="text-ar"
                        >
                          تسليم الطلب
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateOrderStatus(order.id, 'returned')}
                          className="text-ar"
                        >
                          إرجاع الطلب
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 text-xs text-muted-foreground text-ar">
                    تاريخ الإنشاء: {new Date(order.created_at).toLocaleDateString('ar-SA')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default OrdersList