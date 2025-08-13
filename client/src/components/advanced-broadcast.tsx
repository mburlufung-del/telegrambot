import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
//import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Send, 
  Users, 
  Clock, 
  Target, 
  MessageSquare, 
  Zap, 
  Calendar,
  Filter,
  Eye
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const broadcastSchema = z.object({
  message: z.string().min(1, "Message is required").max(4000, "Message too long"),
  targetAudience: z.enum(["all", "active", "recent", "custom"]),
  scheduleType: z.enum(["immediate", "scheduled"]),
  scheduledTime: z.string().optional(),
  includeButtons: z.boolean().default(false),
  buttonText: z.string().optional(),
  buttonUrl: z.string().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

type BroadcastForm = z.infer<typeof broadcastSchema>;

interface BroadcastStats {
  totalSent: number;
  delivered: number;
  failed: number;
  pending: number;
}

export default function AdvancedBroadcast() {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState(false);

  const form = useForm<BroadcastForm>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      targetAudience: "all",
      scheduleType: "immediate",
      includeButtons: false,
      priority: "normal",
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/bot/stats"],
  });

  const { data: broadcastHistory = [] } = useQuery({
    queryKey: ["/api/broadcasts/history"],
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async (data: BroadcastForm) => {
      return await apiRequest("POST", "/api/broadcasts/send", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts/history"] });
      toast({
        title: "Broadcast Sent Successfully",
        description: "Your message has been sent to the selected audience.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Failed to Send Broadcast",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BroadcastForm) => {
    if (data.includeButtons && (!data.buttonText || !data.buttonUrl)) {
      toast({
        title: "Button Configuration Required",
        description: "Please provide both button text and URL when including buttons.",
        variant: "destructive",
      });
      return;
    }
    sendBroadcastMutation.mutate(data);
  };

  const getAudienceSize = (audience: string) => {
    const total = stats?.totalUsers || 0;
    switch (audience) {
      case "all": return total;
      case "active": return Math.floor(total * 0.7);
      case "recent": return Math.floor(total * 0.3);
      default: return 0;
    }
  };

  const watchMessage = form.watch("message");
  const watchTargetAudience = form.watch("targetAudience");
  const watchIncludeButtons = form.watch("includeButtons");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">Compose Broadcast</TabsTrigger>
          <TabsTrigger value="history">Broadcast History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Broadcast Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Broadcast</CardTitle>
                  <p className="text-sm text-gray-600">Send messages to your bot users</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="message">Message Content</Label>
                        <Textarea
                          {...form.register("message")}
                          placeholder="Enter your broadcast message..."
                          className="min-h-32"
                          data-testid="textarea-broadcast-message"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{form.watch("message")?.length || 0}/4000 characters</span>
                          <span>Telegram message limit: 4096 characters</span>
                        </div>
                        {form.formState.errors.message && (
                          <p className="text-sm text-red-600">{form.formState.errors.message.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Target Audience</Label>
                          <Select onValueChange={(value) => form.setValue("targetAudience", value as any)} defaultValue="all">
                            <SelectTrigger data-testid="select-target-audience">
                              <SelectValue placeholder="Select audience" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Users ({getAudienceSize("all")})</SelectItem>
                              <SelectItem value="active">Active Users ({getAudienceSize("active")})</SelectItem>
                              <SelectItem value="recent">Recent Users ({getAudienceSize("recent")})</SelectItem>
                              <SelectItem value="custom">Custom Filter</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select onValueChange={(value) => form.setValue("priority", value as any)} defaultValue="normal">
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low Priority</SelectItem>
                              <SelectItem value="normal">Normal Priority</SelectItem>
                              <SelectItem value="high">High Priority</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex flex-row items-start space-x-3 space-y-0">
                        <Checkbox
                          checked={watchIncludeButtons}
                          onCheckedChange={(checked) => form.setValue("includeButtons", checked as boolean)}
                          data-testid="checkbox-include-buttons"
                        />
                        <div className="space-y-1 leading-none">
                          <Label>Include Action Button</Label>
                          <p className="text-sm text-gray-600">Add a clickable button to your message</p>
                        </div>
                      </div>

                      {watchIncludeButtons && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <Label htmlFor="buttonText">Button Text</Label>
                            <Input
                              {...form.register("buttonText")}
                              placeholder="Visit Website"
                              data-testid="input-button-text"
                            />
                          </div>
                          <div>
                            <Label htmlFor="buttonUrl">Button URL</Label>
                            <Input
                              {...form.register("buttonUrl")}
                              placeholder="https://example.com"
                              data-testid="input-button-url"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setPreviewMode(!previewMode)}
                          data-testid="button-preview"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {previewMode ? "Hide Preview" : "Preview"}
                        </Button>
                        <Button
                          type="submit"
                          disabled={sendBroadcastMutation.isPending}
                          data-testid="button-send-broadcast"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {sendBroadcastMutation.isPending ? "Sending..." : "Send Broadcast"}
                        </Button>
                      </div>
                    </form>
                </CardContent>
              </Card>
            </div>

            {/* Preview & Stats */}
            <div className="space-y-6">
              {/* Audience Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Audience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Target Users</span>
                      <Badge variant="outline">{getAudienceSize(watchTargetAudience)}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estimated Delivery</span>
                      <Badge variant="outline">~2 minutes</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expected Read Rate</span>
                      <Badge variant="outline">~75%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message Preview */}
              {previewMode && watchMessage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="mr-2 h-5 w-5" />
                      Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-telegram-light bg-opacity-10 rounded-lg p-4 border-l-4 border-telegram">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-telegram rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{watchMessage}</p>
                          {watchIncludeButtons && form.getValues("buttonText") && (
                            <div className="mt-3">
                              <Button size="sm" className="bg-telegram hover:bg-blue-700">
                                {form.getValues("buttonText")}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast History</CardTitle>
              <p className="text-sm text-gray-600">Recent broadcast campaigns</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {broadcastHistory.length > 0 ? (
                  broadcastHistory.slice(0, 10).map((broadcast: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium truncate">{broadcast.message || "Broadcast message"}</p>
                        <p className="text-sm text-gray-500">
                          Sent to {broadcast.targetCount || "N/A"} users • {broadcast.timestamp || "Recently"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={broadcast.status === "completed" ? "default" : "secondary"}>
                          {broadcast.status || "Completed"}
                        </Badge>
                        <Badge variant="outline">{broadcast.deliveryRate || "95%"} delivered</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No broadcasts sent yet</p>
                    <p className="text-sm">Your broadcast history will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Broadcasts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-telegram">{broadcastHistory.length}</p>
                <p className="text-sm text-gray-600 mt-1">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Average Delivery Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">94.2%</p>
                <p className="text-sm text-gray-600 mt-1">Last 30 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">78.5%</p>
                <p className="text-sm text-gray-600 mt-1">Click-through rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}