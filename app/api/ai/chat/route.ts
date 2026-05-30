// POST /api/ai/chat - the conversational AI onboarding helper (right-side
// drawer). Streams Claude's reply back via the Vercel AI SDK. Server-side only;
// ANTHROPIC_API_KEY never reaches the client (CLAUDE.md).
import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { CLAUDE_MODEL, isClaudeConfigured } from "@/lib/ai/claude";
import { SYSTEM_ONBOARDING } from "@/lib/ai/prompts";
import { getCurrentAccountId } from "@/lib/db/queries";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const accountId = await getCurrentAccountId();
  if (!accountId) {
    return new Response("Please sign in to use the AI helper.", { status: 401 });
  }

  if (!isClaudeConfigured()) {
    return new Response("AI isn't switched on in this environment yet.", { status: 503 });
  }

  let messages: UIMessage[] = [];
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    messages = body.messages ?? [];
  } catch {
    return new Response("Couldn't read your request.", { status: 400 });
  }

  const result = streamText({
    model: anthropic(CLAUDE_MODEL),
    system: SYSTEM_ONBOARDING,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
