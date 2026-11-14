"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleSignIn } from "@/app/login/google-button";
import { SupportRequests } from "@/app/about/support-requests";
import { ContactForm } from "@/app/contact/contact-form";
import type { MemberSupportRequest } from "@/lib/desk/tickets";
import { cardClass } from "@/lib/ui/classes";

type Tab = "about" | "help" | "requests";

const TABS: { id: Tab; full: string; short: string }[] = [
  { id: "about", full: "About us", short: "About" },
  { id: "help", full: "Help & contact", short: "Help" },
  { id: "requests", full: "Your requests", short: "Requests" },
];

function parseTab(raw: string | null): Tab {
  if (raw === "help" || raw === "requests") return raw;
  return "about";
}

/* ── Tab bar ─────────────────────────────────────────────── */
function TabBar({
  active,
  onChange,
  requestCount,
}: {
  active: Tab;
  onChange(t: Tab): void;
  requestCount: number;
}) {
  return (
    <div className="about-tabs-bar" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className="about-tab-btn"
        >
          <span className="about-tab-full">{t.full}</span>
          <span className="about-tab-short">{t.short}</span>
          {t.id === "requests" && requestCount > 0 ? (
            <b className="about-tab-count">{requestCount}</b>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/* ── About content ───────────────────────────────────────── */
function AboutContent({ user }: { user: boolean }) {
  return (
    <div className="about-tab-panel" role="tabpanel" aria-label="About us">
      <div className="public-card-grid">
        {[
          ["Who we serve",   "Indian families, with care and respect."],
          ["How you begin",  "A Gmail sign-in. Family may write for the bride or groom. Conversation starts when both families are ready."],
          ["How we keep faith", "For adults only. Private details stay private. Community, if shared, is treated with care."],
        ].map(([t, d]) => (
          <article key={t} className={`${cardClass} public-story-card`}>
            <h2 className="font-[family-name:var(--font-display)]">{t}</h2>
            <p>{d}</p>
          </article>
        ))}
      </div>

      {user ? null : (
        <div className="public-cta">
          <GoogleSignIn label="Continue with Gmail" tone="ivory" />
        </div>
      )}
    </div>
  );
}

/* ── Help content ────────────────────────────────────────── */
function RequestsContent({ user, requests }: { user: boolean; requests: MemberSupportRequest[] }) {
  return (
    <div className="about-tab-panel" role="tabpanel" aria-label="Your requests">
      {user ? (
        <SupportRequests requests={requests} />
      ) : (
        <section className="help-requests">
          <h2>Your requests</h2>
          <p>Sign in to see notes you sent the house, and how each one is going.</p>
          <div className="public-cta">
            <GoogleSignIn label="Continue with Gmail" tone="ivory" />
          </div>
        </section>
      )}
    </div>
  );
}

function HelpContent({ user }: { user: boolean }) {
  return (
    <div className="about-tab-panel" role="tabpanel" aria-label="Help and contact">
      <div className="help-genz-grid">
        <aside className="help-genz-side">
          <div className="help-genz-note">
            <span aria-hidden>💌</span>
            <h2>We&apos;ve got you</h2>
            <p>Write in your own words. Follow progress on Your requests.</p>
            <Link href="/about?tab=requests" className="help-genz-link">
              {user ? "See your requests →" : "Sign in to see requests →"}
            </Link>
          </div>
          <ul className="help-genz-topics" aria-label="Popular help topics">
            <li><span aria-hidden>🪄</span><div><b>Profile setup</b><small>Make a strong first impression</small></div></li>
            <li><span aria-hidden>🔒</span><div><b>Safety &amp; privacy</b><small>Keep your details in your control</small></div></li>
            <li><span aria-hidden>💬</span><div><b>Matches &amp; chats</b><small>Help with introductions</small></div></li>
          </ul>
          <p className="help-genz-legal">
            Need policy details? Read our{" "}
            <Link href="/privacy">Privacy Policy</Link>,{" "}
            <Link href="/terms">Terms</Link>, or{" "}
            <Link href="/community-rules">Community Rules</Link>.
          </p>
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
  );
}

/* ── Combined page ───────────────────────────────────────── */
export function AboutHelpTabs({ user, requests = [] }: { user: boolean; requests?: MemberSupportRequest[] }) {
  const params  = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => parseTab(params.get("tab")));

  useEffect(() => {
    setTab(parseTab(params.get("tab")));
  }, [params]);

  const switchTab = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    t === "about" ? url.searchParams.delete("tab") : url.searchParams.set("tab", t);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <>
      <TabBar active={tab} onChange={switchTab} requestCount={requests.length} />
      {tab === "about" ? <AboutContent user={user} /> : null}
      {tab === "help" ? <HelpContent user={user} /> : null}
      {tab === "requests" ? <RequestsContent user={user} requests={requests} /> : null}
    </>
  );
}
