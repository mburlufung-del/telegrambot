import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Mail, Calendar, User, ExternalLink, CheckCircle } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'

interface Inquiry {
  id: string
  telegramUserId: string
  customerName: string
  message: string
  productId: string | null
  contactInfo: string
  isRead: boolean
  createdAt: string
}

export default function Inquiries() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: inquiries = [], isLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/inquiries'],
    refetchInterval: 3 * 60 * 1000, // 3 minutes for inquiries (more important to stay current)
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/inquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: true })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] })
      toast({
        title: "Success",
        description: "Message marked as read",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      })
    }
  })

  const unreadCount = inquiries.filter(inquiry => !inquiry.isRead).length
  const totalInquiries = inquiries.length

  if (isLoading) {
    return <div className="p-6">Loading inquiries...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer Inquiries</h1>
          <p className="text-gray-600 mt-2">Messages and inquiries from your Telegram bot users</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{totalInquiries}</div>
          <div className="text-sm text-gray-600">Total Messages</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
              <Mail className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Read Messages</p>
                <p className="text-2xl font-bold text-green-600">{totalInquiries - unreadCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Customers</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(inquiries.map(i => i.telegramUserId)).size}
                </p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {inquiries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries yet</h3>
              <p className="text-gray-600">Customer messages from your Telegram bot will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          inquiries
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((inquiry) => (
              <Card key={inquiry.id} className={inquiry.isRead ? 'bg-gray-50' : 'border-blue-200'}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {inquiry.customerName}
                        {!inquiry.isRead && (
                          <Badge variant="destructive" className="text-xs">
                            NEW
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(inquiry.createdAt).toLocaleDateString()} at {new Date(inquiry.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!inquiry.isRead && (
                        <Button
                          onClick={() => markAsReadMutation.mutate(inquiry.id)}
                          disabled={markAsReadMutation.isPending}
                          size="sm"
                          variant="outline"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Read
                        </Button>
                      )}
                      <Button
                        onClick={() => window.open(`https://t.me/${inquiry.telegramUserId}`, '_blank')}
                        size="sm"
                        variant="outline"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Message:</h4>
                      <div className="bg-white p-4 rounded-lg border text-sm whitespace-pre-wrap">
                        {inquiry.message}
                      </div>
                      {inquiry.productId && (
                        <div className="mt-2 text-xs text-gray-500">
                          Related to Product ID: {inquiry.productId.slice(0, 8)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Contact Information:</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Telegram ID:</strong> {inquiry.telegramUserId}
                        </div>
                        <div>
                          <strong>Contact:</strong> {inquiry.contactInfo}
                        </div>
                        <div className="flex items-center">
                          <strong>Status:</strong>
                          <Badge 
                            variant={inquiry.isRead ? "secondary" : "destructive"}
                            className="ml-2"
                          >
                            {inquiry.isRead ? 'Read' : 'Unread'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {unreadCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <Mail className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">
                You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </h3>
              <p className="text-yellow-700 text-sm">
                Review and respond to customer inquiries to provide excellent support.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}