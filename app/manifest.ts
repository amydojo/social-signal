import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIGNAL / OPUS",
    short_name: "SIGNAL",
    description: "Private OPUS social intelligence",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e9",
    theme_color: "#291c19",
  };
}
