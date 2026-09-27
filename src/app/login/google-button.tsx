"use client";

import { useState } from "react";
import { googleAuthHelp } from "@/lib/auth/google-errors";
import { createClient } from "@/lib/supabase/client";

function GmailMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M5 7.2 12 12.5 19 7.2V17a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7.2Z" />
      <path fill="#FBBC05" d="M5 7.2V6.2L12 11.4 19 6.2v1L12 12.5 5 7.2Z" />
      <path fill="#34A853" d="M19 7.2 12 12.5 12 11.4 19 6.2v1.0Z" opacity=".9" />
      <path fill="#4285F4" d="M5 7.2 12 12.5 12 11.4 5 6.2v1.0Z" opacity=".9" />
    </svg>
  );
}

export function GoogleSignIn({
  label = "Continue with Gmail",
  tone = "maroon",
  size = "md",
  next = "/app",
}: {
  label?: string;
  tone?: "maroon" | "ivory";
  size?: "md" | "lg";
  next?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (err) {
        setError(googleAuthHelp(err.message, err.status));
        setBusy(false);
      }
    } catch {
      setError("Sign-in is not available just now. Please try again shortly.");
      setBusy(false);
    }
  }

  const className = [
    tone === "ivory" ? "btn-3d btn-3d-ivory" : "btn-3d btn-3d-maroon",
    size === "lg" ? "btn-3d-lg" : "",
  ].join(" ");

  return (
    <div>
      <button type="button" onClick={onClick} disabled={busy} className={className}>
        <GmailMark />
        {busy ? "Opening Google…" : label}
      </button>
      {error ? <p className="mt-3 max-w-md text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
