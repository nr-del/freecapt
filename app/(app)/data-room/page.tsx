import { getDataRoom } from "@/lib/data-room/queries";
import { getActiveCompany } from "@/lib/db/queries";
import { isStorageConfigured } from "@/lib/storage/service";

import { DataRoomClient, type ClientFolder } from "./data-room-client";

export const metadata = {
  title: "Data room · FreeCapT",
};

// Structured, jurisdiction-aware document repository (docs/01_mvp_scope.md §5.26).
export default async function DataRoomPage() {
  const company = await getActiveCompany();
  if (!company) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">No company yet</h1>
        <p className="mt-2 text-sm text-slate-500">
          Run <code className="rounded bg-slate-100 px-1.5 py-0.5">pnpm db:seed</code> to load the
          Acme demo.
        </p>
      </main>
    );
  }

  const room = await getDataRoom(company);

  // Strip the layout to the plain shape the client needs (no server-only fields).
  const folders: ClientFolder[] = room.folders.map((f) => ({
    number: f.number,
    key: f.key,
    name: f.name,
    slots: f.slots.map((s) => ({
      key: s.key,
      name: s.name,
      localTitle: s.localTitle,
      description: s.description,
      status: s.status,
      paidToGenerate: s.paidToGenerate,
      multiple: s.multiple,
      required: s.required,
      // Auto slots backed by a server-rendered export expose a download link.
      autoHref: s.key === "shareholder_register" ? "/data-room/register" : undefined,
      documents: s.documents.map((d) => ({ id: d.id, filename: d.filename, signed: d.signed })),
    })),
  }));

  return (
    <DataRoomClient
      folders={folders}
      readiness={room.readiness}
      storageReady={isStorageConfigured()}
    />
  );
}
