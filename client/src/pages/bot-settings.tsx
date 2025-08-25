import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Settings, MessageSquare, User, CreditCard, RefreshCw, Save, AlertCircle, CheckCircle, XCircle, Link as LinkIcon } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import type { PaymentMethod } from '@shared/schema'

interface BotSetting {
  id: string
  key: string
  value: string
  updatedAt: string
}

interface BotStatus {
  status: 'online' | 'offline' | 'error'
  ready: Record<string, any>
  mode: 'polling' | 'webhook'
}

export default function BotSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'messages' | 'operator' | 'payment'>('general')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: settings = [], isLoading } = useQuery<BotSetting[]>({
    queryKey: ['/api/bot/settings'],
    queryFn: async () => {
      console.log('🔧 Fetching bot settings for admin form...')
      const response = await fetch('/api/bot/settings')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      console.log('🔧 Bot settings loaded for form:', data.length, 'items')
      return data
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fetch fresh data
  })

  const { data: botStatus } = useQuery<BotStatus>({
    queryKey: ['/api/bot/status'],
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  })

  // Fetch payment methods
  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/payment-methods')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response.json()
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  })

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      return await apiRequest('/api/bot/settings', {
        method: 'POST',
        body: JSON.stringify({ key, value })
      })
    },
    onSuccess: (data) => {
      // Force refresh to get the latest data from server
      queryClient.invalidateQueries({ queryKey: ['/api/bot/settings'] })
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] })
      toast({
        title: "Success",
        description: "Bot setting updated successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bot setting",
        variant: "destructive",
      })
    }
  })

  const restartBotMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/bot/restart', {
        method: 'POST'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/status'] })
      toast({
        title: "Success",
        description: "Bot restarted successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restart bot",
        variant: "destructive",
      })
    }
  })

  const getSetting = (key: string) => {
    const setting = settings.find(s => s.key === key)
    return setting?.value || ''
  }

  const updateSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value })
  }

  const refreshSettings = async () => {
    try {
      // Invalidate all relevant queries to force refresh
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/bot/settings'] }),
        queryClient.invalidateQueries({ queryKey: ['payment-methods-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/bot/status'] })
      ])
      
      // Provide user feedback
      toast({
        title: "Settings Refreshed",
        description: "All bot settings and payment methods have been refreshed from the server.",
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const SettingInput = ({ settingKey, label, placeholder, type = 'text' }: {
    settingKey: string
    label: string
    placeholder?: string
    type?: 'text' | 'textarea' | 'number'
  }) => {
    const serverValue = getSetting(settingKey)
    const [value, setValue] = useState('')
    const [hasInitialized, setHasInitialized] = useState(false)

    // Initialize value from server only once
    React.useEffect(() => {
      if (!hasInitialized && serverValue) {
        setValue(serverValue)
        setHasInitialized(true)
      }
    }, [serverValue, hasInitialized])

    const hasChanged = value !== serverValue
    const isLoading = updateSettingMutation.isPending

    const handleSave = () => {
      updateSetting(settingKey, value)
    }

    const handleReset = () => {
      setValue(serverValue)
    }

    if (type === 'textarea') {
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
            rows={4}
            className="w-full"
          />
          {hasChanged && (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                size="sm"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={handleReset}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
          className="w-full"
        />
        {hasChanged && (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={handleReset}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return <div className="p-6">Loading bot settings...</div>
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Bot Settings</h1>
            <p className="text-gray-600 mt-1 lg:mt-2">Configure your Telegram bot settings. Changes sync instantly.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Button 
              onClick={refreshSettings} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 w-full sm:w-auto"
              disabled={isLoading}
              data-testid="button-refresh-settings"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Settings
            </Button>
            {botStatus && (
              <div className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm ${
                botStatus.status === 'online' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <Bot className="w-4 h-4 mr-2" />
                {botStatus.status} ({botStatus.mode})
              </div>
            )}
            <Button
              onClick={() => restartBotMutation.mutate()}
              disabled={restartBotMutation.isPending}
              variant="outline"
              className="w-full sm:w-auto"
              data-testid="button-restart-bot"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${restartBotMutation.isPending ? 'animate-spin' : ''}`} />
              Restart Bot
            </Button>
          </div>
        </div>

      </div>
      
      {/* Mobile-friendly tab navigation */}
      <div className="flex flex-wrap sm:flex-nowrap gap-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium flex-1 sm:flex-none ${
            activeTab === 'general' ? 'bg-white shadow' : 'hover:bg-gray-200'
          }`}
          data-testid="tab-general"
        >
          <Settings className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">General</span>
          <span className="sm:hidden">Info</span>
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium flex-1 sm:flex-none ${
            activeTab === 'messages' ? 'bg-white shadow' : 'hover:bg-gray-200'
          }`}
          data-testid="tab-messages"
        >
          <MessageSquare className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Messages</span>
          <span className="sm:hidden">Msgs</span>
        </button>
        <button
          onClick={() => setActiveTab('operator')}
          className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium flex-1 sm:flex-none ${
            activeTab === 'operator' ? 'bg-white shadow' : 'hover:bg-gray-200'
          }`}
          data-testid="tab-operator"
        >
          <User className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Support</span>
          <span className="sm:hidden">Help</span>
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium flex-1 sm:flex-none ${
            activeTab === 'payment' ? 'bg-white shadow' : 'hover:bg-gray-200'
          }`}
          data-testid="tab-payment"
        >
          <CreditCard className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Payment</span>
          <span className="sm:hidden">Pay</span>
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bot Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingInput
                settingKey="bot_name"
                label="Bot Name"
                placeholder="My TeleShop Bot"
              />
              <SettingInput
                settingKey="bot_username"
                label="Bot Username"
                placeholder="@myshopbot"
              />
              <SettingInput
                settingKey="bot_description"
                label="Bot Description"
                placeholder="Your shop description"
                type="textarea"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency & Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingInput
                settingKey="currency_symbol"
                label="Currency Symbol"
                placeholder="$"
              />
              <SettingInput
                settingKey="currency_code"
                label="Currency Code"
                placeholder="USD"
              />
              <SettingInput
                settingKey="minimum_order"
                label="Minimum Order Amount"
                placeholder="1"
                type="number"
              />
              <SettingInput
                settingKey="shipping_cost"
                label="Shipping Cost"
                placeholder="0"
                type="number"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bot Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingInput
                settingKey="welcome_message"
                label="Welcome Message"
                placeholder="Welcome to our shop! Use {username} to insert user's Telegram username"
                type="textarea"
              />
              <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
                <strong>Tip:</strong> Use {'{username}'} in your message to automatically insert the user's Telegram username (e.g., @john_doe)
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'operator' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Support Team Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingInput
                  settingKey="operator_name"
                  label="Operator Name"
                  placeholder="Support Team"
                />
                <SettingInput
                  settingKey="operator_username"
                  label="Telegram Username"
                  placeholder="@support"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingInput
                  settingKey="support_email"
                  label="Support Email"
                  placeholder="support@example.com"
                />
                <SettingInput
                  settingKey="response_time"
                  label="Expected Response Time"
                  placeholder="2-4 hours"
                />
              </div>

              <SettingInput
                settingKey="operator_id"
                label="Operator Telegram ID"
                placeholder="123456789"
                type="text"
              />
              <div className="text-sm text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <strong>Important:</strong> Enter your Telegram ID here to receive notifications when customers send messages. To find your Telegram ID, send a message to @userinfobot on Telegram.
              </div>

              <SettingInput
                settingKey="support_hours"
                label="Business Hours"
                placeholder="Monday - Friday: 9:00 AM - 6:00 PM&#10;Saturday: 10:00 AM - 4:00 PM&#10;Sunday: Closed"
                type="textarea"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Customer Support Integration</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      These settings are automatically displayed to customers when they contact support through the Telegram bot. 
                      Make sure the username starts with @ (e.g., @your_username) for proper Telegram linking.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


        </div>
      )}

      {activeTab === 'payment' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Configured Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="font-medium mb-2">No Payment Methods Configured</h3>
                  <p className="text-sm">Add payment methods in the Payment Methods admin page to display them here.</p>
                  <Button 
                    onClick={() => window.location.href = '/?page=payment-methods'} 
                    className="mt-4"
                    size="sm"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Manage Payment Methods
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Active Methods ({paymentMethods.filter(m => m.isActive).length})</h4>
                    <Button 
                      onClick={() => window.location.href = '/?page=payment-methods'} 
                      variant="outline"
                      size="sm"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {method.isActive ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-gray-500">{method.description}</div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        method.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {method.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingInput
                settingKey="tax_rate"
                label="Tax Rate (%)"
                placeholder="0"
                type="number"
              />
              <SettingInput
                settingKey="currency"
                label="Currency"
                placeholder="USD"
              />
              <SettingInput
                settingKey="payment_terms"
                label="Payment Terms"
                placeholder="Payment due within 30 days"
                type="textarea"
              />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Instant Sync</h3>
            <p className="text-blue-700 text-sm">All changes are applied immediately to your Telegram bot. No restart required unless specified.</p>
          </div>
        </div>
      </div>
    </div>
  )
}