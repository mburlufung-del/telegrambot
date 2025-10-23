import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Tag, Package, FolderOpen, FolderTree } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import type { Category, Product } from '@shared/schema'

// Recursive component to render category tree at any depth
interface CategoryTreeProps {
  category: Category
  level: number
  categories: Category[]
  products: Product[]
  onEdit: (category: Category) => void
  onDelete: (id: string, name: string) => void
  getCategoryProductCount: (categoryId: string) => number
  getSubcategories: (parentId: string) => Category[]
}

function CategoryTree({
  category,
  level,
  categories,
  products,
  onEdit,
  onDelete,
  getCategoryProductCount,
  getSubcategories
}: CategoryTreeProps) {
  const subcategories = getSubcategories(category.id)
  const productCount = getCategoryProductCount(category.id)
  const marginLeft = level * 32 // 32px = 8 * 4 (ml-8)

  // Style variations based on depth level
  const isTopLevel = level === 0
  const cardClass = isTopLevel
    ? "bg-gradient-to-br from-white to-blue-50 border-blue-300 hover:shadow-lg"
    : "bg-white border-gray-200 hover:shadow-md"
  const iconSize = isTopLevel ? "w-5 h-5" : "w-4 h-4"
  const titleSize = isTopLevel ? "text-lg" : "text-base"
  const IconComponent = isTopLevel ? FolderTree : Tag

  return (
    <div className="space-y-3" style={{ marginLeft: level > 0 ? `${marginLeft}px` : 0 }}>
      <Card className={`${cardClass} transition-all duration-200`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {level > 0 && <div className="text-gray-400">↳</div>}
              <IconComponent className={`${iconSize} ${isTopLevel ? 'text-blue-700' : 'text-gray-600'}`} />
              <CardTitle className={`${titleSize} ${isTopLevel ? 'text-gray-900' : 'text-gray-800'}`}>
                {category.name}
              </CardTitle>
            </div>
            <span className={`px-${isTopLevel ? '3' : '2'} py-1 text-xs rounded-full font-medium ${
              category.isActive 
                ? `bg-green-100 text-green-700 ${isTopLevel ? 'border border-green-200' : ''}` 
                : `bg-gray-100 text-gray-600 ${isTopLevel ? 'border border-gray-200' : ''}`
            }`}>
              {category.isActive ? (isTopLevel ? '✓ Active' : '✓') : (isTopLevel ? '○ Inactive' : '○')}
            </span>
          </div>
          {category.description && (
            <p className={`text-${isTopLevel ? 'sm' : 'xs'} text-gray-${isTopLevel ? '600' : '500'} mt-2 line-clamp-2 ${level > 0 ? 'ml-6' : ''}`}>
              {category.description}
            </p>
          )}
          <div className={`flex items-center gap-4 mt-3 text-${isTopLevel ? 'sm' : 'xs'} ${level > 0 ? 'ml-6' : ''}`}>
            <div className="flex items-center gap-2">
              <Package className={`${isTopLevel ? 'w-4 h-4' : 'w-3 h-3'} text-gray-${isTopLevel ? '500' : '400'}`} />
              <span className={`text-gray-${isTopLevel ? '600' : '500'}`}>
                {productCount} product{productCount !== 1 ? 's' : ''}
              </span>
            </div>
            {subcategories.length > 0 && (
              <div className="flex items-center gap-2">
                <FolderOpen className={`${isTopLevel ? 'w-4 h-4' : 'w-3 h-3'} text-blue-500`} />
                <span className="text-blue-600">
                  {subcategories.length} subcategor{subcategories.length !== 1 ? 'ies' : 'y'}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(category)}
              className={`flex-1 ${isTopLevel ? 'border-blue-200 text-blue-600 hover:bg-blue-50' : 'text-xs'}`}
              data-testid={`button-edit-${category.id}`}
            >
              <Edit className={`${isTopLevel ? 'w-4 h-4' : 'w-3 h-3'} mr-1`} />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(category.id, category.name)}
              className={`flex-1 ${!isTopLevel ? 'text-xs' : ''}`}
              data-testid={`button-delete-${category.id}`}
            >
              <Trash2 className={`${isTopLevel ? 'w-4 h-4' : 'w-3 h-3'} mr-1`} />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recursively render subcategories */}
      {subcategories.length > 0 && (
        <div className="space-y-3">
          {subcategories.map((subCategory) => (
            <CategoryTree
              key={subCategory.id}
              category={subCategory}
              level={level + 1}
              categories={categories}
              products={products}
              onEdit={onEdit}
              onDelete={onDelete}
              getCategoryProductCount={getCategoryProductCount}
              getSubcategories={getSubcategories}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Categories() {
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: null as string | null,
    isActive: true
  })
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    refetchInterval: 3000,
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
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
      parentId: null,
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
      parentId: formData.parentId,
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
      parentId: category.parentId || null,
      isActive: category.isActive
    })
    setIsAddingCategory(true)
  }

  const handleDelete = (id: string, categoryName: string) => {
    // Check if this category has subcategories
    const hasSubcategories = categories.some(cat => cat.parentId === id)
    
    if (hasSubcategories) {
      toast({
        title: "Cannot delete category",
        description: "This category has subcategories. Delete them first or reassign them to another parent.",
        variant: "destructive",
      })
      return
    }

    if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      deleteCategoryMutation.mutate(id)
    }
  }

  const getCategoryProductCount = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length
  }

  const getSubcategories = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId)
  }

  const getParentCategories = () => {
    return categories.filter(cat => !cat.parentId)
  }

  // Recursively get all descendants of a category
  const getAllDescendants = (categoryId: string): string[] => {
    const directChildren = categories.filter(cat => cat.parentId === categoryId)
    const descendantIds: string[] = []
    
    for (const child of directChildren) {
      descendantIds.push(child.id)
      // Recursively get children's descendants
      descendantIds.push(...getAllDescendants(child.id))
    }
    
    return descendantIds
  }

  // Get parent options for the form (excluding current category and ALL descendants to prevent circular reference)
  const getParentOptions = () => {
    if (editingCategory) {
      // When editing, exclude the current category and ALL its descendants (not just immediate children)
      const allDescendantIds = getAllDescendants(editingCategory.id)
      return categories.filter(cat => 
        cat.id !== editingCategory.id && 
        !allDescendantIds.includes(cat.id)
      )
    }
    return categories
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

  const parentCategories = getParentCategories()

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Product Categories</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
            Manage categories and subcategories ({categories.length} total)
          </p>
        </div>
        <Button 
          onClick={() => setIsAddingCategory(true)}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          data-testid="button-add-category"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
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
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Enter category name"
                    className="mt-1"
                    data-testid="input-category-name"
                  />
                </div>
                <div>
                  <Label htmlFor="isActive">Status</Label>
                  <select
                    id="isActive"
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === 'active'})}
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                    data-testid="select-category-status"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="parentId">Parent Category</Label>
                <Select
                  value={formData.parentId || "none"}
                  onValueChange={(value) => setFormData({...formData, parentId: value === "none" ? null : value})}
                >
                  <SelectTrigger className="mt-1" data-testid="select-parent-category">
                    <SelectValue placeholder="No parent (top level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Parent (Top Level)</SelectItem>
                    {getParentOptions().map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.parentId ? `  ↳ ${cat.name}` : cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Select a parent to create a subcategory
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of this category"
                  className="mt-1"
                  data-testid="input-category-description"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-save-category"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {parentCategories.map((parentCategory) => (
          <CategoryTree
            key={parentCategory.id}
            category={parentCategory}
            level={0}
            categories={categories}
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
            getCategoryProductCount={getCategoryProductCount}
            getSubcategories={getSubcategories}
          />
        ))}
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
