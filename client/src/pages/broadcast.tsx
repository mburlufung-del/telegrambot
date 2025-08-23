import EnhancedBroadcast from '@/components/enhanced-broadcast'

export default function Broadcast() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Broadcast Messages</h1>
        <p className="text-sm text-gray-600">Send messages to your Telegram bot users</p>
      </div>
      <EnhancedBroadcast />
    </div>
  )
}