import Link from "next/link";
import { SITE_BRAND } from "@/lib/brand";
import { BrandCrest } from "@/components/brand-crest";
import { SiteName } from "@/components/site-name";

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group brand-mark flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3" aria-label={SITE_BRAND}>
      <BrandCrest />
      <span className="brand-wordmark flex min-w-0 flex-col justify-center leading-none gap-[0.18rem]">
        <span className="font-[family-name:var(--font-display)] text-[1.55rem] tracking-tight sm:text-[2rem]">
          <SiteName light={light} />
        </span>
        <span className={`brand-header-tagline${light ? " is-light" : ""}`}>
          Where hearts unite and families bloom.
        </span>
      </span>
    </Link>
  );
}
