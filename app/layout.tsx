import type { Metadata, Viewport } from "next";
import { Caprasimo, Figtree } from "next/font/google";

import "./globals.css";

/* The Organic design system's two faces, self-hosted by next/font so the page
   never round-trips to Google and the CSS variables stay the same names. */
const heading = Caprasimo({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading-family",
});

const body = Figtree({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body-family",
});

export const metadata: Metadata = {
  title: "Quotations from Pauline Hanson — The Little Orange Book",
  description:
    "A pocket booklet of on-the-record quotations, with sources. Turn the pages, or print it at 105 × 148 mm.",
  openGraph: {
    title: "Quotations from Pauline Hanson",
    description: "A pocket booklet of on-the-record quotations, with sources.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${heading.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
