"use client";

import { useId } from "react";

/** Classic India outline — large on the globe so it reads at header size. */
const INDIA =
  "M100 8 118 28 128 52 162 56 186 42 196 62 168 78 160 112 148 158 132 196 112 212 92 204 80 168 48 128 28 104 24 86 52 80 58 52 44 34 72 18Z";
const NORTHEAST = "M162 56 198 48 204 72 176 86 162 76Z";

export function IndiaGlobe({ size = "mark" }: { size?: "mark" | "logo" }) {
  const id = useId().replace(/:/g, "");
  const ocean = `ocean-${id}`;
  const tri = `tri-${id}`;
  return (
    <span className={`india-globe ${size === "logo" ? "is-logo" : "is-mark"}`} aria-label="India" role="img">
      <svg className="india-globe-art" viewBox="0 0 120 120" aria-hidden>
        <defs>
          <radialGradient id={ocean} cx="32%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#c9ecff" />
            <stop offset="38%" stopColor="#3d9fe0" />
            <stop offset="72%" stopColor="#1560a8" />
            <stop offset="100%" stopColor="#0a2c5c" />
          </radialGradient>
          <linearGradient id={tri} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FF9933" />
            <stop offset="40%" stopColor="#FF9933" />
            <stop offset="40%" stopColor="#ffffff" />
            <stop offset="58%" stopColor="#ffffff" />
            <stop offset="58%" stopColor="#138808" />
            <stop offset="100%" stopColor="#138808" />
          </linearGradient>
          <clipPath id={`ball-${id}`}>
            <circle cx="60" cy="60" r="46" />
          </clipPath>
        </defs>

        <circle cx="60" cy="60" r="52" fill="none" stroke="#f5c84c" strokeWidth="3.2" />
        <circle cx="60" cy="60" r="49" fill="none" stroke="#8a5a18" strokeWidth="0.6" opacity="0.5" />

        <g clipPath={`url(#ball-${id})`}>
          <circle cx="60" cy="60" r="46" fill={`url(#${ocean})`} />
          <ellipse cx="60" cy="60" rx="46" ry="15" fill="none" stroke="rgb(255 255 255 / 28%)" strokeWidth="0.7" />
          <ellipse cx="60" cy="60" rx="46" ry="28" fill="none" stroke="rgb(255 255 255 / 16%)" strokeWidth="0.6" />
          <ellipse cx="60" cy="60" rx="18" ry="46" fill="none" stroke="rgb(255 255 255 / 18%)" strokeWidth="0.6" />
          <ellipse cx="60" cy="60" rx="32" ry="46" fill="none" stroke="rgb(255 255 255 / 12%)" strokeWidth="0.6" />

          <g className="india-globe-spin">
            <g transform="translate(6 4) scale(0.5)">
              <path d={INDIA} fill={`url(#${tri})`} stroke="#1a100c" strokeWidth="3.2" strokeLinejoin="round" />
              <path d={NORTHEAST} fill={`url(#${tri})`} stroke="#1a100c" strokeWidth="2.6" strokeLinejoin="round" />
              <circle cx="108" cy="92" r="6" fill="none" stroke="#000080" strokeWidth="1.8" />
            </g>
          </g>

          <ellipse cx="42" cy="38" rx="18" ry="10" fill="rgb(255 255 255 / 28%)" />
        </g>
      </svg>
    </span>
  );
}
