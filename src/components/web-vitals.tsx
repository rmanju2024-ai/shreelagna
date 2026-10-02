"use client";

import { useReportWebVitals } from "next/web-vitals";

/** Sends real-user speed numbers (LCP, INP, CLS, TTFB) to /api/vitals — see Vercel logs. */
export function WebVitals() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify({
      name: metric.name,
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      page: window.location.pathname,
    });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/vitals", body);
  });
  return null;
}
