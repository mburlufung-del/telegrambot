import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Truck, Plus, Edit, Trash2, DollarSign, Clock, Package } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { insertDeliveryMethodSchema } from '@shared/schema'
import type { DeliveryMethod, InsertDeliveryMethod } from '@shared/schema'
import { z } from 'zod'

export default function DeliveryMethods() {
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: deliveryMethods = [], isLoading } = useQuery<DeliveryMethod[]>({
    queryKey: ['/api/delivery-methods'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  })

  const form = useForm<InsertDeliveryMethod>({
    resolver: zodResolver(insertDeliveryMethodSchema.extend({
      price: z.string().min(1, 'Price is required'),
    })),
    defaultValues: {
      name: '',
      description: '',
      price: '0',
      estimatedDays: '',
      instructions: '',
      isActive: true,
      sortOrder: 0,
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: InsertDeliveryMethod) => {
      return await apiRequest('/api/delivery-methods', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-methods'] })
      setIsDialogOpen(false)
      form.reset()
      toast({
        title: "Delivery Method Created",
        description: "The delivery method has been successfully created.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create delivery method",
        variant: "destructive",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertDeliveryMethod> }) => {
      return await apiRequest(`/api/delivery-methods/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-methods'] })
      setEditingMethod(null)
      setIsDialogOpen(false)
      form.reset()
      toast({
        title: "Delivery Method Updated",
        description: "The delivery method has been successfully updated.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery method",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/delivery-methods/${id}`, {
        method: 'DELETE'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-methods'] })
      toast({
        title: "Delivery Method Deleted",
        description: "The delivery method has been successfully deleted.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete delivery method",
        variant: "destructive",
      })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      return await apiRequest(`/api/delivery-methods/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-methods'] })
      toast({
        title: "Status Updated",
        description: "Delivery method status has been updated.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: InsertDeliveryMethod) => {
    if (editingMethod) {
      updateMutation.mutate({ id: editingMethod.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (method: DeliveryMethod) => {
    setEditingMethod(method)
    form.reset({
      name: method.name,
      description: method.description || '',
      price: method.price,
      estimatedDays: method.estimatedDays || '',
      instructions: method.instructions || '',
      isActive: method.isActive,
      sortOrder: method.sortOrder,
    })
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingMethod(null)
    form.reset({
      name: '',
      description: '',
      price: '0',
      estimatedDays: '',
      instructions: '',
      isActive: true,
      sortOrder: 0,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this delivery method?')) {
      deleteMutation.mutate(id)
    }
  }

  const activeMethodsCount = deliveryMethods.filter(method => method.isActive).length
  const totalMethods = deliveryMethods.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Delivery Methods</h1>
          <p className="text-gray-600 mt-2">
            Manage delivery options for your customers
          </p>
        </div>
        <div className="flex justify-start md:justify-end">
          <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-lg px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 hover:shadow-xl" data-testid="button-add-delivery-method">
            <Plus className="w-5 h-5 mr-2" />
            Add Delivery Method
          </Button>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? 'Edit Delivery Method' : 'Add New Delivery Method'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Express Delivery" 
                            {...field} 
                            data-testid="input-delivery-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                            data-testid="input-delivery-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimatedDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Delivery Time</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="3-5 business days" 
                            {...field} 
                            value={field.value || ''}
                            data-testid="input-delivery-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-delivery-sort"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Fast and reliable delivery service..."
                          rows={3}
                          {...field} 
                          value={field.value || ''}
                          data-testid="textarea-delivery-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide a contact number for delivery..."
                          rows={3}
                          {...field} 
                          value={field.value || ''}
                          data-testid="textarea-delivery-instructions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <div className="text-sm text-gray-600">
                          Enable this delivery method for customers
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-delivery-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-delivery"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-save-delivery"
                  >
                    {createMutation.isPending || updateMutation.isPending 
                      ? 'Saving...' 
                      : editingMethod ? 'Update Method' : 'Create Method'
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Methods</CardTitle>
            <Package className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-methods">{totalMethods}</div>
            <p className="text-xs text-gray-600">All delivery methods</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Methods</CardTitle>
            <Truck className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-methods">{activeMethodsCount}</div>
            <p className="text-xs text-gray-600">Available to customers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Methods</CardTitle>
            <Clock className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-inactive-methods">{totalMethods - activeMethodsCount}</div>
            <p className="text-xs text-gray-600">Currently disabled</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Methods</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : deliveryMethods.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery methods</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first delivery method.</p>
              <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-lg px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 hover:shadow-xl" data-testid="button-add-first-delivery">
                <Plus className="w-5 h-5 mr-3" />
                Add Your First Delivery Method
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveryMethods
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((method) => (
                <div 
                  key={method.id} 
                  className={`border rounded-lg p-4 ${method.isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/30'}`}
                  data-testid={`card-delivery-${method.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold" data-testid={`text-delivery-name-${method.id}`}>
                          {method.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-600" />
                          <span className="font-medium" data-testid={`text-delivery-price-${method.id}`}>
                            ${parseFloat(method.price).toFixed(2)}
                          </span>
                        </div>
                        {method.estimatedDays && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-600" data-testid={`text-delivery-time-${method.id}`}>
                              {method.estimatedDays}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {method.description && (
                        <p className="text-gray-600 mb-2" data-testid={`text-delivery-description-${method.id}`}>
                          {method.description}
                        </p>
                      )}
                      
                      {method.instructions && (
                        <p className="text-sm text-gray-500" data-testid={`text-delivery-instructions-${method.id}`}>
                          <strong>Instructions:</strong> {method.instructions}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={method.isActive}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ id: method.id, isActive: checked })
                        }
                        disabled={toggleActiveMutation.isPending}
                        data-testid={`switch-delivery-active-${method.id}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(method)}
                        data-testid={`button-edit-delivery-${method.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-delivery-${method.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}