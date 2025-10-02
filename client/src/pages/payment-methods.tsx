import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  Save, 
  X,
  GripVertical,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PaymentMethod, InsertPaymentMethod } from "@shared/schema";

export default function PaymentMethods() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    paymentInfo: '',
    instructions: '',
    isActive: true,
    sortOrder: 0
  });

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading, error } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods-admin'],
    queryFn: async () => {
      console.log('🔧 Fetching payment methods for admin page...');
      const response = await fetch('/api/payment-methods');
      
      if (!response.ok) {
        console.error('❌ Payment methods fetch failed:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Payment methods loaded:', data.length, 'methods');
      console.log('📋 Methods:', data.map((m: PaymentMethod) => `${m.name} (${m.id})`));
      return data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Create payment method mutation
  const createPaymentMethodMutation = useMutation({
    mutationFn: async (methodData: InsertPaymentMethod) => {
      return await apiRequest('/api/payment-methods', {
        method: 'POST',
        body: JSON.stringify(methodData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods-admin'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods-dashboard'] });
      resetForm();
      toast({
        title: "Success",
        description: "Payment method created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create payment method: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update payment method mutation
  const updatePaymentMethodMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertPaymentMethod> }) => {
      return await apiRequest(`/api/payment-methods/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods-admin'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods-dashboard'] });
      resetForm();
      toast({
        title: "Success",
        description: "Payment method updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: `Failed to update payment method: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete payment method mutation
  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/payment-methods/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete payment method: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      paymentInfo: '',
      instructions: '',
      isActive: true,
      sortOrder: 0
    });
    setIsAddingMethod(false);
    setEditingMethod(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Payment method name is required",
        variant: "destructive",
      });
      return;
    }

    const methodData: InsertPaymentMethod = {
      ...formData,
      sortOrder: editingMethod ? editingMethod.sortOrder : paymentMethods.length
    };

    if (editingMethod) {
      updatePaymentMethodMutation.mutate({ id: editingMethod.id, data: methodData });
    } else {
      createPaymentMethodMutation.mutate(methodData);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      description: method.description || '',
      paymentInfo: method.paymentInfo || '',
      instructions: method.instructions || '',
      isActive: method.isActive,
      sortOrder: method.sortOrder
    });
    setIsAddingMethod(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      deletePaymentMethodMutation.mutate(id);
    }
  };

  const toggleStatus = (method: PaymentMethod) => {
    updatePaymentMethodMutation.mutate({
      id: method.id,
      data: { isActive: !method.isActive }
    });
  };

  const movePriority = (method: PaymentMethod, direction: 'up' | 'down') => {
    const sortedMethods = [...paymentMethods].sort((a, b) => a.sortOrder - b.sortOrder);
    const currentIndex = sortedMethods.findIndex(m => m.id === method.id);
    
    if (direction === 'up' && currentIndex > 0) {
      const targetMethod = sortedMethods[currentIndex - 1];
      updatePaymentMethodMutation.mutate({
        id: method.id,
        data: { sortOrder: targetMethod.sortOrder }
      });
      updatePaymentMethodMutation.mutate({
        id: targetMethod.id,
        data: { sortOrder: method.sortOrder }
      });
    } else if (direction === 'down' && currentIndex < sortedMethods.length - 1) {
      const targetMethod = sortedMethods[currentIndex + 1];
      updatePaymentMethodMutation.mutate({
        id: method.id,
        data: { sortOrder: targetMethod.sortOrder }
      });
      updatePaymentMethodMutation.mutate({
        id: targetMethod.id,
        data: { sortOrder: method.sortOrder }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading payment methods</h3>
          <p className="text-red-600 text-sm mt-1">{String(error)}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-3"
            size="sm"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Payment Methods</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Configure payment options for your customers</p>
        </div>
        <Button 
          onClick={() => setIsAddingMethod(true)}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          data-testid="button-add-payment-method"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Add/Edit Form */}
      {isAddingMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Payment Method Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Bank Transfer, Cash on Delivery, Crypto"
                    required
                    data-testid="input-payment-name"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    data-testid="switch-payment-active"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this payment method"
                  data-testid="input-payment-description"
                />
              </div>

              <div>
                <Label htmlFor="paymentInfo">Payment Information</Label>
                <Textarea
                  id="paymentInfo"
                  value={formData.paymentInfo}
                  onChange={(e) => setFormData({ ...formData, paymentInfo: e.target.value })}
                  placeholder="Account details, wallet address, or other payment info"
                  rows={3}
                  data-testid="textarea-payment-info"
                />
              </div>

              <div>
                <Label htmlFor="instructions">Payment Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Step-by-step instructions for customers"
                  rows={4}
                  data-testid="textarea-payment-instructions"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createPaymentMethodMutation.isPending || updatePaymentMethodMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-save-payment-method"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingMethod ? 'Update' : 'Create'} Payment Method
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  data-testid="button-cancel-payment-method"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      <div className="grid grid-cols-1 gap-4">
        {paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods yet</h3>
              <p className="text-gray-600 mb-4">Add your first payment method to start accepting payments.</p>
              <Button 
                onClick={() => setIsAddingMethod(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Payment Method
              </Button>
            </CardContent>
          </Card>
        ) : (
          paymentMethods
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((method) => (
              <Card key={method.id} className={`${!method.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => movePriority(method, 'up')}
                            className="h-6 w-6 p-0"
                            data-testid={`button-move-up-${method.id}`}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => movePriority(method, 'down')}
                            className="h-6 w-6 p-0"
                            data-testid={`button-move-down-${method.id}`}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-lg" data-testid={`text-payment-name-${method.id}`}>
                            {method.name}
                          </h3>
                          {method.description && (
                            <p className="text-gray-600 text-sm">{method.description}</p>
                          )}
                        </div>
                        <Badge 
                          variant={method.isActive ? "default" : "secondary"}
                          data-testid={`badge-payment-status-${method.id}`}
                        >
                          {method.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {method.paymentInfo && (
                        <div className="mb-3">
                          <Label className="text-sm font-medium text-gray-700">Payment Information:</Label>
                          <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-2 rounded border">
                            {method.paymentInfo}
                          </p>
                        </div>
                      )}

                      {method.instructions && (
                        <div className="mb-3">
                          <Label className="text-sm font-medium text-gray-700">Instructions:</Label>
                          <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                            {method.instructions}
                          </p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Order: {method.sortOrder} • Created: {new Date(method.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(method)}
                        data-testid={`button-toggle-${method.id}`}
                      >
                        {method.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(method)}
                        data-testid={`button-edit-${method.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(method.id)}
                        className="text-red-600 hover:text-red-800"
                        data-testid={`button-delete-${method.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Summary */}
      {paymentMethods.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  {paymentMethods.length} Payment Method{paymentMethods.length !== 1 ? 's' : ''} Configured
                </h3>
                <p className="text-blue-700 text-sm mt-1">
                  Active methods: {paymentMethods.filter(m => m.isActive).length} | 
                  Available to customers in checkout
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}