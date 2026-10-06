import Link from "next/link";

/** Consistent way back to the Account hub from any of its sections. */
export function BackToAccount({ align = "wide" }: { align?: "wide" | "profile" }) {
  return (
    <nav className={`back-to-account${align === "profile" ? " is-profile" : ""}`} aria-label="Back">
      <Link href="/app/account">← Back to Account</Link>
    </nav>
  );
}
