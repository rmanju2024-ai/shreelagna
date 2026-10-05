import { toggleShortlist } from "@/app/app/profiles/actions";
import { SafetyProfileControl } from "@/app/app/safety/safety-profile-control";
import { BackLink } from "@/components/back-link";

export type ProfileHeroData = {
  id: string;
  name: string;
  shortlisted: boolean;
};

/** Slim action bar. Name, photo, facts and Kundali already live in the profile sheet below, so they are not repeated. */
export function ProfileHero({ data, showActions }: { data: ProfileHeroData; showActions: boolean }) {
  return (
    <nav className="ph-bar" aria-label="Profile actions">
      <BackLink fallback="/browse" className="ph-back">← Back</BackLink>
      {showActions ? (
        <>
          <form action={toggleShortlist}>
            <input type="hidden" name="profile_id" value={data.id} />
            <input type="hidden" name="return_to" value={`/browse/${data.id}`} />
            <button type="submit" className={`ph-primary${data.shortlisted ? " is-on" : ""}`} aria-pressed={data.shortlisted}>
              {data.shortlisted ? "♥ Shortlisted" : "♡ Shortlist"}
            </button>
          </form>
          <a className="ph-ghost" href="/app/plans">✨ Go premium</a>
          <SafetyProfileControl profileId={data.id} returnTo={`/browse/${data.id}`} name={data.name} />
        </>
      ) : null}
    </nav>
  );
}
