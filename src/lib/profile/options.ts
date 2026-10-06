export const CREATOR_ROLES = [
  { value: "self", label: "Self", hint: "I am the bride or groom" },
  { value: "parent", label: "Parent", hint: "Mother or father" },
  { value: "sister", label: "Sister", hint: "Posting for family" },
  { value: "brother", label: "Brother", hint: "Posting for family" },
  { value: "sibling", label: "Sister or brother", hint: "Posting for family" },
  { value: "guardian", label: "Guardian", hint: "Caretaker of the person" },
  { value: "relative", label: "Relative", hint: "Kept for older profiles" },
  { value: "friend", label: "Friend", hint: "Kept for older profiles" },
  { value: "colleague", label: "Colleague", hint: "Kept for older profiles" },
] as const;

export const PUBLIC_CREATOR_ROLE_VALUES = [
  "self",
  "parent",
  "sister",
  "brother",
  "guardian",
] as const;

export function creatorRolesForForm(current?: string) {
  return CREATOR_ROLES.filter(
    (r) =>
      PUBLIC_CREATOR_ROLE_VALUES.includes(
        r.value as (typeof PUBLIC_CREATOR_ROLE_VALUES)[number],
      ) || r.value === current,
  );
}

/** Maps UI roles onto the original SQL enum if 003 has not been applied yet. */
export function toDbCreatorRelationship(value: string): string {
  if (value === "sister" || value === "brother") return "sibling";
  if (value === "guardian") return "relative";
  return value;
}

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export const MOTHER_TONGUES = [
  "English",
  "Assamese",
  "Bengali",
  "Bodo",
  "Dogri",
  "Gujarati",
  "Hindi",
  "Kannada",
  "Kashmiri",
  "Konkani",
  "Maithili",
  "Malayalam",
  "Manipuri",
  "Marathi",
  "Nepali",
  "Odia",
  "Punjabi",
  "Sanskrit",
  "Santali",
  "Sindhi",
  "Tamil",
  "Telugu",
  "Tulu",
  "Urdu",
  "Other",
] as const;

export const MARITAL_STATUSES = [
  { value: "never_married", label: "Never married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "awaiting_divorce", label: "Awaiting divorce" },
] as const;

export const DIETS = [
  "Eggetarian",
  "Jain",
  "Non-vegetarian",
  "Occasionally non-vegetarian",
  "Vegan",
  "Vegetarian",
] as const;

export const DONT_KNOW = "Don't know";

/** Keep one unknown choice at the top of lists people may not be sure about. */
export function withDontKnow(list: readonly string[]): string[] {
  return [DONT_KNOW, ...list.filter((item) => item !== DONT_KNOW)];
}

export function choiceLabel(value: string) {
  return value === DONT_KNOW ? "Dont Know" : value;
}

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Don't know"] as const;

export const RESIDENCY_STATUSES = [
  "Citizen",
  "Permanent resident",
  "Work visa",
  "Student visa",
  "Overseas citizen",
  "Other",
] as const;

export const HOBBY_OPTIONS = [
  "Art",
  "Cooking",
  "Dance",
  "Movies",
  "Music",
  "Photography",
  "Reading",
  "Shopping",
  "Singing",
  "Social media",
  "Sport",
  "Travel",
  "Writing",
  "Yoga",
] as const;

export const HOPE_ANY = {
  language: "Any language",
  religion: "Any religion",
  community: "Any community",
  state: "Any state",
  city: "Any city",
  country: "Any country",
  education: "Any education",
  occupation: "Any occupation",
  marital: "any",
  diet: "Any diet",
  income: "Any income",
  employed: "Any workplace",
  managed: "Any",
  gothra: "Any gothra",
} as const;

export const PREF_MANAGED = ["Self", "Family"] as const;

export const HOROSCOPE_PREF = ["Yes", "No", "Does not matter"] as const;

/** Seed for `lookup_astronomy`. Forms and validation read through FormLists. */
export const RASHIS = [
  "Mesha (Aries)",
  "Vrishabha (Taurus)",
  "Mithuna (Gemini)",
  "Karka (Cancer)",
  "Simha (Leo)",
  "Kanya (Virgo)",
  "Tula (Libra)",
  "Vrischika (Scorpio)",
  "Dhanu (Sagittarius)",
  "Makara (Capricorn)",
  "Kumbha (Aquarius)",
  "Meena (Pisces)",
] as const;

export const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
] as const;

export const NAKSHATRA_PADAS = ["1", "2", "3", "4"] as const;

export const MANGLIK_OPTIONS = ["Yes", "No", "Partial (Anshik)", "Don't know"] as const;

export const GANAS = ["Dev", "Manushya", "Rakshas"] as const;

