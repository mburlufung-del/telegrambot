import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ShoppingCart, DollarSign, MessageSquare, Bot, CheckCircle, Package } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  messagesCount: number
}

interface BotStatus {
  status: 'online' | 'offline' | 'error'
  ready: Record<string, any>
  mode: 'polling' | 'webhook'
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: DashboardStats }>({
    queryKey: ['/api/dashboard/overview'],
    refetchInterval: 10000,
  })

  const { data: botStatus } = useQuery<BotStatus>({
    queryKey: ['/api/bot/status'],
    refetchInterval: 60000,
  })

  if (statsLoading) {
    return <div className="p-6">Loading dashboard...</div>
  }

  const dashboardStats = stats?.stats

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalUsers || 0}</div>
            <p className="text-xs text-gray-600">Active customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalOrders || 0}</div>
            <p className="text-xs text-gray-600">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardStats?.totalRevenue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-gray-600">Total earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.messagesCount || 0}</div>
            <p className="text-xs text-gray-600">Bot interactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <a href="/products" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <ShoppingCart className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold">Manage Products</h3>
                <p className="text-sm text-gray-600">Add or edit products</p>
              </a>
              <a href="/broadcast" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <MessageSquare className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold">Send Broadcast</h3>
                <p className="text-sm text-gray-600">Message all customers</p>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Bot Status</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  botStatus?.status === 'online' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {botStatus?.status || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Database</span>
                <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>API</span>
                <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

