import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  MessageSquare,
  Download,
  RefreshCw,
  Calendar,
  Target,
  Activity
} from "lucide-react";
import type { BotStats } from "@shared/schema";

export default function Analytics() {
  const { data: stats, isLoading, refetch } = useQuery<BotStats>({
    queryKey: ["/api/bot/stats"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      change: "+12%",
      changeType: "increase" as const,
      color: "blue",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      change: "+8%",
      changeType: "increase" as const,
      color: "green",
    },
    {
      title: "Revenue",
      value: stats?.totalRevenue || "$0",
      icon: DollarSign,
      change: "+15%",
      changeType: "increase" as const,
      color: "emerald",
    },
    {
      title: "Messages",
      value: stats?.totalMessages || 0,
      icon: MessageSquare,
      change: "+5%",
      changeType: "increase" as const,
      color: "purple",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      emerald: "bg-emerald-100 text-emerald-600",
      purple: "bg-purple-100 text-purple-600",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your bot's performance and customer engagement</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600 font-medium">{metric.change}</span>
                      <span className="text-sm text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${getColorClasses(metric.color)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="sales">Sales Performance</TabsTrigger>
          <TabsTrigger value="engagement">Bot Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <p className="text-sm text-gray-600">Bot performance over time</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Active Users Today</p>
                      <p className="text-2xl font-bold text-blue-900">{Math.floor((stats?.totalUsers || 0) * 0.3)}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-900">Orders Today</p>
                      <p className="text-2xl font-bold text-green-900">{Math.floor((stats?.totalOrders || 0) * 0.1)}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Bot Health</CardTitle>
                <p className="text-sm text-gray-600">System performance metrics</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Response Time</span>
                    <Badge className="bg-green-100 text-green-800">0.8s</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Uptime</span>
                    <Badge className="bg-blue-100 text-blue-800">99.9%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Success Rate</span>
                    <Badge className="bg-purple-100 text-purple-800">99.1%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <p className="text-sm text-gray-600">New users joining your bot</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Daily Active Users</p>
                      <p className="text-2xl font-bold text-blue-900">{Math.floor((stats?.totalUsers || 0) * 0.3)}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-900">New Users Today</p>
                      <p className="text-2xl font-bold text-green-900">{Math.floor((stats?.totalUsers || 0) * 0.05)}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-purple-900">Retention Rate</p>
                      <p className="text-2xl font-bold text-purple-900">78%</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
                <p className="text-sm text-gray-600">Where your users are from</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { country: "United States", users: 45, percentage: 35 },
                    { country: "United Kingdom", users: 32, percentage: 25 },
                    { country: "Germany", users: 28, percentage: 22 },
                    { country: "France", users: 15, percentage: 12 },
                    { country: "Others", users: 8, percentage: 6 },
                  ].map((item) => (
                    <div key={item.country} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-5 bg-gray-200 rounded-sm"></div>
                        <span className="text-sm font-medium">{item.country}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{item.users} users</span>
                        <Badge variant="outline">{item.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">$1,247</p>
                  <p className="text-sm text-gray-600 mt-1">+23% from yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Average Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">$86.50</p>
                  <p className="text-sm text-gray-600 mt-1">+5% from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">12.5%</p>
                  <p className="text-sm text-gray-600 mt-1">+2% from last month</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bot Interactions</CardTitle>
                <p className="text-sm text-gray-600">How users interact with your bot</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { command: "/catalog", uses: 156, percentage: 45 },
                    { command: "/help", uses: 89, percentage: 26 },
                    { command: "/orders", uses: 67, percentage: 19 },
                    { command: "/contact", uses: 34, percentage: 10 },
                  ].map((item) => (
                    <div key={item.command} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.command}</span>
                        <span className="text-sm text-gray-600">{item.uses} uses</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-telegram h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <p className="text-sm text-gray-600">Bot performance metrics</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Average Response Time</span>
                    <Badge className="bg-green-100 text-green-800">0.8s</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Uptime</span>
                    <Badge className="bg-blue-100 text-blue-800">99.9%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Messages Processed</span>
                    <Badge className="bg-purple-100 text-purple-800">2,847</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium">Error Rate</span>
                    <Badge className="bg-orange-100 text-orange-800">0.1%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}