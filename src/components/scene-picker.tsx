"use client";

import { useState } from "react";
import { SCENE_OPTIONS, type SceneId, writeSceneCookie } from "@/lib/ui/scenes";

export function ScenePicker({ initial }: { initial: SceneId }) {
  const [scene, setScene] = useState<SceneId>(initial);

  function pick(id: SceneId) {
    setScene(id);
    writeSceneCookie(id);
  }

  return (
    <section className="mb-5" aria-label="Display theme">
      <p className="m-0 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[var(--gold)]">Look of the house</p>
      <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl leading-tight">House theme</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Screensaver for every page. Applies at once on this browser.</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4" role="group">
        {SCENE_OPTIONS.map((item) => {
          const on = scene === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => pick(item.id)}
              className={`flex items-center gap-2.5 rounded-2xl border px-2.5 py-2 text-left ${
                on
                  ? "border-[#6f1d1b] bg-[#fff4e4] shadow-[0_3px_0_#8a5a1e]"
                  : "border-[#e2c48a] bg-[#fffdf8] shadow-[0_3px_0_#d4b078]"
              }`}
            >
              <span className="h-9 w-12 shrink-0 rounded-lg" style={{ background: item.wash }} aria-hidden />
              <span className="min-w-0 flex-1">
                <b className="block truncate text-sm">{item.label}</b>
                <small className="block truncate text-[0.7rem] text-[var(--muted)]">{item.hint}</small>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-extrabold uppercase ${
                  on ? "bg-[#6f1d1b] text-[#fff8f0]" : "bg-[#efe3cc] text-[#6a574c]"
                }`}
              >
                {on ? "In use" : "Select"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
