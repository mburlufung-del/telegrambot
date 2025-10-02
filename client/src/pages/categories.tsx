import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Tag, Package } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import type { Category, Product } from '@shared/schema'

export default function Categories() {
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    refetchInterval: 3000,
    queryFn: async () => {
      console.log('Categories page: Fetching categories...');
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Categories page: Got', data.length, 'categories');
      return data;
    }
  })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products']
  })

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      return await apiRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] })
      resetForm()
      toast({
        title: "Success",
        description: "Category created successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      })
    }
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return await apiRequest(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] })
      resetForm()
      toast({
        title: "Success",
        description: "Category updated successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      })
    }
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/categories/${id}`, {
        method: 'DELETE'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] })
      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true
    })
    setIsAddingCategory(false)
    setEditingCategory(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const categoryData = {
      name: formData.name,
      description: formData.description,
      isActive: formData.isActive
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryData })
    } else {
      createCategoryMutation.mutate(categoryData)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive
    })
    setIsAddingCategory(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id)
    }
  }

  const getCategoryProductCount = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Product Categories</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Manage and organize your product categories ({categories.length} total)</p>
        </div>
        <Button 
          onClick={() => setIsAddingCategory(true)}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          data-testid="button-add-category"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Category
        </Button>
      </div>

      {isAddingCategory && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-blue-900">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Enter category name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="isActive">Status</Label>
                  <select
                    id="isActive"
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === 'active'})}
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of this category"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((category) => {
          const productCount = getCategoryProductCount(category.id)
          return (
            <Card key={category.id} className="bg-gradient-to-br from-white to-blue-50 border-blue-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg text-gray-900">{category.name}</CardTitle>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                    category.isActive 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {category.isActive ? '✓ Active' : '○ Inactive'}
                  </span>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{category.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3 text-sm">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{productCount} product{productCount !== 1 ? 's' : ''}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(category)}
                    className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(category.id)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {categories.length === 0 && (
        <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border-blue-200">
          <CardContent className="text-center py-12">
            <Tag className="w-16 h-16 mx-auto mb-4 text-blue-300" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900">No categories yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first product category</p>
            <Button onClick={() => setIsAddingCategory(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}