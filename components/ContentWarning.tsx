"use client";

import { useEffect, useState } from "react";

import styles from "./ContentWarning.module.css";

const STORAGE_KEY = "lob-warned";

/**
 * Shown once, before the book is read for the first time.
 *
 * The booklet's whole method is to reproduce what was said rather than
 * paraphrase it, and some of what it reproduces is racist. Saying so before
 * someone opens it is the least a publication owes a reader, and it costs the
 * work nothing — the material is here for criticism, and a reader who knows
 * what they are looking at reads it as criticism.
 *
 * Nothing renders on the server: whether it has been seen lives in
 * localStorage, and guessing at that during SSR would mismatch on hydration.
 * It therefore appears a moment after the page does, which is the right way
 * round anyway — never showing it is worse than showing it late.
 */
export default function ContentWarning() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // Private browsing: better to warn every time than never.
      setOpen(true);
    }
  }, []);

  /* The reader listens for arrow keys on the window. Without this, keys pressed
     while the warning is up would turn pages behind it, and dismissing would
     drop the reader somewhere they never chose. Capture phase, so it runs
     before the reader's own listener. */
  useEffect(() => {
    if (!open) return;
    const swallow = (event: KeyboardEvent) => {
      if (event.key.startsWith("Arrow") || event.key === " ")
        event.stopPropagation();
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", swallow, true);
    return () => window.removeEventListener("keydown", swallow, true);
  }, [open]);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Nothing to do — it will simply ask again next time.
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    // screenonly: a fixed overlay otherwise lays a dark panel over every
    // printed leaf — 86 of them, and a ten-fold heavier PDF.
    <div className={`screenonly ${styles.backdrop}`}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-warning-title"
      >
        <p className={styles.kicker}>Before you open it</p>
        <h2 id="content-warning-title" className={styles.title}>
          This booklet reproduces racist language
        </h2>
        <p className={styles.body}>
          It is a record of things a sitting senator has said in public, quoted
          rather than paraphrased, because paraphrase is how a record gets
          softened. Some of it is ugly to read.
        </p>
        <p className={styles.body}>
          Every quotation is reproduced from the public record for criticism and
          review, and carries its source so you can check it.
        </p>
        <button
          type="button"
          className={styles.accept}
          onClick={dismiss}
          autoFocus
        >
          I understand — open the book
        </button>
      </div>
    </div>
  );
}
