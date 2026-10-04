export const SECTIONS = [
  { id: "received", label: "Received", meaning: "Families who showed interest in you", empty: "No pending interests right now" },
  { id: "sent", label: "Sent", meaning: "Interests you have sent, awaiting a reply", empty: "No pending interests sent" },
  { id: "accepted", label: "Accepted", meaning: "Mutual interest, ready to talk", empty: "No accepted interests yet" },
  { id: "viewed", label: "Who viewed you", meaning: "Recent visitors to your profile", empty: "No one has viewed you yet" },
  { id: "visited", label: "You viewed", meaning: "Profiles you recently opened", empty: "You have not viewed anyone yet" },
  { id: "history", label: "History", meaning: "Expired, declined or closed", empty: "No expired, declined, or deleted notes." },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
