import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/060_security_hardening.sql"), "utf8");

describe("security hardening migration", () => {
  it("allows only the recipient or staff to update interests", () => {
    expect(sql).toContain("using (public.owns_profile(to_profile_id) or public.is_staff())");
    expect(sql).not.toContain("public.owns_profile(from_profile_id)");
  });

  it("does not expose the global expiry function to visitors", () => {
    expect(sql).toContain(
      "revoke all on function public.expire_stale_interests() from public, anon, authenticated",
    );
  });

  it("derives browse eligibility and returns only approved photos", () => {
    expect(sql).toContain("p.profile_type <> mine_type");
    expect(sql).toContain("and public.can_view_profile(p.id)");
    expect(sql).toContain("and m.status::text = 'approved'");
    expect(sql).toContain("owner.role::text <> 'admin'");
  });
});
