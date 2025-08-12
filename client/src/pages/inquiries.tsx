import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Clock, 
  User,
  Check,
  Phone,
  Mail
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Inquiry } from "@shared/schema";

export default function Inquiries() {
  const { toast } = useToast();

  const { data: inquiries = [], isLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PUT", `/api/inquiries/${id}`, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries/unread-count"] });
      toast({
        title: "Marked as read",
        description: "The inquiry has been marked as read.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark inquiry as read. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(word => word.charAt(0).toUpperCase()).join("").slice(0, 2);
  };

  const hasContactInfo = (inquiry: Inquiry) => {
    return inquiry.contactInfo && (
      inquiry.contactInfo.includes("@") || 
      inquiry.contactInfo.includes("+") ||
      inquiry.contactInfo.includes("phone") ||
      inquiry.contactInfo.includes("email")
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Inquiries</h1>
          <p className="text-gray-600 mt-1">
            {inquiries.length} total inquiries, {inquiries.filter(i => !i.isRead).length} unread
          </p>
        </div>
      </div>

      {inquiries.length > 0 ? (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id} className={!inquiry.isRead ? "border-l-4 border-l-telegram" : ""}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(inquiry.customerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{inquiry.customerName}</h3>
                        {!inquiry.isRead && (
                          <Badge variant="destructive" className="text-xs">New</Badge>
                        )}
                        {hasContactInfo(inquiry) && (
                          <Badge variant="outline" className="text-xs">
                            <Phone className="mr-1 h-3 w-3" />
                            Contact Info
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="mr-1 h-4 w-4" />
                        {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
                        <span className="mx-2">•</span>
                        <User className="mr-1 h-4 w-4" />
                        ID: {inquiry.telegramUserId}
                      </div>
                    </div>
                  </div>
                  {!inquiry.isRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(inquiry.id)}
                      disabled={markAsReadMutation.isPending}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Mark as Read
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
                </div>
                
                {inquiry.contactInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center text-blue-800 text-sm font-medium mb-1">
                      {inquiry.contactInfo.includes("@") ? (
                        <Mail className="mr-1 h-4 w-4" />
                      ) : (
                        <Phone className="mr-1 h-4 w-4" />
                      )}
                      Contact Information
                    </div>
                    <p className="text-blue-700 text-sm">{inquiry.contactInfo}</p>
                  </div>
                )}

                {inquiry.productId && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center text-yellow-800 text-sm">
                      <MessageSquare className="mr-1 h-4 w-4" />
                      Product-related inquiry (ID: {inquiry.productId})
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries yet</h3>
            <p className="text-gray-600 text-center">
              Customer inquiries will appear here when they message your bot
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
