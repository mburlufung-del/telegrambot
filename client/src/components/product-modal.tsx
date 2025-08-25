import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Image } from "lucide-react";
import { insertProductSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import ObjectUploader from "@/components/object-uploader";

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export default function ProductModal({ open, onOpenChange, product }: ProductModalProps) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0.00",
      stock: 0,
      imageUrl: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl || "",
        isActive: product.isActive,
      });
      setImagePreview(product.imageUrl || "");
    } else {
      form.reset({
        name: "",
        description: "",
        price: "0.00",
        stock: 0,
        imageUrl: "",
        isActive: true,
      });
      setImagePreview("");
    }
  }, [product, form]);

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("/api/products", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product created",
        description: "The product has been successfully created.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest(`/api/products/${product!.id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product updated",
        description: "The product has been successfully updated.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const productData = {
      ...data,
      price: parseFloat(data.price),
      imageUrl: imagePreview || undefined,
    };

    if (product) {
      updateProductMutation.mutate(productData);
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setImagePreview(url);
    form.setValue("imageUrl", url);
  };

  const isPending = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
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
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Product</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Show this product in the catalog
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Product Image
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Upload a high-quality image directly from your device
                  </p>
                  
                  {/* Direct Image Upload */}
                  <div className="space-y-3">
                    {!imagePreview ? (
                      <ObjectUploader
                        onUploadComplete={(url) => {
                          console.log('Upload completed, URL:', url);
                          handleImageUrlChange(url);
                        }}
                        buttonClassName="w-full h-40 border-2 border-dashed border-blue-300 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 transition-all"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 bg-blue-100 rounded-full">
                            <Upload className="h-8 w-8 text-blue-600" />
                          </div>
                          <div className="text-center">
                            <span className="text-lg font-medium text-blue-700">Upload Product Image</span>
                            <p className="text-sm text-blue-600 mt-1">Click here to select image from your device</p>
                            <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG, GIF up to 10MB</p>
                          </div>
                        </div>
                      </ObjectUploader>
                    ) : (
                      <div className="relative border-2 border-solid border-green-400 rounded-lg p-3 bg-green-50">
                        <img
                          src={imagePreview.startsWith('/objects/') ? `${window.location.origin}${imagePreview}` : imagePreview}
                          alt="Product preview"
                          className="w-full h-40 object-cover rounded-lg"
                          onError={() => {
                            console.error('Image failed to load:', imagePreview);
                            setImagePreview("");
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-4 right-4 h-8 w-8"
                          onClick={() => {
                            setImagePreview("");
                            form.setValue("imageUrl", "");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Image className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-medium text-green-700">Image uploaded and ready!</span>
                            </div>
                            <ObjectUploader
                              onUploadComplete={handleImageUrlChange}
                              buttonClassName="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700"
                            >
                              Change Image
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hidden form field for imageUrl */}
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <input type="hidden" {...field} />
                    )}
                  />
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter product description"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-telegram hover:bg-blue-700"
                disabled={isPending}
              >
                {isPending ? "Saving..." : product ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
