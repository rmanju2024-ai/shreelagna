export const ACCOUNT_GROUPS = [
  {
    id: "journey",
    title: "My journey",
    kicker: "Your story",
    mark: "About",
    items: [
      { href: "/app", title: "My profile", mark: "Name", text: "Your story, media and completeness." },
      { href: "/app/shortlist", title: "Shortlist", mark: "Partner", text: "Private profiles you wish to revisit." },
      { href: "/app/blocked", title: "Blocked profiles", mark: "Safety", text: "Members you blocked. Unblock any time." },
    ],
  },
  {
    id: "inbox",
    title: "Inbox",
    kicker: "Messages",
    mark: "Inbox",
    columns: 3,
    items: [
      { href: "/app/chat", title: "Chat", mark: "Inbox", text: "Write when you send a request." },
      { href: "/app/interests", title: "Interests", mark: "Partner", text: "Requests you sent, received and accepted." },
      { href: "/app/alerts", title: "Alerts", mark: "Hope", text: "Notices when families view, request or reply." },
    ],
  },
  {
    id: "privacy",
    title: "Privacy & safety",
    kicker: "Kept private",
    mark: "Health",
    items: [
      { href: "/app/settings", title: "Privacy controls", mark: "Living", text: "Photos, details, contact release and alerts." },
      { href: "/app/safety", title: "Safety centre", mark: "Family", text: "Reports, blocks and practical help." },
      { href: "/app/verification", title: "Verification", mark: "Identity", text: "Optional checks for identity, education and employment." },
    ],
  },
  {
    id: "membership",
    title: "Membership & help",
    kicker: "House support",
    mark: "Work",
    items: [
      { href: "/app/plans", title: "Membership", mark: "Income", text: "Your plan, access and future upgrades." },
      { href: "/contact", title: "Help & support", mark: "Contact", text: "Reach the Shree Lagna house team." },
    ],
  },
] as const;

export function accountInboxCounts(inbox: { chatUnread: number; alertUnread: number; likesPending: number }) {
  return {
    "/app/chat": inbox.chatUnread,
    "/app/interests": inbox.likesPending,
    "/app/alerts": inbox.alertUnread,
  } as Record<string, number>;
}

export function accountOwnerName(
  rows: { id?: string | null; subject_full_name?: string | null }[],
  activeId?: string | null,
  fallback?: string | null,
): string {
  const match = rows.find((row) => row.id && row.id === activeId) ?? rows[0];
  const fromProfile = typeof match?.subject_full_name === "string" ? match.subject_full_name.trim() : "";
  const fromAccount = typeof fallback === "string" ? fallback.trim() : "";
  return fromProfile || fromAccount;
}

export function bannerProfileChip(profileName?: string | null): { label: string; pending: boolean } {
  const name = typeof profileName === "string" ? profileName.trim() : "";
  if (name) return { label: name, pending: false };
  return { label: "Not created yet", pending: true };
}
