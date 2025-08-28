import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  Send, 
  Users, 
  MessageSquare, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Megaphone
} from 'lucide-react'

interface BroadcastMessage {
  id: string
  title: string
  message: string
  targetAudience: string
  status: 'draft' | 'sending' | 'sent' | 'failed'
  sentCount: number
  totalCount: number
  createdAt: string
}

export default function Broadcast() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'all'
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mock data for broadcast history
  const { data: broadcastHistory = [] } = useQuery<BroadcastMessage[]>({
    queryKey: ['/api/broadcasts'],
    queryFn: async () => {
      // Mock data - in real implementation, this would fetch from API
      return [
        {
          id: '1',
          title: 'Welcome New Customers',
          message: 'Welcome to our TeleShop! Check out our latest products and special offers.',
          targetAudience: 'new_users',
          status: 'sent' as const,
          sentCount: 245,
          totalCount: 250,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: 'Flash Sale Alert',
          message: '🔥 24-hour flash sale! Get 30% off on all electronics. Use code FLASH30',
          targetAudience: 'all',
          status: 'sent' as const,
          sentCount: 1234,
          totalCount: 1250,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    refetchInterval: 30000
  })

  const sendBroadcastMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to send broadcast')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/broadcasts'] })
      setFormData({ title: '', message: '', targetAudience: 'all' })
      toast({ 
        title: 'Broadcast sent successfully!', 
        description: 'Your message is being delivered to users' 
      })
    },
    onError: () => {
      toast({ 
        title: 'Failed to send broadcast', 
        description: 'Please try again later',
        variant: 'destructive' 
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({ 
        title: 'Please fill in all fields', 
        variant: 'destructive' 
      })
      return
    }
    sendBroadcastMutation.mutate(formData)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800'
      case 'sending': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4" />
      case 'sending': return <Clock className="w-4 h-4" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <Megaphone className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Broadcast to Users</h1>
          <p className="text-gray-600">Send announcements and promotions to your customers</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold">1,250</p>
                <p className="text-blue-100 text-xs">Active bot users</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Messages Sent</p>
                <p className="text-3xl font-bold">2,479</p>
                <p className="text-green-100 text-xs">This month</p>
              </div>
              <Send className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Delivery Rate</p>
                <p className="text-3xl font-bold">98.5%</p>
                <p className="text-purple-100 text-xs">Average success rate</p>
              </div>
              <Target className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send New Broadcast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send New Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Broadcast Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Flash Sale Alert, New Product Launch"
                  required
                  data-testid="input-broadcast-title"
                />
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select 
                  value={formData.targetAudience} 
                  onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
                >
                  <SelectTrigger data-testid="select-target-audience">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users (1,250)</SelectItem>
                    <SelectItem value="active">Active Users (980)</SelectItem>
                    <SelectItem value="new_users">New Users (120)</SelectItem>
                    <SelectItem value="customers">Customers with Orders (340)</SelectItem>
                    <SelectItem value="inactive">Inactive Users (270)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message Content</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Enter your broadcast message here..."
                  rows={6}
                  maxLength={4096}
                  required
                  data-testid="textarea-broadcast-message"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.message.length}/4096 characters
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <h4 className="font-medium text-blue-900">Preview</h4>
                    <p className="text-blue-700 mt-1">
                      {formData.message || 'Your message will appear here...'}
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={sendBroadcastMutation.isPending}
                data-testid="button-send-broadcast"
              >
                {sendBroadcastMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Broadcast
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Broadcast History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Broadcasts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {broadcastHistory.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No broadcasts sent yet</h3>
                <p className="text-gray-600">Your broadcast history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {broadcastHistory.map((broadcast) => (
                  <div key={broadcast.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{broadcast.title}</h4>
                      <Badge className={`${getStatusColor(broadcast.status)} text-xs`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(broadcast.status)}
                          {broadcast.status}
                        </span>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {broadcast.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Target: {broadcast.targetAudience.replace('_', ' ')}
                      </span>
                      <span>
                        {broadcast.sentCount}/{broadcast.totalCount} delivered
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(broadcast.createdAt).toLocaleDateString()} at{' '}
                      {new Date(broadcast.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-900 mb-2">Broadcast Tips</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Keep messages concise and clear</li>
                <li>• Use emojis to make messages more engaging</li>
                <li>• Include clear call-to-action buttons when relevant</li>
                <li>• Test with a small audience before sending to all users</li>
                <li>• Avoid sending too frequently to prevent user fatigue</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}