import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function env(name) {
  const line = readFileSync(".env.local", "utf8").split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim();
}

const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { autoRefreshToken: false, persistSession: false } });
const { data: users, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (error) throw error;
const demos = users.users.filter((user) => user.email?.match(/^demo-2026-\d+@example\.invalid$/));
for (const user of demos) {
  const { error: profileError } = await supabase.from("profiles").delete().eq("created_by", user.id);
  if (profileError) throw profileError;
  const { error: userError } = await supabase.auth.admin.deleteUser(user.id);
  if (userError) throw userError;
}
console.log(`Removed ${demos.length} live demo profiles from batch demo-2026.`);
