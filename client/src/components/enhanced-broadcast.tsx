import { useState, useRef } from "react";
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

import { useToast } from "@/hooks/use-toast";


export default function EnhancedBroadcast() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<'all' | 'recent' | 'custom'>('all');
  const [customUsers, setCustomUsers] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImageName, setUploadedImageName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the working approach from SimpleBroadcastTest instead of useMutation
  const sendBroadcast = async (data: {
    message: string;
    imageUrl?: string;
    targetType: 'all' | 'recent' | 'custom';
    customUsers?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bot/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const successMessage = result.sentCount > 0 
        ? `Successfully sent to ${result.sentCount} users out of ${result.totalTargeted} targeted`
        : result.message || `No active users found. Found ${result.totalTargeted} users in database but none have started the bot.`;
      
      toast({
        title: result.sentCount > 0 ? "Broadcast Sent!" : "No Active Users",
        description: successMessage,
        variant: result.sentCount > 0 ? "default" : "destructive",
      });
      
      // Clear form only if at least one message was sent successfully
      if (result.sentCount > 0) {
        setMessage("");
        setImageUrl("");
        setUploadedImageName("");
        setCustomUsers("");
        setTargetType('all');
      }
    } catch (error) {
      console.error("Broadcast error:", error);
      toast({
        title: "Failed to Send Broadcast",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

    sendBroadcast({
      message: message.trim(),
      imageUrl: imageUrl || undefined,
      targetType,
      customUsers: targetType === 'custom' ? customUsers : undefined
    });
  };





  // Handle image upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, GIF)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadProgress(0);
    setIsLoading(true);

    try {
      // Get upload URL
      const response = await fetch("/api/objects/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get upload URL: ${response.status}`);
      }

      const { uploadURL } = await response.json();

      // Upload file to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      // Set the uploaded image
      setImageUrl(uploadURL);
      setUploadedImageName(file.name);
      setUploadProgress(100);
      
      toast({
        title: "Image Uploaded Successfully",
        description: `${file.name} is ready for broadcast`,
      });

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    setImageUrl("");
    setUploadedImageName("");
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

          {/* Image Upload */}
          <div className="space-y-3">
            <Label>Image Attachment (Optional)</Label>
            <div className="flex flex-col gap-3">
              {!imageUrl ? (
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-20 border-dashed border-2 hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {isLoading ? (
                        <>
                          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                          <span className="text-sm">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-gray-400" />
                          <span className="text-sm text-gray-600">Click to upload image</span>
                          <span className="text-xs text-gray-400">JPG, PNG, GIF up to 10MB</span>
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-3 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">
                        {uploadedImageName || "Image uploaded and ready"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage}
                      className="px-3"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Upload an image to include with your broadcast message. The image will be stored securely and sent to users.
            </p>
            
            {/* User Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-sm">⚠️</span>
                <div className="text-sm text-yellow-800">
                  <strong>Note:</strong> Broadcasts will only reach users who have started the bot by sending /start. 
                  Current database contains sample data - real users need to interact with your bot first.
                </div>
              </div>
            </div>
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
                    <span>Image: {imageUrl.length > 50 ? `${imageUrl.substring(0, 50)}...` : imageUrl}</span>
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