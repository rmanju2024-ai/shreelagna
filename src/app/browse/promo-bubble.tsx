"use client";

import { useEffect, useState } from "react";

const KEY = "sl_promo_closed";

export function PromoBubble({ name }: { name: string }) {
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(KEY)) return;
    const t = window.setTimeout(() => {
      setShown(true);
      setOpen(true);
    }, 4000);
    return () => window.clearTimeout(t);
  }, []);

  function close() {
    sessionStorage.setItem(KEY, "1");
    setOpen(false);
  }

  if (!shown && !open) return null;
  return (
    <div className="promo-bubble" role="complementary" aria-label="Membership offer">
      {open ? (
        <div className="promo-card">
          <button type="button" className="promo-x" onClick={close} aria-label="Close">×</button>
          <p className="promo-from"><span className="promo-dot" /> Shree Lagna · online</p>
          <p className="promo-msg">Hey 👋 {name} could be your match! Go premium to chat instantly, see contact details and send unlimited interests.</p>
          <a className="promo-cta" href="/app/plans">Unlock premium ✨</a>
        </div>
      ) : null}
      <button type="button" className="promo-fab" onClick={() => setOpen((v) => !v)} aria-label="Premium offer">
        <span aria-hidden>👑</span>
        {!open ? <i>1</i> : null}
      </button>
    </div>
  );
}
