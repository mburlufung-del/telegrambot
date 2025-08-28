import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Bot, Package, MessageSquare, Settings, BarChart3, Activity, Folder, ShoppingCart, TrendingUp, Send, CreditCard, Truck, Headphones } from "lucide-react";

const navigation = [
  { name: "Admin Dashboard", href: "/", icon: BarChart3 },
  { name: "Products", href: "/products", icon: Package },
  { name: "Categories", href: "/categories", icon: Folder },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Inquiries", href: "/inquiries", icon: MessageSquare },
  { name: "Payment Methods", href: "/payment-methods", icon: CreditCard },
  { name: "Delivery Methods", href: "/delivery-methods", icon: Truck },
  { name: "Broadcast", href: "/broadcast", icon: Send },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Operator Support", href: "/operator-support", icon: Headphones },
  { name: "Bot Settings", href: "/bot-settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-telegram rounded-lg flex items-center justify-center">
            <Bot className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">TeleShop Bot</h1>
            <p className="text-sm text-gray-500">Admin Panel v2.0</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-6">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-telegram-light bg-opacity-10 text-telegram border-r-3 border-telegram"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="mt-8 px-6">
          <div className="bg-gradient-to-r from-telegram to-telegram-light rounded-lg p-4 text-white">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Bot Status</p>
                <p className="text-xs opacity-80">Online & Active</p>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
