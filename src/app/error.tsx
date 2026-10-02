"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[route-error]", error.digest ?? error.message);
  }, [error]);
  return (
    <div className="gz-state">
      <div className="gz-state-card">
        <span className="gz-emoji" aria-hidden>🦋</span>
        <h1>Something fluttered off</h1>
        <p>That page hit a snag. Try again — your data is safe.</p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button type="button" className="btn-3d btn-3d-maroon" onClick={reset}>Try again</button>
          <Link href="/browse" className="btn-3d btn-3d-ivory">Go to Search</Link>
        </div>
      </div>
    </div>
  );
}
