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
  BarChart3,
  Folder,
  Edit
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

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    refetchInterval: 5000, // Faster refresh for testing
    staleTime: 0,
    refetchOnMount: true,
    queryFn: async () => {
      console.log('🔍 Admin Dashboard: Fetching categories...')
      const response = await fetch('/api/categories')
      if (!response.ok) {
        console.error('❌ Categories API Error:', response.status, response.statusText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      console.log('✅ Admin Dashboard: Got', data.length, 'categories:', data.map(c => c.name))
      return data
    }
  })

  // Debug logging
  console.log('🎯 Dashboard Render State:', {
    categoriesLoading,
    categoriesCount: categories?.length || 0,
    hasCategories: categories && categories.length > 0,
    categoriesError: categoriesError?.message || null
  })

  // Force a re-render indicator
  const renderTime = new Date().toISOString()
  console.log('🔄 Dashboard rendered at:', renderTime)

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
          <Link href="/categories">
            <Button variant="outline" data-testid="button-add-category-header">
              <Folder className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </Link>
          <Link href="/products">
            <Button data-testid="button-add-product">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Category Management Section */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-6 h-6 text-blue-600" />
            Category Management
          </CardTitle>
          <div className="flex gap-2">
            <Link href="/categories">
              <Button size="sm" data-testid="button-create-category-main">
                <Plus className="w-4 h-4 mr-1" />
                Create Category
              </Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline" size="sm" data-testid="button-manage-categories-main">
                <Edit className="w-4 h-4 mr-1" />
                Manage All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-blue-600">Loading categories...</div>
            </div>
          ) : categoriesError ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">Error loading categories</div>
              <Link href="/categories">
                <Button variant="outline" size="sm">Try Again</Button>
              </Link>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Folder className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories created yet</h3>
              <p className="text-gray-600 mb-4">Create your first product category to organize your inventory</p>
              <Link href="/categories">
                <Button data-testid="button-create-first-category-main">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Category
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  {categories.filter(c => c.isActive).length} active categories
                </div>
                <Link href="/categories">
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    View all {categories.length} categories →
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.slice(0, 6).map((category) => {
                  const categoryProducts = products.filter(p => p.categoryId === category.id)
                  return (
                    <div key={category.id} className="p-4 bg-white border border-blue-200 rounded-lg hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Folder className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="font-medium text-gray-900">{category.name}</div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          category.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <Package className="w-3 h-3" />
                          <span>{categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''}</span>
                        </div>
                        <Link href="/categories">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-100">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

    </div>
  )
}