/** India-first mobile digits. Returns 12-digit 91XXXXXXXXXX or null. */
export function digitsOnly(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "");
}

function isTenDigitMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value);
}

export function toWhatsAppNumber(value: string | null | undefined): string | null {
  let digits = digitsOnly(value);
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91") && isTenDigitMobile(digits.slice(2))) return digits;
  if (digits.length === 10 && isTenDigitMobile(digits)) return `91${digits}`;
  return null;
}

export function isIndiaMobile(value: string | null | undefined): boolean {
  const n = toWhatsAppNumber(value);
  return Boolean(n && n.length === 12 && n.startsWith("91"));
}
