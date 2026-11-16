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
    <div className="desk-ticket-layer portrait-peek-layer desk-review-layer" role="presentation" onClick={() => router.replace(closeHref)}>
      <div
        className={`desk-ticket-modal card-3d portrait-peek-modal desk-peek-modal is-premium${wide ? " is-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="desk-peek-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="desk-peek-glow" aria-hidden />
        <span className="desk-peek-corner is-tl" aria-hidden />
        <span className="desk-peek-corner is-tr" aria-hidden />
        <span className="desk-peek-corner is-bl" aria-hidden />
        <span className="desk-peek-corner is-br" aria-hidden />
        <div className="desk-peek-handle" aria-hidden />
        <header className="desk-peek-head">
          <span className="desk-peek-seal" aria-hidden>
            ✦
          </span>
          <div className="desk-peek-head-copy">
            <p className="browse-kicker">{kicker}</p>
            <h2 id="desk-peek-title">{title}</h2>
          </div>
          <em className="desk-peek-mark">House review</em>
          <button type="button" className={`${btnGhost} desk-ticket-modal-close`} onClick={() => router.replace(closeHref)}>
            Close
          </button>
        </header>
        <div className="desk-peek-bar" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className="desk-peek-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
