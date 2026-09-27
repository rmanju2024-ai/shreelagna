"use client";

import { useState } from "react";

export function CopyMemberId({ code }: { code: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch {
      setDone(false);
    }
  }

  return (
    <button type="button" className="member-id-chip" onClick={copy} title="Copy member ID">
      {done ? "Copied" : code}
    </button>
  );
}
