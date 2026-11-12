import { requireDesk } from "@/lib/desk/access";
import { isMemberCode, memberCodeLookup } from "@/lib/profile/member-code";
import { createServiceClient } from "@/lib/supabase/server";
import { btnPrimary, inputClass } from "@/lib/ui/classes";
import { redirect } from "next/navigation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function DeskPeopleSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const desk = await requireDesk("/desk/people");
  if (!desk.allowed) return null;
  const { q: raw } = await searchParams;
  const q = String(raw ?? "").trim();
  if (q) {
    const db = createServiceClient() ?? desk.supabase;
    if (UUID.test(q)) redirect(`/desk/people/${q}`);
    if (isMemberCode(q)) {
      const { data } = await db.from("profiles").select("id").eq("member_code", memberCodeLookup(q)).maybeSingle();
      if (data?.id) redirect(`/desk/people/${data.id}`);
    }
    const { data: byName } = await db
      .from("profiles")
      .select("id")
      .ilike("subject_full_name", `%${q}%`)
      .limit(1)
      .maybeSingle();
    if (byName?.id) redirect(`/desk/people/${byName.id}`);
  }

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Member file</p>
          <h2>Find a family</h2>
        </div>
      </header>
      <form className="desk-ticket-note-form" action="/desk/people" method="get">
        <label className="desk-ticket-note-label">
          Member ID, name, or profile id
          <input name="q" className={inputClass} defaultValue={q} placeholder="MC-KA-F-01000000" />
        </label>
        <button className={btnPrimary} type="submit">
          Open file
        </button>
      </form>
      {q ? <p className="desk-empty">No profile matched “{q}”.</p> : null}
    </section>
  );
}
