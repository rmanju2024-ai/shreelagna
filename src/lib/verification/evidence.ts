import { createServiceClient } from "@/lib/supabase/server";

export const EVIDENCE_BUCKET = "verification-evidence";
export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_MAX_FILES = 3;
export { EVIDENCE_RETENTION_DAYS, EVIDENCE_RETENTION_NOTICE } from "@/lib/verification/copy";
export const EVIDENCE_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export function evidenceDeleteAfter(from = new Date()) {
  return from.toISOString();
}

async function removeFolder(
  store: NonNullable<Awaited<ReturnType<typeof evidenceStore>>>,
  profileId: string,
  caseId: string,
) {
  const folder = evidenceFolder(profileId, caseId);
  const listed = await store.storage.from(EVIDENCE_BUCKET).list(folder);
  const paths = (listed.data ?? [])
    .map((file) => file.name)
    .filter((name) => name && name !== ".emptyFolderPlaceholder")
    .map((name) => `${folder}/${name}`);
  if (paths.length) await store.storage.from(EVIDENCE_BUCKET).remove(paths);
}

export async function deleteCaseEvidence(
  store: NonNullable<Awaited<ReturnType<typeof evidenceStore>>>,
  profileId: string,
  caseId: string,
) {
  await removeFolder(store, profileId, caseId);
}

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

export async function purgeExpiredEvidence(store: NonNullable<Awaited<ReturnType<typeof evidenceStore>>>) {
  const now = new Date().toISOString();
  const { data: due } = await store
    .from("profile_verification_cases")
    .select("id, profile_id")
    .in("status", ["approved", "rejected", "expired"])
    .lte("evidence_delete_after", now)
    .limit(40);
  for (const item of due ?? []) {
    await removeFolder(store, item.profile_id, item.id);
  }
}
