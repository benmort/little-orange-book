"use client";

import { useEffect, useState } from "react";

import type { Quotation } from "@/lib/content";
import styles from "./SharePanel.module.css";

/**
 * Sharing a quotation, not the site. The card is a committed PNG (see
 * scripts/make-cards.ts) rather than something rendered here — it is the same
 * image whoever shares it, and the page does not have to carry a renderer.
 *
 * Three routes out, because they suit different places:
 *   - the native sheet, where the platform can take the *image* (iOS, Android)
 *   - a download, for anywhere you upload by hand
 *   - the words and the citation as text, for a reply or an email
 *
 * The native sheet is offered only when it will actually carry the file:
 * `canShare({ files })` is the test, and a browser that says no gets the other
 * two rather than a button that silently drops the image and shares a URL.
 */
export default function SharePanel({
  quotation,
  onClose,
}: {
  quotation: Quotation;
  onClose: () => void;
}) {
  const [canShareFile, setCanShareFile] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardUrl = `/cards/${quotation.id}.png`;

  useEffect(() => {
    setCanShareFile(typeof navigator !== "undefined" && typeof navigator.canShare === "function");
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.startsWith("Arrow") || event.key === " ") event.stopPropagation();
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const asText = `“${quotation.text}”\n\n— Pauline Hanson, ${quotation.cite}\nlittleorangebook.com.au`;

  async function share() {
    try {
      const file = new File([await (await fetch(cardUrl)).blob()], `${quotation.id}.png`, {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: asText });
        return;
      }
      await navigator.share({ text: asText, url: "https://www.littleorangebook.com.au" });
    } catch {
      // Cancelled, or refused. Nothing to report — the other two still work.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(asText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`screenonly ${styles.backdrop}`} role="presentation" onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Share this quotation"
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.card} src={cardUrl} alt="" />

        <div className={styles.actions}>
          {canShareFile && (
            <button type="button" className={styles.primary} onClick={share}>
              Share
            </button>
          )}
          <a className={styles.secondary} href={cardUrl} download={`${quotation.id}.png`}>
            Download image
          </a>
          <button type="button" className={styles.secondary} onClick={copy}>
            {copied ? "Copied" : "Copy the words"}
          </button>
        </div>

        <p className={styles.cite}>
          {quotation.occasion} · {quotation.cite}
        </p>

        <button type="button" className={styles.close} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
