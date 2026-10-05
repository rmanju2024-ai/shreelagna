import Link from "next/link";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { FieldMark } from "@/app/app/profiles/field-mark";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { cardClass } from "@/lib/ui/classes";

const groups = [
  {
    id: "journey",
    title: "My journey",
    kicker: "Your story",
    mark: "About",
    items: [
      { href: "/app", title: "My profile", mark: "Name", text: "Your story, media and completeness." },
      { href: "/app/shortlist", title: "Shortlist", mark: "Partner", text: "Private profiles you wish to revisit." },
      { href: "/app/blocked", title: "Blocked profiles", mark: "Safety", text: "Members you blocked. Unblock any time." },
      { href: "/app/interests", title: "Interests", mark: "Hope", text: "Requests, replies and match history." },
    ],
  },
  {
    id: "privacy",
    title: "Privacy & safety",
    kicker: "Kept private",
    mark: "Health",
    items: [
      { href: "/app/settings", title: "Privacy controls", mark: "Living", text: "Photos, details, contact release and alerts." },
      { href: "/app/safety", title: "Safety centre", mark: "Family", text: "Reports, blocks and practical help." },
      { href: "/app/verification", title: "Verification", mark: "Identity", text: "Optional private checks with honest trust labels." },
    ],
  },
  {
    id: "membership",
    title: "Membership & help",
    kicker: "House support",
    mark: "Work",
    items: [
      { href: "/app/plans", title: "Membership", mark: "Income", text: "Your plan, access and future upgrades." },
      { href: "/contact", title: "Help & support", mark: "Contact", text: "Reach the Shree Lagna house team." },
    ],
  },
];

export default async function AccountHubPage() {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/account");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");
  return (
    <PageShell>
      <main className="account-hub sx-stage">
        <header className="account-hub-head">
          <span className="account-hub-crest" aria-hidden>
            <FieldMark label="Crest" />
          </span>
          <p className="browse-kicker">Your space</p>
          <h1>Account hub</h1>
          <div className="gold-ornament" />
          <p>Everything personal, private and practical — gathered in one calm house.</p>
        </header>
        <div className="account-hub-layout">
          <aside className="account-hub-rail" aria-label="Account sections">
            {groups.map((group) => (
              <a key={group.id} href={`#${group.id}`}>
                <FieldMark label={group.mark} />
                {group.title}
              </a>
            ))}
          </aside>
          <div className="account-hub-content">
            {groups.map((group) => (
              <section id={group.id} key={group.id} className="account-hub-section">
                <p className="account-hub-section-kicker">{group.kicker}</p>
                <h2>
                  <FieldMark label={group.mark} />
                  {group.title}
                </h2>
                <div className="account-hub-grid">
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} className={`${cardClass} account-hub-card`}>
                      <em className="account-hub-ico" aria-hidden>
                        <FieldMark label={item.mark} />
                      </em>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                      <span>Open</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
