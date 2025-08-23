import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SimpleCategories } from '@/components/SimpleCategories'
import { Users, ShoppingCart, DollarSign, MessageSquare, Bot, CheckCircle, Package, Settings, CreditCard, Mail, AlertCircle, RefreshCw, Tag, Folder } from 'lucide-react'

// Direct categories test component
function DirectCategoriesTest() {
  const [categories, setCategories] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    console.log('DirectCategoriesTest: Starting fetch...')
    const fetchCategories = async () => {
      try {
        console.log('DirectCategoriesTest: Making API call...')
        const response = await fetch('/api/categories')
        console.log('DirectCategoriesTest: Response status:', response.status)
        const data = await response.json()
        console.log('DirectCategoriesTest: Got categories:', data.length)
        console.log('DirectCategoriesTest: Categories:', data.map((c: any) => c.name).join(', '))
        setCategories(data)
      } catch (error) {
        console.error('DirectCategoriesTest error:', error)
      }
      setLoading(false)
    }
    fetchCategories()
    
    // Also set interval for testing
    const interval = setInterval(fetchCategories, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="text-sm">Loading categories...</div>

  console.log('DirectCategoriesTest render - categories:', categories.length, 'loading:', loading)

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-blue-600">
        DirectCategoriesTest Status: {loading ? 'Loading...' : `✓ Found ${categories.length} categories`}
      </p>
      
      {!loading && categories.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {categories.slice(0, 12).map((cat: any, index: number) => (
              <div key={cat.id || index} className="text-xs p-2 bg-blue-100 rounded border">
                <strong>{cat.name}</strong>
                {cat.isActive && <span className="text-green-600"> ✓</span>}
              </div>
            ))}
          </div>
          {categories.length > 12 && (
            <p className="text-xs text-gray-600 font-medium">...and {categories.length - 12} more categories</p>
          )}
        </>
      )}
      
      {!loading && categories.length === 0 && (
        <div className="text-red-600 text-sm font-medium">
          No categories found! Check API /api/categories
        </div>
      )}
    </div>
  )
}
import type { Product, BotSettings, Category } from '@shared/schema'

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

// Remove local interface - will use BotSettings from shared schema

// Remove local interface - will use Product from shared schema

