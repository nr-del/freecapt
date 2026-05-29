"use client";

// Floating launcher for the AI onboarding helper drawer. Mounted once in the
// authed app layout so the helper is reachable from every product screen.
import { useState } from "react";

import { AiHelperPanel } from "@/components/freecapt/ai-helper-panel";

export function AiHelperLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI helper"
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-brand-700"
      >
        <span aria-hidden>✦</span>
        AI helper
      </button>
      <AiHelperPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
