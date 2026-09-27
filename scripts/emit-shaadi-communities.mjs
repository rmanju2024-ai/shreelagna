import fs from "node:fs";
import path from "node:path";
import { COMMUNITIES, RELIGIONS } from "./shaadi-communities-data.mjs";

const root = path.resolve(import.meta.dirname, "..");

function sqlStr(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function slugify(name) {
  const base = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return base || "community";
}

const religionRows = RELIGIONS.map(
  ([slug, name, order]) => `  (${sqlStr(slug)}, ${sqlStr(name)}, ${order})`,
).join(",\n");

const communityRows = [];
for (const [religion, names] of Object.entries(COMMUNITIES)) {
  const used = new Set();
  names.forEach((name, i) => {
    let slug = slugify(name);
    if (used.has(slug)) slug = `${slug}-${i}`;
    used.add(slug);
    communityRows.push(`  (${sqlStr(religion)}, ${sqlStr(slug)}, ${sqlStr(name)})`);
  });
}

const sql = `-- Shaadi.com-style religion and community catalog.
-- Run after 001–002. Existing rows are kept (on conflict do nothing).

begin;

insert into public.religions (slug, name, sort_order) values
${religionRows}
on conflict (slug) do update
  set name = excluded.name,
      sort_order = excluded.sort_order;

insert into public.communities (religion_id, slug, name)
select r.id, v.slug, v.name
from public.religions r
join (values
${communityRows.join(",\n")}
) as v(religion_slug, slug, name) on r.slug = v.religion_slug
on conflict (religion_id, slug) do nothing;

commit;
`;

fs.writeFileSync(path.join(root, "supabase/migrations/027_shaadi_communities.sql"), sql);
console.log(`wrote 027_shaadi_communities.sql (${communityRows.length} communities)`);
