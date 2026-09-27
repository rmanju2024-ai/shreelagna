import { Suspense } from "react";
import { cookies } from "next/headers";
import { BrandMark } from "@/components/brand-mark";
import { LiveClock } from "@/components/live-clock";
import { getAuth, ensureAppUser } from "@/lib/auth/session";
import { KalyanBanner } from "@/components/home/kalyan-banner";
import { HeaderNav } from "@/components/site-nav";
import { SceneLayer } from "@/components/scene-layer";
import { collapseNotices } from "@/lib/match/collapse-notices";
import { SyncSession } from "@/components/sync-session";
import { parseScene, SCENE_COOKIE } from "@/lib/ui/scenes";

export const pageInner = "mx-auto w-full max-w-[115rem] px-6 sm:px-8 lg:px-12";
export const pageFull = "mx-auto w-full px-4 sm:px-6 lg:px-8";

async function readScene() {
  return parseScene((await cookies()).get(SCENE_COOKIE)?.value);
}

export async function SiteHeader({ overlay = false, glass = false }: { overlay?: boolean; glass?: boolean }) {
  const { user, supabase } = await getAuth();
  let staff = false;
  let houseStar: "admin" | "staff" | undefined;
  let chatUnread = 0;
  let alertUnread = 0;
  if (user && supabase) {
    const me = await ensureAppUser(supabase, user);
    staff = me?.role === "service" || me?.role === "admin";
    houseStar = me?.role === "admin" ? "admin" : me?.role === "service" ? "staff" : undefined;
    if (me) {
      const { data: unread } = await supabase
        .from("notices")
        .select("id, kind, match_profile_id, created_at")
        .eq("user_id", me.id)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      const open = collapseNotices(unread ?? []);
      chatUnread = open.filter((row) => row.kind === "chat").length;
      alertUnread = open.filter((row) => row.kind !== "chat").length;
    }
  }

  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-50 w-full border-b border-white/15 bg-gradient-to-b from-black/70 via-black/35 to-transparent"
          : glass
            ? "sticky top-0 z-40 w-full border-b border-[var(--gold)]/25 bg-[var(--paper)]/50 backdrop-blur-xl"
            : "sticky top-0 z-40 w-full border-b border-[var(--stroke)]/80 bg-[var(--paper)]"
      }
    >
      <div className={`${pageInner} site-head-inner flex min-h-24 items-center justify-between gap-4 py-3 sm:min-h-[6.5rem]`}>
        <div className="site-head-brand flex min-w-0 items-center gap-5 sm:gap-8">
          <BrandMark light={overlay} />
          <LiveClock light={overlay} />
        </div>
        <SyncSession guest={!user} />
        <Suspense fallback={null}>
          <HeaderNav
            overlay={overlay}
            user={Boolean(user)}
            staff={staff}
            houseStar={houseStar}
            chatUnread={chatUnread}
            alertUnread={alertUnread}
          />
        </Suspense>
      </div>
    </header>
  );
}

export function SiteFooter({ glass = false }: { glass?: boolean }) {
  return (
    <footer
      className={
        glass
          ? "relative z-20 mt-auto w-full border-t border-[var(--gold)]/30 bg-[#3f0e0d]/70 backdrop-blur-xl"
          : "relative z-20 mt-auto w-full border-t border-[var(--gold)]/35 bg-[#3f0e0d]"
      }
    >
      <div className={`${pageInner} flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between`}>
        <BrandMark light />
        <p className="text-sm leading-relaxed text-[#e7d3b0] sm:text-right">
          Adults only · Indian families · Private introductions
        </p>
      </div>
    </footer>
  );
}

export async function PageShell({
  children,
  bleed = false,
  full = false,
  overlay = false,
  atmosphere,
  honeymoon = false,
}: {
  children: React.ReactNode;
  bleed?: boolean;
  full?: boolean;
  overlay?: boolean;
  atmosphere?: boolean;
  honeymoon?: boolean;
}) {
  const scene = await readScene();
  const showAtmosphere = atmosphere === true;
  return (
    <div className={`relative flex min-h-dvh w-full flex-col page-scene is-${scene}`}>
      <SceneLayer initial={scene} />
      {showAtmosphere ? (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <KalyanBanner intensity="wash" />
        </div>
      ) : null}
      <SiteHeader overlay={overlay} glass={!overlay} />
      <main
        className={
          bleed
            ? "relative z-10 flex w-full flex-1 flex-col"
            : full
              ? `${pageFull} relative z-10 flex w-full flex-1 flex-col py-5`
              : `${pageInner} relative z-10 flex w-full flex-1 flex-col py-8 sm:py-12`
        }
      >
        {children}
      </main>
      <SiteFooter glass />
    </div>
  );
}
