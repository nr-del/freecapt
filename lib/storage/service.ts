// Server-only Supabase Storage access using the service-role key. Per
// CLAUDE.md the secret key bypasses RLS and must NEVER reach the client — this
// module is server-only and used from route handlers / server actions.
//
// Degrades gracefully: when the service key is unset (local/CI), callers can
// check isStorageConfigured() and surface a friendly message instead of a 500.
import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Single private bucket for all company documents. Object keys are namespaced by
// company id, so cross-tenant reads are impossible even with a leaked key path.
export const DOCUMENTS_BUCKET = "documents";

let client: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase storage is not configured.");
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Upload bytes to the documents bucket. Returns the object key on success.
export async function uploadDocument(args: {
  key: string;
  body: ArrayBuffer | Buffer;
  contentType: string;
}): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  try {
    const { error } = await getServiceClient()
      .storage.from(DOCUMENTS_BUCKET)
      .upload(args.key, args.body, { contentType: args.contentType, upsert: false });
    if (error) {
      console.error("[storage] upload error:", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, key: args.key };
  } catch (err) {
    console.error("[storage] upload threw:", err);
    return { ok: false, error: "upload_failed" };
  }
}

// A short-lived signed URL for downloading a private object.
export async function signedDownloadUrl(
  key: string,
  expiresInSeconds = 120,
): Promise<string | null> {
  try {
    const { data, error } = await getServiceClient()
      .storage.from(DOCUMENTS_BUCKET)
      .createSignedUrl(key, expiresInSeconds);
    if (error) {
      console.error("[storage] signed url error:", error.message);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error("[storage] signed url threw:", err);
    return null;
  }
}

export async function deleteDocument(key: string): Promise<void> {
  try {
    await getServiceClient().storage.from(DOCUMENTS_BUCKET).remove([key]);
  } catch (err) {
    console.error("[storage] delete threw:", err);
  }
}
