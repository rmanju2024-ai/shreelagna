// Links the demo-2026 profiles to a real member's profile so every Likes section has data.
// Usage: node scripts/seed-demo-likes.mjs [member-email]
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function env(name) {
  const line = readFileSync(".env.local", "utf8").split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim();
}

const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});
const isDemo = (email) => /^demo-2026-\d+@example\.invalid$/.test(email ?? "");

const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw listError;
const demoUsers = list.users.filter((user) => isDemo(user.email));
const realUsers = list.users.filter((user) => !isDemo(user.email));
const wanted = process.argv[2];
const member = wanted ? realUsers.find((user) => user.email === wanted) : realUsers.length === 1 ? realUsers[0] : null;
if (!member) {
  console.log("Pass the member email. Accounts:", realUsers.map((user) => user.email).join(", "));
  process.exit(1);
}

const { data: me, error: meError } = await supabase.from("app_users").select("active_profile_id").eq("id", member.id).single();
if (meError || !me?.active_profile_id) throw meError ?? new Error("That member has no active profile.");
const mine = me.active_profile_id;

const { data: demos, error: demoError } = await supabase
  .from("profiles")
  .select("id, created_by, subject_full_name")
  .in("created_by", demoUsers.map((user) => user.id))
  .order("subject_full_name");
if (demoError) throw demoError;
if ((demos ?? []).length < 10) throw new Error("Run scripts/seed-live-demo-profiles.mjs first.");

const hours = (n) => new Date(Date.now() - n * 3_600_000).toISOString();
const interests = [];
const views = [];
const visits = [];
demos.slice(0, 6).forEach((p, i) => interests.push({ from_profile_id: p.id, to_profile_id: mine, status: "pending", created_at: hours(2 + i * 5) }));
demos.slice(6, 8).forEach((p, i) => interests.push({ from_profile_id: mine, to_profile_id: p.id, status: "pending", created_at: hours(10 + i * 7) }));
interests.push({ from_profile_id: mine, to_profile_id: demos[8].id, status: "accepted", created_at: hours(30) });
interests.push({ from_profile_id: demos[9].id, to_profile_id: mine, status: "declined", created_at: hours(60) });
demos.slice(0, 7).forEach((p, i) => views.push({ viewer_profile_id: p.id, viewed_profile_id: mine, viewed_at: hours(1 + i * 3) }));
demos.slice(3, 10).forEach((p, i) => visits.push({ viewer_profile_id: mine, viewed_profile_id: p.id, viewed_at: hours(4 + i * 4) }));

const ids = demos.map((p) => p.id);
await supabase.from("interests").delete().eq("from_profile_id", mine).in("to_profile_id", ids);
await supabase.from("interests").delete().eq("to_profile_id", mine).in("from_profile_id", ids);
await supabase.from("profile_views").delete().in("viewer_profile_id", [mine, ...ids]).in("viewed_profile_id", [mine, ...ids]);

for (const [table, rows] of [["interests", interests], ["profile_views", [...views, ...visits]]]) {
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
}
console.log(`Seeded Likes for ${member.email}: 6 received, 2 sent, 1 accepted, 1 history, 7 viewed you, 7 you viewed.`);
