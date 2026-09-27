export const DESK_PAGE_SIZE = 20;

export function deskPage(raw?: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function deskRange(page: number, size = DESK_PAGE_SIZE): { from: number; to: number } {
  const from = (Math.max(1, page) - 1) * size;
  return { from, to: from + size - 1 };
}
