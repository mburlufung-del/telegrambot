import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Send, 
  Package, 
  FolderPlus, 
  MessageSquare, 
  CreditCard, 
  Truck, 
  Headphones,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Activity,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Link } from 'wouter'
import type { Product, Order, Inquiry, Category, PaymentMethod, DeliveryMethod } from '@shared/schema'

export default function AdminDashboard() {
  // Fetch real data
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

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    refetchInterval: 30000
  })

  const { data: deliveryMethods = [] } = useQuery<DeliveryMethod[]>({
    queryKey: ['/api/delivery-methods'],
    refetchInterval: 30000
  })

  // Calculate real stats
  const activeProducts = products.filter(p => p.isActive).length
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const unreadInquiries = inquiries.filter(i => !i.isRead).length
  const totalRevenue = orders
    .filter(o => o.status === 'completed' || o.status === 'delivered')
    .reduce((sum, order) => sum + Number(order.totalAmount), 0)

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  const recentInquiries = inquiries
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">TeleShop Admin Dashboard</h1>
          <p className="text-gray-600">Manage your Telegram e-commerce bot and operations</p>
        </div>
      </div>

      {/* Main Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Live Analysis */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all cursor-pointer">
          <Link href="/analytics">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Analysis</h3>
              <p className="text-sm text-gray-600 mb-4">Monitor real-time sales, user activity, and performance metrics</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="button-live-analysis">
                View Analytics
              </Button>
            </CardContent>
          </Link>
        </Card>

        {/* 2. Broadcast to Users */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all cursor-pointer">
          <Link href="/broadcast">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Broadcast to Users</h3>
              <p className="text-sm text-gray-600 mb-4">Send announcements and promotions to your customers</p>
              <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-broadcast">
                Send Broadcast
              </Button>
            </CardContent>
          </Link>
        </Card>

        {/* 3. Add New Products */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all cursor-pointer">
          <Link href="/products">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Products</h3>
              <p className="text-sm text-gray-600 mb-4">Manage your product catalog and inventory</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700" data-testid="button-products">
                Manage Products
              </Button>
            </CardContent>
          </Link>
        </Card>

        {/* 4. Add Product Categories */}
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-all cursor-pointer">
          <Link href="/categories">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <FolderPlus className="w-6 h-6 text-white" />
                </div>
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Categories</h3>
              <p className="text-sm text-gray-600 mb-4">Organize products into categories for easy browsing</p>
              <Button className="w-full bg-orange-600 hover:bg-orange-700" data-testid="button-categories">
                Manage Categories
              </Button>
            </CardContent>
          </Link>
        </Card>

        {/* 5. Customer Inquiries */}
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100 hover:shadow-lg transition-all cursor-pointer">
          <Link href="/inquiries">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Inquiries</h3>
              <p className="text-sm text-gray-600 mb-4">Handle customer questions and support requests</p>
              <Button className="w-full bg-red-600 hover:bg-red-700" data-testid="button-inquiries">
                View Messages
              </Button>
            </CardContent>
          </Link>
        </Card>

        {/* 6. Payment Options */}
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100 hover:shadow-lg transition-all cursor-pointer">
          <Link href="/payment-methods">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <DollarSign className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Options</h3>
              <p className="text-sm text-gray-600 mb-4">Configure payment methods and processing options</p>
              <Button className="w-full bg-teal-600 hover:bg-teal-700" data-testid="button-payment-methods">
                Setup Payments
              </Button>
            </CardContent>
          </Link>
        </Card>

        {/* 7. Delivery Service */}
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-lg transition-all cursor-pointer">
          <Link href="/delivery-methods">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <Truck className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Service</h3>
              <p className="text-sm text-gray-600 mb-4">Manage shipping methods and delivery options</p>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" data-testid="button-delivery-methods">
                Setup Delivery
              </Button>
            </CardContent>
          </Link>
        </Card>

        {/* 8. Operator Support */}
        <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100 hover:shadow-lg transition-all cursor-pointer">
          <Link href="/operator-support">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <Users className="w-5 h-5 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Operator Support</h3>
              <p className="text-sm text-gray-600 mb-4">Configure support team settings and operations</p>
              <Button className="w-full bg-pink-600 hover:bg-pink-700" data-testid="button-operator-support">
                Manage Support
              </Button>
            </CardContent>
          </Link>
        </Card>

      </div>

      {/* Live Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Active Products</p>
                <p className="text-3xl font-bold">{activeProducts}</p>
                <p className="text-blue-100 text-xs">of {products.length} total</p>
              </div>
              <Package className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold">{orders.length}</p>
                <p className="text-green-100 text-xs">{pendingOrders} pending</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Customer Messages</p>
                <p className="text-3xl font-bold">{inquiries.length}</p>
                <p className="text-red-100 text-xs">{unreadInquiries} unread</p>
              </div>
              <MessageSquare className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
                <p className="text-purple-100 text-xs">from completed orders</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
            <FolderPlus className="w-6 h-6 text-orange-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Payment Methods</p>
              <p className="text-2xl font-bold">{paymentMethods.length}</p>
            </div>
            <CreditCard className="w-6 h-6 text-teal-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivery Options</p>
              <p className="text-2xl font-bold">{deliveryMethods.length}</p>
            </div>
            <Truck className="w-6 h-6 text-indigo-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bot Status</p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
            </div>
            <Activity className="w-6 h-6 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-gray-600">${Number(order.totalAmount).toFixed(2)}</p>
                    </div>
                    <Badge variant={
                      order.status === 'completed' ? 'default' :
                      order.status === 'pending' ? 'secondary' :
                      order.status === 'cancelled' ? 'destructive' : 'outline'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Recent Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInquiries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No inquiries yet</p>
            ) : (
              <div className="space-y-3">
                {recentInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{inquiry.customerName}</p>
                      <p className="text-sm text-gray-600 truncate">{inquiry.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!inquiry.isRead && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                      <Badge variant={inquiry.isRead ? 'secondary' : 'default'}>
                        {inquiry.isRead ? 'Read' : 'New'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}