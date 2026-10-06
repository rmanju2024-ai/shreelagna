"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { btnGhost } from "@/lib/ui/classes";
import { dismissTo } from "@/lib/ui/dismiss";

export function ProfilePeek({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => {
    dismissTo(router, "/browse");
  }, [router]);

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
  }, [close]);

  if (!mounted) return null;

  return createPortal(
    <div className="desk-ticket-layer portrait-peek-layer" role="presentation" onClick={close}>
      <div
        className="desk-ticket-modal card-3d portrait-peek-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portrait-peek-title"
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
