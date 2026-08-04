import type { Metadata } from "next";

import PasswordForm from "./PasswordForm";
import styles from "./enter.module.css";

/**
 * openGraph and twitter are overridden, not just title — `images: []` included. The root layout's
 * social metadata names the subject of the booklet, and Next inherits it into
 * every route — which would have put "Quotations from Pauline Hanson" in the
 * one page an unauthenticated stranger is allowed to read, and in the link
 * preview of anyone who shared the gate.
 */
export const metadata: Metadata = {
  // Absolute, or the root's "%s — The Little Orange Book" template doubles it.
  title: { absolute: "The Little Orange Book" },
  description: "This booklet is not public yet.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "The Little Orange Book",
    description: "This booklet is not public yet.",
    type: "website",
    // The site's OG image *is* the cover, which names the subject in 200pt type.
    // Inheriting it would put the whole point of the booklet in the link preview
    // of the one page a stranger is allowed to see.
    images: [],
  },
  twitter: {
    title: "The Little Orange Book",
    description: "This booklet is not public yet.",
    images: [],
  },
};

/**
 * The password page. The middleware rewrites every gated request onto this
 * route, so it is the only thing an unauthenticated visitor can see — it says
 * what the site is and nothing about what is in it.
 */
export default function EnterPage() {
  return (
    <main className={styles.root}>
      <div className={styles.glow} aria-hidden="true">
        <div className={styles.glowTop} />
        <div className={styles.glowBottom} />
      </div>

      <div className={styles.panel}>
        <p className={styles.kicker}>Not public yet</p>
        <h1 className={styles.title}>The Little Orange Book</h1>
        <p className={styles.blurb}>
          A pocket booklet of on-the-record quotations. It is not finished and not launched, so it
          is behind a password until it is. If you are meant to be here, you have been given one.
        </p>
        <PasswordForm />
      </div>
    </main>
  );
}
