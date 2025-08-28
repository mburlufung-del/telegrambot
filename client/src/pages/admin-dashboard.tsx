import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  DollarSign
} from 'lucide-react'
import { Link } from 'wouter'

export default function AdminDashboard() {
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">24</div>
            <div className="text-sm text-gray-600">Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">156</div>
            <div className="text-sm text-gray-600">Orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">8</div>
            <div className="text-sm text-gray-600">New Messages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">$2,340</div>
            <div className="text-sm text-gray-600">Revenue</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}