import { toggleShortlist } from "@/app/app/profiles/actions";
import { SafetyProfileControl } from "@/app/app/safety/safety-profile-control";
import { BackLink } from "@/components/back-link";

export type ProfileHeroData = {
  id: string;
  name: string;
  photoUrl: string | null;
  age: number | null;
  place: string;
  work: string;
  faith: string;
  lastSeen: string | null;
  kundali: string | null;
  memberCode?: string;
};

export function ProfileHero({ data, showActions }: { data: ProfileHeroData; showActions: boolean }) {
  const facts = [data.age ? `${data.age} yrs` : "", data.place].filter(Boolean).join(" · ");
  const chips = [data.work, data.faith, data.kundali ? `Kundali ${data.kundali}` : ""].filter(Boolean);
  return (
    <header className="ph">
      <div className="ph-cover" style={data.photoUrl ? { backgroundImage: `url(${data.photoUrl})` } : undefined} aria-hidden />
      <div className="ph-top">
        <BackLink fallback="/browse" className="ph-back">← Back</BackLink>
        {data.lastSeen ? <span className="ph-seen">● {data.lastSeen}</span> : null}
      </div>
      <div className="ph-main">
        <div className="ph-avatar">
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photoUrl} alt={data.name} />
          ) : (
            <span>{data.name.slice(0, 1)}</span>
          )}
        </div>
        <div className="ph-copy">
          <h1>{data.name}</h1>
          {facts ? <p className="ph-facts">{facts}</p> : null}
          {chips.length ? (
            <ul className="ph-chips">
              {chips.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      {showActions ? (
        <div className="ph-actions">
          <form action={toggleShortlist}>
            <input type="hidden" name="profile_id" value={data.id} />
            <input type="hidden" name="return_to" value={`/browse/${data.id}`} />
            <button type="submit" className="ph-primary">♥ Shortlist</button>
          </form>
          <a className="ph-ghost" href="/app/plans">✨ Go premium</a>
          <SafetyProfileControl profileId={data.id} returnTo={`/browse/${data.id}`} name={data.name} />
        </div>
      ) : null}
    </header>
  );
}
