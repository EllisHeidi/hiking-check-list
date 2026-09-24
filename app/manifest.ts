import type { MetadataRoute } from "next";

// Makes "Add to Home Screen" use the app's own name, icon and colours.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mountain Kill List",
    short_name: "Kill List",
    description: "Conquer mountains. Build your elevation. Reach the next summit.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e8",
    theme_color: "#1f3a2e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
