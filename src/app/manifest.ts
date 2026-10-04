import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SportKompas — Persoonlijke Sport & Gezondheid",
    short_name: "SportKompas",
    description:
      "Jouw persoonlijke, rustige alles-in-één sportapp voor krachttraining, cardio, voeding en voortgang.",
    start_url: "/",
    display: "standalone",
    background_color: "#090d16",
    theme_color: "#10b981",
    orientation: "portrait-primary",
    lang: "nl",
    categories: ["fitness", "health", "sports", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
