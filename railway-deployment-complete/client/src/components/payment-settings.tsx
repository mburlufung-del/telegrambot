import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BotSettings } from "@shared/schema";
import { CreditCard, Plus, X, Save, DollarSign } from "lucide-react";

const paymentMethodSchema = z.object({
  name: z.string().min(1, "Payment method name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  instructions: z.string().optional(),
});

type PaymentMethodData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  instructions?: string;
}

export default function PaymentSettings() {
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery<BotSettings[]>({
    queryKey: ["/api/bot/settings"],
  });

  const paymentMethodsSetting = settings.find(s => s.key === "payment_methods");
  const paymentMethods: PaymentMethod[] = paymentMethodsSetting?.value 
    ? JSON.parse(paymentMethodsSetting.value) 
    : [
        { id: "cash", name: "Cash on Delivery", isActive: true, description: "Pay when you receive your order" },
        { id: "card", name: "Credit/Debit Card", isActive: true, description: "Pay securely with your card" },
        { id: "bank", name: "Bank Transfer", isActive: true, description: "Transfer directly to our bank account" },
        { id: "paypal", name: "PayPal", isActive: true, description: "Pay safely with PayPal" },
        { id: "crypto", name: "Cryptocurrency", isActive: false, description: "Bitcoin and other cryptocurrencies" },
      ];

  const form = useForm<PaymentMethodData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      instructions: "",
    },
  });

  const updatePaymentMethodsMutation = useMutation({
    mutationFn: async (methods: PaymentMethod[]) => {
      const response = await fetch("/api/bot/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "payment_methods",
          value: JSON.stringify(methods),
        }),
      });
      if (!response.ok) throw new Error("Failed to update payment methods");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/settings"] });
      toast({ title: "Success", description: "Payment methods updated successfully" });
      setEditingMethod(null);
      setIsAddingNew(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update payment methods", variant: "destructive" });
    },
  });

  const handleAddMethod = (data: PaymentMethodData) => {
    const newMethod: PaymentMethod = {
      id: data.name.toLowerCase().replace(/\s+/g, "_"),
      ...data,
    };
    const updatedMethods = [...paymentMethods, newMethod];
    updatePaymentMethodsMutation.mutate(updatedMethods);
  };

  const handleUpdateMethod = (data: PaymentMethodData) => {
    if (!editingMethod) return;
    
    const updatedMethods = paymentMethods.map(method =>
      method.id === editingMethod.id 
        ? { ...method, ...data }
        : method
    );
    updatePaymentMethodsMutation.mutate(updatedMethods);
  };

  const handleDeleteMethod = (methodId: string) => {
    const updatedMethods = paymentMethods.filter(method => method.id !== methodId);
    updatePaymentMethodsMutation.mutate(updatedMethods);
  };

  const handleToggleActive = (methodId: string, isActive: boolean) => {
    const updatedMethods = paymentMethods.map(method =>
      method.id === methodId 
        ? { ...method, isActive }
        : method
    );
    updatePaymentMethodsMutation.mutate(updatedMethods);
  };

  const startEditing = (method: PaymentMethod) => {
    setEditingMethod(method);
    setIsAddingNew(false);
    form.reset({
      name: method.name,
      description: method.description || "",
      isActive: method.isActive,
      instructions: method.instructions || "",
    });
  };

  const startAdding = () => {
    setIsAddingNew(true);
    setEditingMethod(null);
    form.reset({
      name: "",
      description: "",
      isActive: true,
      instructions: "",
    });
  };

  const cancelEditing = () => {
    setEditingMethod(null);
    setIsAddingNew(false);
    form.reset();
  };

  const onSubmit = (data: PaymentMethodData) => {
    if (isAddingNew) {
      handleAddMethod(data);
    } else if (editingMethod) {
      handleUpdateMethod(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Payment Methods</h3>
        </div>
        <Button onClick={startAdding} data-testid="button-add-payment-method">
          <Plus className="h-4 w-4 mr-2" />
          Add Method
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Available Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{method.name}</h4>
                      <Badge variant={method.isActive ? "default" : "secondary"}>
                        {method.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {method.description && (
                      <p className="text-sm text-gray-600">{method.description}</p>
                    )}
                    {method.instructions && (
                      <p className="text-xs text-gray-500 mt-1">
                        Instructions: {method.instructions}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={method.isActive}
                      onCheckedChange={(checked) => handleToggleActive(method.id, checked)}
                      data-testid={`switch-payment-${method.id}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(method)}
                      data-testid={`button-edit-payment-${method.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMethod(method.id)}
                      className="text-red-500 hover:text-red-700"
                      data-testid={`button-delete-payment-${method.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {paymentMethods.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No payment methods configured</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Form */}
        {(isAddingNew || editingMethod) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isAddingNew ? "Add Payment Method" : "Edit Payment Method"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Method Name *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="e.g., Apple Pay"
                    data-testid="input-payment-name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    {...form.register("description")}
                    placeholder="Brief description for customers"
                    data-testid="input-payment-description"
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">Payment Instructions</Label>
                  <Textarea
                    id="instructions"
                    {...form.register("instructions")}
                    placeholder="Detailed instructions for customers on how to pay"
                    rows={3}
                    data-testid="input-payment-instructions"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={form.watch("isActive")}
                    onCheckedChange={(checked) => form.setValue("isActive", checked)}
                    data-testid="switch-payment-active"
                  />
                  <Label htmlFor="isActive">Active Method</Label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={cancelEditing} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatePaymentMethodsMutation.isPending}
                    data-testid="button-save-payment"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isAddingNew ? "Add Method" : "Update Method"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}