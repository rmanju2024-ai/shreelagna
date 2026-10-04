import Image from "next/image";
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
  matchPercent?: number | null;
  date_of_birth?: string | null;
  current_country?: string | null;
  diet?: string | null;
  income_band?: string | null;
};

function chips(note: BrowseCardNote): string[] {
  return [
    [note.religion, note.community].filter(Boolean).join(" · "),
    note.education ?? "",
    note.occupation ?? "",
  ].filter(Boolean);
}

function matchPercent(score?: string | null): number | null {
  const match = score?.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  return Math.max(1, Math.min(100, Math.round((Number(match[1]) / Number(match[2])) * 100)));
}

export function BrowseCard({ note, priority = false }: { note: BrowseCardNote; priority?: boolean }) {
  const percent = note.matchPercent ?? matchPercent(note.score);
  const place = [note.city, note.state].filter(Boolean).join(", ");
  const facts = [note.age, note.height].filter(Boolean).join(" · ");
  return (
    <li className="sx-card">
      <Link href={note.href} className="sx-card-link" prefetch={false}>
        <div className="sx-photo">
          {note.photoUrl ? (
            <Image
              src={note.photoUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 264px"
              quality={70}
              priority={priority}
            />
          ) : (
            <span className="sx-initial">{note.name.slice(0, 1)}</span>
          )}
          {percent != null ? (
            <b className="sx-badge">{percent}% match</b>
          ) : note.score ? (
            <b className="sx-badge">{note.score}</b>
          ) : null}
          <div className="sx-photo-copy">
            <h3>{note.name}</h3>
            {facts ? <p>{facts}</p> : null}
          </div>
        </div>
        <div className="sx-body">
          {place ? <p className="sx-place">{place}</p> : null}
          <ul className="sx-tags">
            {chips(note).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {note.score ? <p className="sx-why-match">Why this match: {note.score}</p> : null}
          <div className="sx-foot">
            <span>{note.lastOnline ?? ""}</span>
            <em>View profile →</em>
          </div>
        </div>
      </Link>
    </li>
  );
}
