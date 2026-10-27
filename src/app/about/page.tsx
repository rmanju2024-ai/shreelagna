import type { Metadata } from "next";
import { Suspense } from "react";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { PageHero } from "@/components/page-hero";
import { getAuth } from "@/lib/auth/session";
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
  const [{ user }] = await Promise.all([getAuth(), searchParams]);

  return (
    <PageShell>
      <div className="sx-stage public-stage">
        <PageHero
          kicker="MarriageConnect"
          title="About &amp; Help"
          sub="Learn who we are — or reach out if you need a hand."
          motto={false}
        />
        {/* Suspense required because AboutHelpTabs uses useSearchParams() */}
        <Suspense>
          <AboutHelpTabs user={!!user} />
        </Suspense>
      </div>
    </PageShell>
  );
}
