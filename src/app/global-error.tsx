"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#fbf5ec", fontFamily: "system-ui, sans-serif", color: "#1a100c", textAlign: "center", padding: "2rem" }}>
        <div>
          <div style={{ fontSize: "3.5rem" }} aria-hidden>🦋</div>
          <h1>Shree Lagna will be right back</h1>
          <p style={{ color: "#6a574c" }}>Something went wrong. Please try again.</p>
          <button
            type="button"
            onClick={reset}
            style={{ border: 0, borderRadius: 999, padding: "0.8rem 1.6rem", color: "#fff", background: "linear-gradient(135deg,#8c2a27,#ff5d8f)", fontWeight: 700, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
