import Link from "next/link";

/** Consistent way back to the Account hub from any of its sections. */
export function BackToAccount() {
  return (
    <nav className="back-to-account" aria-label="Back">
      <Link href="/app/account">← Back to Account</Link>
    </nav>
  );
}
