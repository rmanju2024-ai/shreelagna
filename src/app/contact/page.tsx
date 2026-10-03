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
          kicker="Help centre · real humans"
          title="Stuck? We’ve got you."
          sub="Profile help, account questions, or feedback—drop us a note and our family team will get back to you."
        />
        <div className="help-genz-grid">
          <aside className="help-genz-side">
            <div className="help-genz-note">
              <span aria-hidden>💌</span>
              <h2>We’ve got you</h2>
              <p>No bots, no confusing ticket numbers. Tell us what happened in your own words.</p>
              <Link href={user ? "/app" : "/login"} className="help-genz-link">
                {user ? "Go to my profile →" : "Sign in first →"}
              </Link>
            </div>
            <ul className="help-genz-topics" aria-label="Popular help topics">
              <li><span aria-hidden>🪄</span><div><b>Profile setup</b><small>Make a strong first impression</small></div></li>
              <li><span aria-hidden>🔒</span><div><b>Safety & privacy</b><small>Keep your details in your control</small></div></li>
              <li><span aria-hidden>💬</span><div><b>Matches & chats</b><small>Help with introductions</small></div></li>
            </ul>
          </aside>
          <div className={`${cardClass} help-genz-form-card`}>
            <div className="help-genz-form-head">
              <span aria-hidden>✦</span>
              <div><p>Send a note</p><h2>How can we help?</h2></div>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
