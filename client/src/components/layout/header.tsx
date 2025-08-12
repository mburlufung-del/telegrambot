import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Eye, User } from "lucide-react";

const pageTitle = {
  "/": "Dashboard Overview",
  "/products": "Product Management",
  "/inquiries": "Customer Inquiries",
  "/bot-settings": "Bot Settings",
};

const pageSubtitle = {
  "/": "Manage your Telegram shop bot and monitor performance",
  "/products": "Add, edit, and manage your product catalog",
  "/inquiries": "View and respond to customer messages",
  "/bot-settings": "Configure bot behavior and responses",
};

export default function Header() {
  const [location] = useLocation();
  
  const title = pageTitle[location as keyof typeof pageTitle] || "TeleShop Bot";
  const subtitle = pageSubtitle[location as keyof typeof pageSubtitle] || "";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="default" className="bg-telegram hover:bg-blue-700">
              <Eye className="mr-2 h-4 w-4" />
              Preview Bot
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Admin User</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
