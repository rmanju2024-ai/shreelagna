import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const options = fs.readFileSync(path.join(root, "src/lib/profile/options.ts"), "utf8");
const catalog = fs.readFileSync(path.join(root, "src/lib/profile/catalog.ts"), "utf8");
const gotrasSrc = fs.readFileSync(path.join(root, "src/lib/profile/gotras.ts"), "utf8");

function extractStrings(src, name) {
  const match = src.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) throw new Error(`Missing ${name}`);
  return [...match[1].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) => m[1].replace(/\\"/g, '"'));
}

function extractRoleTuples(src) {
  const match = src.match(/export const CREATOR_ROLES = \[([\s\S]*?)\] as const/);
  if (!match) throw new Error("Missing CREATOR_ROLES");
  return [...match[1].matchAll(/value: "([^"]+)", label: "([^"]+)", hint: "([^"]+)"/g)].map((m) => ({
    value: m[1],
    label: m[2],
    hint: m[3],
  }));
}

function incomeBands() {
  const bands = ["Prefer not to say", "Student / not earning"];
  for (let from = 0; from < 100; from += 5) {
    const to = from + 5;
    if (from === 0) bands.push("Up to ₹5 lakh");
    else if (to === 100) bands.push("₹95 lakh–₹1 crore");
    else bands.push(`₹${from}–${to} lakh`);
  }
  bands.push("Above ₹1 crore");
  return bands;
}

function sqlStr(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function rows(kind, names) {
  return names.map((name, i) => `  (${sqlStr(kind)}, ${sqlStr(name)}, null, null, ${i})`).join(",\n");
}

const employedIn = extractStrings(catalog, "EMPLOYED_IN");
const families = extractStrings(catalog, "FAMILY_TYPES");
const hopeIncomes = extractStrings(catalog, "HOPE_INCOME_BANDS");
const familyStatuses = extractStrings(options, "FAMILY_STATUSES");
const physical = extractStrings(options, "PHYSICAL_STATUSES");
const blood = extractStrings(options, "BLOOD_GROUPS");
const hobbies = extractStrings(options, "HOBBY_OPTIONS");
const countries = extractStrings(options, "NATIVE_COUNTRIES");
const hopeCountries = extractStrings(options, "HOPE_COUNTRIES");
const residency = extractStrings(options, "RESIDENCY_STATUSES");
const managed = extractStrings(options, "PREF_MANAGED");
const horoscope = extractStrings(options, "HOROSCOPE_PREF");
const gotraCore = extractStrings(gotrasSrc, "GOTRAS");
const gotras = ["Don't know", "Other", ...gotraCore];
const roles = extractRoleTuples(options);

const roleRows = roles
  .map((r, i) => `  ('creator_role', ${sqlStr(r.label)}, ${sqlStr(r.value)}, ${sqlStr(r.hint)}, ${i})`)
  .join(",\n");

const sql = `-- Remaining registration catalogs. Run after 001–024.

begin;

create table if not exists public.lookup_options (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  name text not null,
  code text,
  hint text,
  sort_order int not null default 0,
  unique (kind, name)
);

insert into public.lookup_options (kind, name, code, hint, sort_order) values
${rows("employed_in", employedIn)},
${rows("family_type", families)},
${rows("family_status", familyStatuses)},
${rows("physical_status", physical)},
${rows("blood_group", blood)},
${rows("hobby", hobbies)},
${rows("country", countries)},
${rows("hope_country", hopeCountries)},
${rows("residency", residency)},
${rows("income", incomeBands())},
${rows("hope_income", hopeIncomes)},
${rows("pref_managed", managed)},
${rows("horoscope", horoscope)},
${rows("gotra", gotras)},
${roleRows}
on conflict (kind, name) do nothing;

alter table public.lookup_options enable row level security;
drop policy if exists lookup_options_read on public.lookup_options;
create policy lookup_options_read on public.lookup_options for select using (true);
grant select on public.lookup_options to anon, authenticated;

commit;
`;

fs.writeFileSync(path.join(root, "supabase/migrations/025_lookup_options.sql"), sql);
console.log("wrote 025_lookup_options.sql");
