import type { SupportMessage, OperatorSession } from "@shared/schema";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AiSuggestionResult {
  suggestion: string;
  context: string;
  confidence: number;
}

export class AiChatService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.openai.com/v1/chat/completions";

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  private buildConversationContext(
    messages: SupportMessage[],
    session: OperatorSession
  ): ChatMessage[] {
    const systemPrompt = `You are an AI assistant helping a customer support operator for an e-commerce Telegram bot.

Current session details:
- Customer: ${session.customerName}
- Category: ${session.category || "general"}
- Priority: ${session.priority}
- Status: ${session.status}

Your role:
1. Analyze the conversation and provide helpful response suggestions for the operator
2. Be professional, empathetic, and solution-oriented
3. Suggest specific actions when appropriate (check order status, provide product info, etc.)
4. Keep responses concise and customer-friendly
5. Consider the context of an e-commerce bot (products, orders, payments, delivery)

Provide a suggested response that the operator can use or modify.`;

    const conversationMessages: ChatMessage[] = messages
      .slice(-10)
      .map((msg) => ({
        role: msg.senderType === "customer" ? "user" : "assistant",
        content: `${msg.senderName}: ${msg.message}`,
      }));

    return [
      { role: "system", content: systemPrompt },
      ...conversationMessages,
    ];
  }

  async generateSuggestion(
    messages: SupportMessage[],
    session: OperatorSession
  ): Promise<AiSuggestionResult> {
    if (!this.apiKey) {
      return {
        suggestion: "AI assistance is not configured. Please add OPENAI_API_KEY to enable AI suggestions.",
        context: "No API key available",
        confidence: 0,
      };
    }

    try {
      const conversationContext = this.buildConversationContext(messages, session);

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: conversationContext,
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      const suggestion = data.choices[0]?.message?.content || "";

      const cleanSuggestion = suggestion.replace(/^(Operator:|Response:)\s*/i, "").trim();

      const confidence = this.calculateConfidence(data.choices[0]?.finish_reason, cleanSuggestion);

      return {
        suggestion: cleanSuggestion,
        context: JSON.stringify({
          messageCount: messages.length,
          category: session.category,
          priority: session.priority,
          model: "gpt-3.5-turbo",
        }),
        confidence,
      };
    } catch (error) {
      console.error("[AI Chat Service] Error generating suggestion:", error);
      return {
        suggestion: `I'm analyzing the conversation to help you respond effectively. (Error: ${error instanceof Error ? error.message : "Unknown error"})`,
        context: JSON.stringify({ error: String(error) }),
        confidence: 0,
      };
    }
  }

  private calculateConfidence(finishReason: string, suggestion: string): number {
    if (finishReason === "stop" && suggestion.length > 10) {
      return 0.85;
    }
    if (finishReason === "length") {
      return 0.65;
    }
    if (suggestion.length < 10) {
      return 0.3;
    }
    return 0.5;
  }

  async analyzeCustomerSentiment(message: string): Promise<{
    sentiment: "positive" | "neutral" | "negative" | "urgent";
    reasoning: string;
  }> {
    if (!this.apiKey) {
      return {
        sentiment: "neutral",
        reasoning: "AI sentiment analysis not configured",
      };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Analyze the customer's message sentiment and urgency. Respond with ONLY a JSON object in this exact format:
{"sentiment": "positive|neutral|negative|urgent", "reasoning": "brief explanation"}`,
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.3,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sentiment analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "{}";

      const parsed = JSON.parse(content);
      return {
        sentiment: parsed.sentiment || "neutral",
        reasoning: parsed.reasoning || "Unable to determine sentiment",
      };
    } catch (error) {
      console.error("[AI Chat Service] Sentiment analysis error:", error);
      return {
        sentiment: "neutral",
        reasoning: "Error analyzing sentiment",
      };
    }
  }
}

export const aiChatService = new AiChatService();
