import { requireDesk } from "@/lib/desk/access";
import { isMemberCode, memberCodeLookup } from "@/lib/profile/member-code";
import { createServiceClient } from "@/lib/supabase/server";
import { btnPrimary, inputClass } from "@/lib/ui/classes";
import Link from "next/link";
import { redirect } from "next/navigation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HIT_COLS =
  "id, member_code, subject_full_name, status, profile_type, current_city, current_state";

function statusLabel(status: string | null | undefined) {
  if (status === "on_hold") return "Paused";
  if (status === "hidden") return "Hidden";
  if (status === "active") return "Live";
  if (status === "pending_review") return "Review";
  if (status === "draft") return "Draft";
  return status ? status.replace(/_/g, " ") : "—";
}

function kindLabel(type: string | null | undefined) {
  if (type === "vadhu") return "Bride";
  if (type === "vara") return "Groom";
  return "Profile";
}

export default async function DeskPeopleSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const desk = await requireDesk("/desk/people");
  if (!desk.allowed) return null;
  const { q: raw } = await searchParams;
  const q = String(raw ?? "").trim();
  const db = createServiceClient() ?? desk.supabase;
  let hits: {
    id: string;
    member_code?: string | null;
    subject_full_name?: string | null;
    status?: string | null;
    profile_type?: string | null;
    current_city?: string | null;
    current_state?: string | null;
  }[] = [];

  if (q) {
    if (UUID.test(q)) redirect(`/desk/people/${q}`);
    if (isMemberCode(q)) {
      const { data } = await db.from("profiles").select("id").eq("member_code", memberCodeLookup(q)).maybeSingle();
      if (data?.id) redirect(`/desk/people/${data.id}`);
    }
    const { data } = await db
      .from("profiles")
      .select(HIT_COLS)
      .ilike("subject_full_name", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);
    hits = data ?? [];
  }

  return (
    <section className="desk-panel desk-file">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">People</p>
          <h2>Find a member</h2>
        </div>
      </header>
      <form className="desk-file-search" action="/desk/people" method="get">
        <label>
          Name, member ID, or profile id
          <input name="q" className={inputClass} defaultValue={q} placeholder="Name or SL0100003" autoComplete="off" />
        </label>
        <button className={btnPrimary} type="submit">
          Search
        </button>
      </form>
      {q && !hits.length ? <p className="desk-empty">No member matched “{q}”.</p> : null}
      {hits.length ? (
        <ul className="desk-file-hits">
          {hits.map((row) => {
            const place = [row.current_city, row.current_state].filter(Boolean).join(", ");
            return (
              <li key={row.id}>
                <Link href={`/desk/people/${row.id}`} className="desk-file-hit">
                  <span className="desk-file-hit-copy">
                    <strong>{row.subject_full_name || "Unnamed"}</strong>
                    <small>
                      {[row.member_code, kindLabel(row.profile_type), place || null].filter(Boolean).join(" · ")}
                    </small>
                  </span>
                  <em className="desk-pill">{statusLabel(row.status)}</em>
                  <span className="desk-file-go" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
