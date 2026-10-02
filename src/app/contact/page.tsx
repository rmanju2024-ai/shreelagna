import { PageShell } from "@/components/site-chrome";
import { ContactForm } from "./contact-form";
import { cardClass } from "@/lib/ui/classes";
import { getAuth } from "@/lib/auth/session";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write to Shree Lagna Matrimony.",
};

export default async function ContactPage() {
  const { user } = await getAuth();
  return (
    <PageShell>
      <div className="sx-stage public-stage">
        <PageHero
          kicker="Real people, real help"
          title="Let’s talk."
          sub="Questions, feedback, or profile guidance—send it over. Someone from our family team will read it."
        />
        <div className="public-contact-grid">
        <div className="public-contact-note">
          <span aria-hidden>💌</span>
          <h2>We’ve got you</h2>
          <p>A blessing, a question, or a request for guidance—write freely.</p>
          <Link href={user ? "/app" : "/login"} className="mt-6 inline-block text-sm text-[var(--accent)]">
            {user ? "My profile →" : "Sign in with Gmail →"}
          </Link>
        </div>
        <div className={cardClass}>
          <ContactForm />
        </div>
        </div>
      </div>
    </PageShell>
  );
}
