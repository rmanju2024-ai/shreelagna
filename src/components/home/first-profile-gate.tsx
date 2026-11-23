import Link from "next/link";

const DOORS = [
  {
    id: "discover",
    mark: "01",
    title: "Discover",
    line: "Families appear after this profile exists.",
  },
  {
    id: "inbox",
    mark: "02",
    title: "Inbox",
    line: "Interest and chat open once the house lists you.",
  },
  {
    id: "account",
    mark: "03",
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
      <div className="first-gate-veil" aria-hidden />
      <div className="first-gate-body">
        <p className="first-gate-kicker">
          <svg width="18" height="16" viewBox="0 0 72 68" aria-hidden>
            <path d="M36 60 C22 52 6 40 4 24 3 13 11 5 20 5 26 5 31 9 36 16" fill="#a02030" />
            <path d="M36 60 C50 52 66 40 68 24 69 13 61 5 52 5 46 5 41 9 36 16" fill="#e8b23a" />
          </svg>
          Love Begins Here
        </p>
        <h2>{asked ? `${asked.title} opens with your profile` : "Begin with one profile"}</h2>
        <p className="first-gate-lead">
          {asked
            ? asked.line
            : "Discover, Inbox and Account are the same house. One bride or groom profile is the key."}
        </p>
        <ol>
          {DOORS.map((door) => (
            <li key={door.id} className={door.id === from ? "is-asked" : undefined}>
              <em>{door.mark}</em>
              <div>
                <strong>{door.title}</strong>
                <span>{door.line}</span>
              </div>
            </li>
          ))}
        </ol>
        {compact ? (
          <Link href="/app/profiles/new" className="first-gate-go">
            Create your first profile
          </Link>
        ) : (
          <p className="first-gate-next">Continue in the form below. A draft can be saved and finished later.</p>
        )}
      </div>
    </section>
  );
}
