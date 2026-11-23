import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Marriage Connect.in",
    short_name: "Marriage Connect.in",
    description: "Love Begins Here",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fffaf2",
    theme_color: "#fffaf2",
    icons: [
      { src: "/pwa/512?v=4", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/192?v=4", sizes: "192x192", type: "image/png", purpose: "any" },
    ],
  };
}
