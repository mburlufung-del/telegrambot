import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Package, DollarSign, Calendar, User, MapPin } from 'lucide-react'

interface Order {
  id: string
  telegramUserId: string
  items: string
  totalAmount: number
  status: string
  shippingAddress: string
  createdAt: string
}

export default function Orders() {
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    refetchInterval: false, // Only refetch when manually invalidated
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-purple-100 text-purple-800'
      case 'shipped': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const parseOrderItems = (itemsJson: string) => {
    try {
      return JSON.parse(itemsJson)
    } catch {
      return []
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading orders...</div>
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Order Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">View and manage customer orders from Telegram bot</p>
        </div>
        <div className="text-center sm:text-right">
          <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => o.status.toLowerCase() === 'pending').length}
                </p>
              </div>
              <Package className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-purple-600">
                  {orders.filter(o => ['confirmed', 'processing'].includes(o.status.toLowerCase())).length}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(o => ['shipped', 'delivered'].includes(o.status.toLowerCase())).length}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${orders.reduce((sum, order) => sum + Number(order.totalAmount), 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">Orders from your Telegram bot will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const items = parseOrderItems(order.items)
            return (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base md:text-lg truncate">Order #{order.id.slice(0, 8)}</CardTitle>
                      <div className="flex items-center text-xs md:text-sm text-gray-500 mt-1 min-w-0">
                        <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <div className="text-lg font-bold text-green-600">
                        ${Number(order.totalAmount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-xs md:text-sm text-gray-600 min-w-0">
                        <User className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Customer ID: {order.telegramUserId}</span>
                      </div>
                      {order.shippingAddress && order.shippingAddress !== 'TBD' && (
                        <div className="flex items-start text-xs md:text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                          <span className="break-words">{order.shippingAddress}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-xs md:text-sm text-gray-700 mb-2">Order Items:</h4>
                      {items.length > 0 ? (
                        <div className="space-y-1">
                          {items.map((item: any, index: number) => (
                            <div key={index} className="text-xs md:text-sm text-gray-600 break-words">
                              • Product {item.productId?.slice(0, 8)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs md:text-sm text-gray-500">Order details not available</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}