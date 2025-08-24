import { Switch, Route, Link, useLocation } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import Dashboard from './pages/dashboard'
import FreshDashboard from './pages/fresh-dashboard'
import Products from './pages/products'
import Categories from './pages/categories'
import Orders from './pages/orders'
import Inquiries from './pages/inquiries'
import BotSettings from './pages/bot-settings'
import Analytics from './pages/analytics-simple'
import Broadcast from './pages/broadcast'

import PaymentMethods from './pages/payment-methods'
import DeliveryMethods from './pages/delivery-methods'
import NotFound from './pages/not-found'
import { Button } from './components/ui/button'

interface IntegrationTestResult {
  success: boolean
  tests: {
    database: boolean
    bot: boolean
    settings: boolean
  }
}
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  ShoppingCart, 
  MessageSquare, 
  Settings, 
  BarChart3,
  Radio,

  CreditCard,
  Truck
} from 'lucide-react'

function Sidebar() {
  const [location] = useLocation()

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/categories', icon: FolderOpen, label: 'Categories' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/inquiries', icon: MessageSquare, label: 'Inquiries' },
    { path: '/payment-methods', icon: CreditCard, label: 'Payment Methods' },
    { path: '/delivery-methods', icon: Truck, label: 'Delivery Methods' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/broadcast', icon: Radio, label: 'Broadcast' },

    { path: '/bot-settings', icon: Settings, label: 'Bot Settings' }
  ]

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-400">TeleShop Bot</h1>
        <p className="text-sm text-gray-400">Admin Dashboard</p>
      </div>
      <nav className="mt-6">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location === item.path
          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start text-left px-6 py-3 ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function App() {
  // Test integration status
  const { data: integrationTest } = useQuery<IntegrationTestResult>({
    queryKey: ['/api/integration/test'],
    refetchInterval: 30000,
  })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-6">
          {integrationTest && (
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              integrationTest.success 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                integrationTest.success ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {integrationTest.success ? 'All Systems Online' : 'System Issues Detected'}
            </div>
          )}
        </div>
        
        <Switch>
          <Route path="/" component={FreshDashboard} />
          <Route path="/old-dashboard" component={Dashboard} />
          <Route path="/products" component={Products} />
          <Route path="/categories">
            <Categories />
          </Route>
          <Route path="/orders" component={Orders} />
          <Route path="/inquiries" component={Inquiries} />
          <Route path="/payment-methods" component={PaymentMethods} />
          <Route path="/delivery-methods" component={DeliveryMethods} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/broadcast" component={Broadcast} />

          <Route path="/bot-settings" component={BotSettings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  )
}

export default App