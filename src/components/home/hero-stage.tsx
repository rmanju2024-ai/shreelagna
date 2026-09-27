"use client";

import { useEffect, useRef } from "react";

const cards = [
  { kicker: "Bride", title: "Bride profiles", line: "Presented with dignity." },
  { kicker: "Groom", title: "Groom profiles", line: "Considered, never a bazaar." },
  { kicker: "House", title: "A family welcome", line: "Someone in the house will read you." },
];

export function HeroStage() {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    function onMove(e: PointerEvent) {
      const r = el!.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el!.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
      el!.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
    }
    function reset() {
      el!.style.setProperty("--rx", "6deg");
      el!.style.setProperty("--ry", "-16deg");
    }
    reset();
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <div ref={stage} className="scene-3d relative mx-auto h-[460px] w-full max-w-[520px] sm:h-[520px]">
      <div
        className="pointer-events-none absolute left-1/2 top-[46%] h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--gold)]/35 sm:h-[400px] sm:w-[400px]"
        style={{ transformStyle: "preserve-3d" }}
      />
      <div className="pointer-events-none absolute left-1/2 top-[42%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(184,137,76,0.45),transparent_68%)] blur-2xl" />
      <div
        className="relative h-full w-full"
        style={{
          transform: "rotateX(var(--rx, 6deg)) rotateY(var(--ry, -16deg))",
          transformStyle: "preserve-3d",
          transition: "transform 180ms ease-out",
        }}
      >
        {cards.map((c, i) => (
          <article
            key={c.kicker}
            className={`card-3d anim-float absolute overflow-hidden rounded-3xl border border-[var(--gold-soft)] bg-[linear-gradient(165deg,#fffaf2_0%,#f3e4cc_55%,#efe0c4_100%)] p-6 ${i === 0 ? "left-[8%] top-[8%] w-[68%] sm:w-[62%]" : ""} ${i === 1 ? "anim-float-slow right-[2%] top-[28%] w-[64%] sm:w-[58%]" : ""} ${i === 2 ? "bottom-[4%] left-[16%] w-[70%] sm:w-[64%]" : ""}`}
            style={{
              transform: `translateZ(${48 - i * 6}px)`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--gold)]">{c.kicker}</p>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-tight">{c.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{c.line}</p>
            <div className="gold-line mt-5" />
          </article>
        ))}
      </div>
    </div>
  );
}
