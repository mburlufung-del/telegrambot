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
    <div className="p-4 border rounded-lg bg-green-50">
      <h3 className="font-bold text-green-800 mb-3">Categories Found: {categories.length}</h3>
      
      {categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {categories.map((category: any) => (
            <div 
              key={category.id} 
              className="p-2 bg-white border rounded shadow-sm"
            >
              <div className="font-semibold text-sm">{category.name}</div>
              <div className="text-xs text-gray-500">
                {category.isActive ? '✓ Active' : '○ Inactive'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No categories found</p>
      )}
    </div>
  );
}