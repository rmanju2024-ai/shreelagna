import { getAuth, ensureAppUser } from "@/lib/auth/session";
import { houseRoleMark } from "@/lib/desk/access";
import { BannerGreetingTagline } from "./banner-greeting-card";
import { BrandMotto } from "@/components/brand-motto";

/** Server component — fetches member data, renders the tagline-style greeting */
export async function BannerGreeting() {
  try {
    const { user, supabase } = await getAuth();
    if (!user || !supabase) return <BrandMotto as="h1" />;

    const me = await ensureAppUser(supabase, user);
    if (!me) return <BrandMotto as="h1" />;

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
    if (!fullName) return <BrandMotto as="h1" />;

    const firstName = fullName.split(/\s+/)[0];

    return <BannerGreetingTagline name={firstName} mark={mark} />;
  } catch {
    return <BrandMotto as="h1" />;
  }
}
