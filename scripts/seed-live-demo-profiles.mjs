import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function env(name) {
  const line = readFileSync(".env.local", "utf8").split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim();
}

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const key = env("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !key) throw new Error("Missing Supabase service-role configuration.");
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const names = ["Aaradhya", "Diya", "Kavya", "Meera", "Nandini", "Pranavi", "Riya", "Saanvi", "Tanvi", "Vaishnavi"];

for (const [index, name] of names.entries()) {
  const email = `demo-2026-${index + 1}@example.invalid`;
  let userId;
  const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const known = existing?.users.find((user) => user.email === email);
  if (known) {
    userId = known.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: `Demo ${name}`, demo_seed: "demo-2026" },
    });
    if (error || !data.user) throw error ?? new Error(`Could not create ${email}`);
    userId = data.user.id;
  }
  const { data: exists, error: existsError } = await supabase.from("profiles").select("id").eq("created_by", userId).maybeSingle();
  if (existsError) throw existsError;
  if (!exists) {
    const { data: profile, error } = await supabase.from("profiles").insert({
      created_by: userId,
      creator_relationship: "self",
      profile_type: "vadhu",
      status: "active",
      is_complete: true,
      subject_full_name: `Demo ${name}`,
      date_of_birth: `199${index % 7}-0${(index % 8) + 1}-15`,
      mother_tongue: "Kannada",
      height_cm: 158 + index,
      marital_status: "Never married",
      diet: index % 2 ? "Vegetarian" : "Eggetarian",
      current_city: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"][index % 4],
      native_state: "Karnataka",
      citizenship: "Indian",
      qualification: "Bachelor's degree",
      occupation: ["Teacher", "Accountant", "Designer", "Software professional"][index % 4],
      employed_in: "Private",
      income_band: "₹3–5 LPA",
      about: `Demo profile for Shree Lagna layout testing only. This is not a real member or a real matrimonial listing. Demo batch: demo-2026.`,
      pref_age_min: 25,
      pref_age_max: 35,
    }).select("id").single();
    if (error || !profile) throw error ?? new Error(`Could not insert Demo ${name}`);
    const { error: activeError } = await supabase.from("app_users").update({ active_profile_id: profile.id }).eq("id", userId);
    if (activeError) throw activeError;
  }
}
console.log("Ensured 10 live demo profiles for batch demo-2026.");
