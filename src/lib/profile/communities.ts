export type CommunityRow = { id: string; name: string; religion_id: string };

type CommunityInput = {
  id?: string | null;
  name?: string | null;
  religion_id?: string | null;
};

function communityKey(name: string): string {
  let s = name.toLowerCase().trim();
  s = s.replace(/^brahmin\s*[-–]\s*/, "");
  s = s.replace(/\s+brahmin$/, "");
  s = s.replace(/namboothiri/g, "namboodiri");
  s = s.replace(/[^a-z0-9]+/g, "");
  if (s === "bunt") s = "buntshetty";
  if (s === "otherhindu" || s === "othercommunity") s = "other";
  return s;
}

function keepScore(name: string): number {
  return (name.includes(" - ") || name.includes("/") ? 1000 : 0) + name.length;
}

/** One row per religion + caste, preferring the Shaadi-style label. */
export function uniqueCommunities(rows: CommunityInput[]): CommunityRow[] {
  const best = new Map<string, CommunityRow>();
  for (const row of rows) {
    const name = row.name?.trim();
    if (!row.id || !row.religion_id || !name) continue;
    const next = { id: row.id, name, religion_id: row.religion_id };
    const key = `${next.religion_id}:${communityKey(name)}`;
    const prev = best.get(key);
    if (!prev || keepScore(name) > keepScore(prev.name)) best.set(key, next);
  }
  return [...best.values()].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}
