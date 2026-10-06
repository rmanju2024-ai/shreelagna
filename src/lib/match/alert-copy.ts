import { displayFirstName } from "@/lib/profile/options";
import { formatIstDateTime } from "@/lib/time/ist";

export function alertPersonName(fullName: string | null | undefined, fallback = "A member"): string {
  return displayFirstName(fullName ?? fallback);
}

export function interestReceivedCopy(_viewerFirst: string, otherName: string) {
  return {
    kind: "interest_received",
    title: otherName,
    body: `${otherName} sent you an interest.`,
  };
}

export function interestAcceptedCopy(_viewerFirst: string, otherName: string) {
  return {
    kind: "interest_accepted",
    title: otherName,
    body: `${otherName} accepted your interest — start a chat.`,
  };
}

export function interestDeclinedCopy(_viewerFirst: string, otherName: string, reason?: string | null) {
  const note = reason?.trim();
  return {
    kind: "interest_declined",
    title: otherName,
    body: note ? `${otherName} declined your interest — ${note}` : `${otherName} declined your interest.`,
  };
}

export function chatReceivedCopy(_viewerFirst: string, otherName: string, preview: string) {
  const snippet = preview.trim() || "a new note";
  return {
    kind: "chat",
    title: otherName,
    body: `${otherName} sent a message: ${snippet}`,
  };
}

export function matchFoundCopy(_viewerFirst: string) {
  return {
    kind: "match",
    title: "New match",
    body: "A new match fits your preference.",
  };
}

export function profileViewedCopy(otherName: string) {
  return {
    kind: "profile_view",
    title: otherName,
    body: `${otherName} viewed your profile.`,
  };
}

export function profileShortlistedCopy(otherName: string) {
  return {
    kind: "shortlist",
    title: otherName,
    body: `${otherName} shortlisted your profile.`,
  };
}

export function contactViewedCopy(otherName: string) {
  return {
    kind: "contact_view",
    title: otherName,
    body: `${otherName} viewed your mobile and email.`,
  };
}

export function alertWhen(iso: string | Date): string {
  return formatIstDateTime(iso);
}

export function alertActionLabel(kind: string, href: string | null | undefined): string {
  if (kind === "chat" || href?.startsWith("/app/chat")) return "Open chat";
  if (kind === "interest_received" || kind === "interest_declined" || href === "/app/interests") return "Open inbox";
  if (kind === "interest_accepted") return "Open chat";
  if (kind === "profile_view" || kind === "contact_view" || kind === "shortlist") return "Open profile";
  return "Open profile";
}

export function alertHeadline(kind: string, title: string, body: string): { name: string; detail: string } {
  const name = alertDisplayName(kind, title, body) || "Someone";
  if (kind === "interest_received") return { name, detail: "sent you an interest" };
  if (kind === "interest_accepted") return { name, detail: "accepted your interest" };
  if (kind === "interest_declined") {
    const reason = body.includes(" — ") ? body.split(" — ").slice(1).join(" — ").trim() : "";
    return { name, detail: reason ? `declined your interest — ${reason}` : "declined your interest" };
  }
  if (kind === "profile_view") return { name, detail: "viewed your profile" };
  if (kind === "shortlist") return { name, detail: "shortlisted your profile" };
  if (kind === "contact_view") return { name, detail: "viewed your mobile and email" };
  if (kind === "match" || title === "New match") return { name: "New match", detail: "fits your preference" };
  if (kind === "chat" || title === "New message") {
    const snippet = messageSnippet(name, body);
    return { name, detail: snippet ? `sent a message: ${snippet}` : "sent you a message" };
  }
  return { name, detail: alertLine(kind, title, body) };
}

export function alertDisplayName(kind: string, title: string, body: string): string {
  if (title && title !== "New message" && title !== "New match") return title;
  const fromBody = body.match(/^([^:]{1,48}):\s/);
  if (fromBody) return fromBody[1];
  return "";
}

function messageSnippet(name: string, body: string): string {
  const quoted = body.match(/[“"]([^”"]+)[”"]/);
  if (quoted?.[1]) return quoted[1].trim();
  const labeled = body.match(/sent (?:you )?a message:\s*[“"]?(.+?)[”"]?\s*(?:Open chat.*)?$/i);
  if (labeled?.[1]) return labeled[1].replace(/\.$/, "").trim();
  if (name && body.toLowerCase().startsWith(name.toLowerCase() + ":")) {
    return body.slice(name.length + 1).trim();
  }
  const colon = body.match(/^[^:]{1,48}:\s*(.+)$/);
  if (colon && !/namaste/i.test(body)) return colon[1].trim();
  return "";
}

export function alertLine(kind: string, title: string, body: string): string {
  const name = alertDisplayName(kind, title, body);
  if (kind === "interest_received") return `${name} sent you an interest.`;
  if (kind === "interest_accepted") return `${name} accepted your interest — start a chat.`;
  if (kind === "interest_declined") {
    return body.includes("declined your interest") ? body : `${name} declined your interest.`;
  }
  if (kind === "chat" || title === "New message") {
    const snippet = messageSnippet(name, body);
    return snippet ? `${name} sent a message: ${snippet}` : `${name} sent you a message.`;
  }
  if (kind === "profile_view") return `${name || "Someone"} viewed your profile.`;
  if (kind === "shortlist") return `${name || "Someone"} shortlisted your profile.`;
  if (kind === "contact_view") return `${name || "Someone"} viewed your mobile and email.`;
  if (kind === "match" || title === "New match") return "A new match fits your preference.";
  const compact = body.replace(/^Namaste[^.]+\.\s*/i, "").trim();
  const first = compact.split(". ")[0]?.trim() || compact;
  return first.endsWith(".") || first === compact ? first || "New alert." : `${first}.`;
}
