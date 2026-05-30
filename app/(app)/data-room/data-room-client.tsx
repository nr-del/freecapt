"use client";

// Data room UI (§5.26): the structured folder view, per-slot status, document
// download/remove, and the two-path "+ Add" modal (Upload existing = Free,
// Generate from template = Paid stub).
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, FileText, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDownloadUrl, removeDocument, uploadToSlot } from "./actions";

type SlotDoc = {
  id: string;
  filename: string;
  signed: boolean;
};

export type ClientSlot = {
  key: string;
  name: string;
  localTitle: string | null;
  description?: string;
  status: "present" | "missing" | "auto";
  paidToGenerate?: boolean;
  multiple?: boolean;
  required?: boolean;
  documents: SlotDoc[];
};

export type ClientFolder = {
  number: number;
  key: string;
  name: string;
  slots: ClientSlot[];
};

export function DataRoomClient({
  folders,
  readiness,
  storageReady,
}: {
  folders: ClientFolder[];
  readiness: { complete: number; total: number };
  storageReady: boolean;
}) {
  const [active, setActive] = useState<ClientSlot | null>(null);
  const pct = readiness.total > 0 ? Math.round((readiness.complete / readiness.total) * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Data room</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every legally-relevant document, in one structured home. Upload what you have; generate
            what you don&apos;t.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-right">
          <div className="text-xs uppercase tracking-wider text-slate-400">Readiness</div>
          <div className="text-lg font-semibold tabular-nums text-slate-900">
            {readiness.complete} / {readiness.total}
          </div>
          <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </header>

      {!storageReady ? (
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          File storage isn&apos;t switched on in this environment yet, so uploads are disabled. The
          structure and readiness score still work.
        </p>
      ) : null}

      <div className="mt-6 space-y-6">
        {folders.map((folder) => (
          <section key={folder.key}>
            <h2 className="text-sm font-semibold text-slate-900">
              {folder.number}. {folder.name}
            </h2>
            <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {folder.slots.map((slot) => (
                <SlotRow key={slot.key} slot={slot} onAdd={() => setActive(slot)} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <AddDialog slot={active} storageReady={storageReady} onClose={() => setActive(null)} />
    </main>
  );
}

function StatusPill({ status }: { status: ClientSlot["status"] }) {
  if (status === "auto") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
        <Check className="size-3" />
        Auto
      </span>
    );
  }
  if (status === "present") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
        <Check className="size-3" />
        Present
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
      Missing
    </span>
  );
}

function SlotRow({ slot, onAdd }: { slot: ClientSlot; onAdd: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDownload = (id: string) => {
    startTransition(async () => {
      const res = await getDownloadUrl(id);
      if (res.ok) window.open(res.url, "_blank", "noopener");
      else toast.error(res.error);
    });
  };

  const onRemove = (id: string) => {
    startTransition(async () => {
      const res = await removeDocument(id);
      if (res.ok) {
        toast.success("Document removed.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <li className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{slot.name}</span>
          {slot.localTitle && slot.localTitle !== slot.name ? (
            <span className="text-xs text-slate-400">{slot.localTitle}</span>
          ) : null}
          {slot.required ? <span className="text-xs text-slate-300">·  required</span> : null}
        </div>
        {slot.status === "auto" ? (
          <p className="mt-0.5 text-xs text-slate-500">Generated from your cap table — always current.</p>
        ) : slot.documents.length > 0 ? (
          <ul className="mt-1.5 space-y-1">
            {slot.documents.map((d) => (
              <li key={d.id} className="flex items-center gap-2 text-xs text-slate-600">
                <FileText className="size-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{d.filename}</span>
                <button
                  type="button"
                  onClick={() => onDownload(d.id)}
                  disabled={pending}
                  className="text-slate-400 hover:text-brand-600 disabled:opacity-50"
                  aria-label={`Download ${d.filename}`}
                >
                  <Download className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(d.id)}
                  disabled={pending}
                  className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                  aria-label={`Remove ${d.filename}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <StatusPill status={slot.status} />
        {slot.status === "auto" ? null : (
          <button
            type="button"
            onClick={onAdd}
            className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            {slot.multiple || slot.documents.length > 0 ? "+ Add" : "+ Add"}
          </button>
        )}
      </div>
    </li>
  );
}

function AddDialog({
  slot,
  storageReady,
  onClose,
}: {
  slot: ClientSlot | null;
  storageReady: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = () => {
    if (!slot) return;
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }
    const fd = new FormData();
    fd.set("slotKey", slot.key);
    fd.set("file", file);
    startTransition(async () => {
      const res = await uploadToSlot(fd);
      if (res.ok) {
        toast.success("Uploaded.");
        onClose();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={slot != null} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        {slot ? (
          <>
            <DialogHeader>
              <DialogTitle>Add: {slot.name}</DialogTitle>
              {slot.description ? <DialogDescription>{slot.description}</DialogDescription> : null}
            </DialogHeader>

            <div className="space-y-4">
              {slot.paidToGenerate ? (
                <div className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                    <Sparkles className="size-4 text-brand-600" />
                    Generate from template
                    <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      Paid
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    A jurisdiction-appropriate {slot.name.toLowerCase()} for SMB-stage companies,
                    ready for your lawyer to review. Available on the paid plan.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => toast.info("Document templates arrive on the paid plan.")}
                  >
                    Learn more
                  </Button>
                </div>
              ) : null}

              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                  <Upload className="size-4 text-slate-500" />
                  Upload existing
                  <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    Free
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  PDF or Word, up to 25 MB. We&apos;ll attach it to this slot.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  disabled={!storageReady || pending}
                  className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:border-brand-300"
                />
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={onUpload} disabled={!storageReady || pending}>
                    {pending ? "Uploading…" : "Upload"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
