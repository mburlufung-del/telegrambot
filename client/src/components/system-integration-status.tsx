import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Rocket } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface IntegrationTest {
  database: boolean;
  bot: boolean;
  storage: boolean;
  products: boolean;
  orders: boolean;
  categories: boolean;
  settings: boolean;
}

interface IntegrationTestResult {
  success: boolean;
  tests: IntegrationTest;
  passed: number;
  total: number;
  errors: string[] | null;
  ready_for_deployment: boolean;
  deployment_checklist: Record<string, boolean>;
  timestamp: string;
}

export default function SystemIntegrationStatus() {
  const { toast } = useToast();

  const { data: testResult, isLoading, error } = useQuery<IntegrationTestResult>({
    queryKey: ["/api/integration/test"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const restartBotMutation = useMutation({
    mutationFn: () => apiRequest("/api/bot/restart", { method: "POST" }),
    onSuccess: () => {
      toast({
        title: "Bot Restarted",
        description: "The Telegram bot has been restarted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integration/test"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
    },
    onError: () => {
      toast({
        title: "Restart Failed",
        description: "Failed to restart the bot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? "default" : "destructive"}>
        {status ? "Passed" : "Failed"}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Running integration tests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-600">Failed to run integration tests</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/integration/test"] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!testResult) {
    return null;
  }

  const testItems = [
    { key: 'database', label: 'Database Connection', status: testResult.tests.database },
    { key: 'bot', label: 'Telegram Bot', status: testResult.tests.bot },
    { key: 'storage', label: 'Data Storage', status: testResult.tests.storage },
    { key: 'products', label: 'Products System', status: testResult.tests.products },
    { key: 'orders', label: 'Orders System', status: testResult.tests.orders },
    { key: 'categories', label: 'Categories', status: testResult.tests.categories },
    { key: 'settings', label: 'Bot Settings', status: testResult.tests.settings },
  ];

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          {testResult.ready_for_deployment ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          )}
          <div>
            <h4 className="font-medium">
              {testResult.ready_for_deployment ? "System Ready" : "System Issues"}
            </h4>
            <p className="text-sm text-gray-600">
              {testResult.passed}/{testResult.total} components operational
            </p>
          </div>
        </div>
        <Badge 
          variant={testResult.ready_for_deployment ? "default" : "destructive"}
          className="text-sm"
        >
          {testResult.ready_for_deployment ? "Deploy Ready" : "Issues Found"}
        </Badge>
      </div>

      {/* Test Results */}
      <div className="space-y-2">
        {testItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              {getStatusIcon(item.status)}
              <span className="text-sm">{item.label}</span>
            </div>
            {getStatusBadge(item.status)}
          </div>
        ))}
      </div>

      {/* Error Messages */}
      {testResult.errors && testResult.errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <h5 className="font-medium text-red-800 mb-2">Issues Found:</h5>
            <ul className="text-sm text-red-700 space-y-1">
              {testResult.errors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex space-x-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/integration/test"] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Tests
        </Button>
        
        {!testResult.tests.bot && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => restartBotMutation.mutate()}
            disabled={restartBotMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${restartBotMutation.isPending ? 'animate-spin' : ''}`} />
            Restart Bot
          </Button>
        )}

        {testResult.ready_for_deployment && (
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <Rocket className="h-4 w-4 mr-2" />
            Ready to Deploy
          </Button>
        )}
      </div>

      {/* Last Updated */}
      <p className="text-xs text-gray-500 pt-2">
        Last checked: {new Date(testResult.timestamp).toLocaleString()}
      </p>
    </div>
  );
}