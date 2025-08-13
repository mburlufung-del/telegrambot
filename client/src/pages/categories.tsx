import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FolderOpen,
  Eye,
  EyeOff
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CategoryForm from "@/components/category-form";
import type { Category } from "@shared/schema";

export default function Categories() {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category deleted",
        description: "The category has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleCategoryStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PUT", `/api/categories/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category updated",
        description: "The category status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update category status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleToggleStatus = (category: Category) => {
    toggleCategoryStatusMutation.mutate({
      id: category.id,
      isActive: !category.isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">{categories.length} total categories</p>
        </div>
        <Button
          onClick={() => setIsCategoryModalOpen(true)}
          className="bg-telegram hover:bg-blue-700"
          data-testid="button-add-category"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-categories"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow" data-testid={`card-category-${category.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(category)}
                      className="h-8 w-8"
                      data-testid={`button-toggle-category-${category.id}`}
                    >
                      {category.isActive ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditCategory(category)}
                      className="h-8 w-8"
                      data-testid={`button-edit-category-${category.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      data-testid={`button-delete-category-${category.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Created {new Date(category.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "No categories found" : "No categories yet"}
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {searchQuery 
                ? "Try adjusting your search criteria" 
                : "Get started by creating your first product category"
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-telegram hover:bg-blue-700"
                data-testid="button-add-first-category"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Category
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isCategoryModalOpen} onOpenChange={(open) => {
        setIsCategoryModalOpen(open);
        if (!open) {
          setEditingCategory(undefined);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm 
            category={editingCategory}
            onSuccess={() => {
              setIsCategoryModalOpen(false);
              setEditingCategory(undefined);
            }}
            onCancel={() => {
              setIsCategoryModalOpen(false);
              setEditingCategory(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}