import { PageShell } from "@/components/site-chrome";
import { ContactForm } from "./contact-form";
import { cardClass } from "@/lib/ui/classes";
import { getAuth } from "@/lib/auth/session";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write to Shree Lagna Matrimony.",
};

export default async function ContactPage() {
  const { user } = await getAuth();
  return (
    <PageShell>
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--gold)]">Write to us</p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-tight text-[var(--ink)]">
            We are glad to hear from you.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
            A blessing, a question, or a request for guidance — someone in the
            house will read it with care.
          </p>
          <Link href={user ? "/app" : "/login"} className="mt-6 inline-block text-sm text-[var(--accent)]">
            {user ? "My profile →" : "Sign in with Gmail →"}
          </Link>
        </div>
        <div className={cardClass}>
          <ContactForm />
        </div>
      </div>
    </PageShell>
  );
}
