import { type NextRequest } from "next/server";
import { getSystemPrompt } from "@repo/ai";
import type { ChatMessage, UserProfile, ToolId } from "@repo/types";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (rateLimitMap.size > 10_000) {
    for (const [k, v] of rateLimitMap) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("Chybí ANTHROPIC_API_KEY", { status: 500 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return new Response("Příliš mnoho požadavků. Zkus to za chvíli.", { status: 429 });
  }

  let body: { messages: ChatMessage[]; userProfile?: UserProfile; toolContexts?: Array<{ toolId: ToolId; data: unknown }> };
  try {
    body = await req.json();
  } catch {
    return new Response("Neplatný požadavek", { status: 400 });
  }

  const { messages, userProfile, toolContexts } = body;
  const systemPrompt = getSystemPrompt({ userProfile, toolContexts });
  const client = new Anthropic({ apiKey });

  const anthropicMessages = messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: anthropicMessages,
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Neznámá chyba serveru";
        controller.enqueue(encoder.encode(`\n\nOmlouvám se, nastala chyba: ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
