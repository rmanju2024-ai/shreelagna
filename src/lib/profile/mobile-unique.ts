import { digitsOnly, indiaMobileDisplay, toWhatsAppNumber } from "@/lib/notify/phone";

export const MOBILE_IN_USE = "This mobile is already used on another profile. Enter a different number.";

export function mobileKey(value: string | null | undefined): string | null {
  const wa = toWhatsAppNumber(value);
  if (wa && wa.length === 12 && wa.startsWith("91")) return wa.slice(2);
  const display = indiaMobileDisplay(value);
  return display.length === 10 ? display : null;
}

export function mobileLookupValues(value: string | null | undefined): string[] {
  const key = mobileKey(value);
  const wa = toWhatsAppNumber(value);
  const extra = indiaMobileDisplay(value);
  return [...new Set([key, wa, extra, key ? `91${key}` : null, key ? `0${key}` : null].filter((item): item is string => Boolean(item)))];
}

export function sameIndiaMobile(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = mobileKey(a);
  const right = mobileKey(b);
  return Boolean(left && right && left === right);
}

type ProfileClient = {
  from: (table: string) => {
    select: (cols: string) => {
      in: (
        col: string,
        values: string[],
      ) => PromiseLike<{ data: { id: string; subject_mobile?: string | null }[] | null }>;
    };
  };
};

export async function findProfileUsingMobile(
  db: ProfileClient,
  mobile: string,
  exceptProfileId?: string | null,
): Promise<{ id: string } | null> {
  const key = mobileKey(mobile);
  const variants = mobileLookupValues(mobile);
  if (!key || !variants.length) return null;
  const { data } = await db.from("profiles").select("id, subject_mobile").in("subject_mobile", variants);
  const hit = (data ?? []).find((row) => {
    if (exceptProfileId && row.id === exceptProfileId) return false;
    return sameIndiaMobile(row.subject_mobile, key) || digitsOnly(row.subject_mobile).endsWith(key);
  });
  return hit ? { id: hit.id } : null;
}
