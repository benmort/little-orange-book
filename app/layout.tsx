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

/* The Little Orange Book is the masthead; "Quotations from Pauline Hanson" is
   the cover line under it. app/opengraph-image.png and app/icon.png are picked
   up by convention — the OG image is the cover itself, rendered from the running
   book rather than drawn separately, so it cannot drift from it. */
export const metadata: Metadata = {
  metadataBase: new URL("https://www.littleorangebook.com.au"),
  title: {
    default: "The Little Orange Book",
    template: "%s — The Little Orange Book",
  },
  applicationName: "The Little Orange Book",
  description:
    "A pocket booklet of on-the-record quotations from Pauline Hanson, each carrying its source, alongside every vote she has cast. Turn the pages, or print it at 105 × 148 mm.",
  openGraph: {
    siteName: "The Little Orange Book",
    title: "The Little Orange Book",
    description:
      "Quotations from Pauline Hanson, each carrying its source, alongside every vote she has cast.",
    type: "website",
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Little Orange Book",
    description:
      "Quotations from Pauline Hanson, each carrying its source, alongside every vote she has cast.",
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
