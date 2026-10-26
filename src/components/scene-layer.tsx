"use client";

import { useEffect, useState } from "react";
import { WeddingScreensaver } from "@/components/wedding-screensaver";
import { parseScene, type SceneId } from "@/lib/ui/scenes";

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
      <WeddingScreensaver tone={scene} />
    </div>
  );
}
