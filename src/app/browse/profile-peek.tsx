"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { btnGhost } from "@/lib/ui/classes";

export function ProfilePeek({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  function close() {
    const cameFromHere = document.referrer.startsWith(window.location.origin);
    if (cameFromHere && window.history.length > 1) router.back();
    else router.push("/browse");
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey, true);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="desk-ticket-layer portrait-peek-layer"
      role="presentation"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className="desk-ticket-modal card-3d portrait-peek-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portrait-peek-title"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="desk-ticket-modal-head portrait-peek-head">
          <h2 id="portrait-peek-title" className="visually-hidden">
            Profile
          </h2>
          <button type="button" className={`${btnGhost} desk-ticket-modal-close`} onClick={close}>
            Close
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}
