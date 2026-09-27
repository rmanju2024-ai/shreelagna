import { safeNextPath } from "@/lib/auth/safe-next";

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
  const dest = safeNextPath(next);
  const className = [
    tone === "ivory" ? "btn-3d btn-3d-ivory" : "btn-3d btn-3d-maroon",
    size === "lg" ? "btn-3d-lg" : "",
  ].join(" ");

  return (
    <a href={`/auth/google?next=${encodeURIComponent(dest)}`} className={className}>
      <GmailMark />
      {label}
    </a>
  );
}
