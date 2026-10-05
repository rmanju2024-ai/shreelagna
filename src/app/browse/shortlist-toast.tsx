"use client";

import { useEffect, useState } from "react";

export function ShortlistToast({ message, duration = 3000 }: { message?: string; duration?: number }) {
  const [show, setShow] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setShow(false), duration);
    return () => clearTimeout(t);
  }, [message, duration]);

  if (!show || !message) return null;
  return <div className="shortlist-toast" role="status" aria-live="polite">{message}</div>;
}
