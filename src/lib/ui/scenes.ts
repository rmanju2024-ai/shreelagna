export const SCENE_IDS = ["wedding", "honeymoon", "nature", "couple"] as const;

export type SceneId = (typeof SCENE_IDS)[number];

export const SCENE_OPTIONS: { id: SceneId; label: string; hint: string; wash: string }[] = [
  {
    id: "wedding",
    label: "Mandap décor",
    hint: "Gold drapes, diyas and wedding petals",
    wash: "linear-gradient(135deg, #f3d7a4 0%, #c9893f 42%, #8a1f1c 100%)",
  },
  {
    id: "honeymoon",
    label: "Honeymoon valley",
    hint: "Mountain light and travel skies",
    wash: "linear-gradient(180deg, #7eb7e8 0%, #f3d7a4 55%, #4e7a3c 100%)",
  },
  {
    id: "nature",
    label: "Open nature",
    hint: "Hills, trees and open daylight",
    wash: "linear-gradient(180deg, #9ad0ef 0%, #cfe9c8 48%, #4e7a3c 100%)",
  },
  {
    id: "couple",
    label: "Couple goals",
    hint: "Dusk glow and togetherness",
    wash: "linear-gradient(180deg, #2a1540 0%, #7a3358 46%, #e08a6a 100%)",
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
