import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, DollarSign, Package } from "lucide-react";

export interface PricingTierData {
  minQuantity: number;
  maxQuantity?: number;
  price: string;
}

interface InlinePricingTiersProps {
  tiers: PricingTierData[];
  onTiersChange: (tiers: PricingTierData[]) => void;
  basePrice?: string;
}

export default function InlinePricingTiers({ tiers, onTiersChange, basePrice }: InlinePricingTiersProps) {
  const [newTier, setNewTier] = useState({
    minQuantity: "",
    maxQuantity: "",
    price: "",
  });

  const { toast } = useToast();

  const handleAddTier = () => {
    if (!newTier.minQuantity || !newTier.price) {
      toast({ 
        title: "Error", 
        description: "Please fill in minimum quantity and price", 
        variant: "destructive" 
      });
      return;
    }

    const minQty = parseInt(newTier.minQuantity);
    const maxQty = newTier.maxQuantity ? parseInt(newTier.maxQuantity) : undefined;

    // Validate that minQuantity is positive
    if (minQty <= 0) {
      toast({ 
        title: "Error", 
        description: "Minimum quantity must be greater than 0", 
        variant: "destructive" 
      });
      return;
    }

    // Validate that maxQuantity is greater than minQuantity if provided
    if (maxQty && maxQty <= minQty) {
      toast({ 
        title: "Error", 
        description: "Maximum quantity must be greater than minimum quantity", 
        variant: "destructive" 
      });
      return;
    }

    // Check for overlapping ranges
    const hasOverlap = tiers.some(tier => {
      const tierMin = tier.minQuantity;
      const tierMax = tier.maxQuantity || Infinity;
      const newMin = minQty;
      const newMax = maxQty || Infinity;
      
      return (newMin >= tierMin && newMin <= tierMax) || 
             (newMax >= tierMin && newMax <= tierMax) ||
             (newMin <= tierMin && newMax >= tierMax);
    });

    if (hasOverlap) {
      toast({ 
        title: "Error", 
        description: "Quantity ranges cannot overlap with existing tiers", 
        variant: "destructive" 
      });
      return;
    }

    const newTierData: PricingTierData = {
      minQuantity: minQty,
      maxQuantity: maxQty,
      price: newTier.price,
    };

    const updatedTiers = [...tiers, newTierData].sort((a, b) => a.minQuantity - b.minQuantity);
    onTiersChange(updatedTiers);

    setNewTier({ minQuantity: "", maxQuantity: "", price: "" });
    
    toast({ 
      title: "Success", 
      description: "Pricing tier added successfully" 
    });
  };

  const handleRemoveTier = (index: number) => {
    const updatedTiers = tiers.filter((_, i) => i !== index);
    onTiersChange(updatedTiers);
    
    toast({ 
      title: "Success", 
      description: "Pricing tier removed successfully" 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Quantity-Based Pricing (Optional)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Set different prices for different quantities. Great for bulk discounts!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Base Price Display */}
        {basePrice && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Base Price: ${basePrice} per unit
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              This price applies when no pricing tiers match the order quantity
            </p>
          </div>
        )}

        {/* Existing Tiers */}
        {tiers.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pricing Tiers</h3>
            <div className="space-y-3">
              {tiers.map((tier, index) => (
                <div
                  key={index}
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
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTier(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Tier */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-medium">Add New Pricing Tier</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tier-min-quantity">Min Quantity *</Label>
              <Input
                id="tier-min-quantity"
                type="number"
                min="1"
                placeholder="e.g., 10"
                value={newTier.minQuantity}
                onChange={(e) => setNewTier({ ...newTier, minQuantity: e.target.value })}
                data-testid="input-tier-min-quantity"
              />
            </div>
            <div>
              <Label htmlFor="tier-max-quantity">Max Quantity</Label>
              <Input
                id="tier-max-quantity"
                type="number"
                placeholder="e.g., 50 (optional)"
                value={newTier.maxQuantity}
                onChange={(e) => setNewTier({ ...newTier, maxQuantity: e.target.value })}
                data-testid="input-tier-max-quantity"
              />
            </div>
            <div>
              <Label htmlFor="tier-price">Price per Unit *</Label>
              <Input
                id="tier-price"
                type="number"
                step="0.01"
                placeholder="e.g., 9.99"
                value={newTier.price}
                onChange={(e) => setNewTier({ ...newTier, price: e.target.value })}
                data-testid="input-tier-price"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Example: Min 10, Max 50, Price $9.99 = Orders of 10-50 units cost $9.99 each
            </div>
            <Button
              type="button"
              onClick={handleAddTier}
              className="flex items-center gap-2"
              data-testid="button-add-tier"
            >
              <Plus className="h-4 w-4" />
              Add Tier
            </Button>
          </div>
        </div>

        {tiers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pricing tiers configured</p>
            <p className="text-xs">Add pricing tiers above to offer bulk discounts</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}