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
import { useState } from "react";
import type { Product, Inquiry, BotStats } from "@shared/schema";

export default function Dashboard() {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: inquiries = [] } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
  });

  const { data: stats } = useQuery<BotStats>({
    queryKey: ["/api/bot/stats"],
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/inquiries/unread-count"],
  });

  const { data: botStatus } = useQuery<{ status: string; ready: boolean }>({
    queryKey: ["/api/bot/status"],
    refetchInterval: 5000, // Check every 5 seconds
  });

  const recentProducts = products.slice(0, 3);
  const recentInquiries = inquiries.slice(0, 3);
  const unreadCount = unreadData?.count || 0;

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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

          {/* Bot Conversation Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Bot Conversation Preview</CardTitle>
              <p className="text-sm text-gray-600">See how customers interact with your bot</p>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                <div className="space-y-3">
                  {/* Bot message */}
                  <div className="flex">
                    <div className="w-8 h-8 bg-telegram rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-3 bg-white rounded-lg p-3 shadow-sm max-w-xs">
                      <p className="text-sm">Welcome to our store! Type /catalog to see our products or /help for assistance.</p>
                    </div>
                  </div>
                  
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-telegram text-white rounded-lg p-3 max-w-xs">
                      <p className="text-sm">/catalog</p>
                    </div>
                  </div>
                  
                  {/* Bot response */}
                  <div className="flex">
                    <div className="w-8 h-8 bg-telegram rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-3 bg-white rounded-lg p-3 shadow-sm max-w-xs">
                      <p className="text-sm">Here are our featured products:</p>
                      {recentProducts.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {recentProducts.slice(0, 2).map((product, index) => (
                            <div key={product.id} className="text-xs bg-gray-50 p-2 rounded">
                              📱 {product.name} - ${product.price}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs mt-2 text-gray-600">Reply with product number for details</p>
                    </div>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4 bg-telegram hover:bg-blue-700">
                <ExternalLink className="mr-2 h-4 w-4" />
                Test Bot in Full Screen
              </Button>
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
