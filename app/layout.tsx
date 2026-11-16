import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "SIGNAL / OPUS", description: "Private social intelligence for OPUS Plastic Surgery" };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}