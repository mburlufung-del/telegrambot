import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign, 
  MessageSquare, 
  Settings,
  Eye,
  Plus,
  BarChart3
} from 'lucide-react'
import { Link } from 'wouter'
import type { Product, Order, Inquiry, Category } from '@shared/schema'

export default function AdminDashboard() {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    refetchInterval: 30000
  })

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'], 
    refetchInterval: 30000
  })

  const { data: inquiries = [] } = useQuery<Inquiry[]>({
    queryKey: ['/api/inquiries'],
    refetchInterval: 30000
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    refetchInterval: 30000
  })

  // Calculate stats
  const activeProducts = products.filter(p => p.isActive).length
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const unreadInquiries = inquiries.filter(i => !i.isRead).length
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0)

  // Recent activity
  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const recentInquiries = inquiries
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your Telegram shop bot efficiently</p>
        </div>
        <div className="flex gap-2">
          <Link href="/products">
            <Button data-testid="button-add-product">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">From completed orders</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeProducts}
            </div>
            <p className="text-xs text-gray-600">Out of {products.length} total</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingOrders}
            </div>
            <p className="text-xs text-gray-600">Need attention</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {unreadInquiries}
            </div>
            <p className="text-xs text-gray-600">Customer inquiries</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/products">
              <Button variant="outline" className="w-full h-20 flex-col gap-2" data-testid="button-manage-products">
                <Package className="w-6 h-6" />
                <span>Manage Products</span>
              </Button>
            </Link>
            <Link href="/orders">
              <Button variant="outline" className="w-full h-20 flex-col gap-2" data-testid="button-view-orders">
                <ShoppingCart className="w-6 h-6" />
                <span>View Orders</span>
              </Button>
            </Link>
            <Link href="/inquiries">
              <Button variant="outline" className="w-full h-20 flex-col gap-2" data-testid="button-customer-support">
                <MessageSquare className="w-6 h-6" />
                <span>Customer Support</span>
              </Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline" className="w-full h-20 flex-col gap-2" data-testid="button-manage-categories">
                <BarChart3 className="w-6 h-6" />
                <span>Categories</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Recent Orders
            </CardTitle>
            <Link href="/orders">
              <Button variant="ghost" size="sm" data-testid="button-view-all-orders">
                <Eye className="w-4 h-4 mr-1" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No orders yet
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">Order #{order.id.slice(0, 8)}</div>
                      <div className="text-sm text-gray-600">
                        {order.customerName || 'Anonymous'} • ${Number(order.totalAmount).toFixed(2)}
                      </div>
                    </div>
                    <Badge 
                      variant={
                        order.status === 'completed' ? 'default' :
                        order.status === 'pending' ? 'secondary' :
                        order.status === 'cancelled' ? 'destructive' : 'outline'
                      }
                      data-testid={`badge-order-status-${order.status}`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Customer Messages
            </CardTitle>
            <Link href="/inquiries">
              <Button variant="ghost" size="sm" data-testid="button-view-all-inquiries">
                <Eye className="w-4 h-4 mr-1" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInquiries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No messages yet
                </div>
              ) : (
                recentInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{inquiry.customerName}</div>
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {inquiry.message}
                      </div>
                    </div>
                    {!inquiry.isRead && (
                      <Badge variant="destructive" className="ml-2" data-testid="badge-unread">
                        New
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Product Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No categories configured yet
              </div>
            ) : (
              categories.map((category) => {
                const categoryProducts = products.filter(p => p.categoryId === category.id)
                return (
                  <div key={category.id} className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <div className="font-medium text-blue-900">{category.name}</div>
                    <div className="text-sm text-blue-700 mt-1">
                      {categoryProducts.length} products
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                      {category.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}