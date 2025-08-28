import { Switch, Route } from 'wouter'
import { Sidebar } from './components/ui/sidebar'
import Header from './components/layout/header'
import Dashboard from './pages/dashboard'
import AdminDashboard from './pages/admin-dashboard'
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
import OperatorSupport from './pages/operator-support'
import NotFound from './pages/not-found'

function App() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-6">
          <Switch>
            <Route path="/" component={AdminDashboard} />
            <Route path="/fresh-dashboard" component={FreshDashboard} />
            <Route path="/products" component={Products} />
            <Route path="/categories" component={Categories} />
            <Route path="/orders" component={Orders} />
            <Route path="/inquiries" component={Inquiries} />
            <Route path="/payment-methods" component={PaymentMethods} />
            <Route path="/delivery-methods" component={DeliveryMethods} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/broadcast" component={Broadcast} />
            <Route path="/bot-settings" component={BotSettings} />
            <Route path="/operator-support" component={OperatorSupport} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  )
}

export default App