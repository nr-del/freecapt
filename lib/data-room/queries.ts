// Server-side data layer for the Data room (§5.26). Joins the canonical,
// jurisdiction-aware slot layout with the company's stored documents and
// computes a readiness score for fundraise prep.
import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import type { ActiveCompany } from "@/lib/db/queries";
import type { JurisdictionCode } from "@/lib/packs/_shared/types";

import {
  getDataRoomLayout,
  requiredSlotKeys,
  slotLocalTitle,
  type DataRoomFolder,
  type DataRoomSlot,
} from "./slots";

const { documents } = schema;

export interface SlotDocument {
  id: string;
  filename: string;
  signed: boolean;
  signedAt: Date | null;
  templateUsed: string | null;
  createdAt: Date;
}

export type SlotStatus = "present" | "missing" | "auto";

export interface ResolvedSlot extends DataRoomSlot {
  localTitle: string | null; // jurisdiction-local title, if any
  status: SlotStatus;
  documents: SlotDocument[];
}

export interface ResolvedFolder extends Omit<DataRoomFolder, "slots"> {
  slots: ResolvedSlot[];
}

export interface DataRoom {
  folders: ResolvedFolder[];
  readiness: { complete: number; total: number };
}

// Resolve the Data room for one company: the canonical layout, each slot's
// status + attached documents, and the readiness score over required slots.
export async function getDataRoom(company: ActiveCompany): Promise<DataRoom> {
  const jurisdiction = company.jurisdiction as JurisdictionCode;
  const folders = getDataRoomLayout(jurisdiction, company.entityType);

  const docs = await db
    .select({
      id: documents.id,
      filename: documents.filename,
      signed: documents.signed,
      signedAt: documents.signedAt,
      templateUsed: documents.templateUsed,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(and(eq(documents.companyId, company.id), isNull(documents.deletedAt)))
    .orderBy(desc(documents.createdAt));

  // Group stored documents by the slot key they were filed under.
  const bySlot = new Map<string, SlotDocument[]>();
  for (const d of docs) {
    const key = d.templateUsed ?? "other";
    const list = bySlot.get(key) ?? [];
    list.push(d);
    bySlot.set(key, list);
  }

  const resolvedFolders: ResolvedFolder[] = folders.map((folder) => ({
    ...folder,
    slots: folder.slots.map((slot): ResolvedSlot => {
      const slotDocs = bySlot.get(slot.key) ?? [];
      let status: SlotStatus;
      if (slot.source === "auto") {
        status = "auto"; // generated from cap-table data — always available
      } else {
        status = slotDocs.length > 0 ? "present" : "missing";
      }
      return {
        ...slot,
        localTitle: slotLocalTitle(slot.key, jurisdiction),
        status,
        documents: slotDocs,
      };
    }),
  }));

  // Readiness: required slots that are present or auto-generated.
  const required = new Set(requiredSlotKeys(folders));
  let complete = 0;
  for (const folder of resolvedFolders) {
    for (const slot of folder.slots) {
      if (required.has(slot.key) && (slot.status === "present" || slot.status === "auto")) {
        complete += 1;
      }
    }
  }

  return { folders: resolvedFolders, readiness: { complete, total: required.size } };
}
