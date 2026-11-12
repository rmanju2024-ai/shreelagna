/** Public member ID: ISO 3166 region + ISO 5218 gender letter + serial. */

export const MEMBER_CODE_PREFIX = "MC";
const LEGACY_WIDTH = 6;
const SERIAL_WIDTH = 8;
const SERIAL_MAX = 99_999_999;

/** ISO 3166-2:IN subdivision codes keyed by our state labels. */
export const INDIA_STATE_ISO: Record<string, string> = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  "Assam": "AS",
  "Bihar": "BR",
  "Chhattisgarh": "CT",
  "Goa": "GA",
  "Gujarat": "GJ",
  "Haryana": "HR",
  "Himachal Pradesh": "HP",
  "Jharkhand": "JH",
  "Karnataka": "KA",
  "Kerala": "KL",
  "Madhya Pradesh": "MP",
  "Maharashtra": "MH",
  "Manipur": "MN",
  "Meghalaya": "ML",
  "Mizoram": "MZ",
  "Nagaland": "NL",
  "Odisha": "OR",
  "Punjab": "PB",
  "Rajasthan": "RJ",
  "Sikkim": "SK",
  "Tamil Nadu": "TN",
  "Telangana": "TS",
  "Tripura": "TR",
  "Uttar Pradesh": "UP",
  "Uttarakhand": "UT",
  "West Bengal": "WB",
  "Andaman and Nicobar Islands": "AN",
  "Chandigarh": "CH",
  "Dadra and Nagar Haveli and Daman and Diu": "DH",
  "Delhi": "DL",
  "Jammu and Kashmir": "JK",
  "Ladakh": "LA",
  "Lakshadweep": "LD",
  "Puducherry": "PY",
};

const COUNTRY_ISO: Record<string, string> = {
  India: "IN",
  "United Arab Emirates": "AE",
  "United States": "US",
  "United Kingdom": "GB",
  Singapore: "SG",
  Canada: "CA",
  Australia: "AU",
  "Saudi Arabia": "SA",
  Kuwait: "KW",
  Qatar: "QA",
  Oman: "OM",
  Bahrain: "BH",
  Malaysia: "MY",
  Nepal: "NP",
  "Sri Lanka": "LK",
};

export type MemberGender = "F" | "M" | "X";

/** ISO 5218: 1 male, 2 female, 9 not applicable → ID letters M / F / X. */
export function genderCode(profileType: string | null | undefined): MemberGender {
  const t = String(profileType ?? "").toLowerCase();
  if (t === "vara" || t === "male" || t === "m" || t === "groom") return "M";
  if (t === "vadhu" || t === "female" || t === "f" || t === "bride") return "F";
  return "X";
}

export function regionCode(input: {
  nativeState?: string | null;
  currentState?: string | null;
  nativeCountry?: string | null;
  currentCountry?: string | null;
}): string {
  const state = String(input.nativeState || input.currentState || "").trim();
  if (state && INDIA_STATE_ISO[state]) return INDIA_STATE_ISO[state];
  const country = String(input.nativeCountry || input.currentCountry || "").trim();
  if (country && country !== "India" && COUNTRY_ISO[country]) return COUNTRY_ISO[country];
  if (country === "India") return "IN";
  return "XX";
}

export function formatMemberCode(
  sequence: number,
  parts?: { region?: string; gender?: MemberGender },
): string {
  if (!Number.isInteger(sequence) || sequence < 1) return "";
  if (!parts) return `SL${String(sequence).padStart(LEGACY_WIDTH, "0")}`;
  const serial = String(Math.min(sequence, SERIAL_MAX)).padStart(SERIAL_WIDTH, "0");
  const region = (parts.region || "XX").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2).padEnd(2, "X");
  const gender = parts.gender === "M" || parts.gender === "F" ? parts.gender : "X";
  return `${MEMBER_CODE_PREFIX}-${region}-${gender}-${serial}`;
}

export function allocateMemberCode(meta?: {
  profileType?: string | null;
  nativeState?: string | null;
  currentState?: string | null;
  nativeCountry?: string | null;
  currentCountry?: string | null;
}): string {
  const n = 1 + Math.floor(Math.random() * SERIAL_MAX);
  return formatMemberCode(n, {
    region: regionCode(meta ?? {}),
    gender: genderCode(meta?.profileType),
  });
}

const NEW_CODE = /^MC-[A-Z]{2}-[FMX]-\d{6,8}$/;
const OLD_CODE = /^SL\d{6,}$/;

export function isMemberCode(value: string | null | undefined): boolean {
  const code = String(value ?? "").trim().toUpperCase();
  return NEW_CODE.test(code) || OLD_CODE.test(code);
}

export function memberCodeLookup(value: string): string {
  return String(value ?? "").trim().toUpperCase();
}
