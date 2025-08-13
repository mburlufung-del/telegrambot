import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Send, 
  Users, 
  Target, 
  MessageSquare, 
  Upload,
  X,
  Image
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ObjectUploader from "@/components/object-uploader";

export default function EnhancedBroadcast() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<'all' | 'recent' | 'custom'>('all');
  const [customUsers, setCustomUsers] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendBroadcastMutation = useMutation({
    mutationFn: async (data: {
      message: string;
      imageUrl?: string;
      targetType: 'all' | 'recent' | 'custom';
      customUsers?: string;
    }) => {
      return await apiRequest("/api/bot/broadcast", "POST", data);
    },
    onSuccess: (data: { sentCount: number; totalTargeted: number }) => {
      toast({
        title: "Broadcast Sent Successfully",
        description: `Message sent to ${data.sentCount} users out of ${data.totalTargeted} targeted.`,
      });
      setMessage("");
      setImageUrl("");
      setCustomUsers("");
      setTargetType('all');
      setIsLoading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Broadcast",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const handleSendBroadcast = () => {
    if (!message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message to broadcast",
        variant: "destructive",
      });
      return;
    }

    if (targetType === 'custom' && !customUsers.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter user IDs for custom targeting",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    sendBroadcastMutation.mutate({
      message: message.trim(),
      imageUrl: imageUrl || undefined,
      targetType,
      customUsers: targetType === 'custom' ? customUsers : undefined
    });
  };

  const handleImageUpload = (uploadedImageUrl: string) => {
    setImageUrl(uploadedImageUrl);
    toast({
      title: "Image Uploaded",
      description: "Image ready for broadcast",
    });
  };

  const removeImage = () => {
    setImageUrl("");
    toast({
      title: "Image Removed",
      description: "Image removed from broadcast",
    });
  };

  const getTargetDescription = () => {
    switch (targetType) {
      case 'all':
        return 'All users who have interacted with the bot';
      case 'recent':
        return 'Users who have interacted within the last 30 days';
      case 'custom':
        return 'Specific user IDs (comma or newline separated)';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enhanced Broadcast System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="message">Broadcast Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your broadcast message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
              maxLength={4000}
            />
            <div className="text-sm text-gray-500">
              {message.length}/4000 characters
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label>Image Attachment (Optional)</Label>
            {!imageUrl ? (
              <ObjectUploader
                onUploadComplete={handleImageUpload}
                buttonClassName="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Image for Broadcast
              </ObjectUploader>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Image attached</span>
                    <Badge variant="secondary">Ready</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Image will be sent with your broadcast message
                </p>
              </div>
            )}
          </div>

          {/* Target Audience */}
          <div className="space-y-3">
            <Label>Target Audience</Label>
            <Select value={targetType} onValueChange={(value: 'all' | 'recent' | 'custom') => setTargetType(value)}>
              <SelectTrigger>
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
                    <Target className="h-4 w-4" />
                    Recent Users (30 days)
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Custom User IDs
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              {getTargetDescription()}
            </p>
          </div>

          {/* Custom Users Input */}
          {targetType === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customUsers">User IDs</Label>
              <Textarea
                id="customUsers"
                placeholder="Enter user IDs separated by commas or newlines..."
                value={customUsers}
                onChange={(e) => setCustomUsers(e.target.value)}
                className="min-h-[80px]"
              />
              <p className="text-xs text-gray-500">
                Example: 123456789, 987654321 or one ID per line
              </p>
            </div>
          )}

          {/* Send Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleSendBroadcast}
              disabled={isLoading || !message.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Sending Broadcast...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Broadcast
                </>
              )}
            </Button>
          </div>

          {/* Preview Section */}
          {message.trim() && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium mb-2 text-blue-900">Message Preview</h4>
              <div className="space-y-2">
                {imageUrl && (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Image className="h-4 w-4" />
                    <span>Image attachment included</span>
                  </div>
                )}
                <div className="bg-white rounded p-3 border">
                  <p className="text-sm whitespace-pre-wrap">{message}</p>
                </div>
                <p className="text-xs text-blue-600">
                  Target: {getTargetDescription()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}