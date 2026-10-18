import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chroma — OKLCH palettes",
  description:
    "Compose 2–5 color palettes in OKLCH. Control proportion, lightness, chroma, and hue relationships on one page.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full overflow-hidden antialiased`}
    >
      <body className="h-full overflow-hidden bg-white font-sans text-[#1D1D1F]">
        {children}
      </body>
    </html>
  );
}
