import Link from "next/link";
import { SITE_BRAND, SITE_TAGLINE } from "@/lib/brand";
import { GardenMark } from "@/components/garden-mark";
import { SiteName } from "@/components/site-name";

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group brand-mark flex min-w-0 items-center gap-3" aria-label={SITE_BRAND}>
      <GardenMark size="logo" />
      <span className="brand-wordmark flex min-w-0 flex-col leading-tight">
        <span className="font-[family-name:var(--font-display)] text-[1.65rem] tracking-tight sm:text-4xl">
          <SiteName light={light} />
        </span>
        <span className={`brand-tagline ${light ? "is-light" : ""}`}>{SITE_TAGLINE.replace(/\.$/, "")}</span>
      </span>
    </Link>
  );
}
