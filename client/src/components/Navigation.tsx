import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  MessageCircle, 
  FolderOpen, 
  CreditCard,
  Truck,
  Settings,
  Bot
} from "lucide-react";

const Navigation = () => {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/products", label: "Products", icon: Package },
    { path: "/orders", label: "Orders", icon: ShoppingCart },
    { path: "/inquiries", label: "Inquiries", icon: MessageCircle },
    { path: "/categories", label: "Categories", icon: FolderOpen },
    { path: "/payment-methods", label: "Payment Methods", icon: CreditCard },
    { path: "/delivery-methods", label: "Delivery Methods", icon: Truck },
    { path: "/settings", label: "Bot Settings", icon: Settings },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              TeleShop Admin
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  asChild
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Link href={item.path}>
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </div>

          {/* Mobile menu toggle could go here */}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;