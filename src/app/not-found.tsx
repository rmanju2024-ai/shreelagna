import Link from "next/link";

export default function NotFound() {
  return (
    <div className="gz-state">
      <div className="gz-state-card">
        <span className="gz-emoji" aria-hidden>🦋</span>
        <h1>We couldn&apos;t find that page</h1>
        <p>It may have moved, or the profile is no longer available.</p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/browse" className="btn-3d btn-3d-maroon">Search matches</Link>
          <Link href="/" className="btn-3d btn-3d-ivory">Home</Link>
        </div>
      </div>
    </div>
  );
}
