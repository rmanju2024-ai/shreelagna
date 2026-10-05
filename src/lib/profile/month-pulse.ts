export type MonthPulse = {
  views: number;
  received: number;
  sent: number;
  accepted: number;
  warmth: number;
};

export function monthAgoIso(now = new Date()) {
  const at = new Date(now.getTime());
  at.setUTCDate(at.getUTCDate() - 30);
  return at.toISOString();
}

export function pulseWarmth(input: Omit<MonthPulse, "warmth">): number {
  const raw = input.views * 4 + input.received * 12 + input.sent * 8 + input.accepted * 20;
  return Math.max(0, Math.min(100, raw));
}

export function pulseNote(warmth: number): string {
  if (warmth >= 60) return "Families are noticing you.";
  if (warmth >= 25) return "A steady, quiet month.";
  return "A still month. A little Discover time helps.";
}

export function tallyMonthPulse(input: {
  views: number;
  received: { created_at?: string | null; status?: string | null; responded_at?: string | null }[];
  sent: { created_at?: string | null; status?: string | null; responded_at?: string | null }[];
  since: string;
}): MonthPulse {
  const since = Date.parse(input.since);
  const inWindow = (iso?: string | null) => {
    const t = iso ? Date.parse(iso) : NaN;
    return Number.isFinite(t) && t >= since;
  };
  const received = input.received.filter((row) => inWindow(row.created_at)).length;
  const sent = input.sent.filter((row) => inWindow(row.created_at)).length;
  const accepted = [...input.received, ...input.sent].filter(
    (row) => row.status === "accepted" && (inWindow(row.responded_at) || inWindow(row.created_at)),
  ).length;
  const views = input.views;
  const stats = { views, received, sent, accepted };
  return { ...stats, warmth: pulseWarmth(stats) };
}
