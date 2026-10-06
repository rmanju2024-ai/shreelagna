import { DONT_KNOW, PARENT_PROFESSIONS, choiceLabel } from "@/lib/profile/options";

const KNOWN = new Set<string>(PARENT_PROFESSIONS);

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function article(word: string) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function workPhrase(work: string): string {
  const lower = work.trim().toLowerCase();
  if (lower === "employed") return "employed";
  if (lower === "business") return "in business";
  if (lower === "homemaker") return "a homemaker";
  if (lower === "government employee") return "a government employee";
  return `${article(lower)} ${lower}`;
}

function isUnknownTag(value: string) {
  const t = value.toLowerCase();
  return value === DONT_KNOW || t === "dont know" || t === "i don't know";
}

function isLateTag(value: string) {
  const t = value.toLowerCase();
  return t.includes("passed away") || t.includes("expired") || t.includes("deceased") || t === "late";
}

function mapBit(bit: string): string[] {
  const t = bit.trim();
  if (!t) return [];
  if (KNOWN.has(t)) return [t];
  const lower = t.toLowerCase();
  const out: string[] = [];
  if (isLateTag(t)) out.push("Passed away");
  if (lower.includes("retired")) out.push("Retired");
  if (isUnknownTag(t)) out.push(DONT_KNOW);
  if (lower.includes("homemak") || lower.includes("housewife")) out.push("Homemaker");
  if (/\bemployed\b/.test(lower) && !lower.includes("unemployed")) out.push("Employed");
  if (lower.includes("business")) out.push("Business");
  if (lower.includes("farmer")) out.push("Farmer");
  if (lower.includes("government")) out.push("Government employee");
  if (lower.includes("teacher")) out.push("Teacher");
  if (lower.includes("doctor")) out.push("Doctor");
  if (lower.includes("engineer")) out.push("Engineer");
  return out;
}

/** Turn stored text or form values into a short tag list. */
export function parseParentTags(raw: unknown): string[] {
  const parts = Array.isArray(raw)
    ? raw.map((item) => String(item))
    : String(raw ?? "")
        .split(/\s*[·,|/]\s*|\s+-\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
  const tags: string[] = [];
  for (const part of parts) {
    for (const tag of mapBit(part)) {
      if (!tags.includes(tag)) tags.push(tag);
    }
  }
  if (tags.includes(DONT_KNOW) && tags.length > 1) {
    return [DONT_KNOW];
  }
  return PARENT_PROFESSIONS.filter((item) => tags.includes(item));
}

export function joinParentTags(raw: unknown): string {
  return parseParentTags(raw).join(" · ");
}

function pronoun(who: "Father" | "Mother") {
  return who === "Mother" ? "She" : "He";
}

function livingPhrase(jobs: string[], retired: boolean): string {
  if (retired && jobs.includes("Business")) return "a retired businessman";
  if (retired && jobs.includes("Farmer")) return "a retired farmer";
  if (retired && jobs.includes("Government employee")) return "retired from government service";
  if (retired && jobs.length === 1) return `a retired ${jobs[0].toLowerCase()}`;
  if (retired && jobs.length === 0) return "retired";
  if (jobs.length === 0) return retired ? "retired" : "";
  return jobs.map(workPhrase).join(" and ");
}

/** One family-profile line for a parent, including passed-away and retired wording. */
export function parentSentence(name: unknown, work: unknown, who: "Father" | "Mother"): string | null {
  const named = hasText(name) ? name.trim() : "";
  const tags = parseParentTags(work);
  if (!named && !tags.length) return null;

  if (tags.includes(DONT_KNOW) || (tags.length === 1 && isUnknownTag(tags[0]))) {
    return named ? `${who} is **${named}**` : `${who}'s details are not known`;
  }

  const late = tags.some(isLateTag);
  const retired = tags.includes("Retired");
  const jobs = tags.filter((tag) => tag !== "Passed away" && tag !== "Retired" && tag !== DONT_KNOW);
  const role = livingPhrase(jobs, retired && !late);

  if (late) {
    const lateLine = named ? `${who} **${named}** has passed away` : `${who} has passed away`;
    if (!jobs.length && !retired) return lateLine;
    const past = livingPhrase(jobs, retired);
    return `${lateLine}. ${pronoun(who)} was ${past}`;
  }

  if (role) {
    return named ? `${who} is **${named}**, ${role}` : `${who} is ${role}`;
  }

  return named ? `${who} is **${named}**` : null;
}

export function parentWorkLabel(work: string | null | undefined) {
  const tags = parseParentTags(work);
  return tags.map(choiceLabel).join(" · ");
}
