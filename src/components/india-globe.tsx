"use client";

import { useId } from "react";

const MAINLAND =
  "M108 10c7 4 12 14 16 22 7 4 18 8 21 17 3 7-1 14 4 20 8 10 21 13 24 26 2 8-5 15-6 23-2 11 8 18 4 28-4 10-16 12-21 21-4 8 2 16-4 23-7 8-19 6-27 14-7 6-10 17-20 20-10 3-20-4-30-1-8 2-15 10-23 9-10-1-16-10-25-14-10-5-23-3-30-13-5-8 1-17-2-25-4-10-17-13-19-23-2-8 7-15 8-23 2-9-7-18-3-27 4-8 15-11 20-19 4-8 1-17 8-24 6-6 16-4 22-11 5-6 9-14 17-17 7-2 15 2 22-4 5-4 9-11 16-14z";
const NORTHEAST =
  "M168 92c16-6 36 2 41 16 4 11-8 20-23 20-11 0-21-8-23-18-2-7 1-14 5-18z";

export function IndiaGlobe({ size = "mark" }: { size?: "mark" | "logo" }) {
  const raw = useId().replace(/:/g, "");
  const fill = `india-tri-${raw}`;
  return (
    <span className={`india-globe ${size === "logo" ? "is-logo" : "is-mark"}`} aria-label="MarriageConnect.in" role="img">
      <span className="india-globe-scene">
        <span className="india-globe-ring is-a" aria-hidden />
        <span className="india-globe-ring is-b" aria-hidden />
        <span className="india-globe-core">
          <span className="india-globe-bezel">
            <span className="india-globe-sphere">
              <svg className="india-globe-grid" viewBox="0 0 80 80" aria-hidden>
                <ellipse cx="40" cy="40" rx="37" ry="37" fill="none" stroke="rgb(255 255 255 / 20%)" strokeWidth="0.5" />
                <ellipse cx="40" cy="40" rx="24" ry="37" fill="none" stroke="rgb(255 255 255 / 16%)" strokeWidth="0.45" />
                <ellipse cx="40" cy="40" rx="10" ry="37" fill="none" stroke="rgb(255 255 255 / 12%)" strokeWidth="0.45" />
                <ellipse cx="40" cy="40" rx="37" ry="11" fill="none" stroke="rgb(255 255 255 / 18%)" strokeWidth="0.45" />
                <ellipse cx="40" cy="40" rx="37" ry="23" fill="none" stroke="rgb(255 255 255 / 12%)" strokeWidth="0.45" />
              </svg>
              <span className="india-globe-spin">
                <svg className="india-globe-land" viewBox="0 0 220 260" aria-hidden>
                  <defs>
                    <linearGradient id={fill} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#FF9933" />
                      <stop offset="42%" stopColor="#FF9933" />
                      <stop offset="42%" stopColor="#fff" />
                      <stop offset="58%" stopColor="#fff" />
                      <stop offset="58%" stopColor="#138808" />
                      <stop offset="100%" stopColor="#138808" />
                    </linearGradient>
                  </defs>
                  <path fill={`url(#${fill})`} stroke="#1a100c" strokeWidth="2.2" d={MAINLAND} />
                  <path fill={`url(#${fill})`} stroke="#1a100c" strokeWidth="1.8" d={NORTHEAST} />
                  <circle cx="118" cy="108" r="7" fill="none" stroke="#000080" strokeWidth="1.6" />
                </svg>
              </span>
              <span className="india-globe-shine" aria-hidden />
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}
