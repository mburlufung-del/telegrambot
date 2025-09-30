import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Eye, User, Menu, Bot } from "lucide-react";

const pageTitle = {
  "/": "Dashboard Overview",
  "/products": "Product Management",
  "/inquiries": "Customer Inquiries",
  "/bot-settings": "Bot Settings",
  "/languages": "Language Management",
  "/currencies": "Currency Management",
};

const pageSubtitle = {
  "/": "Manage your Telegram shop bot and monitor performance",
  "/products": "Add, edit, and manage your product catalog",
  "/inquiries": "View and respond to customer messages",
  "/bot-settings": "Configure bot behavior and responses",
  "/languages": "Manage supported languages and bot translations",
  "/currencies": "Configure supported currencies and exchange rates",
};

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [location] = useLocation();
  
  const title = pageTitle[location as keyof typeof pageTitle] || "TeleShop Bot";
  const subtitle = pageSubtitle[location as keyof typeof pageSubtitle] || "";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onMenuClick}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-telegram rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="text-white h-4 w-4" />
              </div>
              <h1 className="text-base font-semibold text-gray-900 truncate">TeleShop</h1>
            </div>
            <div className="hidden lg:block min-w-0 flex-1">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{title}</h2>
              {subtitle && <p className="text-sm lg:text-base text-gray-600 mt-1 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Button variant="default" className="bg-telegram hover:bg-blue-700 hidden sm:flex" data-testid="button-preview">
              <Eye className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Preview Bot</span>
              <span className="md:hidden">Preview</span>
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:inline">Admin User</span>
            </div>
          </div>
        </div>
        <div className="lg:hidden mt-3">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
