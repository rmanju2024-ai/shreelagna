import { Suspense } from "react";
import { ChromeSync } from "@/components/chrome-sync";
import { InstallAppRoot } from "@/components/install-app";
import { NavigationFeedback } from "@/components/navigation-feedback";
import { SceneLayer } from "@/components/scene-layer";
import { HeaderSkeleton, SiteFooter, SiteHeader, pageFull, pageInner, readScene } from "@/components/site-chrome";
import { ThemeQuickPicker } from "@/components/theme-quick-picker";

/**
 * Persistent page frame for /app and /browse. It lives in a layout, so the header, clock and menu
 * stay mounted (no blink) while only the page underneath changes.
 */
export async function ChromeLayout({ children }: { children: React.ReactNode }) {
  const scene = await readScene();
  return (
    <InstallAppRoot>
      <div className={`relative flex min-h-dvh w-full flex-col page-scene is-${scene}`}>
        <NavigationFeedback />
        <SceneLayer initial={scene} />
        <Suspense fallback={<HeaderSkeleton overlay={false} />}>
          <SiteHeader overlay={false} glass />
        </Suspense>
        <ThemeQuickPicker initial={scene} />
        <ChromeSync />
        {children}
        <SiteFooter glass />
      </div>
    </InstallAppRoot>
  );
}

/** Page body only; the frame comes from ChromeLayout. */
export function InnerShell({
  children,
  bleed = false,
  full = false,
}: {
  children: React.ReactNode;
  bleed?: boolean;
  full?: boolean;
}) {
  return (
    <main
      className={
        bleed
          ? "app-main is-bleed relative z-10 flex w-full flex-1 flex-col"
          : full
            ? `${pageFull} app-main relative z-10 flex w-full flex-1 flex-col py-5`
            : `${pageInner} app-main relative z-10 flex w-full flex-1 flex-col py-8 sm:py-12`
      }
    >
      {children}
    </main>
  );
}
