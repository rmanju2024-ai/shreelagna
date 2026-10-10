import { createServiceClient } from "@/lib/supabase/server";
import { buildPushPayload, isGonePushStatus, type PushNoticeInput, type WebPushPayload } from "@/lib/notify/push-payload";

type PushRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export function vapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
}

export function vapidConfigured(): boolean {
  return Boolean(vapidPublicKey() && process.env.VAPID_PRIVATE_KEY?.trim());
}

export function vapidSubject(): string {
  return process.env.VAPID_SUBJECT?.trim() || "mailto:house@shreelagna.com";
}

export async function sendWebPushesToUser(userId: string, notice: PushNoticeInput): Promise<void> {
  if (!vapidConfigured()) return;
  const db = createServiceClient();
  if (!db) return;
  const payload = buildPushPayload(notice);
  const { data: rows } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  for (const row of (rows ?? []) as PushRow[]) {
    const status = await sendOnePush(row, payload);
    if (status != null && isGonePushStatus(status)) {
      await db.from("push_subscriptions").delete().eq("id", row.id);
    }
  }
}

export async function sendOnePush(row: PushRow, payload: WebPushPayload): Promise<number | null> {
  try {
    const webpush = await import("web-push");
    webpush.setVapidDetails(vapidSubject(), vapidPublicKey(), process.env.VAPID_PRIVATE_KEY!.trim());
    await webpush.sendNotification(
      {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      },
      JSON.stringify(payload),
    );
    return 201;
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    return typeof status === "number" ? status : null;
  }
}
