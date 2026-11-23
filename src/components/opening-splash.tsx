"use client";

import { useEffect, useState } from "react";

function installedApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

/** First screen of the installed app: name and tagline, not the heart alone. */
export function OpeningSplash() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!installedApp()) return;
    setOn(true);
    const timer = window.setTimeout(() => setOn(false), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  if (!on) return null;

  return (
    <div className="opening-splash" role="status" aria-label="Marriage Connect.in">
      <svg width="120" height="112" viewBox="0 0 72 68" aria-hidden>
        <path d="M36 60 C22 52 6 40 4 24 3 13 11 5 20 5 26 5 31 9 36 16" fill="#a02030" />
        <path d="M36 60 C50 52 66 40 68 24 69 13 61 5 52 5 46 5 41 9 36 16" fill="#e8b23a" />
      </svg>
      <p className="opening-splash-name">
        Marriage Connect<span>.in</span>
      </p>
      <p className="opening-splash-line">Love Begins Here</p>
    </div>
  );
}
