import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product, Category, InsertProduct } from "@shared/schema";
import { Plus, X, Save, Package } from "lucide-react";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string().min(1, "Price is required"),
  compareAtPrice: z.string().optional(),
  stock: z.number().min(0, "Stock must be non-negative"),
  minOrderQuantity: z.number().min(1, "Minimum order quantity must be at least 1"),
  maxOrderQuantity: z.number().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Measurement unit is required"),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [tags, setTags] = useState<string[]>(
    product?.tags ? JSON.parse(product.tags) : []
  );
  const [tagInput, setTagInput] = useState("");
  const [specifications, setSpecifications] = useState<Record<string, string>>(
    product?.specifications ? JSON.parse(product.specifications) : {}
  );
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || "",
      compareAtPrice: product?.compareAtPrice || "",
      stock: product?.stock || 0,
      minOrderQuantity: product?.minOrderQuantity || 1,
      maxOrderQuantity: product?.maxOrderQuantity || undefined,
      imageUrl: product?.imageUrl || "",
      categoryId: product?.categoryId || "",
      unit: "piece", // Default unit
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create product");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product created successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create product", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertProduct>) => {
      const response = await fetch(`/api/products/${product!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update product");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product updated successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    const productData: InsertProduct = {
      ...data,
      tags: JSON.stringify(tags),
      specifications: JSON.stringify({
        ...specifications,
        unit: data.unit,
      }),
    };

    if (product) {
      updateMutation.mutate(productData);
    } else {
      createMutation.mutate(productData);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setSpecifications({
        ...specifications,
        [newSpecKey.trim()]: newSpecValue.trim(),
      });
      setNewSpecKey("");
      setNewSpecValue("");
    }
  };

  const removeSpecification = (key: string) => {
    const newSpecs = { ...specifications };
    delete newSpecs[key];
    setSpecifications(newSpecs);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter product name"
                data-testid="input-product-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Detailed product description"
                rows={4}
                data-testid="input-product-description"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={form.watch("categoryId")}
                onValueChange={(value) => form.setValue("categoryId", value)}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                {...form.register("imageUrl")}
                placeholder="https://example.com/image.jpg"
                data-testid="input-image-url"
              />
              {form.formState.errors.imageUrl && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.imageUrl.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  {...form.register("price")}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  data-testid="input-price"
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="compareAtPrice">Compare Price</Label>
                <Input
                  id="compareAtPrice"
                  {...form.register("compareAtPrice")}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  data-testid="input-compare-price"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  {...form.register("stock", { valueAsNumber: true })}
                  placeholder="0"
                  type="number"
                  data-testid="input-stock"
                />
                {form.formState.errors.stock && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.stock.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="unit">Measurement Unit *</Label>
                <Select
                  value={form.watch("unit")}
                  onValueChange={(value) => form.setValue("unit", value)}
                >
                  <SelectTrigger data-testid="select-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="gram">Gram</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                    <SelectItem value="ml">Milliliter</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="bottle">Bottle</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="capsule">Capsule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minOrderQuantity">Min Order Quantity *</Label>
                <Input
                  id="minOrderQuantity"
                  {...form.register("minOrderQuantity", { valueAsNumber: true })}
                  placeholder="1"
                  type="number"
                  data-testid="input-min-quantity"
                />
              </div>

              <div>
                <Label htmlFor="maxOrderQuantity">Max Order Quantity</Label>
                <Input
                  id="maxOrderQuantity"
                  {...form.register("maxOrderQuantity", { valueAsNumber: true })}
                  placeholder="No limit"
                  type="number"
                  data-testid="input-max-quantity"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={form.watch("isActive")}
                    onCheckedChange={(checked) => form.setValue("isActive", checked)}
                    data-testid="switch-active"
                  />
                  <Label htmlFor="isActive">Product Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={form.watch("isFeatured")}
                    onCheckedChange={(checked) => form.setValue("isFeatured", checked)}
                    data-testid="switch-featured"
                  />
                  <Label htmlFor="isFeatured">Featured Product</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Product Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                data-testid="input-tag"
              />
              <Button type="button" onClick={addTag} data-testid="button-add-tag">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Product Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              {Object.entries(specifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span><strong>{key}:</strong> {value}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSpecification(key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                placeholder="Specification name"
                data-testid="input-spec-key"
              />
              <Input
                value={newSpecValue}
                onChange={(e) => setNewSpecValue(e.target.value)}
                placeholder="Specification value"
                data-testid="input-spec-value"
              />
              <Button type="button" onClick={addSpecification} data-testid="button-add-spec">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          data-testid="button-save"
        >
          <Save className="h-4 w-4 mr-2" />
          {product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}