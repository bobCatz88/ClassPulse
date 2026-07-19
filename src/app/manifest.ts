import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClassPulse AI",
    short_name: "ClassPulse",
    description: "Refleksi guru yang bertukar menjadi tindakan kelas seterusnya.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbfe",
    theme_color: "#6b5dd2",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
