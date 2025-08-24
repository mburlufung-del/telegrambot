import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, ShoppingCart, DollarSign, MessageSquare, Package, Activity, Clock } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  isActive: boolean
  createdAt: string
}

interface Order {
  id: string
  totalAmount: number
  status: string
  createdAt: string
}

interface Inquiry {
  id: string
  isRead: boolean
  createdAt: string
}

export default function Analytics() {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    refetchInterval: false, // Only refetch when manually invalidated
  })

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    refetchInterval: false, // Only refetch when manually invalidated
  })

  const { data: inquiries = [] } = useQuery<Inquiry[]>({
    queryKey: ['/api/inquiries'],
    refetchInterval: false, // Only refetch when manually invalidated
  })

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 5 * 60 * 1000, // 5 minutes for stats
  })

  const { data: botStats } = useQuery({
    queryKey: ['/api/bot/stats'],
    refetchInterval: 5 * 60 * 1000, // 5 minutes for bot stats
  })

  // Calculate analytics using both local data and bot stats
  const totalRevenue = stats?.totalRevenue || botStats?.totalRevenue || orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
  const totalOrders = stats?.totalOrders || botStats?.totalOrders || orders.length
  const totalMessages = stats?.messagesCount || botStats?.totalMessages || 0
  const totalUsers = botStats?.totalUsers || stats?.totalUsers || 0
  const totalProducts = stats?.totalProducts || products.length
  
  const averageOrderValue = totalOrders > 0 ? Number(totalRevenue) / totalOrders : 0
  const activeProducts = products.filter(p => p.isActive).length
  const lowStockProducts = products.filter(p => p.stock < 5).length
  const unreadInquiries = inquiries.filter(i => !i.isRead).length
  
  // Recent activity (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentOrders = orders.filter(o => new Date(o.createdAt) > weekAgo)
  const recentInquiries = inquiries.filter(i => new Date(i.createdAt) > weekAgo)
  const recentProducts = products.filter(p => new Date(p.createdAt) > weekAgo)

  // Order status breakdown
  const pendingOrders = orders.filter(o => o.status.toLowerCase() === 'pending').length
  const completedOrders = orders.filter(o => ['shipped', 'delivered'].includes(o.status.toLowerCase())).length
  const processingOrders = orders.filter(o => ['confirmed', 'processing'].includes(o.status.toLowerCase())).length

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
            <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
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
            <div className="text-2xl font-bold text-purple-600">{activeProducts}</div>
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
                ${recentOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0).toFixed(2)}
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

      {/* Inventory & Customer Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Products</span>
              <span className="font-semibold">{products.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Products</span>
              <span className="font-semibold text-green-600">{activeProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Low Stock (&lt; 5)</span>
              <span className={`font-semibold ${lowStockProducts > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {lowStockProducts}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Stock Value</span>
              <span className="font-semibold text-green-600">
                ${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Customer Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Messages</span>
              <span className="font-semibold">{inquiries.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Unread Messages</span>
              <span className={`font-semibold ${unreadInquiries > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {unreadInquiries}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Response Rate</span>
              <span className="font-semibold text-green-600">
                {inquiries.length > 0 ? Math.round(((inquiries.length - unreadInquiries) / inquiries.length) * 100) : 100}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Daily Messages</span>
              <span className="font-semibold text-blue-600">
                {Math.round(inquiries.length / Math.max(1, (Date.now() - new Date(inquiries[inquiries.length - 1]?.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Recommendations */}
      {(lowStockProducts > 0 || unreadInquiries > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Clock className="w-5 h-5" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockProducts > 0 && (
              <div className="text-sm text-orange-700">
                • {lowStockProducts} product{lowStockProducts > 1 ? 's have' : ' has'} low stock (&lt; 5 units) - consider restocking
              </div>
            )}
            {unreadInquiries > 0 && (
              <div className="text-sm text-orange-700">
                • {unreadInquiries} unread customer message{unreadInquiries > 1 ? 's' : ''} - respond to maintain customer satisfaction
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Activity className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Real-Time Analytics</h3>
            <p className="text-blue-700 text-sm">
              All analytics update automatically as customers interact with your Telegram bot. Data refreshes every 30 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}