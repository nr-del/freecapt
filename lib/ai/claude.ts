// Server-only Anthropic Claude client. Per CLAUDE.md, all Claude calls run
// server-side (route handlers / server actions) — ANTHROPIC_API_KEY is NEVER
// exposed to the client.
import "server-only";

import Anthropic from "@anthropic-ai/sdk";

// Default model for FreeCapT's AI features (docs/13 Prompt 9).
export const CLAUDE_MODEL = "claude-sonnet-4-6";

// Lazily constructed so an empty key doesn't crash module import at build time
// (the key is currently unset in dev/CI — features degrade gracefully).
let client: Anthropic | null = null;

export function getClaude(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  client ??= new Anthropic({ apiKey });
  return client;
}

// Whether the AI features are live in this environment. Used to short-circuit
// route handlers with a friendly message instead of a 500.
export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
