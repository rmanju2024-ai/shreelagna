import Link from "next/link";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { cardClass } from "@/lib/ui/classes";

const groups = [
  {
    title: "My journey",
    items: [
      { href: "/app", title: "My profile", text: "Your story, media and profile completeness." },
      { href: "/app/shortlist", title: "Shortlist", text: "Private profiles you want to revisit." },
      { href: "/app/interests", title: "Interests", text: "Requests, replies and match history." },
    ],
  },
  {
    title: "Privacy & safety",
    items: [
      { href: "/app/settings", title: "Privacy controls", text: "Photos, profile details, contact release and alerts." },
      { href: "/app/safety", title: "Safety centre", text: "Reports, blocks and practical help when you need it." },
      { href: "/app/verification", title: "Verification requests", text: "Optional private checks with clear, honest trust labels." },
    ],
  },
  {
    title: "Membership & help",
    items: [
      { href: "/app/plans", title: "Membership", text: "Your plan, access and future upgrades." },
      { href: "/contact", title: "Help & support", text: "Get help from the Shree Lagna team." },
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
          <p className="browse-kicker">Your space</p>
          <h1>Account hub</h1>
          <p>Everything personal, private and practical—grouped in one calm place.</p>
        </header>
        <div className="account-hub-layout">
          <aside className="account-hub-rail" aria-label="Account sections">
            {groups.map((group) => <a key={group.title} href={`#${group.title.toLowerCase().replaceAll(" ", "-").replace("&-", "")}`}>{group.title}</a>)}
          </aside>
          <div className="account-hub-content">
            {groups.map((group) => (
              <section id={group.title.toLowerCase().replaceAll(" ", "-").replace("&-", "")} key={group.title} className="account-hub-section">
                <h2>{group.title}</h2>
                <div className="account-hub-grid">
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} className={`${cardClass} account-hub-card`}>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                      <span>Open →</span>
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
