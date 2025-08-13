import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, X, GripVertical, CreditCard, Edit2, Save, XCircle } from 'lucide-react';
import type { PaymentMethod } from '@shared/schema';

interface PaymentMethodsManagerProps {
  className?: string;
}

interface PaymentMethodForm {
  name: string;
  description: string;
  isActive: boolean;
}

export function PaymentMethodsManager({ className }: PaymentMethodsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMethod, setNewMethod] = useState<PaymentMethodForm>({
    name: '',
    description: '',
    isActive: true
  });
  const [editForm, setEditForm] = useState<PaymentMethodForm & { id: string }>({
    id: '',
    name: '',
    description: '',
    isActive: true
  });

  // Query payment methods
  const { data: methods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
    refetchOnWindowFocus: false,
  });

  // Create payment method mutation
  const createMutation = useMutation({
    mutationFn: async (data: PaymentMethodForm) => {
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          sortOrder: methods.length
        }),
      });
      if (!response.ok) throw new Error('Failed to create payment method');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      setNewMethod({ name: '', description: '', isActive: true });
      setIsAddingNew(false);
      toast({
        title: "Success",
        description: "Payment method added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add payment method",
        variant: "destructive",
      });
    },
  });

  // Update payment method mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<PaymentMethodForm>) => {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update payment method');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      setEditingId(null);
      toast({
        title: "Success",
        description: "Payment method updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update payment method",
        variant: "destructive",
      });
    },
  });

  // Delete payment method mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete payment method');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete payment method",
        variant: "destructive",
      });
    },
  });

  const handleCreate = useCallback(() => {
    if (!newMethod.name.trim()) {
      toast({
        title: "Error",
        description: "Payment method name is required",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newMethod);
  }, [newMethod, createMutation, toast]);

  const handleEdit = useCallback((method: PaymentMethod) => {
    setEditForm({
      id: method.id,
      name: method.name,
      description: method.description || '',
      isActive: method.isActive
    });
    setEditingId(method.id);
  }, []);

  const handleUpdate = useCallback(() => {
    if (!editForm.name.trim()) {
      toast({
        title: "Error",
        description: "Payment method name is required",
        variant: "destructive",
      });
      return;
    }
    const { id, ...data } = editForm;
    updateMutation.mutate({ id, ...data });
  }, [editForm, updateMutation, toast]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({ id: '', name: '', description: '', isActive: true });
  }, []);

  const handleCancelAdd = useCallback(() => {
    setIsAddingNew(false);
    setNewMethod({ name: '', description: '', isActive: true });
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
        <CardDescription>
          Manage available payment methods for your customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing payment methods */}
        <div className="space-y-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center gap-3 p-4 border rounded-lg bg-card"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
              
              {editingId === method.id ? (
                // Edit mode
                <div className="flex-1 space-y-2">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Payment method name"
                    className="font-medium"
                    data-testid={`input-edit-name-${method.id}`}
                  />
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description (optional)"
                    rows={2}
                    data-testid={`textarea-edit-description-${method.id}`}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editForm.isActive}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                      data-testid={`switch-edit-active-${method.id}`}
                    />
                    <span className="text-sm text-gray-600">Active</span>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium" data-testid={`text-method-name-${method.id}`}>
                      {method.name}
                    </h4>
                    <Badge 
                      variant={method.isActive ? "default" : "secondary"}
                      data-testid={`badge-status-${method.id}`}
                    >
                      {method.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {method.description && (
                    <p className="text-sm text-gray-600 mt-1" data-testid={`text-method-description-${method.id}`}>
                      {method.description}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {editingId === method.id ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleUpdate}
                      disabled={updateMutation.isPending}
                      data-testid={`button-save-${method.id}`}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      data-testid={`button-cancel-edit-${method.id}`}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(method)}
                      data-testid={`button-edit-${method.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(method.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`button-delete-${method.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add new payment method */}
        {isAddingNew ? (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-900">Add New Payment Method</h4>
            <div className="space-y-3">
              <Input
                value={newMethod.name}
                onChange={(e) => setNewMethod(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Payment method name (e.g., Credit Card, PayPal, Bitcoin)"
                data-testid="input-new-method-name"
              />
              <Textarea
                value={newMethod.description}
                onChange={(e) => setNewMethod(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                rows={2}
                data-testid="textarea-new-method-description"
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={newMethod.isActive}
                  onCheckedChange={(checked) => setNewMethod(prev => ({ ...prev, isActive: checked }))}
                  data-testid="switch-new-method-active"
                />
                <span className="text-sm text-gray-600">Active</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                data-testid="button-create-method"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Method
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancelAdd}
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsAddingNew(true)}
            className="w-full border-dashed"
            data-testid="button-add-new-method"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Payment Method
          </Button>
        )}

        {methods.length === 0 && !isAddingNew && (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No payment methods configured</p>
            <p className="text-sm">Add your first payment method to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}