export default function Dashboard() {
  const queryClient = useQueryClient()

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  const { data: botStatus } = useQuery<BotStatus>({
    queryKey: ['/api/bot/status'],
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  })

  const { data: botSettings = [], isLoading: settingsLoading, error: settingsError } = useQuery<BotSettings[]>({
    queryKey: ['/api/bot/settings'],
    refetchInterval: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    retry: 1,
    queryFn: async () => {
      console.log('Fetching bot settings from API...')
      try {
        const response = await fetch('/api/bot/settings')
        console.log('API Response status:', response.status)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const data = await response.json()
        console.log('Fetched bot settings data:', data)
        return data
      } catch (error) {
        console.error('Error fetching bot settings:', error)
        throw error
      }
    }
  })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    refetchInterval: false, // Only refetch manually
  })

  // Categories are now handled by the CategoriesDisplay component

  const refreshDashboard = async () => {
    console.log('Refreshing dashboard data...')
    await queryClient.invalidateQueries({ queryKey: ['/api/bot/settings'] })
    await queryClient.invalidateQueries({ queryKey: ['/api/products'] })
    await queryClient.invalidateQueries({ queryKey: ['/api/categories'] })
    await queryClient.refetchQueries({ queryKey: ['/api/categories'] })
    await queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] })
    await queryClient.invalidateQueries({ queryKey: ['/api/bot/status'] })
    console.log('Dashboard refresh triggered')
  }

  if (statsLoading) {
    return <div className="p-6">Loading dashboard...</div>
  }

  const dashboardStats = stats
  
  const getSetting = (key: string) => {
    if (settingsLoading) return 'Loading...'
    if (settingsError) {
      console.error('Settings error:', settingsError)
      return 'Error loading'
    }
    console.log('All bot settings:', botSettings)
    console.log('Settings length:', botSettings?.length)
    const setting = botSettings.find(s => s.key === key)
    console.log(`Getting setting ${key}:`, setting)
    return setting?.value || 'Not set'
  }

  const activeProducts = products.filter(p => p.isActive).length
  const lowStockProducts = products.filter(p => p.stock < 5).length

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
            <div className="text-2xl font-bold text-blue-600">{dashboardStats?.totalUsers || 0}</div>
            <p className="text-xs text-gray-600">Telegram customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardStats?.totalOrders || 0}</div>
            <p className="text-xs text-gray-600">From bot customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${dashboardStats?.totalRevenue || 0}</div>
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
                <span className="text-sm text-gray-600 min-w-0 w-1/3">Min Order:</span>
                <span className="font-medium text-sm text-right">{getSetting('currency_symbol')}{getSetting('minimum_order')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Welcome Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-24 overflow-y-auto">
                {getSetting('welcome_message').length > 100 
                  ? getSetting('welcome_message').substring(0, 100) + '...'
                  : getSetting('welcome_message')}
              </p>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              First message customers see when they start the bot
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment & Support Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {getSetting('payment_methods')}
              </p>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Payment options displayed to customers during checkout
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Support Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Operator:</span>
              <span className="font-medium text-sm">{getSetting('operator_name')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Username:</span>
              <span className="font-medium text-sm">{getSetting('operator_username')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Time:</span>
              <span className="font-medium text-sm">{getSetting('response_time')}</span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Hours:</span>
              <span className="font-medium text-sm text-right">{getSetting('support_hours')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Product Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleCategories />
        </CardContent>
      </Card>

      {/* Inventory & Activity Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Products</span>
              <span className="font-semibold">{products.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Products</span>
              <span className="font-semibold text-green-600">{activeProducts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Low Stock (&lt; 5)</span>
              <span className={`font-semibold ${lowStockProducts > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {lowStockProducts}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Stock Value</span>
              <span className="font-semibold text-green-600">
                ${products.reduce((sum, p) => sum + (Number(p.price) * p.stock), 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Custom Commands
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {getSetting('custom_command_1') && getSetting('custom_command_1') !== 'Not set' ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">/{getSetting('custom_command_1')}</span>
                <span className="font-medium text-sm text-green-600">Active</span>
              </div>
            ) : null}
            {getSetting('custom_command_2') && getSetting('custom_command_2') !== 'Not set' ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">/{getSetting('custom_command_2')}</span>
                <span className="font-medium text-sm text-green-600">Active</span>
              </div>
            ) : null}
            {getSetting('custom_command_3') && getSetting('custom_command_3') !== 'Not set' ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">/{getSetting('custom_command_3')}</span>
                <span className="font-medium text-sm text-green-600">Active</span>
              </div>
            ) : null}
            {(!getSetting('custom_command_1') || getSetting('custom_command_1') === 'Not set') && 
             (!getSetting('custom_command_2') || getSetting('custom_command_2') === 'Not set') && 
             (!getSetting('custom_command_3') || getSetting('custom_command_3') === 'Not set') && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No custom commands configured
              </div>
            )}
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Unread Messages:</span>
                <span className={`font-semibold ${(dashboardStats?.pendingInquiries || 0) > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {dashboardStats?.pendingInquiries || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(lowStockProducts > 0 || (dashboardStats?.pendingInquiries || 0) > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-5 h-5" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockProducts > 0 && (
              <div className="text-sm text-orange-700">
                • {lowStockProducts} product{lowStockProducts > 1 ? 's have' : ' has'} low stock - consider restocking
              </div>
            )}
            {(dashboardStats?.pendingInquiries || 0) > 0 && (
              <div className="text-sm text-orange-700">
                • {dashboardStats?.pendingInquiries} unread customer message{(dashboardStats?.pendingInquiries || 0) > 1 ? 's' : ''} from Telegram bot - respond to maintain customer satisfaction
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Bot className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Admin Dashboard</h3>
            <p className="text-blue-700 text-sm">
              Complete control over your Telegram shop bot. All changes sync instantly to customer interactions.
              Bot is {botStatus?.status || 'checking'} and serving customers through Telegram exclusively.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}