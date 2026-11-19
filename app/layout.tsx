import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGNAL · OPUS",
  description: "OPUS SIGNAL — creative and growth intelligence.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  applicationName: "OPUS SIGNAL",
  appleWebApp: {
    capable: true,
    title: "SIGNAL",
    statusBarStyle: "default",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#291c19",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
