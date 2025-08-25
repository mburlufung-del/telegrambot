import EnhancedBroadcast from '@/components/enhanced-broadcast'

export default function Broadcast() {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold">Broadcast Messages</h1>
        <p className="text-sm text-gray-600">Send messages to your Telegram bot users</p>
      </div>
      <EnhancedBroadcast />
    </div>
  )
}