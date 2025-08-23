import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Settings, MessageSquare, User, CreditCard, RefreshCw, Save, AlertCircle } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'

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
    refetchInterval: false, // Only refetch manually when updated
  })

  const { data: botStatus } = useQuery<BotStatus>({
    queryKey: ['/api/bot/status'],
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  })

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      return await apiRequest('/api/bot/settings', {
        method: 'POST',
        body: JSON.stringify({ key, value })
      })
    },
    onSuccess: () => {
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

  const SettingInput = ({ settingKey, label, placeholder, type = 'text' }: {
    settingKey: string
    label: string
    placeholder?: string
    type?: 'text' | 'textarea' | 'number'
  }) => {
    const currentValue = getSetting(settingKey)
    const [value, setValue] = useState(currentValue)
    const [hasChanged, setHasChanged] = useState(false)

    // Update local value when the setting changes from server
    React.useEffect(() => {
      setValue(currentValue)
      setHasChanged(false)
    }, [currentValue])

    const handleChange = (newValue: string) => {
      setValue(newValue)
      setHasChanged(newValue !== currentValue)
    }

    const handleSave = () => {
      updateSetting(settingKey, value)
      setHasChanged(false)
    }

    if (type === 'textarea') {
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <div className="flex gap-2">
            <Textarea
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="flex-1"
            />
            {hasChanged && (
              <Button
                onClick={handleSave}
                disabled={updateSettingMutation.isPending}
                size="sm"
                className="shrink-0"
              >
                <Save className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Input
            type={type}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          {hasChanged && (
            <Button
              onClick={handleSave}
              disabled={updateSettingMutation.isPending}
              size="sm"
              className="shrink-0"
            >
              <Save className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <div className="p-6">Loading bot settings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bot Settings</h1>
          <p className="text-gray-600 mt-2">Configure your Telegram bot settings. Changes sync instantly.</p>
        </div>
        <div className="flex gap-2 items-center">
          {botStatus && (
            <div className={`flex items-center px-3 py-2 rounded-lg text-sm ${
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
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${restartBotMutation.isPending ? 'animate-spin' : ''}`} />
            Restart Bot
          </Button>
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            activeTab === 'general' ? 'bg-white shadow' : 'hover:bg-gray-200'
          }`}
        >
          <Settings className="w-4 h-4 mr-2" />
          General
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            activeTab === 'messages' ? 'bg-white shadow' : 'hover:bg-gray-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Messages
        </button>
        <button
          onClick={() => setActiveTab('operator')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            activeTab === 'operator' ? 'bg-white shadow' : 'hover:bg-gray-200'
          }`}
        >
          <User className="w-4 h-4 mr-2" />
          Support
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            activeTab === 'payment' ? 'bg-white shadow' : 'hover:bg-gray-200'
          }`}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Payment
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                placeholder="Welcome to our shop! Browse our products and place orders easily."
                type="textarea"
              />
              <SettingInput
                settingKey="help_message"
                label="Help Message"
                placeholder="Available commands and how to use the bot..."
                type="textarea"
              />
              <SettingInput
                settingKey="order_confirmation"
                label="Order Confirmation Message"
                placeholder="Thank you for your order! We'll process it shortly."
                type="textarea"
              />
              <SettingInput
                settingKey="contact_message"
                label="Contact Information"
                placeholder="Contact our support team..."
                type="textarea"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Commands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SettingInput
                  settingKey="custom_command_1"
                  label="Custom Command 1"
                  placeholder="info"
                />
                <SettingInput
                  settingKey="custom_response_1"
                  label="Response 1"
                  placeholder="Response to command 1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SettingInput
                  settingKey="custom_command_2"
                  label="Custom Command 2"
                  placeholder="support"
                />
                <SettingInput
                  settingKey="custom_response_2"
                  label="Response 2"
                  placeholder="Response to command 2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SettingInput
                  settingKey="custom_command_3"
                  label="Custom Command 3"
                  placeholder="faq"
                />
                <SettingInput
                  settingKey="custom_response_3"
                  label="Response 3"
                  placeholder="Response to command 3"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'operator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingInput
                settingKey="operator_name"
                label="Operator Name"
                placeholder="Support Team"
              />
              <SettingInput
                settingKey="operator_username"
                label="Operator Username"
                placeholder="@support"
              />
              <SettingInput
                settingKey="support_email"
                label="Support Email"
                placeholder="support@example.com"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingInput
                settingKey="response_time"
                label="Expected Response Time"
                placeholder="Within 24 hours"
              />
              <SettingInput
                settingKey="support_hours"
                label="Support Hours"
                placeholder="Mon-Fri 9AM-6PM EST"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingInput
                settingKey="payment_methods"
                label="Available Payment Methods"
                placeholder="Credit Card, PayPal, Bank Transfer..."
                type="textarea"
              />
              <SettingInput
                settingKey="tax_rate"
                label="Tax Rate (%)"
                placeholder="0"
                type="number"
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