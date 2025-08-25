import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, ShoppingCart, DollarSign, MessageSquare, Bot, CheckCircle, Package, RefreshCw, Folder, CreditCard, Mail, Tag, Settings, AlertCircle } from 'lucide-react'
import type { Product, BotSettings, Category, PaymentMethod, DeliveryMethod } from '@shared/schema'

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  pendingInquiries: number
  messagesCount: number
}

interface BotStatus {
  status: 'online' | 'offline' | 'error'
  ready: Record<string, any>
  mode: 'polling' | 'webhook'
}

interface Inquiry {
  id: string
  isRead: boolean
}

export default function ComprehensiveDashboard() {
  const queryClient = useQueryClient()

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/bot/stats'],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  const { data: botStatus } = useQuery<BotStatus>({
    queryKey: ['/api/bot/status'],
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  })

  const { data: botSettings = [] } = useQuery<BotSettings[]>({
    queryKey: ['/api/bot/settings'],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  const { data: inquiries = [] } = useQuery<Inquiry[]>({
    queryKey: ['/api/inquiries'],
    refetchInterval: 30 * 1000, // 30 seconds
  })

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  const { data: deliveryMethods = [] } = useQuery<DeliveryMethod[]>({
    queryKey: ['/api/delivery-methods'],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  const refreshDashboard = async () => {
    await queryClient.invalidateQueries()
  }

  if (statsLoading) {
    return <div className="p-6">Loading dashboard...</div>
  }

  const getSetting = (key: string) => {
    const setting = botSettings.find(s => s.key === key)
    return setting?.value || 'Not set'
  }

  const activeProducts = products.filter(p => p.isActive).length
  const lowStockProducts = products.filter(p => p.stock < 5).length
  const unreadInquiries = inquiries.filter(i => !i.isRead).length
  const activePaymentMethods = paymentMethods.filter(pm => pm.isActive).length
  const activeDeliveryMethods = deliveryMethods.filter(dm => dm.isActive).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">Admin control center for your Telegram shop bot</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={refreshDashboard} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
          {botStatus && (
            <div className={`flex items-center px-3 py-2 rounded-lg ${
              botStatus.status === 'online' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <Bot className="w-4 h-4 mr-2" />
              Bot {botStatus.status} ({botStatus.mode})
              {botStatus.status === 'online' && <CheckCircle className="w-4 h-4 ml-1" />}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-gray-600">Telegram customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-gray-600">From bot customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${stats?.totalRevenue || 0}</div>
            <p className="text-xs text-gray-600">All sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{activeProducts}</div>
            <p className="text-xs text-gray-600">of {products.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Folder className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{categories.length}</div>
            <p className="text-xs text-gray-600">Product categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Bot Configuration Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Bot Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600 min-w-0 w-1/3">Bot Name:</span>
                <span className="font-medium text-sm break-words text-right">{getSetting('bot_name')}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600 min-w-0 w-1/3">Username:</span>
                <span className="font-medium text-sm break-words text-right">{getSetting('bot_username')}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600 min-w-0 w-1/3">Currency:</span>
                <span className="font-medium text-sm text-right">{getSetting('currency_symbol')} ({getSetting('currency_code')})</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600 min-w-0 w-1/3">Language:</span>
                <span className="font-medium text-sm text-right">{getSetting('language')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Customer Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Inquiries</span>
              <span className="font-semibold">{inquiries.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Unread Messages</span>
              <span className={`font-semibold ${unreadInquiries > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {unreadInquiries}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Rate</span>
              <span className="font-semibold text-green-600">
                {inquiries.length > 0 ? Math.round((inquiries.length - unreadInquiries) / inquiries.length * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment & Delivery Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Methods</span>
              <span className="font-semibold text-green-600">{activePaymentMethods}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Configured</span>
              <span className="font-semibold">{paymentMethods.length}</span>
            </div>
            {paymentMethods.slice(0, 3).map((method) => (
              <div key={method.id} className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-600">{method.name}</span>
                <span className={`text-xs ${method.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {method.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Delivery Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Methods</span>
              <span className="font-semibold text-green-600">{activeDeliveryMethods}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Configured</span>
              <span className="font-semibold">{deliveryMethods.length}</span>
            </div>
            {deliveryMethods.slice(0, 3).map((method) => (
              <div key={method.id} className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-600">{method.name}</span>
                <span className={`text-xs ${method.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {method.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Product Inventory Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Inventory Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{products.length}</div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{activeProducts}</div>
              <div className="text-sm text-gray-600">Active Products</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${lowStockProducts > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {lowStockProducts}
              </div>
              <div className="text-sm text-gray-600">Low Stock (&lt; 5)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${products.reduce((sum, p) => sum + (Number(p.price) * p.stock), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Stock Value</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Bot Status</span>
              <span className={`font-medium ${botStatus?.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                {botStatus?.status || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Configuration</span>
              <span className="font-medium">{botSettings.length} Settings</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Categories</span>
              <span className="font-medium">{categories.filter(c => c.isActive).length} Active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="w-5 h-5" />
              Admin Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-blue-700 text-sm">
                Complete control over your Telegram shop bot. All changes sync instantly to customer interactions.
                Bot is {botStatus?.status || 'checking'} and serving customers through Telegram exclusively.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}