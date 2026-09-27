"use client";

import { useEffect, useState } from "react";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function LiveClock({
  variant = "nav",
  light = false,
}: {
  variant?: "nav" | "banner";
  light?: boolean;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const date = now ? dateFmt.format(now) : "—";
  const time = now ? timeFmt.format(now) : "--:--";

  if (variant === "banner") {
    return (
      <div className={`select-none ${light ? "text-[#f7efe4]" : "text-[var(--ink)]"}`}>
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--gold-soft)]">
          India · IST
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">{date}</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-5xl tabular-nums tracking-wide sm:text-6xl">
          {time}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`hidden min-w-[220px] select-none lg:block ${light ? "text-[#fff7ea]" : "text-[var(--ink)]"}`}
      suppressHydrationWarning
    >
      <p className={`text-sm font-medium ${light ? "text-[var(--gold-soft)]" : "text-[var(--muted)]"}`}>
        {date}
      </p>
      <p className="mt-0.5 font-[family-name:var(--font-display)] text-2xl tabular-nums tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
        {time}
      </p>
    </div>
  );
}
