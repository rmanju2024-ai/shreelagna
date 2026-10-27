import { getAuth, ensureAppUser } from "@/lib/auth/session";
import { houseRoleMark } from "@/lib/desk/access";
import { BannerGreetingTagline } from "./banner-greeting-card";

/** Server component — fetches member data, renders the time greeting */
export async function BannerGreeting() {
  try {
    const { user, supabase } = await getAuth();
    if (!user || !supabase) return null;

    const me = await ensureAppUser(supabase, user);
    if (!me) return null;

    const mark = houseRoleMark(me.role) ?? "member";

    const { data: profile } = me.active_profile_id
      ? await supabase
          .from("profiles")
          .select("subject_full_name")
          .eq("id", me.active_profile_id)
          .maybeSingle()
      : await supabase
          .from("profiles")
          .select("subject_full_name")
          .eq("created_by", me.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

    const fullName =
      typeof profile?.subject_full_name === "string"
        ? profile.subject_full_name.trim()
        : "";
    if (!fullName) return null;

    const firstName = fullName.split(/\s+/)[0];

    return <BannerGreetingTagline name={firstName} mark={mark} />;
  } catch {
    return null;
  }
}
