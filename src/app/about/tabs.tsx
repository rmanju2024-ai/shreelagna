"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleSignIn } from "@/app/login/google-button";
import { ContactForm } from "@/app/contact/contact-form";
import { btnPrimary, cardClass } from "@/lib/ui/classes";

type Tab = "about" | "help";

/* ── Tab bar ─────────────────────────────────────────────── */
function TabBar({ active, onChange }: { active: Tab; onChange(t: Tab): void }) {
  return (
    <div className="about-tabs-bar" role="tablist">
      {(["about", "help"] as Tab[]).map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={active === t}
          onClick={() => onChange(t)}
          className="about-tab-btn"
        >
          {t === "about" ? "Our story" : "Help & contact"}
        </button>
      ))}
    </div>
  );
}

/* ── About content ───────────────────────────────────────── */
function AboutContent({ user }: { user: boolean }) {
  return (
    <div className="about-tab-panel" role="tabpanel" aria-label="Our story">
      <div className="public-card-grid">
        {[
          ["Who we serve",   "Indian families, with care and respect."],
          ["How you begin",  "A Gmail sign-in. Members return to their profile. Family may write on behalf of the bride or groom."],
          ["How we keep faith", "For adults only. Private details stay private. Community, if shared, is treated with care."],
        ].map(([t, d]) => (
          <article key={t} className={`${cardClass} public-story-card`}>
            <h2 className="font-[family-name:var(--font-display)]">{t}</h2>
            <p>{d}</p>
          </article>
        ))}
      </div>

      <blockquote className="public-quote">
        Search with ease. Speak when both families are ready.
      </blockquote>

      <div className="public-cta">
        {user ? (
          <Link href="/app" className={btnPrimary}>My profile</Link>
        ) : (
          <GoogleSignIn label="Continue with Gmail" tone="ivory" />
        )}
      </div>
    </div>
  );
}

/* ── Help content ────────────────────────────────────────── */
function HelpContent({ user }: { user: boolean }) {
  return (
    <div className="about-tab-panel" role="tabpanel" aria-label="Help and contact">
      <div className="help-genz-grid">
        <aside className="help-genz-side">
          <div className="help-genz-note">
            <span aria-hidden>💌</span>
            <h2>We&apos;ve got you</h2>
            <p>No bots, no confusing ticket numbers. Tell us what happened in your own words.</p>
            <Link href={user ? "/app" : "/login"} className="help-genz-link">
              {user ? "Go to my profile →" : "Sign in first →"}
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
export function AboutHelpTabs({ user }: { user: boolean }) {
  const params  = useSearchParams();
  const initial: Tab = params.get("tab") === "help" ? "help" : "about";
  const [tab, setTab] = useState<Tab>(initial);

  // Keep in sync if someone navigates via the browser back/forward
  useEffect(() => {
    setTab(params.get("tab") === "help" ? "help" : "about");
  }, [params]);

  const switchTab = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    t === "about" ? url.searchParams.delete("tab") : url.searchParams.set("tab", t);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <>
      <TabBar active={tab} onChange={switchTab} />
      {tab === "about"
        ? <AboutContent user={user} />
        : <HelpContent  user={user} />}
    </>
  );
}
