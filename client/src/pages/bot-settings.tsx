import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import EnhancedBroadcast from "@/components/enhanced-broadcast";
import { PaymentMethodsManager } from "@/components/payment-methods-manager";
import { DeliveryMethodsManager } from "@/components/delivery-methods-manager";

import type { BotSettings } from "@shared/schema";
import { 
  Bot, 
  MessageSquare, 
  Send, 
  CreditCard, 
  User, 
  Save,
  Settings,
  Command,
  Info,
  Zap
} from "lucide-react";

// Bot configuration categories for organized settings
const BOT_CONFIG_CATEGORIES = {
  general: {
    title: "General Information",
    icon: Info,
    description: "Basic bot information and identity",
    settings: [
      { key: "bot_name", label: "Bot Name", type: "text", default: "TeleShop Bot", description: "The display name for your bot" },
      { key: "bot_description", label: "Bot Description", type: "textarea", default: "Your friendly shopping assistant", description: "Brief description of what your bot does" },
      { key: "bot_username", label: "Bot Username", type: "text", default: "@teleshop_bot", description: "The Telegram username (with @)" },
      { key: "welcome_message", label: "Welcome Message", type: "textarea", default: "🛍️ Welcome to TeleShop!\n\nChoose an option below:", description: "Message shown when users start the bot" }
    ]
  },
  messages: {
    title: "Bot Messages",
    icon: MessageSquare,
    description: "Configure all bot responses and messages",
    settings: [
      { key: "help_message", label: "Help Message", type: "textarea", default: "🔹 Available Commands:\n\n🏠 Main Menu - Return to main options\n📦 Catalog - Browse all products", description: "Help command response" },
      { key: "contact_message", label: "Contact Message", type: "textarea", default: "📞 Contact Information:\n\n👤 Operator: @murzion", description: "Contact information display" },
      { key: "order_confirmation", label: "Order Confirmation", type: "textarea", default: "✅ Order confirmed! We'll process your order and contact you within 24 hours.", description: "Message after successful order" },
      { key: "out_of_stock_message", label: "Out of Stock Message", type: "textarea", default: "❌ Sorry, this item is currently out of stock.", description: "Shown when items are unavailable" },
      { key: "cart_empty_message", label: "Empty Cart Message", type: "textarea", default: "🛒 Your cart is empty. Start shopping to add items!", description: "Shown when cart is empty" },
      { key: "payment_instructions", label: "Payment Instructions", type: "textarea", default: "💳 Please follow the payment instructions provided by our operator.", description: "Payment guidance for users" }
    ]
  },
  operator: {
    title: "Operator Settings",
    icon: User,
    description: "Customer support operator information",
    settings: [
      { key: "operator_username", label: "Operator Username", type: "text", default: "@murzion", description: "Support contact username (with @)" },
      { key: "operator_name", label: "Operator Name", type: "text", default: "Support Team", description: "Display name for support" },
      { key: "support_hours", label: "Support Hours", type: "text", default: "Mon-Fri 9AM-6PM EST", description: "Available support hours" },
      { key: "support_email", label: "Support Email", type: "email", default: "support@teleshop.com", description: "Contact email address" },
      { key: "response_time", label: "Expected Response Time", type: "text", default: "Within 24 hours", description: "How quickly you respond" }
    ]
  },
  payment: {
    title: "Payment & Commerce",
    icon: CreditCard,
    description: "Payment methods and pricing settings",
    settings: [
      { key: "currency_symbol", label: "Currency Symbol", type: "text", default: "$", description: "Symbol shown with prices" },
      { key: "currency_code", label: "Currency Code", type: "text", default: "USD", description: "Three-letter currency code" },
      { key: "minimum_order", label: "Minimum Order Amount", type: "number", default: "0", description: "Minimum order value required" },
      { key: "tax_rate", label: "Tax Rate (%)", type: "number", default: "0", description: "Tax percentage applied" }
    ]
  },
  delivery: {
    title: "Delivery Methods",
    icon: Send,
    description: "Shipping and delivery options management",
    settings: []
  },
  commands: {
    title: "Custom Commands",
    icon: Command,
    description: "Create custom bot commands and responses",
    settings: [
      { key: "custom_command_1", label: "Custom Command 1", type: "text", default: "", description: "Command without / (e.g., 'info')" },
      { key: "custom_response_1", label: "Response for Command 1", type: "textarea", default: "", description: "What the bot replies with" },
      { key: "custom_command_2", label: "Custom Command 2", type: "text", default: "", description: "Command without / (e.g., 'faq')" },
      { key: "custom_response_2", label: "Response for Command 2", type: "textarea", default: "", description: "What the bot replies with" },
      { key: "custom_command_3", label: "Custom Command 3", type: "text", default: "", description: "Command without / (e.g., 'about')" },
      { key: "custom_response_3", label: "Response for Command 3", type: "textarea", default: "", description: "What the bot replies with" }
    ]
  }
};

