import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Headphones, Plus, Users, Edit, Trash2, UserCheck, UserX, Settings } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import type { Operator } from '@shared/schema'

export default function OperatorSupport() {
  const [isAddingOperator, setIsAddingOperator] = useState(false)
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    telegramUsername: '',
    email: '',
    role: '',
    active: true
  })
  const [settingsData, setSettingsData] = useState({
    autoAssign: true,
    supportHours: true,
    maxSessions: 5,
    responseTime: 5
  })
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: operators = [], isLoading, error } = useQuery<Operator[]>({
    queryKey: ['/api/operators'],
    queryFn: async () => {
      const response = await fetch('/api/operators');
      if (!response.ok) {
        throw new Error(`Failed to fetch operators: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
  })

  const { data: activeSessions = [] } = useQuery({
    queryKey: ['/api/operator-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/operator-sessions');
      if (!response.ok) return [];
      return response.json();
    },
    refetchInterval: 10000,
  })

  const { data: supportSettings } = useQuery({
    queryKey: ['/api/support/settings'],
    queryFn: async () => {
      const response = await fetch('/api/support/settings');
      if (!response.ok) throw new Error('Failed to fetch support settings');
      const data = await response.json();
      setSettingsData(data);
      return data;
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return await apiRequest('/api/support/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/settings'] })
      toast({
        title: "Success",
        description: "Support settings updated successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update support settings",
        variant: "destructive",
      })
    }
  })

  const createOperatorMutation = useMutation({
    mutationFn: async (operatorData: any) => {
      return await apiRequest('/api/operators', {
        method: 'POST',
        body: JSON.stringify(operatorData)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operators'] })
      resetForm()
      toast({
        title: "Success",
        description: "Operator created successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create operator",
        variant: "destructive",
      })
    }
  })

  const updateOperatorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return await apiRequest(`/api/operators/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operators'] })
      resetForm()
      toast({
        title: "Success",
        description: "Operator updated successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update operator",
        variant: "destructive",
      })
    }
  })

  const toggleOperatorMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/operators/${id}/toggle`, {
        method: 'PUT'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operators'] })
      toast({
        title: "Success",
        description: "Operator status updated",
      })
    },
  })

  const deleteOperatorMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/operators/${id}`, {
        method: 'DELETE'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operators'] })
      toast({
        title: "Success",
        description: "Operator deleted successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete operator",
        variant: "destructive",
      })
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      telegramUsername: '',
      email: '',
      role: '',
      active: true
    })
    setIsAddingOperator(false)
    setEditingOperator(null)
  }

  const handleEdit = (operator: Operator) => {
    setEditingOperator(operator)
    setFormData({
      name: operator.name,
      telegramUsername: operator.telegramUsername,
      email: operator.email || '',
      role: operator.role || '',
      active: operator.active
    })
    setIsAddingOperator(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clean up form data - convert empty strings to undefined
    const cleanedData = {
      ...formData,
      email: formData.email?.trim() || undefined,
      role: formData.role?.trim() || undefined,
      telegramUsername: formData.telegramUsername.trim(),
    }
    
    if (editingOperator) {
      updateOperatorMutation.mutate({
        id: editingOperator.id,
        data: cleanedData
      })
    } else {
      createOperatorMutation.mutate(cleanedData)
    }
  }

  const handleDelete = (operator: Operator) => {
    if (confirm(`Are you sure you want to delete operator "${operator.name}"?`)) {
      deleteOperatorMutation.mutate(operator.id)
    }
  }

  const handleToggleActive = (operator: Operator) => {
    toggleOperatorMutation.mutate(operator.id)
  }

  const activeOperators = operators.filter(op => op.active)
  const waitingSessions = activeSessions.filter((s: any) => s.status === 'waiting').length

  if (isLoading) {
    return <div className="p-6">Loading operators...</div>
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load operators. Please refresh the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Operator Support</h1>
          <p className="text-gray-600 mt-2">Manage support team and customer service</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            data-testid="button-support-settings"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button 
            onClick={() => setIsAddingOperator(true)}
            className="bg-telegram hover:bg-blue-700"
            data-testid="button-add-operator"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Operator
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Operators</p>
                <p className="text-2xl font-bold text-blue-600">{operators.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Operators</p>
                <p className="text-2xl font-bold text-green-600">{activeOperators.length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Waiting Sessions</p>
                <p className="text-2xl font-bold text-orange-600">{waitingSessions}</p>
              </div>
              <Headphones className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {activeSessions.filter((s: any) => s.status === 'active').length}
                </p>
              </div>
              <Headphones className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Support Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Auto-assign sessions</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="auto-assign" 
                    checked={settingsData.autoAssign}
                    onCheckedChange={(checked) => setSettingsData({ ...settingsData, autoAssign: checked })}
                  />
                  <Label htmlFor="auto-assign" className="text-sm text-gray-600">
                    Automatically assign new sessions to available operators
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Support hours notification</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="support-hours" 
                    checked={settingsData.supportHours}
                    onCheckedChange={(checked) => setSettingsData({ ...settingsData, supportHours: checked })}
                  />
                  <Label htmlFor="support-hours" className="text-sm text-gray-600">
                    Notify users when support is offline
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-sessions">Max sessions per operator</Label>
                <Input
                  id="max-sessions"
                  type="number"
                  value={settingsData.maxSessions}
                  onChange={(e) => setSettingsData({ ...settingsData, maxSessions: parseInt(e.target.value) || 5 })}
                  min="1"
                  max="20"
                  data-testid="input-max-sessions"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="response-time">Target response time (minutes)</Label>
                <Input
                  id="response-time"
                  type="number"
                  value={settingsData.responseTime}
                  onChange={(e) => setSettingsData({ ...settingsData, responseTime: parseInt(e.target.value) || 5 })}
                  min="1"
                  max="60"
                  data-testid="input-response-time"
                />
              </div>
            </div>

            <Button 
              className="mt-4" 
              onClick={() => updateSettingsMutation.mutate(settingsData)}
              disabled={updateSettingsMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Operator Form */}
      {isAddingOperator && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingOperator ? 'Edit Operator' : 'Add New Operator'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    data-testid="input-operator-name"
                  />
                </div>
                <div>
                  <Label htmlFor="telegramUsername">Telegram Username</Label>
                  <Input
                    id="telegramUsername"
                    value={formData.telegramUsername}
                    onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value })}
                    placeholder="@johndoe"
                    required
                    data-testid="input-operator-telegram"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    data-testid="input-operator-email"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role (optional)</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Support Agent, Team Lead, etc."
                    data-testid="input-operator-role"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  data-testid="switch-operator-active"
                />
                <Label htmlFor="active">Active (can receive support sessions)</Label>
              </div>

              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={createOperatorMutation.isPending || updateOperatorMutation.isPending}
                  data-testid="button-submit-operator"
                >
                  {editingOperator ? 'Update' : 'Create'} Operator
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  data-testid="button-cancel-operator"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Operators List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Team ({operators.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {operators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No operators</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding an operator.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {operators.map((operator) => (
                <div 
                  key={operator.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`operator-item-${operator.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      operator.active ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {operator.active ? (
                        <UserCheck className="w-6 h-6 text-green-600" />
                      ) : (
                        <UserX className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{operator.name}</h3>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>{operator.telegramUsername}</p>
                        {operator.email && <p>{operator.email}</p>}
                        {operator.role && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {operator.role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Status: {operator.active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(operator)}
                      data-testid={`button-toggle-${operator.id}`}
                    >
                      {operator.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(operator)}
                      data-testid={`button-edit-${operator.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(operator)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-delete-${operator.id}`}
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
            <Headphones className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-medium text-blue-900">Operator Support Guide</h3>
              <div className="text-sm text-blue-700 mt-2 space-y-1">
                <p>• Operators must have Telegram usernames to receive support messages</p>
                <p>• Only active operators can be assigned to customer support sessions</p>
                <p>• Configure auto-assignment to distribute sessions automatically</p>
                <p>• Set maximum sessions per operator to prevent overload</p>
                <p>• Monitor waiting sessions and response times from the dashboard</p>
                <p>• Operators can be temporarily deactivated without losing their data</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
