import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, Globe, Users, Check, X } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import type { Language } from '@shared/schema'

export default function Languages() {
  const [isAddingLanguage, setIsAddingLanguage] = useState(false)
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nativeName: '',
    isActive: true
  })
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: languages = [], isLoading } = useQuery<Language[]>({
    queryKey: ['/api/languages'],
    refetchInterval: 30000,
    queryFn: async () => {
      console.log('Languages page: Fetching languages...');
      const response = await fetch('/api/languages');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Languages page: Got', data.length, 'languages');
      return data;
    }
  })

  // Get statistics about language usage
  const { data: stats } = useQuery({
    queryKey: ['/api/languages/stats'],
    queryFn: async () => {
      const response = await fetch('/api/languages/stats');
      if (!response.ok) return { totalUsers: 0, usersByLanguage: {} };
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  })

  const createLanguageMutation = useMutation({
    mutationFn: async (languageData: any) => {
      return await apiRequest('/api/languages', {
        method: 'POST',
        body: JSON.stringify(languageData)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/languages'] })
      resetForm()
      toast({
        title: "Success",
        description: "Language created successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create language",
        variant: "destructive",
      })
    }
  })

  const updateLanguageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return await apiRequest(`/api/languages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/languages'] })
      resetForm()
      toast({
        title: "Success",
        description: "Language updated successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update language",
        variant: "destructive",
      })
    }
  })

  const deleteLanguageMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/languages/${id}`, {
        method: 'DELETE'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/languages'] })
      toast({
        title: "Success",
        description: "Language deleted successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete language",
        variant: "destructive",
      })
    }
  })

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      nativeName: '',
      isActive: true
    })
    setIsAddingLanguage(false)
    setEditingLanguage(null)
  }

  const handleEdit = (language: Language) => {
    setEditingLanguage(language)
    setFormData({
      code: language.code,
      name: language.name,
      nativeName: language.nativeName,
      isActive: language.isActive
    })
    setIsAddingLanguage(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingLanguage) {
      updateLanguageMutation.mutate({
        id: editingLanguage.code,
        data: formData
      })
    } else {
      createLanguageMutation.mutate(formData)
    }
  }

  const handleDelete = (language: Language) => {
    if (confirm(`Are you sure you want to delete the language "${language.name}"?`)) {
      deleteLanguageMutation.mutate(language.code)
    }
  }

  const getUserCount = (languageCode: string) => {
    return stats?.usersByLanguage?.[languageCode] || 0
  }

  if (isLoading) {
    return <div className="p-6">Loading languages...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Language Management</h1>
          <p className="text-gray-600 mt-2">Configure supported languages for your Telegram bot</p>
        </div>
        <Button 
          onClick={() => setIsAddingLanguage(true)}
          className="bg-telegram hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Language
        </Button>
      </div>

      {/* Language Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Languages</p>
                <p className="text-2xl font-bold text-blue-600">{languages.length}</p>
              </div>
              <Globe className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Languages</p>
                <p className="text-2xl font-bold text-green-600">
                  {languages.filter(lang => lang.isActive).length}
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
      </div>

      {/* Add/Edit Language Form */}
      {isAddingLanguage && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingLanguage ? 'Edit Language' : 'Add New Language'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Language Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                    placeholder="en, es, fr, etc."
                    maxLength={5}
                    required
                    disabled={!!editingLanguage} // Don't allow changing code for existing languages
                  />
                </div>
                <div>
                  <Label htmlFor="name">English Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="English, Spanish, French, etc."
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="nativeName">Native Name</Label>
                <Input
                  id="nativeName"
                  value={formData.nativeName}
                  onChange={(e) => setFormData({ ...formData, nativeName: e.target.value })}
                  placeholder="English, Español, Français, etc."
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active (visible to users)</Label>
              </div>

              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={createLanguageMutation.isPending || updateLanguageMutation.isPending}
                >
                  {editingLanguage ? 'Update' : 'Create'} Language
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Languages List */}
      <Card>
        <CardHeader>
          <CardTitle>Languages ({languages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {languages.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No languages</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a language.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {languages.map((language) => (
                <div key={language.code} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600 uppercase">
                        {language.code}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        {language.name}
                        {language.isActive ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{language.nativeName}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getUserCount(language.code)} users using this language
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(language)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(language)}
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
            <Globe className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-medium text-blue-900">Language Management Guide</h3>
              <div className="text-sm text-blue-700 mt-2 space-y-1">
                <p>• Use standard ISO 639-1 language codes (en, es, fr, de, etc.)</p>
                <p>• Native names help users identify their language easily</p>
                <p>• Only active languages are shown to users in settings</p>
                <p>• User statistics update in real-time as users interact with the bot</p>
                <p>• Deleting a language will not affect existing user preferences</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}