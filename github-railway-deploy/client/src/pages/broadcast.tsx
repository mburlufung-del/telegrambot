import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Users, History, TrendingUp } from "lucide-react";
import EnhancedBroadcast from "@/components/enhanced-broadcast";

export default function BroadcastPage() {
  const [activeTab, setActiveTab] = useState("compose");

  // Mock data for broadcast history and analytics
  const recentBroadcasts = [
    {
      id: 1,
      message: "🎉 New products are now available! Check out our latest collection...",
      sentTo: 156,
      sent: "2 hours ago",
      status: "delivered"
    },
    {
      id: 2,
      message: "💎 Special discount for our valued customers - 20% off everything!",
      sentTo: 189,
      sent: "1 day ago",
      status: "delivered"
    },
    {
      id: 3,
      message: "📦 Your order has been processed and will be shipped soon!",
      sentTo: 23,
      sent: "2 days ago",
      status: "delivered"
    }
  ];

  const stats = {
    totalSent: 368,
    totalUsers: 203,
    averageOpenRate: "85%",
    lastBroadcast: "2 hours ago"
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Broadcast Center</h1>
          <p className="text-muted-foreground mt-1">Send messages to your bot users and track performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {stats.totalUsers} Active Users
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold" data-testid="stat-total-sent">{stats.totalSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold" data-testid="stat-active-users">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Rate</p>
                <p className="text-2xl font-bold" data-testid="stat-open-rate">{stats.averageOpenRate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <History className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Sent</p>
                <p className="text-lg font-semibold" data-testid="stat-last-broadcast">{stats.lastBroadcast}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="compose" data-testid="tab-compose">
            <MessageSquare className="h-4 w-4 mr-2" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Compose Broadcast Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedBroadcast />
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Broadcast History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBroadcasts.map((broadcast) => (
                  <div 
                    key={broadcast.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`broadcast-item-${broadcast.id}`}
                  >
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {broadcast.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Sent to {broadcast.sentTo} users</span>
                        <span>•</span>
                        <span>{broadcast.sent}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={broadcast.status === "delivered" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {broadcast.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {recentBroadcasts.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No broadcast history yet</p>
                    <p className="text-sm text-muted-foreground">Send your first broadcast to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}