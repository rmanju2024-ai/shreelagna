import { CITIES_BY_STATE } from "@/lib/profile/cities-by-state";
import { INDIAN_STATES } from "@/lib/profile/options";

export { CITIES_BY_STATE };

export const EDUCATION_OPTIONS = [
  "No formal schooling",
  "Up to 10th",
  "Up to 12th",
  "Diploma",
  "ITI",
  "Pursuing 12th",
  "Pursuing diploma",
  "Pursuing bachelor's",
  "Pursuing master's",
  "B.A.",
  "B.Com",
  "B.Sc",
  "B.E. / B.Tech",
  "BCA",
  "BBA",
  "B.Pharm",
  "B.Arch",
  "LL.B.",
  "MBBS",
  "BDS",
  "B.Ed",
  "BAMS",
  "BHMS",
  "M.A.",
  "M.Com",
  "M.Sc",
  "M.E. / M.Tech",
  "MBA",
  "MCA",
  "M.Pharm",
  "LL.M.",
  "MD / MS",
  "M.Phil",
  "Ph.D.",
  "CA",
  "CS",
  "CMA",
] as const;

export const VAGUE_EDUCATIONS = ["Graduate", "Postgraduate"] as const;

export function specificEducations(names: readonly string[]): string[] {
  const vague = new Set<string>(VAGUE_EDUCATIONS);
  return names.filter((name) => !vague.has(name));
}

export const OCCUPATION_OPTIONS = [
  "Student",
  "Software professional",
  "Data analyst / scientist",
  "Cybersecurity professional",
  "Product manager",
  "Project manager",
  "UI / UX designer",
  "Engineer",
  "Civil engineer",
  "Mechanical engineer",
  "Electrical engineer",
  "Electronics engineer",
  "Chemical engineer",
  "Aviation professional",
  "Merchant navy",
  "Doctor",
  "Medical specialist",
  "Physiotherapist",
  "Psychologist / counsellor",
  "Dentist",
  "Nurse",
  "Pharmacist",
  "Veterinarian",
  "Healthcare administrator",
  "Teacher",
  "Professor",
  "Researcher / scientist",
  "Librarian",
  "Government employee",
  "Civil services",
  "Judiciary",
  "Bank employee",
  "Financial analyst",
  "Investment professional",
  "Insurance professional",
  "Accountant",
  "Defence",
  "Police",
  "Fire and emergency services",
  "Lawyer",
  "Chartered accountant",
  "Company secretary",
  "Cost accountant",
  "Auditor",
  "Tax consultant",
  "Architect",
  "Interior designer",
  "Designer",
  "Artist / illustrator",
  "Photographer / videographer",
  "Fashion professional",
  "Journalist",
  "Writer / editor",
  "Media / entertainment",
  "Public relations",
  "Consultant",
  "Manager",
  "Human resources",
  "Operations professional",
  "Customer success / support",
  "Legal professional",
  "Business",
  "Self-employed",
  "Entrepreneur / startup founder",
  "Freelancer",
  "Real estate professional",
  "Hospitality / tourism",
  "Chef / culinary professional",
  "Retail / e-commerce",
  "Logistics / supply chain",
  "Manufacturing professional",
  "Construction professional",
  "Sales",
  "Marketing",
  "Digital marketing",
  "Advertising professional",
  "Social worker / NGO",
  "Religious / spiritual services",
  "Agriculture",
  "Farmer",
  "Dairy / food business",
  "Skilled trade / technician",
  "Homemaker",
  "Retired",
  "Looking for work",
  "Not working",
  "Other profession",
] as const;

export const HEIGHT_CM_OPTIONS = Array.from({ length: 81 }, (_, i) => 140 + i);

export function citiesForState(state: string | null | undefined): readonly string[] {
  if (!state) return [];
  return CITIES_BY_STATE[state as (typeof INDIAN_STATES)[number]] ?? [];
}

export function isListedCity(state: string | null | undefined, city: string): boolean {
  return citiesForState(state).includes(city);
}

function incomeBandsEveryFiveLakh(): string[] {
  const bands = ["Prefer not to say", "Student / not earning"];
  for (let from = 0; from < 100; from += 5) {
    const to = from + 5;
    if (from === 0) bands.push("Up to ₹5 lakh");
    else if (to === 100) bands.push("₹95 lakh–₹1 crore");
    else bands.push(`₹${from}–${to} lakh`);
  }
  bands.push("Above ₹1 crore");
  return bands;
}

export const INCOME_BANDS = incomeBandsEveryFiveLakh();

/** Partner hopes: a floor, not a closed band. No student or prefer-not-to-say. */
export const HOPE_INCOME_BANDS = [
  "Greater than ₹5 lakh",
  "Greater than ₹10 lakh",
  "Greater than ₹15 lakh",
  "Greater than ₹20 lakh",
  "Greater than ₹25 lakh",
  "Greater than ₹30 lakh",
  "Greater than ₹35 lakh",
  "Greater than ₹40 lakh",
  "Greater than ₹45 lakh",
  "Greater than ₹50 lakh",
  "Greater than ₹60 lakh",
  "Greater than ₹75 lakh",
  "Greater than ₹1 crore",
] as const;

export const EMPLOYED_IN = [
  "Student",
  "Private company",
  "Government",
  "Defence",
  "Public sector",
  "Business / self-employed",
  "Startup",
  "Family business",
  "Non-profit / NGO",
  "Freelance / contract",
  "Work from home",
  "Overseas employer",
  "Professional practice",
  "Retired",
  "Not working",
] as const;

export const FAMILY_TYPES = ["Nuclear", "Joint", "Other"] as const;

export const HABITS = ["No", "Occasionally", "Yes"] as const;
