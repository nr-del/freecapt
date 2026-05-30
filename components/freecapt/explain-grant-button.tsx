"use client";

// "Explain my grant" (§5.7): a stakeholder taps this and Claude returns a short,
// plain-English explanation of their specific grant. Server-side inference; the
// button degrades gracefully when AI isn't configured.
import { useState } from "react";
import { Sparkles } from "lucide-react";

import type { ExplainGrantResponse } from "@/app/api/portal/explain-grant/route";

export function ExplainGrantButton({
  grantSummary,
  jurisdiction,
}: {
  grantSummary: string;
  jurisdiction?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function explain() {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/portal/explain-grant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grantSummary, jurisdiction }),
      });
      const data = (await res.json()) as ExplainGrantResponse;
      if (!res.ok || !data.ok || !data.text) {
        setError(data.error ?? "Couldn't generate an explanation.");
        setState("error");
        return;
      }
      setText(data.text);
      setState("done");
    } catch {
      setError("Network error. Please try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-brand-700">
          <Sparkles className="size-3.5" />
          In plain English
        </div>
        <p className="mt-1.5 whitespace-pre-line text-sm text-slate-700">{text}</p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={explain}
        disabled={state === "loading"}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
      >
        <Sparkles className="size-3.5" />
        {state === "loading" ? "Thinking…" : "Explain my grant"}
      </button>
      {state === "error" ? <p className="mt-1.5 text-xs text-amber-700">{error}</p> : null}
    </div>
  );
}
