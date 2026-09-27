import { ageFromDob, formatBirthWithAge } from "@/lib/profile/completeness";
import { VAGUE_EDUCATIONS } from "@/lib/profile/catalog";
import { profileKindLabel } from "@/lib/profile/options";
import { GAP_TO_SECTION, SECTION_TITLES } from "@/lib/profile/sections";

export const PORTRAIT_CHECK_COUNT = 25;

export function portraitReadiness(gapCount: number): { percent: number; label: string } {
  const closed = Math.max(0, PORTRAIT_CHECK_COUNT - Math.max(0, gapCount));
  const percent = Math.round((closed / PORTRAIT_CHECK_COUNT) * 100);
  if (percent >= 100) return { percent: 100, label: "Ready for families" };
  if (percent >= 80) return { percent, label: "Almost ready" };
  if (percent >= 50) return { percent, label: "Taking shape" };
  return { percent, label: "Getting started" };
}

export function houseReading(input: {
  profileType: string;
  dateOfBirth: string | null;
  currentCity: string | null;
  nativeState: string | null;
  qualification: string | null;
  occupation: string | null;
  employerName?: string | null;
  incomeBand?: string | null;
  prefNotes?: string | null;
  hasPhoto: boolean;
}): string[] {
  const notes: string[] = [];
  const kind = profileKindLabel(input.profileType);
  const age = input.dateOfBirth ? ageFromDob(input.dateOfBirth) : null;
  const born = input.dateOfBirth ? formatBirthWithAge(input.dateOfBirth) : null;
  if (born && age) {
    notes.push(`${kind}, born ${born}.`);
  } else if (age) {
    notes.push(`${kind}, ${age.years} years of age.`);
  }
  const place = [input.currentCity, input.nativeState].filter(Boolean).join(", ");
  if (place) notes.push(`Lives in ${place}.`);
  if (input.occupation) {
    const company = input.employerName?.trim();
    const pay =
      input.incomeBand && input.incomeBand !== "Prefer not to say"
        ? ` Annual income ${input.incomeBand}.`
        : "";
    notes.push(
      company
        ? `Works as ${input.occupation} at ${company}.${pay}`
        : `Works as ${input.occupation}.${pay}`,
    );
  }
  if (input.qualification && !new Set<string>(VAGUE_EDUCATIONS).has(input.qualification)) {
    notes.push(`Education: ${input.qualification}.`);
  }
  if (input.prefNotes?.trim()) {
    notes.push(`Partner preference: ${input.prefNotes.trim()}`);
  }
  if (!input.hasPhoto) {
    notes.push("A clear photograph still needs to be added to the album.");
  }
  return notes.slice(0, 5);
}

export function nextHouseAction(gaps: { key: string; label: string }[]): {
  hrefSuffix: string;
  title: string;
  detail: string;
} {
  const first = gaps[0];
  const target = first ? GAP_TO_SECTION[first.key] : undefined;
  if (target === "album" || gaps.some((g) => g.key === "photo")) {
    return {
      hrefSuffix: "?edit=1&section=album#album",
      title: "Add a photograph",
      detail: "One clear photo for the album.",
    };
  }
  if (target) {
    return {
      hrefSuffix: `?edit=1&section=${target}`,
      title: `Edit ${SECTION_TITLES[target]}`,
      detail: first?.label ?? "A few fields are still open.",
    };
  }
  if (gaps.length) {
    return {
      hrefSuffix: "?edit=1",
      title: "Complete the remaining details",
      detail: gaps[0]?.label ?? "A few fields are still open.",
    };
  }
  return {
    hrefSuffix: "/browse",
    title: "Browse matches",
    detail: "The profile is ready.",
  };
}
