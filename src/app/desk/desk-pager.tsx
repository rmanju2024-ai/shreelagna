import Link from "next/link";
import { DESK_PAGE_SIZE } from "@/lib/desk/pager";
import { btnGhost } from "@/lib/ui/classes";

export function DeskPager({
  path,
  page,
  count,
  param = "page",
  extra = {},
  size = DESK_PAGE_SIZE,
  always = false,
}: {
  path: string;
  page: number;
  count: number;
  param?: string;
  extra?: Record<string, string>;
  size?: number;
  always?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(Math.max(0, count) / size));
  if (!always && pages <= 1) return null;
  if (always && count <= 0) return null;
  const start = count === 0 ? 0 : (Math.max(1, page) - 1) * size + 1;
  const end = Math.min(Math.max(1, page) * size, count);

  function href(next: number) {
    const q = new URLSearchParams(extra);
    if (next > 1) q.set(param, String(next));
    else q.delete(param);
    const s = q.toString();
    return s ? `${path}?${s}` : path;
  }

  return (
    <nav className="desk-pager" aria-label="Pages">
      {page > 1 ? (
        <Link href={href(page - 1)} className={btnGhost}>
          Prev
        </Link>
      ) : (
        <span />
      )}
      <span>
        {start}–{end} of {count}
        {pages > 1 ? ` · ${page} / ${pages}` : ""}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className={btnGhost}>
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
