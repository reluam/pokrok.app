import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, CoachingTopicId } from "@repo/types";
import { getSystemPrompt } from "./prompts";

// Model konfigurace
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;

export function createAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

// Hlavní funkce pro koučovací odpověď (streaming)
export async function streamCoachResponse({
  apiKey,
  topicId,
  messages,
  onChunk,
  onComplete,
}: {
  apiKey: string;
  topicId: CoachingTopicId;
  messages: ChatMessage[];
  onChunk: (text: string) => void;
  onComplete: (fullText: string) => void;
}): Promise<void> {
  const client = createAnthropicClient(apiKey);
  const systemPrompt = getSystemPrompt({});

  // Převod na Anthropic formát
  const anthropicMessages = messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  let fullText = "";

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullText += event.delta.text;
      onChunk(event.delta.text);
    }
  }

  onComplete(fullText);
}

// Non-streaming verze (pro jednoduché použití)
export async function getCoachResponse({
  apiKey,
  topicId,
  messages,
}: {
  apiKey: string;
  topicId: CoachingTopicId;
  messages: ChatMessage[];
}): Promise<string> {
  const client = createAnthropicClient(apiKey);
  const systemPrompt = getSystemPrompt({});

  const anthropicMessages = messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  const block = response.content[0];
  if (!block || block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}
