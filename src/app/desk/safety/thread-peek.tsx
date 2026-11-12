import { orderedProfilePair } from "@/lib/desk/safety-actions";
import { formatIstDateTime } from "@/lib/time/ist";

type Db = { from: (table: string) => any };

export async function SafetyThreadPeek({
  db,
  reporterId,
  reportedId,
}: {
  db: Db;
  reporterId: string;
  reportedId: string;
}) {
  if (!reporterId || !reportedId) return null;
  const [a, b] = orderedProfilePair(reporterId, reportedId);
  const { data: thread } = await db
    .from("threads")
    .select("id, frozen")
    .eq("profile_a", a)
    .eq("profile_b", b)
    .maybeSingle();
  if (!thread?.id) {
    return <p className="desk-ticket-meta">No salon thread between these two profiles.</p>;
  }
  const { data: notes } = await db
    .from("messages")
    .select("id, body, created_at, sender_profile_id, deleted_at")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: false })
    .limit(12);
  return (
    <details className="desk-thread-peek">
      <summary>Chat investigation {thread.frozen ? "(frozen)" : ""}</summary>
      <ol>
        {(notes ?? []).slice().reverse().map((row: { id: string; body?: string; created_at?: string; deleted_at?: string | null }) => (
          <li key={row.id}>
            <time>{row.created_at ? formatIstDateTime(String(row.created_at)) : ""}</time>
            <p>{row.deleted_at ? "(removed by sender)" : String(row.body ?? "")}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
