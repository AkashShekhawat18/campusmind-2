import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { SplashCursor } from "@/components/ui/SplashCursor";
import { SmoothScrollProvider } from "@/components/ui/SmoothScrollProvider";
import { GridOverlay } from "@/components/ui/GridOverlay";
import { FloatingParticles } from "@/components/ui/FloatingParticles";

import { ThemeProvider } from "@/components/ThemeProvider";
import { Malphor } from "@/components/malphor/Malphor";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SmoothScrollProvider>
            <SplashCursor />
            <GridOverlay />
            <FloatingParticles />
            {children}
            <Malphor />
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
