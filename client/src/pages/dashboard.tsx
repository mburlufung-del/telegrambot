import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  ShoppingCart, 
  Package, 
  MessageSquare, 
  Edit, 
  Trash2, 
  Plus,
  PlusCircle,
  MessageCircle,
  BarChart3,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductForm from "@/components/product-form";
import SystemIntegrationStatus from "@/components/system-integration-status";
import { useState } from "react";
import type { Product, Inquiry, BotStats } from "@shared/schema";

export default function Dashboard() {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Use the new synchronized dashboard overview API
  const { data: overview, isLoading } = useQuery<{
    stats: {
      totalUsers: number;
      totalOrders: number;
      totalProducts: number;
      totalMessages: number;
      totalRevenue: number;
      activeProducts: number;
      unreadInquiries: number;
    };
    recentProducts: Product[];
    recentInquiries: Inquiry[];
    recentOrders: any[];
    recentActivity: {
      newOrders: number;
      newInquiries: number;
      newProducts: number;
    };
    botStatus: {
      status: string;
      ready: boolean;
      lastRestart: string;
      uptime: number;
    };
    botConfig: {
      name: string;
      username: string;
      operator: string;
      customCommands: Array<{ command: string; response: string }>;
    };
    paymentMethods: number;
    deliveryMethods: number;
    systemHealth: {
      database: boolean;
      bot: boolean;
      lastSyncAt: string;
    };
  }>({
    queryKey: ["/api/dashboard/overview"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fallback to existing queries if overview fails
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: !overview, // Only fetch if overview is not available
  });

  const { data: inquiries = [] } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
    enabled: !overview,
  });

  // Use overview data when available, fallback to individual queries
  const recentProducts = overview?.recentProducts || products.slice(0, 3);
  const recentInquiries = overview?.recentInquiries || inquiries.slice(0, 3);
  const stats = overview?.stats;
  const botStatus = overview?.botStatus;
  const unreadCount = overview?.stats?.unreadInquiries || 0;

  if (isLoading && !overview) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Sync Status */}
      {overview?.systemHealth && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-800">
                Dashboard Synchronized
              </span>
            </div>
            <span className="text-xs text-green-600">
              Last sync: {new Date(overview.systemHealth.lastSyncAt).toLocaleTimeString()}
            </span>
          </div>
          {overview.botConfig && (
            <div className="mt-2 text-xs text-green-600">
              Bot: {overview.botConfig.name} • Operator: {overview.botConfig.operator} • 
              Custom Commands: {overview.botConfig.customCommands.length}
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalMessages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                botStatus?.ready ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {botStatus?.ready ? (
                  <Users className="h-6 w-6 text-green-600" />
                ) : (
                  <Users className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bot Status</p>
                <div className="flex items-center space-x-2">
                  <p className="text-lg font-bold text-gray-900 capitalize">{botStatus?.status || 'offline'}</p>
                  <Badge variant={botStatus?.ready ? 'default' : 'destructive'}>
                    {botStatus?.ready ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Products */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Product Catalog</CardTitle>
                <Button variant="ghost" className="text-telegram hover:text-blue-700">
                  Manage All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProducts.length > 0 ? (
                  recentProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.description}</p>
                        <div className="flex items-center mt-2">
                          <span className="text-lg font-bold text-telegram">${product.price}</span>
                          <Badge
                            variant={product.stock > 0 ? "default" : "destructive"}
                            className="ml-3"
                          >
                            {product.stock > 0 ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No products yet</p>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  className="w-full border-dashed border-2 hover:border-telegram hover:text-telegram"
                  onClick={() => setIsProductModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Product
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Inquiries & Bot Preview */}
        <div className="space-y-8">
          {/* Recent Customer Inquiries */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Inquiries</CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} New</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInquiries.length > 0 ? (
                  recentInquiries.map((inquiry) => (
                    <div key={inquiry.id} className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{inquiry.customerName}</p>
                        <p className="text-sm text-gray-600 truncate">{inquiry.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!inquiry.isRead && (
                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No inquiries yet</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full text-telegram hover:bg-telegram hover:text-white border-telegram"
                >
                  View All Inquiries
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Integration</CardTitle>
              <p className="text-sm text-gray-600">Bot and dashboard integration status</p>
            </CardHeader>
            <CardContent>
              <SystemIntegrationStatus />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-telegram to-telegram-light rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="ghost"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 h-auto text-left text-white hover:text-white justify-start"
            onClick={() => setIsProductModalOpen(true)}
          >
            <div>
              <PlusCircle className="h-6 w-6 mb-2" />
              <h4 className="font-medium">Add Product</h4>
              <p className="text-sm opacity-80">Add new item to catalog</p>
            </div>
          </Button>
          <Button
            variant="ghost"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 h-auto text-left text-white hover:text-white justify-start"
          >
            <div>
              <MessageCircle className="h-6 w-6 mb-2" />
              <h4 className="font-medium">Edit Auto-Responses</h4>
              <p className="text-sm opacity-80">Customize bot messages</p>
            </div>
          </Button>
          <Button
            variant="ghost"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 h-auto text-left text-white hover:text-white justify-start"
          >
            <div>
              <BarChart3 className="h-6 w-6 mb-2" />
              <h4 className="font-medium">View Analytics</h4>
              <p className="text-sm opacity-80">See bot performance</p>
            </div>
          </Button>
        </div>
      </div>

      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <ProductForm 
            onSuccess={() => setIsProductModalOpen(false)}
            onCancel={() => setIsProductModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
