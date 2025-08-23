import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
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
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    staleTime: 0, // Always fetch fresh data to show newly added categories
    refetchOnWindowFocus: true,
  })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  })

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: { name: string; description?: string }) => {
      console.log("Sending category data:", categoryData);
      const payload = {
        name: categoryData.name,
        description: categoryData.description || null
      };
      console.log("Final payload:", payload);
      return await apiRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    },
    onSuccess: (data) => {
      console.log('Category created successfully:', data);
      
      // Clear specific query cache immediately
      queryClient.removeQueries({ queryKey: ['/api/categories'] });
      queryClient.removeQueries({ queryKey: ['/api/products'] });
      
      // Force immediate refetch
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      }, 100);
      
      setIsAddDialogOpen(false)
      setNewCategoryName('')
      setNewCategoryDescription('')
      
      const createdName = data?.name || 'Category';
      const wasRenamed = createdName !== newCategoryName && newCategoryName.trim() !== '';
      
      toast({
        title: "Success",
        description: wasRenamed 
          ? `Category created as "${createdName}" (name was adjusted to avoid duplicates)`
          : "Category created successfully and synced with products",
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

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCategoryName.trim()) {
      createCategoryMutation.mutate({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined
      })
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading categories...</div>
  }

  return (
    <div className="space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
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
          <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Create New Category</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                Add a new category to organize your products. Categories help customers find items easily.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-gray-900 dark:text-gray-100">
              <div>
                <Label htmlFor="category-name" className="text-gray-700 dark:text-gray-200">Category Name *</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name..."
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category-description" className="text-gray-700 dark:text-gray-200">Description</Label>
                <Textarea
                  id="category-description"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Enter category description..."
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setNewCategoryName('')
                    setNewCategoryDescription('')
                  }}
                  disabled={createCategoryMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                >
                  {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                </Button>
              </div>
            </form>
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
    </div>
  )
}