"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { btnGhost } from "@/lib/ui/classes";

export function DeskPeek({
  title,
  kicker = "Staff preview · view only",
  closeHref,
  wide = false,
  children,
}: {
  title: string;
  kicker?: string;
  closeHref: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        router.replace(closeHref);
      }
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [closeHref, router]);

  if (!mounted) return null;
  return createPortal(
    <div className="desk-ticket-layer portrait-peek-layer" role="presentation" onClick={() => router.replace(closeHref)}>
      <div
        className={`desk-ticket-modal card-3d portrait-peek-modal desk-peek-modal${wide ? " is-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="desk-peek-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="desk-peek-handle" aria-hidden />
        <header className="desk-peek-head">
          <div>
            <p className="browse-kicker">{kicker}</p>
            <h2 id="desk-peek-title">{title}</h2>
          </div>
          <button type="button" className={`${btnGhost} desk-ticket-modal-close`} onClick={() => router.replace(closeHref)}>
            Close
          </button>
        </header>
        <div className="desk-peek-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
