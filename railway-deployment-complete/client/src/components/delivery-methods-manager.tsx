import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, GripVertical, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DeliveryMethod } from "@shared/schema";

interface DeliveryMethodFormData {
  name: string;
  description: string;
  price: string;
  estimatedDays: string;
  instructions: string;
  isActive: boolean;
  sortOrder: number;
}

const initialFormData: DeliveryMethodFormData = {
  name: "",
  description: "",
  price: "0",
  estimatedDays: "",
  instructions: "",
  isActive: true,
  sortOrder: 0,
};

export function DeliveryMethodsManager() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<DeliveryMethodFormData>(initialFormData);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(null);
  const [deletingMethod, setDeletingMethod] = useState<DeliveryMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: deliveryMethods = [], isLoading } = useQuery<DeliveryMethod[]>({
    queryKey: ["/api/delivery-methods"],
  });

  const handleAddMethod = () => {
    setFormData({ ...initialFormData, sortOrder: deliveryMethods.length });
    setIsAddDialogOpen(true);
  };

  const handleEditMethod = (method: DeliveryMethod) => {
    setFormData({
      name: method.name,
      description: method.description || "",
      price: method.price,
      estimatedDays: method.estimatedDays || "",
      instructions: method.instructions || "",
      isActive: method.isActive,
      sortOrder: method.sortOrder,
    });
    setEditingMethod(method);
    setIsEditDialogOpen(true);
  };

  const handleDeleteMethod = (method: DeliveryMethod) => {
    setDeletingMethod(method);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Method name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingMethod) {
        await fetch(`/api/delivery-methods/${editingMethod.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
        toast({
          title: "Success",
          description: "Delivery method updated successfully",
        });
        setIsEditDialogOpen(false);
      } else {
        await fetch("/api/delivery-methods", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
        toast({
          title: "Success",
          description: "Delivery method added successfully",
        });
        setIsAddDialogOpen(false);
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/delivery-methods"] });
      setFormData(initialFormData);
      setEditingMethod(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save delivery method",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMethod) return;

    setIsSubmitting(true);
    try {
      await fetch(`/api/delivery-methods/${deletingMethod.id}`, {
        method: "DELETE",
      });

      toast({
        title: "Success",
        description: "Delivery method deleted successfully",
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/delivery-methods"] });
      setIsDeleteDialogOpen(false);
      setDeletingMethod(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete delivery method",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMethodStatus = async (method: DeliveryMethod) => {
    try {
      await fetch(`/api/delivery-methods/${method.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...method, isActive: !method.isActive }),
      });

      toast({
        title: "Success",
        description: `Delivery method ${!method.isActive ? "enabled" : "disabled"}`,
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/delivery-methods"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update delivery method status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Delivery Methods</h3>
        </div>
        <div className="text-center py-8">Loading delivery methods...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Delivery Methods</h3>
          <p className="text-sm text-muted-foreground">
            Manage shipping and delivery options for orders
          </p>
        </div>
        <Button onClick={handleAddMethod} data-testid="button-add-delivery-method">
          <Plus className="w-4 h-4 mr-2" />
          Add Method
        </Button>
      </div>

      <div className="grid gap-4">
        {deliveryMethods.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-medium mb-2">No delivery methods</h4>
              <p className="text-muted-foreground mb-4">
                Create your first delivery method to start managing shipping options
              </p>
              <Button onClick={handleAddMethod}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Method
              </Button>
            </CardContent>
          </Card>
        ) : (
          deliveryMethods.map((method: DeliveryMethod) => (
            <Card key={method.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    <div>
                      <CardTitle className="text-base">{method.name}</CardTitle>
                      {method.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {method.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={method.isActive ? "default" : "secondary"}>
                      {method.isActive ? "Active" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={method.isActive}
                      onCheckedChange={() => toggleMethodStatus(method)}
                      data-testid={`switch-delivery-method-${method.id}`}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Price
                    </Label>
                    <p className="text-sm font-medium">${method.price}</p>
                  </div>
                  {method.estimatedDays && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        Delivery Time
                      </Label>
                      <p className="text-sm">{method.estimatedDays}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Order
                    </Label>
                    <p className="text-sm">{method.sortOrder}</p>
                  </div>
                </div>

                {method.instructions && (
                  <div className="mb-4">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Instructions
                    </Label>
                    <p className="text-sm bg-muted p-2 rounded mt-1">
                      {method.instructions}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditMethod(method)}
                    data-testid={`button-edit-delivery-method-${method.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMethod(method)}
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-delivery-method-${method.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingMethod(null);
            setFormData(initialFormData);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Edit Delivery Method" : "Add Delivery Method"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Method Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Standard Shipping"
                data-testid="input-delivery-method-name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this delivery method"
                data-testid="input-delivery-method-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  data-testid="input-delivery-method-price"
                />
              </div>

              <div>
                <Label htmlFor="estimated-days">Delivery Time</Label>
                <Input
                  id="estimated-days"
                  value={formData.estimatedDays}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedDays: e.target.value })
                  }
                  placeholder="e.g., 3-5 days"
                  data-testid="input-delivery-method-days"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Special Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) =>
                  setFormData({ ...formData, instructions: e.target.value })
                }
                placeholder="Any special delivery instructions or requirements"
                data-testid="input-delivery-method-instructions"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
                data-testid="switch-delivery-method-active"
              />
              <Label htmlFor="is-active">Enable this delivery method</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingMethod(null);
                setFormData(initialFormData);
              }}
              data-testid="button-cancel-delivery-method"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              data-testid="button-save-delivery-method"
            >
              {isSubmitting ? "Saving..." : editingMethod ? "Update" : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingMethod?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-delivery-method">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-delivery-method"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}