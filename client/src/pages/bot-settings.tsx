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
import BroadcastForm from "@/components/broadcast-form";
import AdvancedBroadcast from "@/components/advanced-broadcast";
import PaymentSettings from "@/components/payment-settings";
import type { BotSettings } from "@shared/schema";
import { 
  Bot, 
  MessageSquare, 
  Send, 
  CreditCard, 
  User, 
  Save,
  Settings,
  Plus,
  Command
} from "lucide-react";

const botSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

type BotSettingData = z.infer<typeof botSettingSchema>;

const operatorSchema = z.object({
  username: z.string().min(1, "Username is required").startsWith("@", "Username must start with @"),
  displayName: z.string().min(1, "Display name is required"),
});

type OperatorData = z.infer<typeof operatorSchema>;

export default function BotSettings() {
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isCustomCommandModalOpen, setIsCustomCommandModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery<BotSettings[]>({
    queryKey: ["/api/bot/settings"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (data: BotSettingData) => {
      const response = await fetch("/api/bot/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update setting");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/settings"] });
      toast({ title: "Success", description: "Bot setting updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update bot setting", variant: "destructive" });
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

  // Get specific settings
  const getSetting = (key: string) => settings.find(s => s.key === key)?.value || "";

  // Forms for different settings
  const welcomeForm = useForm({
    defaultValues: { value: getSetting("welcome_message") },
  });

  const helpForm = useForm({
    defaultValues: { value: getSetting("help_message") },
  });

  const contactForm = useForm({
    defaultValues: { value: getSetting("contact_message") },
  });

  const operatorForm = useForm<OperatorData>({
    resolver: zodResolver(operatorSchema),
    defaultValues: {
      username: "@murzion",
      displayName: "Support Team",
    },
  });

  const customCommandForm = useForm<BotSettingData>({
    resolver: zodResolver(botSettingSchema),
    defaultValues: {
      key: "",
      value: "",
    },
  });

  const handleUpdateSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bot Settings</h1>
          <p className="text-gray-600 mt-1">Configure your Telegram bot behavior and messages</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setIsBroadcastModalOpen(true)}
            variant="outline"
            data-testid="button-broadcast"
          >
            <Send className="mr-2 h-4 w-4" />
            Broadcast
          </Button>
          <Button
            onClick={() => restartBotMutation.mutate()}
            disabled={restartBotMutation.isPending}
            data-testid="button-restart-bot"
          >
            <Bot className="mr-2 h-4 w-4" />
            {restartBotMutation.isPending ? "Restarting..." : "Restart Bot"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="operator" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Operator</span>
          </TabsTrigger>
          <TabsTrigger value="commands" className="flex items-center gap-2">
            <Command className="h-4 w-4" />
            <span className="hidden sm:inline">Commands</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Welcome Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Welcome Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={welcomeForm.handleSubmit((data) => 
                  handleUpdateSetting("welcome_message", data.value)
                )} className="space-y-4">
                  <div>
                    <Label htmlFor="welcome">Message Content</Label>
                    <Textarea
                      id="welcome"
                      {...welcomeForm.register("value")}
                      placeholder="Enter welcome message..."
                      rows={6}
                      className="resize-none"
                      data-testid="input-welcome-message"
                    />
                  </div>
                  <Button type="submit" disabled={updateSettingMutation.isPending} data-testid="button-save-welcome">
                    <Save className="h-4 w-4 mr-2" />
                    Save Welcome Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Help Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Help Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={helpForm.handleSubmit((data) => 
                  handleUpdateSetting("help_message", data.value)
                )} className="space-y-4">
                  <div>
                    <Label htmlFor="help">Message Content</Label>
                    <Textarea
                      id="help"
                      {...helpForm.register("value")}
                      placeholder="Enter help message..."
                      rows={6}
                      className="resize-none"
                      data-testid="input-help-message"
                    />
                  </div>
                  <Button type="submit" disabled={updateSettingMutation.isPending} data-testid="button-save-help">
                    <Save className="h-4 w-4 mr-2" />
                    Save Help Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Message */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={contactForm.handleSubmit((data) => 
                  handleUpdateSetting("contact_message", data.value)
                )} className="space-y-4">
                  <div>
                    <Label htmlFor="contact">Message Content</Label>
                    <Textarea
                      id="contact"
                      {...contactForm.register("value")}
                      placeholder="Enter contact information..."
                      rows={4}
                      className="resize-none"
                      data-testid="input-contact-message"
                    />
                  </div>
                  <Button type="submit" disabled={updateSettingMutation.isPending} data-testid="button-save-contact">
                    <Save className="h-4 w-4 mr-2" />
                    Save Contact Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <PaymentSettings />
        </TabsContent>

        <TabsContent value="operator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Operator Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={operatorForm.handleSubmit((data) => {
                handleUpdateSetting("operator_username", data.username);
                handleUpdateSetting("operator_display_name", data.displayName);
              })} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Telegram Username</Label>
                    <Input
                      id="username"
                      {...operatorForm.register("username")}
                      placeholder="@username"
                      data-testid="input-operator-username"
                    />
                    {operatorForm.formState.errors.username && (
                      <p className="text-sm text-red-500 mt-1">
                        {operatorForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      {...operatorForm.register("displayName")}
                      placeholder="Support Team"
                      data-testid="input-operator-display-name"
                    />
                    {operatorForm.formState.errors.displayName && (
                      <p className="text-sm text-red-500 mt-1">
                        {operatorForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={updateSettingMutation.isPending} data-testid="button-save-operator">
                  <Save className="h-4 w-4 mr-2" />
                  Update Operator Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commands" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Custom Commands</h3>
              <p className="text-gray-600">Add custom command buttons and information responses</p>
            </div>
            <Button
              onClick={() => setIsCustomCommandModalOpen(true)}
              data-testid="button-add-command"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Command
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings
              .filter(setting => setting.key.startsWith("custom_command_"))
              .map((setting) => (
                <Card key={setting.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      /{setting.key.replace("custom_command_", "")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">{setting.value}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            
            {settings.filter(s => s.key.startsWith("custom_command_")).length === 0 && (
              <Card className="md:col-span-2">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Command className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No custom commands yet</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Create custom commands to provide quick information to your customers
                  </p>
                  <Button onClick={() => setIsCustomCommandModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Command
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Broadcast Modal */}
      <Dialog open={isBroadcastModalOpen} onOpenChange={setIsBroadcastModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Broadcast Message</DialogTitle>
          </DialogHeader>
          <BroadcastForm 
            onSuccess={() => setIsBroadcastModalOpen(false)}
            onCancel={() => setIsBroadcastModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Custom Command Modal */}
      <Dialog open={isCustomCommandModalOpen} onOpenChange={setIsCustomCommandModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Custom Command</DialogTitle>
          </DialogHeader>
          <form onSubmit={customCommandForm.handleSubmit((data) => {
            updateSettingMutation.mutate({
              key: `custom_command_${data.key}`,
              value: data.value,
            });
            setIsCustomCommandModalOpen(false);
            customCommandForm.reset();
          })} className="space-y-4">
            <div>
              <Label htmlFor="commandKey">Command Name</Label>
              <Input
                id="commandKey"
                {...customCommandForm.register("key")}
                placeholder="e.g., delivery, pricing, about"
                data-testid="input-command-key"
              />
              {customCommandForm.formState.errors.key && (
                <p className="text-sm text-red-500 mt-1">
                  {customCommandForm.formState.errors.key.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="commandValue">Response Message</Label>
              <Textarea
                id="commandValue"
                {...customCommandForm.register("value")}
                placeholder="Enter the response message for this command..."
                rows={4}
                data-testid="input-command-value"
              />
              {customCommandForm.formState.errors.value && (
                <p className="text-sm text-red-500 mt-1">
                  {customCommandForm.formState.errors.value.message}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomCommandModalOpen(false)}
                data-testid="button-cancel-command"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-command">
                <Save className="h-4 w-4 mr-2" />
                Add Command
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}