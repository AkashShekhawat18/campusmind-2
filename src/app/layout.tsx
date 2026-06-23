import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CursorGlow } from "@/components/ui/CursorGlow";
import { GridOverlay } from "@/components/ui/GridOverlay";
import { FloatingParticles } from "@/components/ui/FloatingParticles";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusMind | Infinite Learning",
  description: "A premium AI-powered educational ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-graphite text-foreground`}
      >
        <CursorGlow />
        <GridOverlay />
        <FloatingParticles />
        {children}
      </body>
    </html>
  );
}
