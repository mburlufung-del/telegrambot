import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type Order } from "@shared/schema";
import { Package, Eye, Calendar, DollarSign, User, MapPin, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Orders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update order status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update order status", variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      processing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: "⏳",
      confirmed: "✅",
      processing: "🔄",
      shipped: "🚚",
      delivered: "📦",
      cancelled: "❌",
    };
    return icons[status as keyof typeof icons] || "📋";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
  const orderStats = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Package className="h-4 w-4 mr-2" />
          {orders.length} Total Orders
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.processing || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.delivered || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <div className="grid gap-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground">Orders will appear here once customers start placing them through the Telegram bot.</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const orderItems = JSON.parse(order.items);
            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        Order #{order.id.substring(0, 8)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {order.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(order.createdAt), "MMM dd, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${order.totalAmount}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)} {order.status.toUpperCase()}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Order Details #{order.id.substring(0, 8)}</DialogTitle>
                            <DialogDescription>
                              Complete order information and status management
                            </DialogDescription>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-6">
                              {/* Customer Information */}
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Customer Information
                                  </h4>
                                  <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                                  <p><strong>Contact:</strong> {selectedOrder.contactInfo}</p>
                                  {selectedOrder.deliveryAddress && (
                                    <p><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
                                  )}
                                  {selectedOrder.paymentMethod && (
                                    <p className="flex items-center gap-2">
                                      <CreditCard className="h-4 w-4" />
                                      <strong>Payment:</strong> {selectedOrder.paymentMethod}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold">Order Status</h4>
                                  <Select
                                    value={selectedOrder.status}
                                    onValueChange={(value) => {
                                      updateStatusMutation.mutate({
                                        orderId: selectedOrder.id,
                                        status: value,
                                      });
                                      setSelectedOrder({ ...selectedOrder, status: value });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="confirmed">Confirmed</SelectItem>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="shipped">Shipped</SelectItem>
                                      <SelectItem value="delivered">Delivered</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <p className="text-sm text-muted-foreground">
                                    Last updated: {format(new Date(selectedOrder.updatedAt), "MMM dd, yyyy HH:mm")}
                                  </p>
                                </div>
                              </div>

                              {/* Order Items */}
                              <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  Order Items
                                </h4>
                                <div className="border rounded-lg divide-y">
                                  {JSON.parse(selectedOrder.items).map((item: any, index: number) => (
                                    <div key={index} className="p-3 flex justify-between items-center">
                                      <div>
                                        <p className="font-medium">{item.productName}</p>
                                        <p className="text-sm text-muted-foreground">
                                          ${item.price} × {item.quantity}
                                        </p>
                                      </div>
                                      <p className="font-semibold">${item.total}</p>
                                    </div>
                                  ))}
                                  <div className="p-3 bg-muted/50 flex justify-between items-center font-bold">
                                    <span>Total</span>
                                    <span>${selectedOrder.totalAmount}</span>
                                  </div>
                                </div>
                              </div>

                              {selectedOrder.notes && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold">Notes</h4>
                                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedOrder.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {orderItems.slice(0, 3).map((item: any, index: number) => (
                        <Badge key={index} variant="secondary">
                          {item.productName} ({item.quantity})
                        </Badge>
                      ))}
                      {orderItems.length > 3 && (
                        <Badge variant="secondary">+{orderItems.length - 3} more</Badge>
                      )}
                    </div>
                    {(order.contactInfo || order.deliveryAddress) && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        {order.contactInfo && (
                          <p className="flex items-center gap-2">
                            <span>Contact: {order.contactInfo}</span>
                          </p>
                        )}
                        {order.deliveryAddress && (
                          <p className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {order.deliveryAddress}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}