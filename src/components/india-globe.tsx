"use client";

import { useId } from "react";

export function IndiaGlobe({ size = "mark" }: { size?: "mark" | "logo" }) {
  const raw = useId().replace(/:/g, "");
  const fill = `india-tri-${raw}`;
  return (
    <span className={`india-globe ${size === "logo" ? "is-logo" : "is-mark"}`} aria-label="India" role="img">
      <span className="india-globe-halo" aria-hidden />
      <span className="india-globe-orbit" aria-hidden />
      <span className="india-globe-sphere">
        <svg className="india-globe-grid" viewBox="0 0 80 80" aria-hidden>
          <ellipse cx="40" cy="40" rx="38" ry="38" fill="none" stroke="rgb(255 255 255 / 22%)" strokeWidth="0.6" />
          <ellipse cx="40" cy="40" rx="22" ry="38" fill="none" stroke="rgb(255 255 255 / 16%)" strokeWidth="0.5" />
          <ellipse cx="40" cy="40" rx="8" ry="38" fill="none" stroke="rgb(255 255 255 / 12%)" strokeWidth="0.5" />
          <ellipse cx="40" cy="40" rx="38" ry="12" fill="none" stroke="rgb(255 255 255 / 18%)" strokeWidth="0.5" />
          <ellipse cx="40" cy="40" rx="38" ry="24" fill="none" stroke="rgb(255 255 255 / 12%)" strokeWidth="0.5" />
        </svg>
        <span className="india-globe-spin">
          <svg className="india-globe-land" viewBox="0 0 80 90" aria-hidden>
            <defs>
              <linearGradient id={fill} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#FF9933" />
                <stop offset="48%" stopColor="#FF9933" />
                <stop offset="48%" stopColor="#fff" />
                <stop offset="58%" stopColor="#fff" />
                <stop offset="58%" stopColor="#138808" />
                <stop offset="100%" stopColor="#138808" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#${fill})`}
              stroke="#3f0e0d"
              strokeWidth="0.7"
              d="M41 3c3 2 7 7 8 13 5 2 12 6 14 13 1 4-1 7 3 11 5 4 11 8 9 16-1 5 3 8 1 13-3 7-11 8-12 15 0 5 5 8 2 13-4 6-12 6-16 12-3 4-10 9-16 7-6-2-7-10-14-12-6-2-13 3-18-3-4-5 1-11-2-17-3-6-11-7-12-15 0-6 7-8 8-14 1-5-4-8-1-13 3-6 11-7 14-13 3-5 2-11 8-16 4-3 11-2 15-8 3-3 7-6 12-7z"
            />
            <circle cx="38" cy="36" r="2.1" fill="none" stroke="#000080" strokeWidth="0.55" />
          </svg>
        </span>
        <span className="india-globe-shine" aria-hidden />
      </span>
    </span>
  );
}
