import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function SimpleBroadcastTest() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendTestBroadcast = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/bot/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          targetType: "all"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      toast({
        title: "Broadcast Complete",
        description: `Sent to ${result.sentCount} out of ${result.totalTargeted} users`,
      });
      
      if (result.sentCount > 0) {
        setMessage("");
      }
    } catch (error) {
      console.error("Broadcast error:", error);
      toast({
        title: "Broadcast Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-medium">Simple Broadcast Test</h3>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter broadcast message..."
        rows={3}
      />
      <Button 
        onClick={sendTestBroadcast}
        disabled={isLoading || !message.trim()}
      >
        {isLoading ? "Sending..." : "Send Test Broadcast"}
      </Button>
    </div>
  );
}