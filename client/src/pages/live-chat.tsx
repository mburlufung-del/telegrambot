import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Send,
  Sparkles,
  CheckCircle,
  Clock,
  User,
  Bot,
  AlertCircle,
  CheckCheck,
} from "lucide-react";
import type { OperatorSession, SupportMessage, AiChatSuggestion } from "@shared/schema";

export default function LiveChat() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<AiChatSuggestion | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery<OperatorSession[]>({
    queryKey: ["/api/chat/sessions"],
    refetchInterval: 5000,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<SupportMessage[]>({
    queryKey: ["/api/chat/sessions", selectedSession, "messages"],
    enabled: !!selectedSession,
    refetchInterval: 2000,
  });

  const { data: currentSession } = useQuery<OperatorSession>({
    queryKey: ["/api/chat/sessions", selectedSession],
    enabled: !!selectedSession,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; senderType: string; senderName: string }) => {
      return apiRequest(`/api/chat/sessions/${selectedSession}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions", selectedSession, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      setMessage("");
      setAiSuggestion(null);
    },
  });

  const generateAiSuggestionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/chat/sessions/${selectedSession}/ai-suggest`, {
        method: "POST",
      });
    },
    onSuccess: (data: AiChatSuggestion) => {
      setAiSuggestion(data);
    },
  });

  const useAiSuggestionMutation = useMutation({
    mutationFn: async () => {
      if (!aiSuggestion) return;
      await apiRequest(`/api/chat/sessions/${selectedSession}/use-suggestion`, {
        method: "POST",
        body: JSON.stringify({ suggestionId: aiSuggestion.id }),
      });
      return aiSuggestion.suggestion;
    },
    onSuccess: (suggestion) => {
      if (suggestion) {
        sendMessageMutation.mutate({
          message: suggestion,
          senderType: "operator",
          senderName: "Admin",
        });
      }
    },
  });

  const assignOperatorMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest(`/api/chat/sessions/${sessionId}/assign`, {
        method: "PUT",
        body: JSON.stringify({ operatorName: "Admin" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
    },
  });

  const closeSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/chat/sessions/${selectedSession}/close`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      setSelectedSession(null);
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !selectedSession) return;

    sendMessageMutation.mutate({
      message: message.trim(),
      senderType: "operator",
      senderName: "Admin",
    });
  };

  const handleGenerateAiSuggestion = () => {
    if (!selectedSession) return;
    generateAiSuggestionMutation.mutate();
  };

  const handleUseAiSuggestion = () => {
    if (!aiSuggestion) return;
    useAiSuggestionMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-500";
      case "active":
        return "bg-green-500";
      case "resolved":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      default:
        return "secondary";
    }
  };

  if (isLoadingSessions) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading chat sessions...</p>
        </div>
      </div>
    );
  }

  const activeSessions = sessions.filter(s => s.status === "active" || s.status === "waiting");
  const resolvedSessions = sessions.filter(s => s.status === "resolved");

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Live Chat with AI Assistance</h1>
        <p className="text-muted-foreground">Manage customer conversations with intelligent AI suggestions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {activeSessions.length === 0 && resolvedSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No chat sessions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSessions.length > 0 && (
                    <>
                      <div className="text-sm font-medium text-muted-foreground">Active Sessions</div>
                      {activeSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => setSelectedSession(session.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedSession === session.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                          }`}
                          data-testid={`chat-session-${session.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{session.customerName}</span>
                                <span className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
                              </div>
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {session.lastMessage || session.initialMessage}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={getPriorityColor(session.priority)} className="text-xs">
                                  {session.priority}
                                </Badge>
                                {session.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {session.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {resolvedSessions.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="text-sm font-medium text-muted-foreground">Resolved Sessions</div>
                      {resolvedSessions.slice(0, 5).map((session) => (
                        <div
                          key={session.id}
                          onClick={() => setSelectedSession(session.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors opacity-60 ${
                            selectedSession === session.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                          }`}
                          data-testid={`chat-session-${session.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{session.customerName}</span>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {session.lastMessage || session.initialMessage}
                          </p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {currentSession ? (
                  <>
                    <User className="w-5 h-5" />
                    {currentSession.customerName}
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Select a Session
                  </>
                )}
              </CardTitle>
              {currentSession && (
                <div className="flex items-center gap-2">
                  {currentSession.status === "waiting" && (
                    <Button
                      size="sm"
                      onClick={() => assignOperatorMutation.mutate(currentSession.id)}
                      data-testid="button-assign-session"
                    >
                      Accept Chat
                    </Button>
                  )}
                  {currentSession.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => closeSessionMutation.mutate()}
                      data-testid="button-close-session"
                    >
                      <CheckCheck className="w-4 h-4 mr-1" />
                      Close Session
                    </Button>
                  )}
                  <Badge className={getStatusColor(currentSession.status)}>
                    {currentSession.status}
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedSession ? (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a chat session to start messaging</p>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[400px] mb-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4 p-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderType === "customer" ? "justify-start" : "justify-end"}`}
                          data-testid={`message-${msg.id}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.senderType === "customer"
                                ? "bg-muted"
                                : msg.senderType === "ai"
                                ? "bg-purple-100 dark:bg-purple-900/30"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {msg.senderType === "ai" && <Bot className="w-4 h-4" />}
                              <span className="text-xs font-medium">{msg.senderName}</span>
                              {msg.isAiSuggestion && <Sparkles className="w-3 h-3" />}
                            </div>
                            <p className="text-sm">{msg.message}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {aiSuggestion && (
                  <Card className="mb-4 bg-purple-50 dark:bg-purple-950/30 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-600 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">AI Suggestion</span>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(parseFloat(aiSuggestion.confidence || "0") * 100)}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm mb-3">{aiSuggestion.suggestion}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleUseAiSuggestion}
                              disabled={useAiSuggestionMutation.isPending}
                              data-testid="button-use-suggestion"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Use Suggestion
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAiSuggestion(null)}
                              data-testid="button-dismiss-suggestion"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {currentSession?.status !== "resolved" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        disabled={sendMessageMutation.isPending || currentSession?.status === "waiting"}
                        data-testid="input-message"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendMessageMutation.isPending || currentSession?.status === "waiting"}
                        data-testid="button-send-message"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateAiSuggestion}
                        disabled={generateAiSuggestionMutation.isPending || currentSession?.status === "waiting"}
                        data-testid="button-ai-suggest"
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        {generateAiSuggestionMutation.isPending ? "Generating..." : "Get AI Suggestion"}
                      </Button>
                      {currentSession?.status === "waiting" && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="w-4 h-4" />
                          Accept the chat to start messaging
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
