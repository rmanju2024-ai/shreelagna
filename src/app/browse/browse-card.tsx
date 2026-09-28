import Link from "next/link";

export type BrowseCardNote = {
  id: string;
  href: string;
  name: string;
  photoUrl?: string | null;
  lastOnline?: string | null;
  age?: string | null;
  height?: string | null;
  religion?: string | null;
  community?: string | null;
  city?: string | null;
  state?: string | null;
  education?: string | null;
  occupation?: string | null;
  score?: string | null;
  date_of_birth?: string | null;
  current_country?: string | null;
  diet?: string | null;
  income_band?: string | null;
};

function chips(note: BrowseCardNote): string[] {
  return [
    [note.age, note.height].filter(Boolean).join(" · "),
    [note.religion, note.community].filter(Boolean).join(" · "),
    [note.city, note.state].filter(Boolean).join(", "),
    note.education ?? "",
    note.occupation ?? "",
  ].filter(Boolean);
}

function matchPercent(score?: string | null): number {
  const match = score?.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return 64;
  const value = Math.round((Number(match[1]) / Number(match[2])) * 100);
  return Math.max(1, Math.min(100, value));
}

export function BrowseCard({ note }: { note: BrowseCardNote }) {
  const percent = matchPercent(note.score);
  const photo = note.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={note.photoUrl} alt="" loading="lazy" decoding="async" />
  ) : (
    <span>{note.name.slice(0, 1)}</span>
  );
  return (
    <li className="browse-card" style={{ "--match-dash": `${percent}` } as React.CSSProperties}>
      <Link href={note.href} className="browse-card-link">
        <div className="browse-card-photo-wrap">
          <div className="browse-card-photo">{photo}</div>
          <div className="match-ring" aria-label={`${percent}% match`}>
            <svg viewBox="0 0 40 40" aria-hidden>
              <circle className="match-ring-track" cx="20" cy="20" r="16" />
              <circle className="match-ring-fill" cx="20" cy="20" r="16" pathLength="100" />
            </svg>
            <strong>{percent}%</strong>
          </div>
        </div>
        <div className="browse-card-copy">
          <p className="browse-card-name">{note.name}</p>
          {note.lastOnline ? <p className="browse-card-seen">{note.lastOnline}</p> : null}
          <ul className="browse-card-meta">
            {chips(note).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        {note.score ? <p className="browse-score">{note.score}</p> : null}
      </Link>
    </li>
  );
}
