import { savePrivacy } from "@/app/app/match/actions";
import { btnHero } from "@/lib/ui/classes";

export function PrivacyForm({
  profileId,
  hideLastSeen,
  hidePhotoUntilAccept,
}: {
  profileId: string;
  hideLastSeen?: boolean | null;
  hidePhotoUntilAccept?: boolean | null;
}) {
  return (
    <form action={savePrivacy} className="form-3d-panel mt-8">
      <input type="hidden" name="profile_id" value={profileId} />
      <p className="form-3d-kicker">Privacy</p>
      <h2 className="form-3d-title">Last seen and photographs</h2>
      <div className="gold-ornament" />
      <label className="mt-6 flex items-start gap-3 text-sm">
        <input type="checkbox" name="hide_last_seen" defaultChecked={Boolean(hideLastSeen)} className="mt-1" />
        <span>Hide last seen from other families.</span>
      </label>
      <label className="mt-3 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="hide_photo_until_accept"
          defaultChecked={hidePhotoUntilAccept !== false}
          className="mt-1"
        />
        <span>Show photographs only after you accept interest.</span>
      </label>
      <button type="submit" className={`${btnHero} mt-6`}>
        Save privacy
      </button>
    </form>
  );
}
