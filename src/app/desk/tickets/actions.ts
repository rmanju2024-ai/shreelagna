"use server";

import { requireDesk } from "@/lib/desk/access";
import { writeAudit } from "@/lib/desk/audit";
import { parseTicketStatus, ticketStatusLabel, trimTicketResolution } from "@/lib/desk/tickets";
import { missingPayloadColumn } from "@/lib/profile/db-errors";
import { createServiceClient } from "@/lib/supabase/server";
import { formatIstDateTime } from "@/lib/time/ist";
import { refreshDesk } from "@/lib/desk/refresh";

function deskDb(supabase: Awaited<ReturnType<typeof requireDesk>>["supabase"]) {
  return createServiceClient() ?? supabase;
}

function refreshDeskTickets(id?: string) {
  refreshDesk(["/desk/tickets", "/desk/analytics"]);
  if (id) refreshDesk([`/desk/tickets/${id}`]);
}

async function insertNote(
  db: ReturnType<typeof deskDb>,
  id: string,
  body: string,
  createdBy: string | null,
  status: string | null,
) {
  const payload: Record<string, unknown> = {
    ticket_id: id,
    body,
    created_by: createdBy,
  };
  if (status) payload.ticket_status = status;
  let { error } = await db.from("ticket_notes").insert(payload);
  while (error) {
    const missing = missingPayloadColumn(error, payload);
    if (!missing) break;
    delete payload[missing];
    ({ error } = await db.from("ticket_notes").insert(payload));
  }
  if (error) {
    const stamp = formatIstDateTime(new Date());
    const label = status ? `${ticketStatusLabel(status)} · ` : "";
    const { data: row } = await db.from("tickets").select("resolution").eq("id", id).maybeSingle();
    const prev = typeof row?.resolution === "string" ? row.resolution.trim() : "";
    const next = prev ? `${prev}\n${stamp} — ${label}${body}` : `${stamp} — ${label}${body}`;
    await db.from("tickets").update({ resolution: next.slice(0, 2000) }).eq("id", id);
  }
}

export async function setTicketStatus(formData: FormData) {
  const desk = await requireDesk("/desk/tickets");
  if (!desk.allowed) return;
  const id = String(formData.get("id") ?? "");
  const status = parseTicketStatus(formData.get("status"));
  if (!id || !status) return;
  const payload: Record<string, unknown> = {
    status,
    resolved_at: status === "done" ? new Date().toISOString() : null,
  };
  const db = deskDb(desk.supabase);
  let { error } = await db.from("tickets").update(payload).eq("id", id);
  while (error) {
    const missing = missingPayloadColumn(error, payload);
    if (!missing) break;
    delete payload[missing];
    ({ error } = await db.from("tickets").update(payload).eq("id", id));
  }
  if (!error) {
    await writeAudit({
      actorUserId: desk.me?.id,
      actorRole: desk.me?.role,
      action: "ticket.status",
      entityType: "ticket",
      entityId: id,
      metadata: { status },
    });
  }
  refreshDeskTickets(id);
}

export async function addTicketNote(formData: FormData) {
  const desk = await requireDesk("/desk/tickets");
  if (!desk.allowed) return;
  const id = String(formData.get("id") ?? "");
  const body = trimTicketResolution(formData.get("body"));
  const status = parseTicketStatus(formData.get("status"));
  if (!id || !body) return;
  const db = deskDb(desk.supabase);
  await insertNote(db, id, body, desk.me?.id ?? null, status);
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "ticket.note",
    entityType: "ticket",
    entityId: id,
    metadata: status ? { status } : undefined,
  });
  refreshDeskTickets(id);
}

export async function saveTicketWork(formData: FormData) {
  const desk = await requireDesk("/desk/tickets");
  if (!desk.allowed) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const status = parseTicketStatus(formData.get("status"));
  const body = trimTicketResolution(formData.get("body"));
  const db = deskDb(desk.supabase);

  if (status) {
    const payload: Record<string, unknown> = {
      status,
      resolved_at: status === "done" ? new Date().toISOString() : null,
    };
    let { error } = await db.from("tickets").update(payload).eq("id", id);
    while (error) {
      const missing = missingPayloadColumn(error, payload);
      if (!missing) break;
      delete payload[missing];
      ({ error } = await db.from("tickets").update(payload).eq("id", id));
    }
    if (!error) {
      await writeAudit({
        actorUserId: desk.me?.id,
        actorRole: desk.me?.role,
        action: "ticket.status",
        entityType: "ticket",
        entityId: id,
        metadata: { status },
      });
    }
  }

  if (body) {
    await insertNote(db, id, body, desk.me?.id ?? null, status);
    await writeAudit({
      actorUserId: desk.me?.id,
      actorRole: desk.me?.role,
      action: "ticket.note",
      entityType: "ticket",
      entityId: id,
      metadata: status ? { status } : undefined,
    });
  }

  refreshDeskTickets(id);
}
