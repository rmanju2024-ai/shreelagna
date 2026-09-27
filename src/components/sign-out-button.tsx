"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NavGlyph } from "@/components/nav-icons";
import { createClient } from "@/lib/supabase/client";
import { btnGhost } from "@/lib/ui/classes";

export function SignOutButton({
  className,
  icon = false,
}: {
  className?: string;
  icon?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" className={className || btnGhost} disabled={busy} onClick={onClick}>
      {icon ? (
        <span className="nav-3d-ico">
          <NavGlyph name="out" />
        </span>
      ) : null}
      <span className={icon ? "nav-3d-label" : undefined}>{busy ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