export const YONI_ANIMALS = [
  "Horse (Ashwa)",
  "Elephant (Gaja)",
  "Sheep (Mesha)",
  "Serpent (Sarpa)",
  "Dog (Shwan)",
  "Cat (Marjara)",
  "Rat (Mushaka)",
  "Cow (Go)",
  "Buffalo (Mahisha)",
  "Tiger (Vyaghra)",
  "Deer (Mriga)",
  "Monkey (Vanara)",
  "Mongoose (Nakula)",
  "Lion (Simha)",
] as const;

export const HOPE_COUNTRIES = [
  "Any country",
  "India",
  "United Arab Emirates",
  "Singapore",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Other",
] as const;

export const NATIVE_COUNTRIES = [
  "India",
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahrain",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Costa Rica",
  "Croatia",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Egypt",
  "Estonia",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lithuania",
  "Luxembourg",
  "Malaysia",
  "Maldives",
  "Malta",
  "Mauritius",
  "Mexico",
  "Moldova",
  "Mongolia",
  "Morocco",
  "Myanmar",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palestine",
  "Panama",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saudi Arabia",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sweden",
  "Switzerland",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
  "Other",
] as const;

export function isIndiaNative(country?: string | null) {
  return (country ?? "India") === "India";
}

export function displayFirstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || "Member";
}

export function profileKindLabel(type: string | null | undefined): string {
  return type === "vara" ? "Groom / Vara" : "Bride / Vadhu";
}

export function postedAsLabel(rel: string | null | undefined, _profileType?: string | null): string {
  if (!rel || rel === "self") return "Created by Self";
  if (rel === "parent") return "Created by Family";
  if (rel === "sister") return "Created by Sister";
  if (rel === "brother") return "Created by Brother";
  return "Created by Family";
}

export function parentLine(name?: unknown, work?: unknown, empty = ""): string {
  const n = typeof name === "string" ? name.trim() : "";
  const w = typeof work === "string" ? work.trim() : "";
  if (n && w) {
    if (w.toLowerCase().includes(n.toLowerCase())) return w;
    return `${n}, ${w}`;
  }
  return n || w || empty;
}

function asCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Combine sibling total with how many are married. */
export function siblingLine(total: unknown, married: unknown, empty = "—"): string {
  const n = asCount(total);
  if (n == null) return empty;
  if (n === 0) return "0";
  const raw = asCount(married);
  if (raw == null) return String(n);
  const wed = Math.min(Math.max(0, raw), n);
  const unwed = n - wed;
  if (wed === 0) return `${n} (Unmarried)`;
  if (unwed === 0) return `${n} (Married)`;
  return `${n} (${wed} Married & ${unwed} Unmarried)`;
}

export const FAMILY_STATUSES = [
  "Lower middle class",
  "Middle class",
  "Upper middle class",
  "Upper class",
  "Prefer not to say",
] as const;

export const SETTLE_ABROAD = ["Yes", "No", "Open", "Don't know"] as const;

/** How a parent earns a living, or that they have passed away — used to write the family line. */
export const PARENT_PROFESSIONS = [
  "Homemaker",
  "Employed",
  "Government employee",
  "Business",
  "Farmer",
  "Teacher",
  "Doctor",
  "Engineer",
  "Professional",
  "Retired",
  "Retired from government service",
  "Retired businessman",
  "Retired farmer",
  "Passed away",
  "Passed away · was employed",
  "Passed away · was in business",
  "Passed away · was a farmer",
  "Don't know",
] as const;

export const LIVING_ARRANGEMENTS = ["Own house", "Parents' house", "Rented", "Leased"] as const;

export const PHYSICAL_STATUSES = [
  "No disability",
  "Has a disability",
  "Prefer not to say",
  "Don't know",
] as const;

export function maritalLabel(value: string | null | undefined): string {
  if (value === "any") return "Any marital status";
  return MARITAL_STATUSES.find((m) => m.value === value)?.label ?? value ?? "";
}

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const PROFILE_FORM_DEFAULTS = {
  creator_relationship: "self",
  profile_type: "vadhu",
  subject_full_name: "Ananya Sharma",
  height_cm: 165,
  mother_tongue: "English",
  marital_status: "never_married",
  diet: "Vegetarian",
  native_state: "Delhi",
  current_city: "New Delhi",
  qualification: "B.E. / B.Tech",
  occupation: "Software professional",
  employed_in: "Private company",
  income_band: "₹10–15 lakh",
  employer_name: "",
  family_type: "Nuclear",
  pref_age_min: 24,
  pref_age_max: 36,
  pref_height_min: 150,
  pref_height_max: 180,
  pref_marital: "any",
  pref_education: "Any education",
  pref_occupation: "Any occupation",
  pref_country: "Any country",
  pref_state: "Any state",
  pref_notes: "",
  subject_mobile: "9876543210",
  prefer_not_community: false,
  about:
    "A warm, family-oriented person who values kindness, education, and a respectful home. Looking to meet a considered family for a life of shared faith and care.",
} as const;
