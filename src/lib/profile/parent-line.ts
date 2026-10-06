import { DONT_KNOW, choiceLabel } from "@/lib/profile/options";

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function article(word: string) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function wasClause(work: string): string | null {
  const extra = work.split("·")[1]?.trim();
  if (!extra) return null;
  return extra.replace(/^was\s+/i, "").replace(/^(a|an)\s+/i, "").trim() || null;
}

function workPhrase(work: string): string {
  const lower = work.trim().toLowerCase();
  if (lower === "employed") return "employed";
  if (lower === "business" || lower.startsWith("in ")) return lower.startsWith("in ") ? lower : "in business";
  if (lower === "homemaker") return "a homemaker";
  if (lower === "professional") return "a professional";
  if (lower.startsWith("retired")) return `${article(lower)} ${lower}`;
  return `${article(lower)} ${lower}`;
}

function isLate(work: string) {
  const t = work.toLowerCase();
  return t.includes("passed away") || t.includes("expired") || t === "late" || t.includes("deceased");
}

function isUnknown(work: string) {
  return work === DONT_KNOW || work.toLowerCase() === "dont know" || work.toLowerCase() === "i don't know";
}

function pronoun(who: "Father" | "Mother") {
  return who === "Mother" ? "She" : "He";
}

/** One family-profile line for a parent, including passed-away and retired wording. */
export function parentSentence(name: unknown, work: unknown, who: "Father" | "Mother"): string | null {
  const named = hasText(name) ? name.trim() : "";
  const job = hasText(work) ? work.trim() : "";
  if (!named && !job) return null;

  if (job && isUnknown(job)) {
    return named ? `${who} is **${named}**` : null;
  }

  if (job && isLate(job)) {
    const was = wasClause(job);
    const late = named ? `${who} **${named}** has passed away` : `${who} has passed away`;
    if (!was) return late;
    return `${late}. ${pronoun(who)} was ${workPhrase(was)}`;
  }

  if (job && job.toLowerCase().includes("retired")) {
    const role = workPhrase(job);
    return named ? `${who} is **${named}**, ${role}` : `${who} is ${role}`;
  }

  if (job) {
    const role = workPhrase(job);
    return named ? `${who} is **${named}**, ${role}` : `${who} is ${role}`;
  }

  return `${who} is **${named}**`;
}

export function parentWorkLabel(work: string | null | undefined) {
  if (!work?.trim()) return "";
  return choiceLabel(work.trim());
}
