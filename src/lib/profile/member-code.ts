const PREFIX = "SL";
const WIDTH = 6;

export function formatMemberCode(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) return "";
  return `${PREFIX}${String(sequence).padStart(WIDTH, "0")}`;
}

export function allocateMemberCode(): string {
  const n = 100000 + Math.floor(Math.random() * 900000);
  return formatMemberCode(n);
}

export function isMemberCode(value: string | null | undefined): boolean {
  return Boolean(value && /^SL\d{6,}$/.test(value));
}
