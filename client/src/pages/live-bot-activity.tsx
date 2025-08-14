import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ShoppingCart, Users, TrendingUp, Bot, Activity } from "lucide-react";

interface BotActivity {
  timestamp: string;
  type: 'message' | 'order' | 'inquiry' | 'cart_add';
  userId: string;
  userName: string;
  details: string;
  amount?: number;
}

export default function LiveBotActivity() {
  const { data: botStatus } = useQuery({
    queryKey: ['/api/bot/status'],
    refetchInterval: 5000,
  });

  const { data: overview } = useQuery({
    queryKey: ['/api/dashboard/overview'],
    refetchInterval: 10000,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['/api/orders'],
    refetchInterval: 5000,
    select: (orders: any[]) => {
      return orders
        .slice(0, 10)
        .map(order => ({
          timestamp: order.createdAt,
          type: 'order' as const,
          userId: order.telegramUserId,
          userName: order.customerName,
          details: `Order #${order.orderNumber} - $${order.totalAmount}`,
          amount: parseFloat(order.totalAmount)
        }));
    }
  });

  const { data: inquiries } = useQuery({
    queryKey: ['/api/inquiries'],
    refetchInterval: 10000,
    select: (inquiries: any[]) => {
      return inquiries
        .filter(inquiry => inquiry.status === 'pending')
        .slice(0, 5)
        .map(inquiry => ({
          timestamp: inquiry.createdAt,
          type: 'inquiry' as const,
          userId: inquiry.telegramUserId,
          userName: inquiry.customerName,
          details: inquiry.message.length > 50 ? 
            `${inquiry.message.substring(0, 50)}...` : 
            inquiry.message
        }));
    }
  });

  const isOnline = botStatus?.status === 'online';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Bot className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Live Bot Activity</h1>
          <p className="text-gray-600">Real-time monitoring of your Telegram bot</p>
        </div>
        <div className="ml-auto">
          <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bot Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOnline ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              Mode: {botStatus?.mode || 'polling'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.stats.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Interacted with bot
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.stats.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total revenue: ${overview?.stats.totalRevenue || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.stats.messagesProcessed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Messages processed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <CardDescription>Latest orders from your Telegram bot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity?.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent orders</p>
              )}
              {recentActivity?.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">{activity.userName}</p>
                      <p className="text-sm text-gray-600">{activity.details}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {activity.amount && (
                    <Badge variant="outline" className="text-green-600">
                      ${activity.amount.toFixed(2)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Inquiries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Pending Inquiries
            </CardTitle>
            <CardDescription>Customer messages waiting for response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inquiries?.length === 0 && (
                <p className="text-gray-500 text-center py-4">No pending inquiries</p>
              )}
              {inquiries?.map((inquiry, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">{inquiry.userName}</p>
                      <p className="text-sm text-gray-600">{inquiry.details}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(inquiry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-600">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bot Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Bot Configuration</CardTitle>
          <CardDescription>Current bot settings and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Environment</h4>
              <p className="text-sm text-gray-600">{botStatus?.environment || 'development'}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Mode</h4>
              <p className="text-sm text-gray-600">{botStatus?.mode || 'polling'}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Status</h4>
              <p className="text-sm text-gray-600">
                {isOnline ? 'Ready for messages' : 'Not responding'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}