"use client";

import { useState, type FormEvent } from "react";

import styles from "./enter.module.css";

/**
 * The gate's only interactive part. On success it reloads rather than routing:
 * the middleware rewrote this page over whatever URL the visitor actually asked
 * for, so a reload re-runs the gate and lands them where they were going.
 */
/* Lucide's eye and eye-off, inlined. Two icons is not worth a dependency, and
   they are the same shapes the No Room for Racism gate uses. */
function Eye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

export default function PasswordForm() {
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/site-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        window.location.reload();
        return;
      }

      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "That password is not right.");
      setBusy(false);
    } catch {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.label} htmlFor="site-password">
        Password
      </label>
      <div className={styles.field}>
        <input
          id="site-password"
          className={styles.input}
          type={revealed ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error !== null}
          aria-describedby={error ? "site-password-error" : undefined}
        />
        <button
          type="button"
          className={styles.reveal}
          onClick={() => setRevealed((shown) => !shown)}
          aria-label={revealed ? "Hide password" : "Show password"}
          aria-pressed={revealed}
        >
          {revealed ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {error && (
        <p id="site-password-error" className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={styles.submit} disabled={busy || password.length === 0}>
        {busy ? "Checking…" : "Open the book"}
      </button>
    </form>
  );
}
