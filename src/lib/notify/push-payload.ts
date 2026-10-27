import { SITE_NAME } from "@/lib/brand";

export type PushNoticeInput = {
  title: string;
  body: string;
  href?: string | null;
  kind?: string;
};

export type WebPushPayload = {
  title: string;
  body: string;
  url: string;
  kind?: string;
  tag?: string;
};

export function defaultAlertUrl(href?: string | null): string {
  const path = typeof href === "string" ? href.trim() : "";
  if (path.startsWith("/") && !path.startsWith("//")) return path;
  return "/app/alerts";
}

export function buildPushPayload(input: PushNoticeInput): WebPushPayload {
  const title = String(input.title || SITE_NAME).slice(0, 80) || SITE_NAME;
  const body = String(input.body || "You have a new update.").slice(0, 180);
  const url = defaultAlertUrl(input.href);
  const tag = [input.kind, url].filter(Boolean).join(":");
  return {
    title,
    body,
    url,
    ...(input.kind ? { kind: input.kind } : {}),
    ...(tag ? { tag } : {}),
  };
}

export function isGonePushStatus(status: number): boolean {
  return status === 404 || status === 410;
}

export function shouldDeliverHouseChannels(kind?: string | null): boolean {
  return kind !== "chat";
}
