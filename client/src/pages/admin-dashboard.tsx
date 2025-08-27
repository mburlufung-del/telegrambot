import { useQuery } from '@tanstack/react-query'
import React from 'react'
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
    refetchInterval: 3000,
    staleTime: 0,
    refetchOnMount: true,
    queryFn: async () => {
      console.log('Fetching categories...')
      const response = await fetch('/api/categories')
      if (!response.ok) {
        console.error('Categories API failed:', response.status)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      console.log('Categories loaded:', data.length, 'items')
      return data
    }
  })

  // Add debugging
  console.log('Categories state:', { loading: categoriesLoading, error: categoriesError, count: categories.length })



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
        {/* Categories */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Folder className="w-6 h-6 text-red-600" />
              Categories [DEBUG: {categoriesLoading ? 'Loading' : 'Loaded'} - {categories.length} items]
            </CardTitle>
            <div className="flex gap-2">
              <Link href="/categories">
                <Button size="sm" data-testid="button-create-category-main">
                  <Plus className="w-4 h-4 mr-1" />
                  Create Category
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-xs">
              DEBUG INFO: Loading={String(categoriesLoading)}, Error={String(categoriesError)}, Count={categories.length}
              <br />
              Categories: {categories.map(c => c.name).join(', ')}
            </div>
            
            <div className="mb-4 p-4 bg-green-100 border border-green-400 rounded">
              <h3 className="font-bold text-green-800 mb-2">TEST DISPLAY - Categories:</h3>
              {categories.length > 0 ? (
                <ul className="space-y-2">
                  {categories.map(category => (
                    <li key={category.id} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div>
                        <strong>{category.name}</strong>
                        <br />
                        <small className="text-gray-600">{category.description}</small>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${category.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-600 font-bold">NO CATEGORIES FOUND!</p>
              )}
            </div>
            
            <Link href="/categories">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Go to Categories Page
              </Button>
            </Link>
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