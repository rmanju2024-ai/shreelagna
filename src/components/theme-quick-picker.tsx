"use client";

import { useState } from "react";
import { SCENE_OPTIONS, type SceneId, writeSceneCookie } from "@/lib/ui/scenes";

/** Available to guests and members, including before a profile exists. */
export function ThemeQuickPicker({ initial }: { initial: SceneId }) {
  const [scene, setScene] = useState(initial);
  const [open, setOpen] = useState(false);

  function choose(id: SceneId) {
    setScene(id);
    writeSceneCookie(id);
    setOpen(false);
  }

  return (
    <div className="theme-quick">
      <button
        type="button"
        className="theme-quick-trigger"
        aria-label="Choose website theme"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden>🎨</span>
        <b>Theme</b>
      </button>
      {open ? (
        <div className="theme-quick-menu" role="menu" aria-label="Website themes">
          <p>Choose your vibe</p>
          {SCENE_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitemradio"
              aria-checked={scene === item.id}
              className={scene === item.id ? "is-on" : ""}
              onClick={() => choose(item.id)}
            >
              <span style={{ background: item.wash }} aria-hidden />
              <span>
                <b>{item.label}</b>
                <small>{item.hint}</small>
              </span>
              {scene === item.id ? <em>✓</em> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
