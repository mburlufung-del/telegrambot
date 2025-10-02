import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Package, DollarSign, Hash, Upload, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import type { Product, Category } from '@shared/schema'
import { ObjectUploader } from '@/components/ObjectUploader'

export default function Products() {
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currencyCode: 'USD',
    stock: '',
    unit: 'piece',
    categoryId: '',
    minOrderQuantity: '1',
    imageUrl: '',
    isActive: true
  })
  const [pricingTiers, setPricingTiers] = useState<Array<{
    minQuantity: number;
    maxQuantity?: number;
    price: number;
  }>>([])
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Helper function to get currency symbol from currency code
  const getCurrencySymbol = (currencyCode: string) => {
    const currency = currencies.find((c: any) => c.code === currencyCode)
    return currency?.symbol || '$'
  }

  const { data: products = [], isLoading, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: 30000,
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    }
  })

  const { data: categories = [], refetch: refetchCategories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: 30000,
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    }
  })

  const { data: currencies = [] } = useQuery({
    queryKey: ['/api/currencies'],
    queryFn: async () => {
      const response = await fetch('/api/currencies');
      if (!response.ok) throw new Error('Failed to fetch currencies');
      return response.json();
    }
  })

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] })
      refetchProducts() // Force immediate refetch
      resetForm()
      toast({
        title: "Success",
        description: "Product created successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      })
    }
  })

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return await apiRequest(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] })
      resetForm()
      toast({
        title: "Success",
        description: "Product updated successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      })
    }
  })

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/products/${id}`, {
        method: 'DELETE'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] })
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  })

  // Image upload is now handled by ObjectUploader component

  // Add pricing tier
  const addPricingTier = () => {
    setPricingTiers([...pricingTiers, { minQuantity: 1, price: 0 }]);
  };

  // Remove pricing tier
  const removePricingTier = (index: number) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== index));
  };

  // Update pricing tier
  const updatePricingTier = (index: number, field: 'minQuantity' | 'maxQuantity' | 'price', value: number | undefined) => {
    const updated = [...pricingTiers];
    updated[index] = { ...updated[index], [field]: value };
    setPricingTiers(updated);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currencyCode: 'USD',
      stock: '',
      unit: 'piece',
      categoryId: '',
      minOrderQuantity: '1',
      imageUrl: '',
      isActive: true
    })
    setPricingTiers([])
    setUploadedImageUrl('')
    setIsAddingProduct(false)
    setEditingProduct(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      currencyCode: formData.currencyCode,
      stock: parseInt(formData.stock),
      unit: formData.unit,
      categoryId: formData.categoryId || null,
      minOrderQuantity: parseInt(formData.minOrderQuantity),
      imageUrl: uploadedImageUrl || formData.imageUrl || null,
      isActive: formData.isActive
    }

    try {
      let productId: string;
      
      if (editingProduct) {
        const updatedProduct = await apiRequest(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(productData),
        });
        productId = editingProduct.id;
        toast({ title: "Product updated successfully!" });
      } else {
        const newProduct = await apiRequest('/api/products', {
          method: 'POST',
          body: JSON.stringify(productData),
        });
        productId = newProduct.id;
        toast({ title: "Product created successfully!" });
      }
      
      // Save pricing tiers if any
      if (pricingTiers.length > 0) {
        for (const tier of pricingTiers) {
          await apiRequest(`/api/products/${productId}/pricing-tiers`, {
            method: 'POST',
            body: JSON.stringify(tier),
          });
        }
        toast({ title: "Pricing tiers saved successfully!" });
      }
      
      // Refresh products list
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      refetchProducts(); // Force immediate refetch
      resetForm();
      
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ 
        title: "Error", 
        description: "Failed to save product. Please try again.",
        variant: "destructive"
      });
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      currencyCode: product.currencyCode || 'USD',
      stock: product.stock.toString(),
      unit: (product as any).unit || 'piece',
      categoryId: product.categoryId || '',
      minOrderQuantity: product.minOrderQuantity?.toString() || '1',
      imageUrl: product.imageUrl || '',
      isActive: product.isActive
    })
    setIsAddingProduct(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id)
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading products...</div>
  }



  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Products</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Manage your product catalog. Changes sync instantly to Telegram bot.</p>
        </div>
        <Button 
          onClick={() => setIsAddingProduct(true)}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          data-testid="button-add-product"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {isAddingProduct && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({...formData, categoryId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        categoriesLoading 
                          ? "Loading categories..." 
                          : categories.length === 0 
                            ? "No categories available" 
                            : "Select a category"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name} {category.isActive ? '✓' : '○'}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-categories" disabled>
                          {categoriesLoading ? 'Loading...' : 'No categories found'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-blue-600 font-medium">
                      {categories.length} categories available
                    </p>
                    {categoriesLoading && (
                      <div className="text-xs text-orange-600 animate-pulse">Loading...</div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="price">Base Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                    placeholder="Enter base price"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default price when no bulk pricing tiers apply
                  </p>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currencyCode}
                    onValueChange={(value) => setFormData({...formData, currencyCode: value})}
                  >
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency: any) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name} ({currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Currency for pricing display
                  </p>
                </div>
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    required
                    placeholder="Available quantity"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit of Measurement</Label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="lb">Pound (lb)</option>
                    <option value="gram">Gram (g)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="bottle">Bottle</option>
                    <option value="bag">Bag</option>
                    <option value="dozen">Dozen</option>
                    <option value="meter">Meter (m)</option>
                    <option value="yard">Yard</option>
                    <option value="set">Set</option>
                    <option value="pair">Pair</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="minOrderQuantity">Min Order Quantity</Label>
                  <Input
                    id="minOrderQuantity"
                    type="number"
                    min="1"
                    value={formData.minOrderQuantity}
                    onChange={(e) => setFormData({...formData, minOrderQuantity: e.target.value})}
                    placeholder="Minimum quantity per order"
                  />
                </div>
                <div>
                  <Label>Product Image</Label>
                  <ObjectUploader
                    onComplete={(imageUrl) => {
                      setUploadedImageUrl(imageUrl);
                      setFormData({...formData, imageUrl});
                    }}
                    currentImageUrl={uploadedImageUrl || formData.imageUrl}
                  >
                    Upload Product Image
                  </ObjectUploader>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a product image for better presentation in Telegram bot
                  </p>
                </div>
                {/* Bulk Pricing Tiers Section - Prominently positioned */}
                <div className="col-span-2 space-y-4 p-5 border-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Label className="text-lg font-bold text-blue-900 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Bulk Pricing Tiers
                      </Label>
                      <p className="text-sm text-blue-700">Create quantity-based pricing for wholesale customers</p>
                      <p className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded inline-block">
                        Perfect for B2B sales and bulk orders
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      size="default"
                      onClick={addPricingTier}
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pricing Tier
                    </Button>
                  </div>
                  
                  {pricingTiers.length === 0 ? (
                    <div className="text-center py-8 text-blue-700">
                      <Package className="w-16 h-16 mx-auto mb-4 opacity-60" />
                      <p className="text-base font-medium mb-2">No pricing tiers configured</p>
                      <p className="text-sm mb-3">Add tiers to offer automatic bulk discounts to your customers</p>
                      <div className="bg-blue-100 p-3 rounded-lg text-xs">
                        <strong>Example:</strong> 1-10 units at $5.00 each, 11-50 units at $4.50 each, 51+ units at $4.00 each
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pricingTiers.map((tier, index) => (
                        <div key={index} className="flex items-center space-x-4 bg-white p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                          <div className="flex-1">
                            <Label className="text-sm font-semibold text-gray-700">Min Quantity</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={tier.minQuantity}
                              onChange={(e) => updatePricingTier(index, 'minQuantity', parseFloat(e.target.value) || 0.1)}
                              placeholder="1.0"
                              className="mt-2 border-blue-200 focus:border-blue-400"
                              data-testid={`input-tier-min-${index}`}
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-sm font-semibold text-gray-700">Max Quantity</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={tier.maxQuantity || ''}
                              onChange={(e) => updatePricingTier(index, 'maxQuantity', e.target.value ? parseFloat(e.target.value) : undefined)}
                              placeholder="Unlimited"
                              className="mt-2 border-blue-200 focus:border-blue-400"
                              data-testid={`input-tier-max-${index}`}
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-sm font-semibold text-gray-700">Price per Unit ({getCurrencySymbol(formData.currencyCode)})</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={tier.price}
                              onChange={(e) => updatePricingTier(index, 'price', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="mt-2 border-blue-200 focus:border-blue-400"
                            />
                          </div>
                          <div className="flex flex-col items-center space-y-2 pt-6">
                            <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              Tier {index + 1}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePricingTier(index)}
                              className="h-8 w-8 p-0 border-red-300 hover:bg-red-50 hover:border-red-400"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm text-blue-700 bg-blue-100 p-4 rounded-lg border border-blue-200">
                        <span className="flex items-center">
                          <Hash className="w-4 h-4 mr-2" />
                          Customers automatically get the best price for their order quantity
                        </span>
                        <span className="font-semibold">
                          {pricingTiers.length} active tier{pricingTiers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active (visible to customers)</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="Detailed product description for customers"
                />
              </div>
              
              {formData.imageUrl && (
                <div>
                  <Label>Image Preview</Label>
                  <div className="mt-2 border rounded-lg p-4 bg-gray-50">
                    <img 
                      src={formData.imageUrl} 
                      alt="Product preview" 
                      className="max-w-full max-h-48 object-contain rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden text-sm text-red-600 mt-2">
                      Failed to load image. Please check the URL.
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className={`${!product.isActive ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {product.categoryId && (
                    <p className="text-sm text-gray-500">{product.categoryId}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {product.description && (
                <p className="text-gray-600 text-sm mb-3">{product.description}</p>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                    <span className="font-semibold">{getCurrencySymbol(product.currencyCode || 'USD')}{product.price}</span>
                  </div>
                  <div className="flex items-center">
                    <Package className="w-4 h-4 text-blue-600 mr-1" />
                    <span className="text-sm">{product.stock} in stock</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Hash className="w-4 h-4 text-purple-600 mr-1" />
                    <span className="text-sm">Min: {product.minOrderQuantity || 1}</span>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-10">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first product to the catalog.</p>
            <Button 
              onClick={() => setIsAddingProduct(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Products summary */}
      {products.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                {products.length} Product{products.length !== 1 ? 's' : ''} in Catalog
              </h3>
              <p className="text-blue-700 text-sm mt-1">
                Active products: {products.filter(p => p.isActive).length} | 
                Total stock: {products.reduce((sum, p) => sum + p.stock, 0)} units
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      )}
    </div>
  )
}