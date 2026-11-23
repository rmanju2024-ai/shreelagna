import Link from "next/link";

const DOORS = [
  {
    id: "discover",
    title: "Discover",
    line: "Families appear after this profile exists.",
  },
  {
    id: "inbox",
    title: "Inbox",
    line: "Interest and chat open once the house lists you.",
  },
  {
    id: "account",
    title: "Account",
    line: "The licence sits on a profile, so this waits too.",
  },
] as const;

export function firstProfileFrom(value: string | undefined) {
  return DOORS.some((door) => door.id === value) ? value : "";
}

export function FirstProfileGate({ from, compact = false }: { from?: string; compact?: boolean }) {
  const asked = DOORS.find((door) => door.id === from);
  return (
    <section className={`first-gate${compact ? " is-compact" : ""}`} aria-label="Start with a profile">
      <p className="browse-kicker">One profile opens the house</p>
      <h2>{asked ? `${asked.title} is waiting on your profile` : "Your profile comes first"}</h2>
      <p>
        {asked
          ? `${asked.line} The same short form opens Discover, Inbox and Account.`
          : "Discover, Inbox and Account all wait for the same thing: one bride or groom profile on this login."}
      </p>
      <ul>
        {DOORS.map((door) => (
          <li key={door.id} className={door.id === from ? "is-asked" : undefined}>
            <strong>{door.title}</strong>
            <span>{door.line}</span>
          </li>
        ))}
      </ul>
      {compact ? (
        <Link href="/app/profiles/new" className="first-gate-go">
          Create your first profile
        </Link>
      ) : (
        <p className="first-gate-next">The form is just below. Save a draft and come back any time.</p>
      )}
    </section>
  );
}
