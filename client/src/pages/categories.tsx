import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, Plus, Edit, Trash2, Package } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import type { Category } from '@shared/schema'

interface Product {
  id: string
  name: string
  categoryId: string | null
}

export default function Categories() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  })

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: { name: string; description?: string }) => {
      return await apiRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] })
      setIsAddDialogOpen(false)
      toast({
        title: "Success",
        description: "Category created successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      })
    }
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string }) => {
      return await apiRequest(`/api/categories/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: data.name, description: data.description })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] })
      setEditingCategory(null)
      toast({
        title: "Success",
        description: "Category updated successfully",
      })
    },
    onError: () => {
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
      queryClient.invalidateQueries({ queryKey: ['/api/products'] })
      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
    }
  })

  const getProductCountForCategory = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length
  }

  const CategoryForm = ({ 
    category, 
    onSubmit, 
    onCancel,
    isLoading 
  }: {
    category?: Category
    onSubmit: (data: { name: string; description?: string }) => void
    onCancel: () => void
    isLoading: boolean
  }) => {
    const [name, setName] = useState(category?.name || '')
    const [description, setDescription] = useState(category?.description || '')

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (name.trim()) {
        onSubmit({ name: name.trim(), description: description.trim() || undefined })
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="category-name">Category Name *</Label>
          <Input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name..."
            required
          />
        </div>
        <div>
          <Label htmlFor="category-description">Description</Label>
          <Textarea
            id="category-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter category description..."
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !name.trim()}>
            {isLoading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    )
  }

  if (isLoading) {
    return <div className="p-6">Loading categories...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-gray-600 mt-2">Organize your products into categories</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <CategoryForm
              onSubmit={(data) => createCategoryMutation.mutate(data)}
              onCancel={() => setIsAddDialogOpen(false)}
              isLoading={createCategoryMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
            <p className="text-gray-600 mb-4">Create your first category to start organizing products</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    {category.name}
                  </CardTitle>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.description && (
                  <p className="text-sm text-gray-600">{category.description}</p>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Package className="w-4 h-4" />
                  {getProductCountForCategory(category.id)} products
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCategory(category)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (getProductCountForCategory(category.id) > 0) {
                        toast({
                          title: "Cannot delete category",
                          description: "This category has products assigned to it. Please move or delete the products first.",
                          variant: "destructive",
                        })
                      } else if (confirm('Are you sure you want to delete this category?')) {
                        deleteCategoryMutation.mutate(category.id)
                      }
                    }}
                    disabled={deleteCategoryMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSubmit={(data) => 
                updateCategoryMutation.mutate({ 
                  id: editingCategory.id, 
                  ...data 
                })
              }
              onCancel={() => setEditingCategory(null)}
              isLoading={updateCategoryMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}