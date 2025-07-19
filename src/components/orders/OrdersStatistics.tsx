import React, { useState, useEffect } from 'react'
import { StatsCard } from '@/components/ui/stats-card'
import { supabase } from '@/integrations/supabase/client'
import { OrderStatistics } from '@/types/database'
import { toast } from 'sonner'

interface OrdersStatisticsProps {
  refreshTrigger: number
}

const OrdersStatistics: React.FC<OrdersStatisticsProps> = ({ refreshTrigger }) => {
  const [stats, setStats] = useState<OrderStatistics>({
    total_orders: 0,
    pending_orders: 0,
    assigned_orders: 0,
    delivered_orders: 0,
    returned_orders: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [refreshTrigger])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_orders_statistics')

      if (error) {
        console.error('Fetch Statistics Error:', error)
        toast.error('فشل في تحميل الإحصائيات')
        return
      }

      if (data && data.length > 0) {
        setStats(data[0])
      }
    } catch (error) {
      console.error('Fetch Statistics Error:', error)
      toast.error('حدث خطأ في تحميل الإحصائيات')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatsCard
        title="إجمالي الطلبات"
        value={stats.total_orders}
        variant="info"
      />
      <StatsCard
        title="طلبات معلقة"
        value={stats.pending_orders}
        variant="warning"
      />
      <StatsCard
        title="طلبات معينة"
        value={stats.assigned_orders}
        variant="default"
      />
      <StatsCard
        title="طلبات مسلمة"
        value={stats.delivered_orders}
        variant="success"
      />
      <StatsCard
        title="طلبات مرتجعة"
        value={stats.returned_orders}
        variant="destructive"
      />
    </div>
  )
}

export default OrdersStatistics