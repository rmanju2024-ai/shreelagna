import { arattaiConfigured, sendArattaiAlert, toArattaiMobile } from "@/lib/notify/arattai";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWebPushesToUser } from "@/lib/notify/web-push";
import { shouldDeliverHouseChannels, type PushNoticeInput } from "@/lib/notify/push-payload";

export type HouseNotice = PushNoticeInput & {
  userId: string;
  kind?: string;
  mobileHint?: string | null;
};

async function loadAlertMobile(userId: string, mobileHint?: string | null): Promise<string | null> {
  const db = createServiceClient();
  if (!db) return toArattaiMobile(mobileHint);
  const account = await db.from("app_users").select("id, notify_whatsapp").eq("id", userId).maybeSingle();
  if (account.data && account.data.notify_whatsapp === false) return null;
  const profile = await db
    .from("profiles")
    .select("subject_mobile, phone_otp_verified_at")
    .eq("created_by", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!profile.data?.phone_otp_verified_at) return null;
  return (
    toArattaiMobile(mobileHint) ||
    toArattaiMobile(typeof profile.data.subject_mobile === "string" ? profile.data.subject_mobile : null)
  );
}

/** Web Push + Arattai for house notices. Never used for in-app family chat. */
export async function deliverHouseNotice(notice: HouseNotice): Promise<void> {
  if (!shouldDeliverHouseChannels(notice.kind)) return;
  const payload: PushNoticeInput = {
    title: notice.title,
    body: notice.body,
    href: notice.href,
    kind: notice.kind,
  };
  await sendWebPushesToUser(notice.userId, payload).catch(() => undefined);
  if (!arattaiConfigured()) return;
  const mobile = await loadAlertMobile(notice.userId, notice.mobileHint);
  if (!mobile) return;
  const line = (notice.body || notice.title).slice(0, 120);
  await sendArattaiAlert(mobile, [notice.title.slice(0, 60) || "Shree Lagna", line]).catch(() => undefined);
}
