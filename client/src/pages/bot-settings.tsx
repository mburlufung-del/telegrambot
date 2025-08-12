import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Bot, 
  MessageSquare, 
  Save,
  Activity,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BotSettings } from "@shared/schema";

interface BotStatus {
  status: string;
  ready: boolean;
}

export default function BotSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});

  const { data: botSettings = [], isLoading } = useQuery<BotSettings[]>({
    queryKey: ["/api/bot/settings"],
  });

  // Update settings when botSettings changes
  useEffect(() => {
    if (botSettings.length > 0) {
      const settingsMap: Record<string, string> = {};
      botSettings.forEach((setting: BotSettings) => {
        settingsMap[setting.key] = setting.value;
      });
      setSettings(settingsMap);
    }
  }, [botSettings]);

  const { data: botStatus } = useQuery<BotStatus>({
    queryKey: ["/api/bot/status"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiRequest("POST", "/api/bot/settings", { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/settings"] });
      toast({
        title: "Settings updated",
        description: "Bot settings have been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bot settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSetting = (key: string) => {
    const value = settings[key];
    if (value !== undefined) {
      updateSettingMutation.mutate({ key, value });
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const settingsConfig = [
    {
      key: "welcome_message",
      label: "Welcome Message",
      description: "Message sent when users start a conversation with /start",
      type: "textarea" as const,
    },
    {
      key: "help_message",
      label: "Help Message",
      description: "Message shown when users request help with /help",
      type: "textarea" as const,
    },
    {
      key: "bot_token",
      label: "Bot Token",
      description: "Telegram bot token from @BotFather",
      type: "input" as const,
      placeholder: "Enter your bot token...",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bot Settings</h1>
          <p className="text-gray-600 mt-1">Configure your Telegram bot behavior and responses</p>
        </div>
        <div className="flex items-center space-x-2">
          {botStatus?.ready ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />
              Online
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="mr-1 h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Bot Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Bot Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${botStatus?.ready ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="font-medium text-gray-900">
                  {botStatus?.ready ? 'Bot is online and responding' : 'Bot is offline'}
                </p>
                <p className="text-sm text-gray-600">
                  {botStatus?.ready 
                    ? 'Your bot is successfully connected to Telegram and ready to receive messages'
                    : 'Check your bot token and internet connection'
                  }
                </p>
              </div>
            </div>
            <Bot className="h-8 w-8 text-telegram" />
          </div>
        </CardContent>
      </Card>

      {/* Settings Cards */}
      <div className="space-y-6">
        {settingsConfig.map((config) => (
          <Card key={config.key}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                {config.label}
              </CardTitle>
              <p className="text-sm text-gray-600">{config.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor={config.key}>{config.label}</Label>
                  {config.type === "textarea" ? (
                    <Textarea
                      id={config.key}
                      value={settings[config.key] || ""}
                      onChange={(e) => handleInputChange(config.key, e.target.value)}
                      placeholder={config.placeholder}
                      rows={4}
                      className="mt-1"
                    />
                  ) : (
                    <Input
                      id={config.key}
                      value={settings[config.key] || ""}
                      onChange={(e) => handleInputChange(config.key, e.target.value)}
                      placeholder={config.placeholder}
                      type={config.key === "bot_token" ? "password" : "text"}
                      className="mt-1"
                    />
                  )}
                </div>
                <Button
                  onClick={() => handleSaveSetting(config.key)}
                  disabled={updateSettingMutation.isPending}
                  className="bg-telegram hover:bg-blue-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save {config.label}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How to get a Bot Token:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Message @BotFather on Telegram</li>
                <li>Send /newbot and follow the instructions</li>
                <li>Choose a name and username for your bot</li>
                <li>Copy the token and paste it in the Bot Token field above</li>
                <li>Save the settings and your bot will come online</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Available Commands:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>/start - Shows the welcome message</li>
                <li>/help - Shows the help message</li>
                <li>/catalog - Displays the product catalog</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
