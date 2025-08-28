import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PaymentMethod } from "@shared/schema";

export default function PaymentMethods() {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    paymentInfo: "",
    instructions: "",
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paymentMethods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to add payment method');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      resetForm();
      toast({ title: "Payment method added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add payment method", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: typeof formData }) => {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update payment method');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      resetForm();
      toast({ title: "Payment method updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update payment method", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete payment method');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({ title: "Payment method deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete payment method", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      paymentInfo: "",
      instructions: "",
      isActive: true
    });
    setIsAddingNew(false);
    setEditingId(null);
  };

  const handleEdit = (method: PaymentMethod) => {
    setFormData({
      name: method.name,
      description: method.description || "",
      paymentInfo: method.paymentInfo || "",
      instructions: method.instructions || "",
      isActive: method.isActive
    });
    setEditingId(method.id);
    setIsAddingNew(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Payment Methods</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <Button 
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2"
          data-testid="button-add-payment-method"
        >
          <Plus className="w-4 h-4" />
          Add Payment Method
        </Button>
      </div>

      {(isAddingNew || editingId) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Payment Method' : 'Add New Payment Method'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Credit Card, PayPal, Bank Transfer"
                  required
                  data-testid="input-payment-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the payment method"
                  required
                  data-testid="input-payment-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentInfo">Payment Information</Label>
                <Textarea
                  id="paymentInfo"
                  value={formData.paymentInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentInfo: e.target.value }))}
                  placeholder="Account details, wallet address, etc."
                  required
                  data-testid="input-payment-info"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Step-by-step payment instructions for customers"
                  required
                  data-testid="input-payment-instructions"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  data-testid="switch-payment-active"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" data-testid="button-save-payment">
                  {editingId ? 'Update' : 'Add'} Payment Method
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel-payment">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {paymentMethods.map((method) => (
          <Card key={method.id} data-testid={`card-payment-${method.id}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {method.name}
                  {!method.isActive && (
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                      Inactive
                    </span>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(method)}
                    data-testid={`button-edit-${method.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(method.id)}
                    data-testid={`button-delete-${method.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Description</h4>
                  <p className="text-sm" data-testid={`text-description-${method.id}`}>{method.description}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Payment Information</h4>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded" data-testid={`text-payment-info-${method.id}`}>
                    {method.paymentInfo}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Instructions</h4>
                  <p className="text-sm whitespace-pre-wrap" data-testid={`text-instructions-${method.id}`}>
                    {method.instructions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {paymentMethods.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods yet</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first payment method</p>
          <Button onClick={() => setIsAddingNew(true)} data-testid="button-add-first-payment">
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      )}
    </div>
  );
}