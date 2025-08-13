import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Users, MessageSquare, Image } from "lucide-react";

const broadcastFormSchema = z.object({
  message: z.string().min(1, "Message is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  targetType: z.enum(["all", "recent", "custom"]),
  customUsers: z.string().optional(),
});

type BroadcastFormData = z.infer<typeof broadcastFormSchema>;

interface BroadcastFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BroadcastForm({ onSuccess, onCancel }: BroadcastFormProps) {
  const [previewMessage, setPreviewMessage] = useState("");
  const { toast } = useToast();

  const form = useForm<BroadcastFormData>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: {
      message: "",
      imageUrl: "",
      targetType: "all",
      customUsers: "",
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async (data: BroadcastFormData) => {
      const response = await fetch("/api/bot/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to send broadcast");
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Success", 
        description: `Message sent to ${data.sentCount} users successfully` 
      });
      onSuccess?.();
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to send broadcast message", 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: BroadcastFormData) => {
    broadcastMutation.mutate(data);
  };

  const messagePreview = form.watch("message");
  const imagePreview = form.watch("imageUrl");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Send className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Broadcast Message</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="message">Message Text *</Label>
                <Textarea
                  id="message"
                  {...form.register("message")}
                  placeholder="Enter your broadcast message here..."
                  rows={6}
                  className="resize-none"
                  data-testid="input-broadcast-message"
                />
                {form.formState.errors.message && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.message.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {messagePreview.length}/4096 characters
                </p>
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  {...form.register("imageUrl")}
                  placeholder="https://example.com/image.jpg"
                  data-testid="input-broadcast-image"
                />
                {form.formState.errors.imageUrl && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.imageUrl.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="targetType">Target Audience</Label>
                <Select
                  value={form.watch("targetType")}
                  onValueChange={(value: "all" | "recent" | "custom") => form.setValue("targetType", value)}
                >
                  <SelectTrigger data-testid="select-target-type">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        All Users
                      </div>
                    </SelectItem>
                    <SelectItem value="recent">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Recent Users (Last 30 days)
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Custom User IDs
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.watch("targetType") === "custom" && (
                <div>
                  <Label htmlFor="customUsers">Custom User IDs</Label>
                  <Textarea
                    id="customUsers"
                    {...form.register("customUsers")}
                    placeholder="Enter user IDs separated by commas or new lines"
                    rows={3}
                    data-testid="input-custom-users"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter Telegram user IDs separated by commas or new lines
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={broadcastMutation.isPending}
                  data-testid="button-send-broadcast"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {broadcastMutation.isPending ? "Sending..." : "Send Broadcast"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Message Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[300px]">
              <div className="space-y-3">
                {/* Bot message preview */}
                <div className="flex">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div className="ml-3 bg-white rounded-lg p-3 shadow-sm max-w-xs">
                    {imagePreview && (
                      <div className="mb-2">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full rounded object-cover max-h-32"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    {messagePreview ? (
                      <p className="text-sm whitespace-pre-wrap">{messagePreview}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Your message will appear here...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Target: {form.watch("targetType") === "all" ? "All Users" : 
                          form.watch("targetType") === "recent" ? "Recent Users" : "Custom Users"}
                </Badge>
              </div>
              {imagePreview && (
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <span className="text-sm text-gray-600">Image attached</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}