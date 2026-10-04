import { createServiceClient } from "@/lib/supabase/server";

export const EVIDENCE_BUCKET = "verification-evidence";
export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_MAX_FILES = 3;
export const EVIDENCE_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/** Private bucket: nothing here is ever public; the desk reads files through short-lived signed links. */
export async function evidenceStore() {
  const db = createServiceClient();
  if (!db) return null;
  const made = await db.storage.createBucket(EVIDENCE_BUCKET, { public: false, fileSizeLimit: EVIDENCE_MAX_BYTES });
  void made; // already-exists is fine
  return db;
}

export function evidenceFolder(profileId: string, caseId: string) {
  return `${profileId}/${caseId}`;
}
