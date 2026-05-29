"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/auth/supabase-browser";

// Magic-link sign-in — docs/12_design_system.md §6.8 (auth card pattern).
export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createBrowserClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (otpError) {
      setError(otpError.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <Card className="mx-auto w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
            Free<span className="text-brand-600">C</span>apT
          </div>
          <p className="text-sm text-slate-500">
            {status === "sent"
              ? `Check ${email} for your sign-in link.`
              : "Sign in to your cap table."}
          </p>
        </div>

        {status === "sent" ? (
          <p className="text-center text-sm text-slate-600">
            We sent a one-time link to your inbox. It expires in a few minutes —
            open it on this device to finish signing in.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input
              type="email"
              required
              autoFocus
              placeholder="you@yourcompany.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={status === "sending"}
              aria-invalid={status === "error" || undefined}
            />
            <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send magic link →"}
            </Button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          No password required. We&apos;ll email you a one-time sign-in link.
        </p>
      </Card>
    </main>
  );
}
