export const WELCOME_DAYS = 61;
export const WELCOME_INTEREST_LIMIT = 20;

export function planBenefitLines(interestLimit: number): string[] {
  return [
    `${interestLimit} interests or views`,
    "Chat as soon as you send interest",
    "Search and shortlist families",
    "Open contact on a counted view",
  ];
}

export type PlanCard = {
  code: string;
  name: string;
  tagline: string;
  months: number;
  priceInr: number;
  featured: boolean;
  forSale: boolean;
  sortOrder: number;
  interestLimit: number;
  perks: string[];
};

export const SALE_PLANS: PlanCard[] = [
  {
    code: "silver",
    name: "Silver",
    tagline: "Three months of match access after the welcome gift.",
    months: 3,
    priceInr: 1499,
    featured: false,
    forSale: true,
    sortOrder: 1,
    interestLimit: 40,
    perks: planBenefitLines(40),
  },
  {
    code: "gold",
    name: "Gold",
    tagline: "The usual house plan — six months, one payment.",
    months: 6,
    priceInr: 2499,
    featured: true,
    forSale: true,
    sortOrder: 2,
    interestLimit: 80,
    perks: planBenefitLines(80),
  },
  {
    code: "platinum",
    name: "Platinum",
    tagline: "A full year if the search may take longer.",
    months: 12,
    priceInr: 3999,
    featured: false,
    forSale: true,
    sortOrder: 3,
    interestLimit: 150,
    perks: planBenefitLines(150),
  },
];

export type PlanRow = {
  code?: string | null;
  name?: string | null;
  tagline?: string | null;
  months?: number | null;
  price_inr?: number | null;
  featured?: boolean | null;
  for_sale?: boolean | null;
  sort_order?: number | null;
  interest_limit?: number | null;
  perks?: string[] | string | null;
};

export function slugPlanCode(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function isPlanCode(value: string): boolean {
  return /^[a-z][a-z0-9_-]{0,31}$/.test(value) && value !== "welcome";
}

export function parsePerks(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.map((item) => String(item))
    : String(value ?? "").split(/\r?\n|,/);
  const out: string[] = [];
  for (const item of raw) {
    const line = item.trim();
    if (line && !out.includes(line)) out.push(line.slice(0, 80));
  }
  return out.slice(0, 8);
}

export function clampMonths(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 3;
  return Math.min(36, Math.max(1, n));
}

export function clampPrice(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.min(999999, Math.max(0, n));
}

export function clampInterestLimit(value: unknown, fallback = 80): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(9999, Math.max(1, n));
}

export function mapPlanRow(row: PlanRow): PlanCard | null {
  const code = slugPlanCode(String(row.code ?? ""));
  const name = String(row.name ?? "").trim();
  if (!isPlanCode(code) || !name) return null;
  return {
    code,
    name: name.slice(0, 40),
    tagline: String(row.tagline ?? "").trim().slice(0, 160),
    months: clampMonths(row.months),
    priceInr: clampPrice(row.price_inr),
    featured: Boolean(row.featured),
    forSale: row.for_sale !== false,
    sortOrder: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
    interestLimit: clampInterestLimit(
      row.interest_limit,
      SALE_PLANS.find((plan) => plan.code === code)?.interestLimit ?? 80,
    ),
    perks: parsePerks(row.perks),
  };
}

export function planByCode(code: string | null | undefined, plans: PlanCard[] = SALE_PLANS): PlanCard | null {
  return plans.find((plan) => plan.code === code) ?? SALE_PLANS.find((plan) => plan.code === code) ?? null;
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function perkText(perks: string[]): string {
  return perks.join("\n");
}

export function readPlanForm(form: FormData, codeRaw?: string): PlanCard | null {
  const code = slugPlanCode(codeRaw ?? String(form.get("code") ?? ""));
  return mapPlanRow({
    code,
    name: String(form.get("name") ?? ""),
    tagline: String(form.get("tagline") ?? ""),
    months: Number(form.get("months")),
    price_inr: Number(form.get("price")),
    featured: form.get("featured") === "on",
    for_sale: form.get("for_sale") === "on",
    sort_order: Number(form.get("sort_order")),
    interest_limit: Number(form.get("interest_limit")),
    perks: String(form.get("perks") ?? ""),
  });
}
