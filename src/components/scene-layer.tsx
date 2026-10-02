"use client";

import { useEffect, useState } from "react";
import { HoneymoonScene } from "@/components/honeymoon-scene";
import { WeddingScreensaver } from "@/components/wedding-screensaver";
import { parseScene, type SceneId } from "@/lib/ui/scenes";

function NatureScene() {
  return (
    <div className="scene-nature" aria-hidden>
      <div className="scene-nature-sky" />
      <div className="scene-nature-sun" />
      <div className="scene-nature-hill is-back" />
      <div className="scene-nature-hill is-mid" />
      <div className="scene-nature-trees" />
      <div className="scene-nature-glow" />
    </div>
  );
}

function CoupleScene() {
  return (
    <div className="scene-couple" aria-hidden>
      <div className="scene-couple-dusk" />
      <span className="scene-couple-bokeh is-a" />
      <span className="scene-couple-bokeh is-b" />
      <span className="scene-couple-bokeh is-c" />
      <svg className="scene-couple-pair" viewBox="0 0 200 140" aria-hidden>
        <path
          fill="currentColor"
          d="M62 128c2-22 8-38 22-46 6-18 4-36-8-42-14-8-30 2-28 20 1 10 7 18 16 22-18 8-28 28-28 46h26zm76 0c0-18-10-38-28-46 9-4 15-12 16-22 2-18-14-28-28-20-12 6-14 24-8 42 14 8 20 24 22 46h26z"
        />
      </svg>
      <div className="scene-couple-ground" />
    </div>
  );
}

export function SceneLayer({ initial }: { initial: SceneId }) {
  const [scene, setScene] = useState<SceneId>(initial);

  useEffect(() => {
    document.documentElement.dataset.scene = initial;
    const onScene = (event: Event) => {
      const id = parseScene((event as CustomEvent<string>).detail);
      setScene(id);
    };
    window.addEventListener("sl-scene", onScene);
    return () => window.removeEventListener("sl-scene", onScene);
  }, [initial]);

  return (
    <div className={`scene-layer is-${scene}`} aria-hidden>
      {scene === "wedding" ? <WeddingScreensaver /> : null}
      {scene === "honeymoon" ? <HoneymoonScene /> : null}
      {scene === "nature" ? <NatureScene /> : null}
      {scene === "couple" ? <CoupleScene /> : null}
    </div>
  );
}
