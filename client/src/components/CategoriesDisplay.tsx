import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Folder, Tag } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

interface Product {
  id: string;
  categoryId: string;
  isActive: boolean;
}

interface CategoriesDisplayProps {
  products: Product[];
}

export function CategoriesDisplay({ products }: CategoriesDisplayProps) {
  const { data: categories = [], isLoading, error, refetch } = useQuery<Category[]>({
    queryKey: ['categories-display'],
    queryFn: async () => {
      console.log('🔄 CategoriesDisplay: Fetching categories...');
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('✅ CategoriesDisplay: Got', data.length, 'categories');
      console.log('📝 Categories:', data.map((c: Category) => c.name).join(', '));
      return data;
    },
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  // Auto-refresh on mount and when products change
  React.useEffect(() => {
    refetch();
  }, [products.length, refetch]);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Tag className="w-8 h-8 mx-auto mb-2 animate-pulse" />
        <p className="text-sm">Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p className="text-sm">Error loading categories: {String(error)}</p>
        <Button onClick={() => refetch()} size="sm" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium">No categories found</p>
        <p className="text-xs text-gray-400 mt-1">Create your first category to start organizing products</p>
        <Button 
          onClick={() => window.location.href = '/categories'}
          size="sm" 
          className="mt-3 bg-blue-500 hover:bg-blue-600 text-white"
        >
          Create Category
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {categories.map((category) => {
          const categoryProducts = products.filter(p => p.categoryId === category.id);
          const activeInCategory = categoryProducts.filter(p => p.isActive).length;
          
          return (
            <div key={category.id} className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200 transition-all duration-200 shadow-sm hover:shadow-md">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-base text-gray-900 truncate">{category.name}</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  category.isActive 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  {category.isActive ? '✓ Active' : '○ Inactive'}
                </div>
              </div>
              
              {category.description ? (
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{category.description}</p>
              ) : (
                <p className="text-sm text-gray-500 mb-3 italic">No description</p>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">
                  📦 {categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''}
                </span>
                <span className="text-green-600 font-medium">
                  ✅ {activeInCategory} active
                </span>
              </div>
              
              {category.createdAt && (
                <div className="text-xs text-gray-400 mt-2">
                  Created: {new Date(category.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="text-center">
        <Button 
          onClick={() => window.location.href = '/categories'}
          variant="outline"
          size="sm"
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
        >
          + Add More Categories
        </Button>
      </div>

      {/* Debug panel */}
      <div className="mt-4 pt-4 border-t text-xs text-gray-500 bg-yellow-50 p-3 rounded">
        <p><strong>Categories Debug:</strong></p>
        <p>Categories loaded: {categories.length}</p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {error ? String(error) : 'None'}</p>
        <p>Categories: {categories.map(c => c.name).join(', ') || 'None'}</p>
        <Button 
          onClick={() => refetch()}
          size="sm" 
          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white"
        >
          Force Refresh Categories
        </Button>
      </div>
    </>
  );
}