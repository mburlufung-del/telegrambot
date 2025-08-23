import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, MessageSquare, RefreshCw } from 'lucide-react'
import type { BotSettings } from '@shared/schema'

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

  const getSetting = (key: string): string => {
    if (isLoading) return 'Loading...'
    if (error) return 'Error'
    const setting = botSettings.find(s => s.key === key)
    return setting?.value || 'Not set'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fresh Bot Dashboard</h1>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Page
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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