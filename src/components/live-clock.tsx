"use client";

import { useEffect, useState } from "react";
import { IST_OFFSET_MS } from "@/lib/time/ist";

const WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Same IST wall clock in Chrome, Safari, Firefox, and iOS. */
function istLabel(now: Date) {
  const d = new Date(now.getTime() + IST_OFFSET_MS);
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  let hour = d.getUTCHours();
  const minute = String(d.getUTCMinutes()).padStart(2, "0");
  const suffix = hour >= 12 ? "pm" : "am";
  hour = hour % 12 || 12;
  return {
    long: `${WEEK[d.getUTCDay()]}, ${day} ${MONTH[d.getUTCMonth()]} ${year}`,
    short: `${WEEK_SHORT[d.getUTCDay()]}, ${day} ${MONTH_SHORT[d.getUTCMonth()]} ${year}`,
    time: `${String(hour).padStart(2, "0")}:${minute} ${suffix}`,
  };
}

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

  const label = now ? istLabel(now) : null;
  const date = label?.long ?? "—";
  const time = label?.time ?? "--:--";

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
      className={`live-clock select-none ${light ? "text-[#fff7ea]" : "text-[var(--ink)]"}`}
      suppressHydrationWarning
    >
      <p className={`live-clock-date text-sm font-medium ${light ? "text-[var(--gold-soft)]" : "text-[var(--muted)]"}`}>
        <span className="live-clock-long">{date}</span>
        <span className="live-clock-short">{label?.short ?? "—"}</span>
      </p>
      <p className="live-clock-time font-[family-name:var(--font-display)] tabular-nums tracking-wide">
        {time}
      </p>
    </div>
  );
}