export default function BotSettings() {
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");
  const [editingSettings, setEditingSettings] = useState<{[key: string]: string}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery<BotSettings[]>({
    queryKey: ["/api/bot/settings"],
  });

  // Helper function to get setting value
  const getSettingValue = (key: string) => {
    const setting = settings.find(s => s.key === key);
    if (setting?.value) return setting.value;
    
    // Find default value from categories
    for (const category of Object.values(BOT_CONFIG_CATEGORIES)) {
      const settingDef = category.settings.find(s => s.key === key);
      if (settingDef) return settingDef.default;
    }
    return "";
  };

  const bulkUpdateMutation = useMutation({
    mutationFn: async (settingsToUpdate: {[key: string]: string}) => {
      const promises = Object.entries(settingsToUpdate).map(([key, value]) =>
        fetch("/api/bot/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        })
      );
      const responses = await Promise.all(promises);
      const failed = responses.filter(r => !r.ok);
      if (failed.length > 0) throw new Error(`Failed to update ${failed.length} settings`);
      return responses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/settings"] });
      toast({ title: "Success", description: "Bot settings updated successfully" });
      setEditingSettings({});
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update some bot settings", variant: "destructive" });
    },
  });

  const restartBotMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/bot/restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to restart bot");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bot restarted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to restart bot", variant: "destructive" });
    },
  });

  const handleSaveCategory = () => {
    const categorySettings = BOT_CONFIG_CATEGORIES[activeCategory as keyof typeof BOT_CONFIG_CATEGORIES];
    const settingsToUpdate: {[key: string]: string} = {};
    
    categorySettings.settings.forEach(setting => {
      const currentValue = editingSettings[setting.key] ?? getSettingValue(setting.key);
      settingsToUpdate[setting.key] = currentValue;
    });
    
    bulkUpdateMutation.mutate(settingsToUpdate);
  };

  const handleInputChange = (key: string, value: string) => {
    setEditingSettings(prev => ({ ...prev, [key]: value }));
  };

  const hasUnsavedChanges = Object.keys(editingSettings).length > 0;

  const renderSettingInput = (setting: any) => {
    const currentValue = editingSettings[setting.key] ?? getSettingValue(setting.key);
    
    switch (setting.type) {
      case "textarea":
        return (
          <Textarea
            value={currentValue}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            placeholder={setting.default}
            className="min-h-[100px] resize-none"
            data-testid={`textarea-${setting.key}`}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            placeholder={setting.default}
            min="0"
            step="0.01"
            data-testid={`input-${setting.key}`}
          />
        );
      case "email":
        return (
          <Input
            type="email"
            value={currentValue}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            placeholder={setting.default}
            data-testid={`input-${setting.key}`}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={currentValue}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            placeholder={setting.default}
            data-testid={`input-${setting.key}`}
          />
        );
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Bot Management</h1>
          <p className="text-muted-foreground mt-1">Configure all aspects of your Telegram bot</p>
        </div>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <Button
              onClick={handleSaveCategory}
              disabled={bulkUpdateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-save-changes"
            >
              <Save className="h-4 w-4 mr-2" />
              {bulkUpdateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          )}
          <Button
            onClick={() => setIsBroadcastModalOpen(true)}
            variant="outline"
            data-testid="button-broadcast"
          >
            <Send className="h-4 w-4 mr-2" />
            Broadcast
          </Button>
          <Button
            onClick={() => restartBotMutation.mutate()}
            disabled={restartBotMutation.isPending}
            variant="outline"
            data-testid="button-restart-bot"
          >
            <Bot className="h-4 w-4 mr-2" />
            {restartBotMutation.isPending ? "Restarting..." : "Restart Bot"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {Object.entries(BOT_CONFIG_CATEGORIES).map(([key, category]) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      data-testid={`nav-${key}`}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                        activeCategory === key
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-left">{category.title}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Bot Status */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Bot Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Online</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {(() => {
                  const category = BOT_CONFIG_CATEGORIES[activeCategory as keyof typeof BOT_CONFIG_CATEGORIES];
                  const Icon = category.icon;
                  return <Icon className="h-5 w-5" />;
                })()}
                <div>
                  <CardTitle>
                    {BOT_CONFIG_CATEGORIES[activeCategory as keyof typeof BOT_CONFIG_CATEGORIES].title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {BOT_CONFIG_CATEGORIES[activeCategory as keyof typeof BOT_CONFIG_CATEGORIES].description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment methods get special treatment */}
              {activeCategory === "payment" && (
                <PaymentMethodsManager className="mb-6" />
              )}
              
              {/* Delivery methods get special treatment */}
              {activeCategory === "delivery" && (
                <DeliveryMethodsManager />
              )}
              
              {BOT_CONFIG_CATEGORIES[activeCategory as keyof typeof BOT_CONFIG_CATEGORIES].settings.map(setting => (
                <div key={setting.key} className="space-y-2">
                  <Label htmlFor={setting.key} className="text-sm font-medium">
                    {setting.label}
                  </Label>
                  {renderSettingInput(setting)}
                  {setting.description && (
                    <p className="text-xs text-muted-foreground">
                      {setting.description}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Broadcast Modal */}
      <Dialog open={isBroadcastModalOpen} onOpenChange={setIsBroadcastModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Broadcast Message</DialogTitle>
          </DialogHeader>
          <EnhancedBroadcast onClose={() => setIsBroadcastModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}