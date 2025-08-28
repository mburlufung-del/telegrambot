import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Headphones, Plus, Users } from 'lucide-react'

export default function OperatorSupport() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operator Support</h1>
          <p className="text-gray-600">Manage support team and customer service settings</p>
        </div>
        <Button data-testid="button-add-operator">
          <Plus className="w-4 h-4 mr-2" />
          Add Operator
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              Support Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Configure automatic responses and support hours</p>
            <Button variant="outline">Configure</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Support Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Manage operators and support staff</p>
            <Button variant="outline">Manage Team</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}