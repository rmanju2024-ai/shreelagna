import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export type StaffRole = "service" | "admin";

export function isStaffRole(role?: string | null): role is StaffRole {
  return role === "service" || role === "admin";
}

export function isAdminRole(role?: string | null): boolean {
  return role === "admin";
}

/** Header identity: admin, staff, or signed-in member. */
export function houseRoleMark(role?: string | null): "admin" | "staff" | "member" | null {
  if (role === "admin") return "admin";
  if (role === "service") return "staff";
  if (role) return "member";
  return null;
}

export function canEditMemberProfile(
  actor: { id: string; role?: string | null },
  owner: { id?: string | null; role?: string | null } | null,
): boolean {
  if (owner?.id && actor.id === owner.id) return true;
  if (actor.role === "admin") return true;
  if (actor.role === "service" && owner?.role !== "admin") return true;
  return false;
}

export async function requireDesk(next = "/desk") {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect(`/login?next=${next}`);
  const me = await ensureAppUser(supabase, user);
  if (!isStaffRole(me?.role)) {
    return { supabase, user, me, allowed: false as const, admin: false };
  }
  return {
    supabase,
    user,
    me,
    allowed: true as const,
    admin: isAdminRole(me.role),
  };
}
