export const SCENE_IDS = ["wedding", "ivory", "jewel", "dusk"] as const;

export type SceneId = (typeof SCENE_IDS)[number];

export const SCENE_OPTIONS: { id: SceneId; label: string; hint: string; wash: string }[] = [
  {
    id: "wedding",
    label: "Royal foil 3D",
    hint: "Sculpted gold, lotus and depth",
    wash: "linear-gradient(145deg, #fff6d6 0%, #d4a85a 38%, #8a5a18 72%, #6f1d1b 100%)",
  },
  {
    id: "ivory",
    label: "Ivory marble 3D",
    hint: "Pearl stone, cool gold inlay",
    wash: "linear-gradient(145deg, #fffef8 0%, #e8dcc4 42%, #c4b08a 78%, #8a7a5c 100%)",
  },
  {
    id: "jewel",
    label: "Midnight jewel 3D",
    hint: "Wine velvet, gem light and gold",
    wash: "linear-gradient(145deg, #2a0e18 0%, #6f1d1b 40%, #c47a22 78%, #f3c56a 100%)",
  },
  {
    id: "dusk",
    label: "Silk dusk 3D",
    hint: "Rose-gold silk and evening glow",
    wash: "linear-gradient(145deg, #3f1a28 0%, #a43f72 38%, #e08a6a 70%, #f3c56a 100%)",
  },
];

export const SCENE_COOKIE = "sl_scene";

export function parseScene(value: string | null | undefined): SceneId {
  return SCENE_IDS.includes(value as SceneId) ? (value as SceneId) : "wedding";
}

export function writeSceneCookie(id: SceneId) {
  document.cookie = `${SCENE_COOKIE}=${id};path=/;max-age=31536000;samesite=lax`;
  document.documentElement.dataset.scene = id;
  window.dispatchEvent(new CustomEvent("sl-scene", { detail: id }));
}
