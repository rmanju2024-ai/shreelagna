import { NAKSHATRAS, RASHIS } from "@/lib/profile/options";

export type KundaliInput = {
  rashi?: string | null;
  nakshatra?: string | null;
  gana?: string | null;
  yoni?: string | null;
  manglik?: string | null;
};

export type KundaliPart = { k: string; score: number; max: number };

export type KundaliScore = {
  total: number;
  max: 36;
  parts: KundaliPart[];
  label: string;
};

function indexOf(list: readonly string[], value: string | null | undefined): number {
  if (!value) return -1;
  const needle = value.trim().toLowerCase();
  return list.findIndex((item) => item.toLowerCase() === needle);
}

function yoniKey(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value.split("(")[0].trim().toLowerCase();
}

function ganaScore(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0;
  if (a === b) return 6;
  const pair = new Set([a, b]);
  if (pair.has("Dev") && pair.has("Manushya")) return 5;
  if (pair.has("Dev") && pair.has("Rakshas")) return 1;
  return 0;
}

function yoniScore(a: string | null | undefined, b: string | null | undefined): number {
  const left = yoniKey(a);
  const right = yoniKey(b);
  if (!left || !right) return 0;
  return left === right ? 4 : 2;
}

function taraScore(a: string | null | undefined, b: string | null | undefined): number {
  const i = indexOf(NAKSHATRAS, a);
  const j = indexOf(NAKSHATRAS, b);
  if (i < 0 || j < 0) return 0;
  const count = ((j - i + NAKSHATRAS.length) % NAKSHATRAS.length) + 1;
  const remainder = count % 9;
  return remainder === 2 || remainder === 4 || remainder === 6 || remainder === 8 || remainder === 0 ? 3 : 1;
}

function rashiScore(a: string | null | undefined, b: string | null | undefined): number {
  const i = indexOf(RASHIS, a);
  const j = indexOf(RASHIS, b);
  if (i < 0 || j < 0) return 0;
  if (i === j) return 7;
  const gap = Math.min(Math.abs(i - j), 12 - Math.abs(i - j));
  if (gap === 6) return 0;
  if (gap === 1 || gap === 5) return 5;
  return 4;
}

function manglikScore(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 4;
  const yes = (v: string) => v.toLowerCase().startsWith("yes");
  const no = (v: string) => v.toLowerCase() === "no";
  if ((yes(a) && yes(b)) || (no(a) && no(b))) return 8;
  if (yes(a) !== yes(b) && (yes(a) || yes(b))) return 2;
  return 5;
}

export function kundaliLabel(total: number): string {
  if (total >= 24) return "Favourable";
  if (total >= 18) return "Average";
  return "Needs care";
}

export function kundaliInputFromProfile(profile: Record<string, unknown> | null | undefined): KundaliInput {
  if (!profile) return {};
  const text = (key: string) => (typeof profile[key] === "string" ? (profile[key] as string) : null);
  return {
    rashi: text("rashi"),
    nakshatra: text("nakshatra"),
    gana: text("gana"),
    yoni: text("yoni_animal") || text("yoni"),
    manglik: text("manglik"),
  };
}

export function kundaliScore(a: KundaliInput, b: KundaliInput): KundaliScore {
  const parts: KundaliPart[] = [
    { k: "Gana", score: ganaScore(a.gana, b.gana), max: 6 },
    { k: "Yoni", score: yoniScore(a.yoni, b.yoni), max: 4 },
    { k: "Tara", score: taraScore(a.nakshatra, b.nakshatra), max: 3 },
    { k: "Rashi", score: rashiScore(a.rashi, b.rashi), max: 7 },
    { k: "Mangalik", score: manglikScore(a.manglik, b.manglik), max: 8 },
  ];
  const filled = [a.rashi, a.nakshatra, b.rashi, b.nakshatra].filter(Boolean).length;
  parts.push({ k: "Details", score: filled === 4 ? 8 : filled >= 2 ? 4 : 0, max: 8 });
  const total = parts.reduce((sum, part) => sum + part.score, 0);
  return { total, max: 36, parts, label: kundaliLabel(total) };
}
