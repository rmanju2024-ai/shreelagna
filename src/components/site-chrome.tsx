import { Suspense } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { LiveClock } from "@/components/live-clock";
import { getAuth, ensureAppUser } from "@/lib/auth/session";
import { KalyanBanner } from "@/components/home/kalyan-banner";
import { HeaderNav } from "@/components/site-nav";
import { SceneLayer } from "@/components/scene-layer";
import { collapseNotices } from "@/lib/match/collapse-notices";
import { unreadNoticeBadge } from "@/lib/notices/unread-badge";
import { effectiveInterestStatus } from "@/lib/match/interest-status";
import { isPublicProfileStatus } from "@/lib/profile/visibility";
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
  let likesPending = 0;
  if (user && supabase) {
    const me = await ensureAppUser(supabase, user);
    staff = me?.role === "service" || me?.role === "admin";
    houseStar = me?.role === "admin" ? "admin" : me?.role === "service" ? "staff" : undefined;
    if (me) {
      const [badge, waitingResult] = await Promise.all([
        unreadNoticeBadge(me.id).catch(async () => {
          const { data: unread } = await supabase
            .from("notices")
            .select("id, kind, match_profile_id, created_at")
            .eq("user_id", me.id)
            .is("read_at", null)
            .order("created_at", { ascending: false })
            .limit(80);
          const open = collapseNotices(unread ?? []);
          return {
            chatUnread: open.filter((row) => row.kind === "chat").length,
            alertUnread: open.filter((row) => row.kind !== "chat").length,
          };
        }),
        me.active_profile_id
          ? supabase
              .from("interests")
              .select("from_profile_id, status, created_at")
              .eq("to_profile_id", me.active_profile_id)
              .eq("status", "pending")
              .limit(100)
          : Promise.resolve({ data: [] }),
      ]);
      chatUnread = badge.chatUnread;
      alertUnread = badge.alertUnread;
      if (me.active_profile_id) {
        // Likes badge = pending interests actually waiting in Likes > Received (same rules as that page).
        const waiting = waitingResult.data ?? [];
        const senderIds = [...new Set((waiting ?? []).map((row) => row.from_profile_id))];
        const { data: senders } = senderIds.length
          ? await supabase.from("profiles").select("id, status").in("id", senderIds)
          : { data: [] as { id: string; status: string }[] };
        const live = new Set((senders ?? []).filter((p) => isPublicProfileStatus(p.status)).map((p) => p.id));
        likesPending = (waiting ?? []).filter(
          (row) => live.has(row.from_profile_id) && effectiveInterestStatus(row.status, row.created_at) === "pending",
        ).length;
      }
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
            likesPending={likesPending}
          />
        </Suspense>
      </div>
    </header>
  );
}

function HeaderSkeleton({ overlay }: { overlay: boolean }) {
  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-50 w-full border-b border-white/15"
          : "sticky top-0 z-40 w-full border-b border-[var(--gold)]/25 bg-[var(--paper)]/50 backdrop-blur-xl"
      }
    >
      <div className={`${pageInner} site-head-inner flex min-h-24 items-center gap-4 py-3 sm:min-h-[6.5rem]`}>
        <BrandMark light={overlay} />
      </div>
    </header>
  );
}

export function SiteFooter({ glass = false }: { glass?: boolean }) {
  return (
    <footer
      className={`site-footer ${
        glass
          ? "relative z-20 mt-auto w-full border-t border-[var(--gold)]/30 bg-[#3f0e0d]/70 backdrop-blur-xl"
          : "relative z-20 mt-auto w-full border-t border-[var(--gold)]/35 bg-[#3f0e0d]"
      }`}
    >
      <div className={`${pageInner} site-footer-inner`}>
        <Link href="/" className="site-footer-brand" aria-label="Shree Lagna home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/graphics/shreelagna-crest-3d.png" alt="" width={36} height={36} />
          <span>Shree Lagna</span>
        </Link>
        <nav className="site-footer-links" aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/contact">Help</Link>
        </nav>
        <p>Adults only · Indian families · Private introductions</p>
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
}: {
  children: React.ReactNode;
  bleed?: boolean;
  full?: boolean;
  overlay?: boolean;
  atmosphere?: boolean;
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
      <Suspense fallback={<HeaderSkeleton overlay={overlay} />}>
        <SiteHeader overlay={overlay} glass={!overlay} />
      </Suspense>
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
