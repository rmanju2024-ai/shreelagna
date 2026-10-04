import { blockProfile } from "@/app/app/safety/actions";
import { btnGhost } from "@/lib/ui/classes";

export function SafetyProfileControl({ profileId, returnTo }: { profileId: string; returnTo: string }) {
  return (
    <div className="safety-profile-control">
      <form action={blockProfile}>
        <input type="hidden" name="profile_id" value={profileId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <button className={btnGhost} type="submit">Block</button>
      </form>
      <a className={btnGhost} href={`/browse/${profileId}/report`}>
        Report
      </a>
    </div>
  );
}
