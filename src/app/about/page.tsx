import type { Metadata } from "next";
import { Suspense } from "react";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { PageHero } from "@/components/page-hero";
import { getAuth } from "@/lib/auth/session";
import { loadMemberSupportRequests } from "@/lib/desk/member-requests";
import { createServiceClient } from "@/lib/supabase/server";
import { AboutHelpTabs } from "./tabs";

export const metadata: Metadata = {
  title: "About & Help",
  description: "The house behind MarriageConnect — and how to reach us.",
};

export default async function AboutPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ supabase, user }] = await Promise.all([getAuth(), searchParams]);
  const db = createServiceClient() ?? supabase;
  const requests =
    user && db ? await loadMemberSupportRequests(db, user).catch(() => []) : [];

  return (
    <PageShell>
      <div className="sx-stage public-stage">
        <PageHero
          kicker="MarriageConnect"
          title="About &amp; Help"
          motto={false}
        />
        {/* Suspense required because AboutHelpTabs uses useSearchParams() */}
        <Suspense>
          <AboutHelpTabs user={!!user} requests={requests} />
        </Suspense>
      </div>
    </PageShell>
  );
}
