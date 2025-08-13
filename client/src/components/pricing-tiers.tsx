import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { PricingTier } from "@shared/schema";
import { Plus, Trash2, DollarSign, Package } from "lucide-react";

interface PricingTiersProps {
  productId: string;
  productName?: string;
}

export default function PricingTiers({ productId, productName }: PricingTiersProps) {
  const [newTier, setNewTier] = useState({
    minQuantity: "",
    maxQuantity: "",
    price: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tiers = [], isLoading } = useQuery<PricingTier[]>({
    queryKey: ["/api/products", productId, "pricing-tiers"],
  });

  const createMutation = useMutation({
    mutationFn: async (tierData: any) => {
      const response = await fetch(`/api/products/${productId}/pricing-tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tierData),
      });
      if (!response.ok) throw new Error("Failed to create pricing tier");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "pricing-tiers"] });
      toast({ title: "Success", description: "Pricing tier created successfully" });
      setNewTier({ minQuantity: "", maxQuantity: "", price: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create pricing tier", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (tierId: string) => {
      const response = await fetch(`/api/pricing-tiers/${tierId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete pricing tier");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "pricing-tiers"] });
      toast({ title: "Success", description: "Pricing tier deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete pricing tier", variant: "destructive" });
    },
  });

  const handleCreateTier = () => {
    if (!newTier.minQuantity || !newTier.price) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const tierData = {
      minQuantity: parseInt(newTier.minQuantity),
      maxQuantity: newTier.maxQuantity ? parseInt(newTier.maxQuantity) : null,
      price: newTier.price,
      isActive: true,
    };

    createMutation.mutate(tierData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Quantity-Based Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading pricing tiers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Quantity-Based Pricing
        </CardTitle>
        {productName && (
          <p className="text-sm text-muted-foreground">Configure pricing tiers for {productName}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Tiers */}
        {tiers.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Pricing Tiers</h3>
            <div className="space-y-3">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {tier.minQuantity}{tier.maxQuantity ? ` - ${tier.maxQuantity}` : '+'} units
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${tier.price} per unit
                      </div>
                    </div>
                    <Badge variant={tier.isActive ? "default" : "secondary"}>
                      {tier.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(tier.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-tier-${tier.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Tier */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Add New Pricing Tier</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minQuantity">Minimum Quantity *</Label>
              <Input
                id="minQuantity"
                type="number"
                min="1"
                placeholder="e.g., 10"
                value={newTier.minQuantity}
                onChange={(e) => setNewTier({ ...newTier, minQuantity: e.target.value })}
                data-testid="input-min-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxQuantity">Maximum Quantity</Label>
              <Input
                id="maxQuantity"
                type="number"
                min="1"
                placeholder="e.g., 50 (or leave empty for unlimited)"
                value={newTier.maxQuantity}
                onChange={(e) => setNewTier({ ...newTier, maxQuantity: e.target.value })}
                data-testid="input-max-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price per Unit *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 8.50"
                value={newTier.price}
                onChange={(e) => setNewTier({ ...newTier, price: e.target.value })}
                data-testid="input-tier-price"
              />
            </div>
          </div>
          <Button
            onClick={handleCreateTier}
            disabled={createMutation.isPending || !newTier.minQuantity || !newTier.price}
            className="w-full md:w-auto"
            data-testid="button-add-tier"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Pricing Tier
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">How quantity-based pricing works:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create tiers with quantity ranges and corresponding prices</li>
            <li>When customers order within a tier's range, they get that tier's price</li>
            <li>Leave maximum quantity empty for unlimited quantities in that tier</li>
            <li>If no tiers match an order quantity, the base product price is used</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}