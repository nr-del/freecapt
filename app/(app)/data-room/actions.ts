"use server";

// Data room document actions (§5.26): upload an existing file to a canonical
// slot (Free, always available when storage is configured), remove it, or mint
// a short-lived signed download URL. Generate-from-template is Paid and lands in
// a later prompt.
import { createHash, randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getActiveCompany, getCurrentAccountId } from "@/lib/db/queries";
import {
  deleteDocument,
  isStorageConfigured,
  signedDownloadUrl,
  uploadDocument,
} from "@/lib/storage/service";

const { documents } = schema;

// 25 MB — generous for legal PDFs/Word docs, small enough to refuse abuse.
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export type UploadResult = { ok: true } | { ok: false; error: string };

export async function uploadToSlot(formData: FormData): Promise<UploadResult> {
  const slotKey = String(formData.get("slotKey") ?? "").trim();
  const file = formData.get("file");
  if (!slotKey) return { ok: false, error: "Missing slot." };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }
  if (file.size > MAX_BYTES) return { ok: false, error: "That file is larger than 25 MB." };
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Upload a PDF or Word document." };
  }
  if (!isStorageConfigured()) {
    return { ok: false, error: "File storage isn't switched on in this environment yet." };
  }

  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };
  const accountId = await getCurrentAccountId();

  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buffer).digest();
  // Sanitise the stored filename for the object key; keep the original on the row.
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
  const objectKey = `${company.id}/${slotKey}/${randomUUID()}-${safeName}`;

  const up = await uploadDocument({
    key: objectKey,
    body: buffer,
    contentType: file.type || "application/octet-stream",
  });
  if (!up.ok) return { ok: false, error: "Couldn't upload the file. Please try again." };

  try {
    await db.insert(documents).values({
      companyId: company.id,
      filename: file.name,
      storageKey: objectKey,
      storageRegion: company.dataRegion,
      contentType: file.type || "application/octet-stream",
      byteSize: buffer.byteLength,
      sha256Hash: sha256,
      templateUsed: slotKey,
      createdByAccountId: accountId,
      updatedByAccountId: accountId,
    });
  } catch (err) {
    console.error("[uploadToSlot] db insert failed:", err);
    // Best-effort cleanup so we don't orphan the object.
    await deleteDocument(objectKey);
    return { ok: false, error: "Couldn't save the document. Please try again." };
  }

  revalidatePath("/data-room");
  return { ok: true };
}

export type RemoveDocumentResult = { ok: true } | { ok: false; error: string };

export async function removeDocument(documentId: string): Promise<RemoveDocumentResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };
  const accountId = await getCurrentAccountId();

  try {
    const [doc] = await db
      .select({ id: documents.id, storageKey: documents.storageKey })
      .from(documents)
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.companyId, company.id),
          isNull(documents.deletedAt),
        ),
      )
      .limit(1);
    if (!doc) return { ok: false, error: "That document wasn't found." };

    await db
      .update(documents)
      .set({ deletedAt: new Date(), updatedAt: new Date(), updatedByAccountId: accountId })
      .where(eq(documents.id, documentId));
    // Remove the stored object too; the row stays soft-deleted for audit.
    await deleteDocument(doc.storageKey);
  } catch (err) {
    console.error("[removeDocument] failed:", err);
    return { ok: false, error: "Couldn't remove the document. Please try again." };
  }

  revalidatePath("/data-room");
  return { ok: true };
}

export type DownloadResult = { ok: true; url: string } | { ok: false; error: string };

export async function getDownloadUrl(documentId: string): Promise<DownloadResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };

  const [doc] = await db
    .select({ storageKey: documents.storageKey })
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.companyId, company.id),
        isNull(documents.deletedAt),
      ),
    )
    .limit(1);
  if (!doc) return { ok: false, error: "That document wasn't found." };

  const url = await signedDownloadUrl(doc.storageKey);
  if (!url) return { ok: false, error: "Couldn't prepare the download. Please try again." };
  return { ok: true, url };
}
