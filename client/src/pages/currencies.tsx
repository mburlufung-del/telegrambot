import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, DollarSign, Users, Check, X, TrendingUp, RefreshCw } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import type { Currency } from '@shared/schema'

export default function Currencies() {
  const [isAddingCurrency, setIsAddingCurrency] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    decimalPlaces: 2,
    isActive: true
  })
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: currencies = [], isLoading } = useQuery<Currency[]>({
    queryKey: ['/api/currencies'],
    refetchInterval: 30000,
    queryFn: async () => {
      console.log('Currencies page: Fetching currencies...');
      const response = await fetch('/api/currencies');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Currencies page: Got', data.length, 'currencies');
      return data;
    }
  })

  // Get statistics about currency usage
  const { data: stats } = useQuery({
    queryKey: ['/api/currencies/stats'],
    queryFn: async () => {
      const response = await fetch('/api/currencies/stats');
      if (!response.ok) return { totalUsers: 0, usersByCurrency: {} };
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  })

  // Get exchange rates for informational purposes
  const { data: exchangeRates } = useQuery({
    queryKey: ['/api/currency/rates'],
    queryFn: async () => {
      const response = await fetch('/api/currency/rates');
      if (!response.ok) return {};
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })

  const createCurrencyMutation = useMutation({
    mutationFn: async (currencyData: any) => {
      return await apiRequest('/api/currencies', {
        method: 'POST',
        body: JSON.stringify(currencyData)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currencies'] })
      resetForm()
      toast({
        title: "Success",
        description: "Currency created successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create currency",
        variant: "destructive",
      })
    }
  })

  const updateCurrencyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return await apiRequest(`/api/currencies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currencies'] })
      resetForm()
      toast({
        title: "Success",
        description: "Currency updated successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update currency",
        variant: "destructive",
      })
    }
  })

  const deleteCurrencyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/currencies/${id}`, {
        method: 'DELETE'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currencies'] })
      toast({
        title: "Success",
        description: "Currency deleted successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete currency",
        variant: "destructive",
      })
    }
  })

  const updateExchangeRatesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/currency/rates/update', {
        method: 'POST'
      })
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency/rates'] })
      toast({
        title: "Success",
        description: `Exchange rates updated successfully. ${data.updatedCount} currencies synced.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update exchange rates",
        variant: "destructive",
      })
    }
  })

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      decimalPlaces: 2,
      isActive: true
    })
    setIsAddingCurrency(false)
    setEditingCurrency(null)
  }

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency)
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      decimalPlaces: currency.decimalPlaces,
      isActive: currency.isActive
    })
    setIsAddingCurrency(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCurrency) {
      updateCurrencyMutation.mutate({
        id: editingCurrency.code,
        data: formData
      })
    } else {
      createCurrencyMutation.mutate(formData)
    }
  }

  const handleDelete = (currency: Currency) => {
    if (confirm(`Are you sure you want to delete the currency "${currency.name}"?`)) {
      deleteCurrencyMutation.mutate(currency.code)
    }
  }

  const getUserCount = (currencyCode: string) => {
    return stats?.usersByCurrency?.[currencyCode] || 0
  }

  const getExchangeRate = (currencyCode: string) => {
    const rate = exchangeRates?.rates?.[currencyCode]
    return rate ? parseFloat(rate).toFixed(4) : 'N/A'
  }

  const refreshRates = () => {
    updateExchangeRatesMutation.mutate()
  }

  if (isLoading) {
    return <div className="p-6">Loading currencies...</div>
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Currency Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Configure supported currencies and exchange rates for your Telegram bot</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={refreshRates}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh Rates</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button 
            onClick={() => setIsAddingCurrency(true)}
            className="bg-telegram hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Currency
          </Button>
        </div>
      </div>

      {/* Currency Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Currencies</p>
                <p className="text-2xl font-bold text-blue-600">{currencies.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Currencies</p>
                <p className="text-2xl font-bold text-green-600">
                  {currencies.filter(curr => curr.isActive).length}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Exchange Rates</p>
                <p className="text-2xl font-bold text-orange-600">
                  {exchangeRates?.fallbackUsed ? 'Fallback' : 'Live'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Currency Form */}
      {isAddingCurrency && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCurrency ? 'Edit Currency' : 'Add New Currency'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="code">Currency Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="USD, EUR, GBP, etc."
                    maxLength={3}
                    required
                    disabled={!!editingCurrency} // Don't allow changing code for existing currencies
                  />
                </div>
                <div>
                  <Label htmlFor="name">Currency Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="US Dollar, Euro, British Pound, etc."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="$, €, £, etc."
                    maxLength={5}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="decimalPlaces">Decimal Places</Label>
                  <Input
                    id="decimalPlaces"
                    type="number"
                    value={formData.decimalPlaces}
                    onChange={(e) => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value) })}
                    min="0"
                    max="4"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of decimal places to show (0 for currencies like JPY, 2 for most others)
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active (visible to users)</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={createCurrencyMutation.isPending || updateCurrencyMutation.isPending}
                >
                  {editingCurrency ? 'Update' : 'Create'} Currency
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Currencies List */}
      <Card>
        <CardHeader>
          <CardTitle>Currencies ({currencies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {currencies.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No currencies</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a currency.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currencies.map((currency) => (
                <div key={currency.code} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {currency.symbol}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        {currency.name} ({currency.code})
                        {currency.isActive ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Decimal places: {currency.decimalPlaces}</span>
                        <span>Rate: 1 USD = {getExchangeRate(currency.code)} {currency.code}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {getUserCount(currency.code)} users using this currency
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(currency)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(currency)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <DollarSign className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-medium text-blue-900">Currency Management Guide</h3>
              <div className="text-sm text-blue-700 mt-2 space-y-1">
                <p>• Use standard ISO 4217 currency codes (USD, EUR, GBP, JPY, etc.)</p>
                <p>• Set decimal places correctly: 0 for JPY, 2 for most others, 3 for some crypto</p>
                <p>• Exchange rates are fetched automatically from external APIs</p>
                <p>• Only active currencies are shown to users in settings</p>
                <p>• Product prices are stored in USD and converted in real-time</p>
                <p>• Deleting a currency will not affect existing user preferences</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}