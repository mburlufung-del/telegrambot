import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, ShoppingCart, DollarSign, MessageSquare, Package, Activity, Clock } from 'lucide-react'

export default function Analytics() {
  // Direct API queries with explicit fetch functions
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    },
    refetchInterval: 30 * 1000,
  })

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'], 
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')
      return response.json()
    },
    refetchInterval: 10 * 1000,
  })

  const { data: botStatsData, isLoading: botStatsLoading } = useQuery({
    queryKey: ['bot-stats'],
    queryFn: async () => {
      const response = await fetch('/api/bot/stats')
      if (!response.ok) throw new Error('Failed to fetch bot stats')
      return response.json()
    },
    refetchInterval: 10 * 1000,
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      return response.json()
    },
    refetchInterval: 30 * 1000,
  })

  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['inquiries'],
    queryFn: async () => {
      const response = await fetch('/api/inquiries')
      if (!response.ok) throw new Error('Failed to fetch inquiries')
      return response.json()
    },
    refetchInterval: 15 * 1000,
  })

  // Safe data access with fallbacks
  const products = Array.isArray(productsData) ? productsData : []
  const stats = statsData || {}
  const botStats = botStatsData || {}
  const orders = Array.isArray(ordersData) ? ordersData : []
  const inquiries = Array.isArray(inquiriesData) ? inquiriesData : []

  // Calculate metrics safely
  const totalUsers = botStats.totalUsers || stats.totalUsers || 0
  const totalProducts = stats.totalProducts || products.length
  const activeProducts = products.filter((p: any) => p.isActive).length
  const totalRevenue = stats.totalRevenue || Number(botStats.totalRevenue || 0) || 0
  const totalOrders = stats.totalOrders || botStats.totalOrders || orders.length
  const totalMessages = stats.messagesCount || botStats.totalMessages || 0

  const averageOrderValue = totalOrders > 0 ? Number(totalRevenue) / totalOrders : 0
  const lowStockProducts = products.filter((p: any) => p.stock < 5).length
  const unreadInquiries = inquiries.filter((i: any) => !i.isRead).length

  // Recent activity (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentOrders = orders.filter((o: any) => new Date(o.createdAt) > weekAgo)
  const recentInquiries = inquiries.filter((i: any) => new Date(i.createdAt) > weekAgo)
  const recentProducts = products.filter((p: any) => new Date(p.createdAt) > weekAgo)

  // Order status breakdown
  const pendingOrders = orders.filter((o: any) => o.status?.toLowerCase() === 'pending').length
  const completedOrders = orders.filter((o: any) => ['completed', 'shipped', 'delivered'].includes(o.status?.toLowerCase())).length
  const processingOrders = orders.filter((o: any) => ['confirmed', 'processing'].includes(o.status?.toLowerCase())).length

  const isLoading = productsLoading || statsLoading || botStatsLoading

  console.log('Analytics Simple Debug:', {
    totalUsers,
    totalProducts,
    activeProducts,
    products: products.length,
    stats,
    botStats,
    isLoading,
    orders: {
      total: orders.length,
      pending: pendingOrders,
      processing: processingOrders,
      completed: completedOrders,
      statusBreakdown: orders.reduce((acc: any, order: any) => {
        const status = order.status?.toLowerCase() || 'unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Comprehensive overview of your Telegram shop performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? 'Loading...' : totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">Telegram bot users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${Number(totalRevenue).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {totalOrders} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {isLoading ? 'Loading...' : activeProducts}
            </div>
            <p className="text-xs text-muted-foreground">of {totalProducts} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Order Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Orders</span>
              <span className="font-semibold text-green-600">{recentOrders.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Messages</span>
              <span className="font-semibold text-blue-600">{recentInquiries.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Products</span>
              <span className="font-semibold text-purple-600">{recentProducts.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue (7d)</span>
              <span className="font-semibold text-green-600">
                ${recentOrders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Order Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Orders</span>
              <span className="font-semibold text-yellow-600">{pendingOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Processing</span>
              <span className="font-semibold text-blue-600">{processingOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">{completedOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="font-semibold text-green-600">
                {orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bot Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Bot Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Messages</span>
              <span className="font-semibold text-blue-600">{totalMessages.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bot Users</span>
              <span className="font-semibold text-green-600">{totalUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bot Revenue</span>
              <span className="font-semibold text-purple-600">${Number(botStats.totalRevenue || 0).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-Time Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bot Status</span>
              <span className="font-semibold text-green-600">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Update</span>
              <span className="font-semibold text-blue-600">
                {botStats.updatedAt ? new Date(botStats.updatedAt).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Data Sync</span>
              <span className="font-semibold text-green-600">Active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="font-semibold text-green-600">
                {totalUsers > 0 ? ((totalOrders / totalUsers) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Messages/User</span>
              <span className="font-semibold text-blue-600">
                {totalUsers > 0 ? (totalMessages / totalUsers).toFixed(1) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue/User</span>
              <span className="font-semibold text-purple-600">
                ${totalUsers > 0 ? (Number(totalRevenue) / totalUsers).toFixed(2) : '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Activity className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Real-Time Analytics</h3>
            <p className="text-blue-700 text-sm">
              All analytics update automatically as customers interact with your Telegram bot. Data refreshes every 10-30 seconds for real-time synchronization.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}