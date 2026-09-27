export function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (value && typeof value === "object") {
    return asStringList(Object.values(value));
  }
  if (typeof value === "string" && value.trim()) {
    const text = value.trim();
    if ((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))) {
      try {
        const parsed = JSON.parse(text.startsWith("{") ? `[${text.slice(1, -1)}]` : text);
        if (Array.isArray(parsed)) return asStringList(parsed);
      } catch {
        /* use the split path */
      }
    }
    return text
      .split(/[,|]/)
      .map((s) => s.trim().replace(/^[{}"']+|["'}]+$/g, ""))
      .filter(Boolean);
  }
  return [];
}

export function listedOnly(values: string[], allowed: string[]): string[] {
  const ok = new Set(allowed);
  return [...new Set(values.filter((v) => ok.has(v)))].slice(0, 24);
}

export function listedSubmitted(values: string[], allowed: string[]): string[] {
  const unique = [...new Set(values.filter(Boolean))];
  const kept = listedOnly(unique, allowed);
  return kept.length ? kept : unique.slice(0, 24);
}

export function listedHope(values: string[], allowed: string[], anyLabel: string): string[] {
  const unique = [...new Set(values.filter(Boolean))];
  if (unique.includes(anyLabel) || unique.length === 0) return [anyLabel];
  const kept = listedOnly(unique, allowed);
  return kept.length ? kept : unique.slice(0, 24);
}

export function joinHope(values: string[] | null | undefined): string | null {
  const list = [...new Set((values ?? []).map((s) => String(s).trim()).filter(Boolean))];
  return list.length ? list.join(", ") : null;
}

export const HOPE_BAG_KEYS = [
  "pref_tongues",
  "pref_religions",
  "pref_communities",
  "pref_countries",
  "pref_states",
  "pref_cities",
  "pref_educations",
  "pref_occupations",
  "pref_maritals",
  "pref_employed",
  "pref_incomes",
  "pref_diets",
  "pref_managed",
  "pref_horoscope",
] as const;

export function packHopeBag(data: Record<string, unknown>): string {
  const bag: Record<string, string[]> = {};
  for (const key of HOPE_BAG_KEYS) {
    bag[key] = asStringList(data[key]);
  }
  return JSON.stringify(bag);
}

export function unpackHopeBag(raw: unknown): Record<string, string[]> {
  if (typeof raw !== "string") return {};
  const text = raw.trim();
  if (!text.startsWith("{") || !text.endsWith("}")) return {};
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      out[key] = asStringList(value);
    }
    return out;
  } catch {
    return {};
  }
}

export function hopeValues(
  profile: object | null | undefined,
  key: string,
  fallbackKey?: string,
): string[] {
  const row = (profile ?? {}) as Record<string, unknown>;
  const primary = asStringList(row[key]);
  if (primary.length) return primary;
  if (fallbackKey) {
    const extra = asStringList(row[fallbackKey]);
    if (extra.length) return extra;
  }
  return unpackHopeBag(row.pref_community_mode)[key] ?? [];
}

export function joinDisplay(values: string[] | null | undefined, empty = "—"): string {
  const list = [...(values ?? []).filter(Boolean)].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base", numeric: true }),
  );
  return list.length ? list.join(", ") : empty;
}

export function hopeDisplay(value: unknown, anyLabel: string, fallback?: unknown): string {
  const list = asStringList(value);
  const extra = asStringList(fallback);
  return joinDisplay(list.length ? list : extra.length ? extra : [anyLabel]);
}

export function formList(formData: FormData, key: string): string[] {
  const joined = String(formData.get(`${key}__joined`) ?? "").trim();
  const fromJoined = joined
    ? joined.split("|").map((s) => s.trim()).filter(Boolean)
    : [];
  const many = asStringList(
    formData
      .getAll(key)
      .map(String)
      .filter((v) => v !== "undefined" && v !== joined),
  );
  return [...new Set([...fromJoined, ...many])];
}

export function languagesKnown(profile: unknown): string[] {
  const row = (profile ?? {}) as { known_languages?: unknown; hobbies?: unknown };
  const fromLang = asStringList(row.known_languages);
  if (fromLang.length) return fromLang;
  return asStringList(row.hobbies);
}
