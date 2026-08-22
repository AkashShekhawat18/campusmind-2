import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { SmoothScrollProvider } from "@/components/ui/SmoothScrollProvider";
import { GridOverlay } from "@/components/ui/GridOverlay";
import { FloatingParticles } from "@/components/ui/FloatingParticles";

import { ThemeProvider } from "@/components/ThemeProvider";
import { Malphor } from "@/components/malphor/Malphor";
import { GoogleOAuthProvider } from "@react-oauth/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MALPHOR | Infinite Learning",
  description: "A premium AI-powered educational ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <SmoothScrollProvider>
              <GridOverlay />
              <FloatingParticles />
              {children}
              <Malphor />
            </SmoothScrollProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
