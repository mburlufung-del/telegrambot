import { useState } from 'react'
import { Switch, Route } from 'wouter'
import Sidebar, { MobileSidebar } from './components/layout/sidebar'
import Header from './components/layout/header'
import AdminDashboard from './pages/admin-dashboard'
import Products from './pages/products'
import Categories from './pages/categories'
import Orders from './pages/orders'
import Inquiries from './pages/inquiries'
import BotSettings from './pages/bot-settings'
import Analytics from './pages/analytics-simple'
import Broadcast from './pages/broadcast'
import PaymentMethods from './pages/payment-methods'
import DeliveryMethods from './pages/delivery-methods'
import Languages from './pages/languages'
import Currencies from './pages/currencies'
import OperatorSupport from './pages/operator-support'
import LiveChat from './pages/live-chat'
import NotFound from './pages/not-found'

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1 p-4 sm:p-6">
          <Switch>
            <Route path="/" component={AdminDashboard} />
            <Route path="/products" component={Products} />
            <Route path="/categories" component={Categories} />
            <Route path="/orders" component={Orders} />
            <Route path="/inquiries" component={Inquiries} />
            <Route path="/payment-methods" component={PaymentMethods} />
            <Route path="/delivery-methods" component={DeliveryMethods} />
            <Route path="/languages" component={Languages} />
            <Route path="/currencies" component={Currencies} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/broadcast" component={Broadcast} />
            <Route path="/bot-settings" component={BotSettings} />
            <Route path="/operator-support" component={OperatorSupport} />
            <Route path="/live-chat" component={LiveChat} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  )
}

export default App