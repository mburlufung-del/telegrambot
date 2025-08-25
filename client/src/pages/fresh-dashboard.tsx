import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, MessageSquare, RefreshCw, CreditCard } from 'lucide-react'
import type { BotSettings, PaymentMethod } from '@shared/schema'

export default function FreshDashboard() {
  const { data: botSettings = [], isLoading, error } = useQuery<BotSettings[]>({
    queryKey: ['bot-settings-fresh'],
    queryFn: async () => {
      console.log('🚀 Fresh fetch starting...')
      const response = await fetch('/api/bot/settings')
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        console.error('❌ Response not OK:', response.status, response.statusText)
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Success! Data received:', data.length, 'items')
      console.log('📋 First item:', data[0])
      return data
    },
    retry: false,
    refetchOnMount: true,
  })

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/payment-methods')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response.json()
    },
    refetchInterval: 5000, // Refresh every 5 seconds to show new additions
  })

  const getSetting = (key: string): string => {
    if (isLoading) return 'Loading...'
    if (error) return 'Error'
    const setting = botSettings.find(s => s.key === key)
    return setting?.value || 'Not set'
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Bot Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Monitor and manage your Telegram bot</p>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          data-testid="button-refresh"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Page
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Bot Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Bot Name:</span>
              <span className="font-medium">{getSetting('bot_name')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Username:</span>
              <span className="font-medium">{getSetting('bot_username')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Currency:</span>
              <span className="font-medium">{getSetting('currency_symbol')} ({getSetting('currency_code')})</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Welcome Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {getSetting('welcome_message')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Active Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No payment methods configured
              </div>
            ) : (
              paymentMethods
                .filter(pm => pm.isActive)
                .map((method, index) => (
                  <div key={method.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium capitalize">{method.name}</span>
                      {method.description && (
                        <p className="text-xs text-gray-600 mt-1">{method.description}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      #{index + 1}
                    </div>
                  </div>
                ))
            )}
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-500">
                Total: {paymentMethods.filter(pm => pm.isActive).length} active methods
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Bot Status:</span>
              <span className="font-medium text-green-600">Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Payment Methods:</span>
              <span className="font-medium">{paymentMethods.filter(pm => pm.isActive).length} Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Configuration:</span>
              <span className="font-medium">{botSettings.length} Settings</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
          </div>
          <div className="text-sm">
            <strong>Error:</strong> {error ? String(error) : 'None'}
          </div>
          <div className="text-sm">
            <strong>Settings Count:</strong> {botSettings.length}
          </div>
          {botSettings.length > 0 && (
            <div className="text-sm">
              <strong>Sample Setting:</strong> {botSettings[0].key} = {botSettings[0].value}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}