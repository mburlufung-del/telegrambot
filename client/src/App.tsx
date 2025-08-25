import { Switch, Route, Link, useLocation } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Dashboard from './pages/dashboard'
import FreshDashboard from './pages/fresh-dashboard'
import ComprehensiveDashboard from './pages/comprehensive-dashboard'
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
  Truck,
  Menu,
  X
} from 'lucide-react'

function Sidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
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
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onToggle}
          data-testid="sidebar-overlay"
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 w-64 bg-gray-900 text-white min-h-screen transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-white hover:bg-gray-800"
            data-testid="button-close-sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6 lg:mt-0 -mt-16">
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
                  onClick={() => {
                    // Close sidebar on mobile when navigating
                    if (window.innerWidth < 1024) {
                      onToggle()
                    }
                  }}
                  data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Test integration status
  const { data: integrationTest } = useQuery<IntegrationTestResult>({
    queryKey: ['/api/integration/test'],
    refetchInterval: 30000,
  })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main content */}
      <main className="flex-1 lg:ml-0 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600"
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">TeleShop Bot</h1>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
        
        <div className="p-4 lg:p-8">
          <div className="mb-4 lg:mb-6">
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
          <Route path="/" component={ComprehensiveDashboard} />
          <Route path="/simple-dashboard" component={FreshDashboard} />
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
        </div>
      </main>
    </div>
  )
}

export default App