import Link from "next/link";

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group brand-mark flex min-w-0 items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/shreelagna-crest-3d.png"
        alt="Shree Lagna"
        width={88}
        height={88}
        className="logo-3d h-16 w-16 shrink-0 object-contain drop-shadow-[0_12px_22px_rgba(47,22,14,0.45)] sm:h-[88px] sm:w-[88px]"
      />
      <span className="brand-wordmark flex min-w-0 flex-col leading-tight">
        <span
          className={`font-[family-name:var(--font-display)] text-[1.65rem] tracking-tight sm:text-4xl ${light ? "text-[#fff7ea] drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]" : "text-[var(--ink)]"}`}
        >
          Shree Lagna
        </span>
        <span
          className={`mt-1 text-[12px] font-medium uppercase tracking-[0.2em] sm:text-sm ${light ? "text-[var(--gold-soft)]" : "text-[var(--gold)]"}`}
        >
          Everyone welcome
        </span>
      </span>
    </Link>
  );
}
