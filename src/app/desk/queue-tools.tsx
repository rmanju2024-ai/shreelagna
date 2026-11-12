import Link from "next/link";
import { assignDeskWork } from "@/app/desk/assign-actions";
import { slaChip, type QueueView } from "@/lib/desk/sla";
import { btnGhost, btnPrimary, inputClass } from "@/lib/ui/classes";

export function QueueViewLinks({ path, view }: { path: string; view: QueueView }) {
  const items: { id: QueueView; label: string }[] = [
    { id: "all", label: "All" },
    { id: "mine", label: "Mine" },
    { id: "unassigned", label: "Unassigned" },
    { id: "overdue", label: "Older than 24h" },
  ];
  return (
    <p className="desk-queue-views">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`${path}?view=${item.id}`}
          className={view === item.id ? "is-on" : undefined}
          prefetch
        >
          {item.label}
        </Link>
      ))}
    </p>
  );
}

export function AssignBar({
  kind,
  id,
  assignedTo,
  staff,
}: {
  kind: "ticket" | "safety" | "verification";
  id: string;
  assignedTo?: string | null;
  staff: { id: string; label: string }[];
}) {
  return (
    <form action={assignDeskWork} className="desk-assign-bar">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <label className="desk-ticket-note-label">
        Owner
        <select name="assigned_to" className={inputClass} defaultValue={assignedTo ?? ""}>
          <option value="">Unassigned</option>
          {staff.map((row) => (
            <option key={row.id} value={row.id}>
              {row.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className={btnGhost}>
        Save owner
      </button>
      <button type="submit" name="claim" value="1" className={btnPrimary}>
        Claim
      </button>
    </form>
  );
}

export function SlaMark(props: {
  createdAt?: string | null;
  dueAt?: string | null;
  status?: string | null;
  assignedTo?: string | null;
}) {
  const chip = slaChip(props);
  return <span className={`desk-pill desk-sla is-${chip.tone}`}>{chip.label}</span>;
}
