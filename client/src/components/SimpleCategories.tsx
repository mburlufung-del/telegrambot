import * as React from 'react';

export function SimpleCategories() {
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('SimpleCategories: Fetching from /api/categories...');
        const response = await fetch('/api/categories');
        console.log('SimpleCategories: Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('SimpleCategories: Success! Got', data.length, 'categories');
        console.log('SimpleCategories: Categories:', data.map((c: any) => c.name));
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error('SimpleCategories: Error:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    
    // Refresh every 3 seconds
    const interval = setInterval(fetchCategories, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50">
        <p className="font-semibold text-yellow-800">Loading Categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50">
        <p className="font-semibold text-red-800">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
      <h3 className="font-bold text-indigo-900 mb-4 text-lg">Product Categories ({categories.length})</h3>
      
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {categories.map((category: any) => (
            <div 
              key={category.id} 
              className="p-4 bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <div className="font-semibold text-gray-900 mb-2">{category.name}</div>
              <div className="flex items-center justify-between">
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                  category.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {category.isActive ? '✓ Active' : '○ Inactive'}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(category.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-center py-8">No categories found</p>
      )}
    </div>
  );
}